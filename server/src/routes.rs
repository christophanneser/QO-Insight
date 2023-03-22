/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
use std::collections::HashMap;
use std::path::Path;

use diesel::dsl::not;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, PooledConnection};
use diesel::sql_query;
use diesel::sql_types::Integer;
use rocket::response::content;
use rocket::response::content::Json;
use rocket::State;

use crate::{models, utils};
use crate::connections::DBConnections;
use crate::models::{Benchmark, DefaultRuntime, DefaultRuntimeMeasurement, DisabledRulesQueries, Measurement, OptimizerList, Query, QueryEffectiveOptimizersDependency, QueryMeasurements, QueryOptimizerConfig, QueryOptimizerConfigMeasurements, QuerySpan};
use crate::schema::benchmarks::dsl::*;
use crate::schema::measurements::dsl::*;
use crate::schema::queries::dsl::*;
use crate::schema::query_effective_optimizers::dsl::*;
use crate::schema::query_effective_optimizers_dependencies::dsl::query_effective_optimizers_dependencies;
use crate::schema::query_optimizer_configs::dsl::query_optimizer_configs;
use crate::schema::query_required_optimizers::dsl::query_required_optimizers;

// Store the most important execution statistics for a query plan
struct DefaultStatistics {
    latency_median: i64,
    latency_mean: f32,
    io: i32,
    io_hits: i32,
    tmp_spills: i32,
    rows: i32,
    rows_width: i32,
}

//--------------------------------------------------------------------------------
/// Rule-Centric Mode
//--------------------------------------------------------------------------------
fn default_runtimes(database: &String, db_connections: &State<DBConnections>) -> HashMap<i32, DefaultRuntime>
{
    let some_conn = db_connections.get_db_from_string(&database);
    let conn = some_conn.unwrap();

    let mut the_benchmarks: Vec<DefaultRuntimeMeasurement> =
        sql_query("
        SELECT q.benchmark_id as benchmark_id,
               b.name as benchmark_name,
               q.id as query_id,
               q.query_path as query_path,
               qo.id as qoc_id,
               m.walltime as latency,
               m.io as io,
               m.io_hits as io_hits,
               m.tmp_io_writes as tmp_io_writes,
               m.rows as rows,
               m.rows_width as rows_widths
        FROM benchmarks b, queries q, query_optimizer_configs qo, measurements m
        WHERE b.id = q.benchmark_id and q.id = qo.query_id and qo.id = m.query_optimizer_config_id and disabled_rules = 'None'
        ")
            .load::<DefaultRuntimeMeasurement>(&*conn)
            .expect("Cannot run sql query");

    // Group by query and collect all measurements
    let mut aggs: HashMap<i32, Vec<DefaultRuntimeMeasurement>> = HashMap::new();
    for x in the_benchmarks.drain(..) {
        match aggs.get_mut(&x.query_id) {
            Some(list) => { list.push(x); }
            None => {
                aggs.insert(x.query_id, vec![x]);
            }
        }
    }

    // Calculate stats
    let mut results: HashMap<i32, DefaultRuntime> = HashMap::new();
    for (the_query_id, the_measurements) in aggs.drain() {
        let mut m_latencies = Vec::new();
        let mut m_ios: Vec<i32> = Vec::new();
        let mut m_io_hits: Vec<i32> = Vec::new();
        let mut m_spills: Vec<i32> = Vec::new();
        let mut m_rows: Vec<i32> = Vec::new();
        let mut m_rows_widths: Vec<i32> = Vec::new();
        for measurement in &the_measurements {
            m_latencies.push(measurement.latency);
            m_ios.push(measurement.io);
            m_io_hits.push(measurement.io_hits);
            m_spills.push(measurement.tmp_io_writes);
            m_rows.push(measurement.rows);
            m_rows_widths.push(measurement.rows_widths);
        }
        let (_, benchmark_name) = the_measurements.first().unwrap().query_path.rsplit_once('/').unwrap();
        results.insert(the_query_id, DefaultRuntime {
            benchmark_id: the_measurements.first().unwrap().benchmark_id,
            benchmark_name: the_measurements.first().unwrap().benchmark_name.clone(),
            query_id: the_measurements.first().unwrap().query_id,
            query_path: String::from(benchmark_name).to_ascii_uppercase(),
            qoc_id: the_measurements.first().unwrap().qoc_id,
            latency_median: utils::median(&mut m_latencies).unwrap(),
            latency_mean: (m_latencies.iter().sum::<i32>() as f64 / m_latencies.len() as f64) as f32,
            io: utils::median(&mut m_ios).unwrap(),
            io_hits: utils::median(&mut m_io_hits).unwrap(),
            tmp_io_writes: utils::median(&mut m_spills).unwrap(),
            rows: utils::median(&mut m_rows).unwrap(),
            rows_widths: utils::median(&mut m_rows_widths).unwrap(),
        });
    }

    results
}

fn benchmark_names(database: &String, db_connections: &State<DBConnections>) -> HashMap<i32, String>
{
    let some_conn = db_connections.get_db_from_string(&database);
    let conn = some_conn.unwrap();
    let the_benchmarks: Vec<Benchmark> = benchmarks.load::<Benchmark>(&*conn).expect("Cannot load the benchmarks");
    let mut map: HashMap<i32, String> = HashMap::new();
    for b in &the_benchmarks {
        let (_, benchmark_name) = b.name.rsplit_once('/').unwrap();
        map.insert(b.benchmark_id, String::from(benchmark_name).to_ascii_uppercase());
    }
    map
}

/// Return all optimizer configurations, optionally for a specific query and add the measurements
#[get("/<database>/group-hints?<benchmark>")]
pub fn get_grouped_hints(database: String, benchmark: Option<i32>, db_connections: State<DBConnections>) -> Option<content::Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);

    if some_conn.is_none() { None } else {
        // query_id -> default runtimes
        let df_runtimes = default_runtimes(&database, &db_connections);
        let benchmark_map = benchmark_names(&database, &db_connections);

        let conn = some_conn.unwrap();
        let the_query_configs: Vec<QueryOptimizerConfig> = get_filtered_query_opt_configs_by_benchmark(benchmark, &conn);
        let the_measurements: Vec<Measurement> = Measurement::belonging_to(&the_query_configs).load::<Measurement>(&*conn).expect("Cannot load Measurements");
        let grouped_configs = the_measurements.grouped_by(&the_query_configs);
        let mut result: Vec<(QueryOptimizerConfig, Vec<Measurement>)> = the_query_configs.into_iter().zip(grouped_configs).collect();

        // Group by disabled_rules
        let mut aggregated_hints: HashMap<OptimizerList, Vec<QueryMeasurements>> = HashMap::new();

        for (config, measurement) in result.drain(..) {
            let df_plan_opt = df_runtimes.get(&config.query_id);
            if !df_plan_opt.is_some() {
                eprintln!("Cannot find default plan for query_id={}", config.query_id);
                continue;
            }
            let df_plan = df_plan_opt.unwrap();
            let the_queries: Vec<Query> = queries.filter(queries::all_columns().0.eq(config.query_id)).load::<Query>(&*conn).expect("Cannot load queries");

            let mut measurement_walltimes = Vec::new();
            let mut mios: Vec<i32> = Vec::new();
            let mut mio_hits: Vec<i32> = Vec::new();
            let mut mspills: Vec<i32> = Vec::new();
            let mut mrows: Vec<i32> = Vec::new();
            let mut mrows_widths: Vec<i32> = Vec::new();

            let mut am = QueryMeasurements {
                config_id: config.id,
                query_id: config.query_id,
                query_path: String::from(Path::new(&df_plan.query_path).file_stem().unwrap().to_str().unwrap()),
                benchmark_id: the_queries.first().unwrap().benchmark_id,
                benchmark_name: benchmark_map[&the_queries.first().unwrap().benchmark_id].clone(),
                default_config_id: df_plan.qoc_id,
                // *** plan execution stats
                m_latency_median: 0,
                m_latency_mean: 0.0,
                m_io: 0,
                m_io_hits: 0,
                m_tmp_spills: 0,
                m_rows: 0,
                m_rows_widths: 0,
                // *** default plan execution stats
                m_default_latency_median: df_plan.latency_median as i64,
                m_default_latency_mean: df_plan.latency_mean,
                m_default_io: df_plan.io,
                m_default_io_hits: df_plan.io_hits,
                m_default_tmp_spills: df_plan.tmp_io_writes,
                m_default_rows: df_plan.rows,
                m_default_rows_widths: df_plan.rows_widths,
            };

            for m in measurement {
                measurement_walltimes.push(m.walltime as i64);
                if m.io.is_some() { mios.push(m.io.unwrap()); }
                if m.io_hits.is_some() { mio_hits.push(m.io_hits.unwrap()); }
                if m.tmp_io_writes.is_some() { mspills.push(m.tmp_io_writes.unwrap()); }
                if m.rows.is_some() { mrows.push(m.rows.unwrap()); }
                if m.rows_width.is_some() { mrows_widths.push(m.rows_width.unwrap()); }
            }
            // Calculate statistics
            if measurement_walltimes.is_empty() {
                continue;
            }
            am.m_latency_median = utils::median(&mut measurement_walltimes).unwrap();
            am.m_latency_mean = (measurement_walltimes.iter().sum::<i64>() as f64 / measurement_walltimes.len() as f64) as f32;
            am.m_io = utils::median(&mut mios).unwrap();
            am.m_io_hits = utils::median(&mut mio_hits).unwrap();
            am.m_tmp_spills = utils::median(&mut mspills).unwrap();
            am.m_rows = utils::median(&mut mrows).unwrap();
            am.m_rows_widths = utils::median(&mut mrows_widths).unwrap();

            match aggregated_hints.get_mut(&config.disabled_rules) {
                Some(list) => list.push(am),
                None => {
                    aggregated_hints.insert(config.disabled_rules, vec![am]);
                    ()
                }
            }
        }
        let mut results: Vec<DisabledRulesQueries> = Vec::new();
        for (disabled_rules, queries_measurements) in aggregated_hints.drain() {
            let drq = DisabledRulesQueries {
                disabled_rules,
                queries: queries_measurements,
            };

            results.push(drq);
        }

        Some(content::Json(utils::create_json_array(results)))
    }
}

//--------------------------------------------------------------------------------
/// Query-Centric Mode
//--------------------------------------------------------------------------------
/// Return all known benchmarks
#[get("/<database>/benchmarks")]
pub fn get_benchmarks(database: String, db_connections: State<DBConnections>) -> Option<content::Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);
    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        let mut the_benchmarks: Vec<Benchmark> = benchmarks.
            load::<Benchmark>(&*conn).
            expect("Cannot load table");
        for bench in &mut the_benchmarks {
            bench.name = bench.name.to_ascii_uppercase();
        }
        Some(content::Json(utils::create_json_array(the_benchmarks)))
    }
}

/// Return all queries. Optionally, we filter for specific benchmarks first. Add the potential improvements
#[get("/<database>/queries?<benchmark>")]
pub fn get_queries(database: String, benchmark: Option<i32>, db_connections: State<DBConnections>) -> Option<content::Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);
    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        let mut the_queries: Vec<Query>;
        match benchmark {
            Some(benchmark_) => {
                the_queries = queries.
                    filter(queries::all_columns().1.eq(benchmark_)).
                    load::<Query>(&*conn).
                    expect("Cannot load table");
            }
            None => {
                the_queries = queries.
                    load::<Query>(&*conn).
                    expect("Cannot load table");
            }
        }
        for query in &mut the_queries {
            query.query_path = String::from(Path::new(&query.query_path).file_stem().unwrap().to_str().unwrap());
        }
        Some(content::Json(utils::create_json_array(the_queries)))
    }
}

fn get_query_paths(database: &String, db_connections: &State<DBConnections>) -> HashMap<i32, String> {
    let mut result = HashMap::new();
    let some_conn = db_connections.get_db_from_string(&database);
    if !some_conn.is_none() {
        let conn = some_conn.unwrap();
        let the_queries: Vec<Query> = queries.
            load::<Query>(&*conn).
            expect("Cannot load table");

        for query in &the_queries {
            result.insert(query.query_id, query.query_path.clone());
        }
    }
    result
}

/// Return queries and optionally filter by query_id if exists
fn get_filtered_query_opt_configs_by_query(query: Option<i32>, conn: &PooledConnection<ConnectionManager<SqliteConnection>>) -> Vec<QueryOptimizerConfig> {
    let the_query_opt_configs: Vec<QueryOptimizerConfig>;
    match query {
        Some(the_query_id) => {
            the_query_opt_configs = query_optimizer_configs.
                filter(query_optimizer_configs::all_columns().1.eq(the_query_id)).
                load::<QueryOptimizerConfig>(&*conn).
                expect("Cannot load table QueryOptimizerConfigs");
        }
        None => {
            the_query_opt_configs = query_optimizer_configs.
                load::<QueryOptimizerConfig>(&*conn).
                expect("Cannot load table QueryOptimizerConfigs");
        }
    }
    the_query_opt_configs
}

/// Return queries and optionally filter by benchmark
fn get_filtered_query_opt_configs_by_benchmark(benchmark_id_option: Option<i32>, conn: &PooledConnection<ConnectionManager<SqliteConnection>>) -> Vec<QueryOptimizerConfig> {
    let the_query_opt_configs: Vec<QueryOptimizerConfig>;
    match benchmark_id_option {
        Some(the_benchmark_id) => {
            the_query_opt_configs = sql_query("
        SELECT qo.id as id, query_id, disabled_rules, query_plan, analyzed_query_plan, num_disabled_rules, hash, duplicated_plan
        FROM queries q, query_optimizer_configs qo
        WHERE q.benchmark_id = ? and q.id = qo.query_id and disabled_rules != 'None'")
                .bind::<Integer, _>(the_benchmark_id)
                .load::<QueryOptimizerConfig>(&*conn)
                .expect("Cannot run sql query");
        }
        None => {
            the_query_opt_configs = query_optimizer_configs.
                filter(not(query_optimizer_configs::all_columns().2.eq("None"))).
                load::<QueryOptimizerConfig>(&*conn).
                expect("Cannot load table QueryOptimizerConfigs");
        }
    }
    the_query_opt_configs
}

/// Return all optimizer configurations, optionally for a specific query.
#[get("/<database>/configs?<query>")]
pub fn get_optimizer_configs(database: String, query: Option<i32>, db_connections: State<DBConnections>) -> Option<content::Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);
    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        let the_queries: Vec<QueryOptimizerConfig> = get_filtered_query_opt_configs_by_query(query, &conn);
        Some(content::Json(utils::create_json_array(the_queries)))
    }
}

/// Return all optimizer configurations, optionally for a specific query and add the measurements
#[get("/<database>/configs-measurements?<include_plans>&<query>")]
pub fn get_optimizer_configs_and_measurements(database: String, include_plans: Option<bool>, query: Option<i32>, db_connections: State<DBConnections>) -> Option<content::Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);
    let query_path_idx = get_query_paths(&database, &db_connections);
    let benchmark_map = benchmark_names(&database, &db_connections);
    let add_query_plans: bool = include_plans.is_some() && include_plans.unwrap();

    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        let the_query_configs: Vec<QueryOptimizerConfig> = get_filtered_query_opt_configs_by_query(query, &conn);
        let the_measurements: Vec<Measurement> = Measurement::belonging_to(&the_query_configs).load::<Measurement>(&*conn).expect("Cannot load Measurements");
        let grouped_configs = the_measurements.grouped_by(&the_query_configs);
        let mut merged_config_measurements: Vec<(QueryOptimizerConfig, Vec<Measurement>)> = the_query_configs.into_iter().zip(grouped_configs).collect();


        let mut default_plan_measurements: HashMap<i32, DefaultStatistics> = HashMap::new();

        // Restructure the tuples
        let mut results: Vec<QueryOptimizerConfigMeasurements> = Vec::new();
        for (config, measurement) in merged_config_measurements.drain(..) {
            let the_queries: Vec<Query> = queries.filter(queries::all_columns().0.eq(config.query_id)).load::<Query>(&*conn).expect("Cannot load queries");
            // Todo Add Relative Change to default plan for all the measurements
            let mut am = QueryOptimizerConfigMeasurements {
                id: config.id,
                query_id: config.query_id,
                query_path: String::from(Path::new(&query_path_idx[&config.query_id]).file_stem().unwrap().to_str().unwrap()),
                benchmark_id: the_queries.first().unwrap().benchmark_id,
                benchmark_name: benchmark_map[&the_queries.first().unwrap().benchmark_id].clone(),
                disabled_rules: config.disabled_rules,
                query_plan: if add_query_plans { config.analyzed_query_plan } else { models::QPJson::new(serde_json::value::Value::Null) },
                num_disabled_rules: config.num_disabled_rules,
                hash: config.hash,
                duplicated_plan: config.duplicated_plan,
                // ** Metrics for this plan
                m_latency_median: 0,
                m_latency_mean: 0.0,
                m_io: 0,
                m_io_hits: 0,
                m_tmp_spills: 0,
                m_rows: 0,
                m_rows_width: 0,
                // ** Metrics from default plan
                m_default_latency_median: 0,
                m_default_latency_mean: 0.0,
                m_default_io: 0,
                m_default_io_hits: 0,
                m_default_tmp_spills: 0,
                m_default_rows: 0,
                m_default_rows_width: 0,
            };

            let mut m_latencies: Vec<i64> = Vec::new();
            let mut m_ios: Vec<i32> = Vec::new();
            let mut m_io_hits: Vec<i32> = Vec::new();
            let mut m_spills: Vec<i32> = Vec::new();
            let mut m_rows: Vec<i32> = Vec::new();
            let mut m_rows_widths: Vec<i32> = Vec::new();

            for m in measurement {
                m_latencies.push(m.walltime as i64);
                if m.io.is_some() { m_ios.push(m.io.unwrap()); }
                if m.io_hits.is_some() { m_io_hits.push(m.io_hits.unwrap()); }
                if m.tmp_io_writes.is_some() { m_spills.push(m.tmp_io_writes.unwrap()); }
                if m.rows.is_some() { m_rows.push(m.rows.unwrap()); }
                if m.rows_width.is_some() { m_rows_widths.push(m.rows_width.unwrap()); }
            }

            // Calculate statistics
            if m_latencies.is_empty() { continue; }
            m_latencies.sort();
            am.m_latency_median = utils::median(&mut m_latencies).unwrap();
            am.m_latency_mean = (m_latencies.iter().sum::<i64>() as f64 / m_latencies.len() as f64) as f32;
            am.m_io = utils::median(&mut m_ios).unwrap();
            am.m_io_hits = utils::median(&mut m_io_hits).unwrap();
            am.m_tmp_spills = utils::median(&mut m_spills).unwrap();
            am.m_rows = utils::median(&mut m_rows).unwrap();
            am.m_rows_width = utils::median(&mut m_rows_widths).unwrap();

            // Save the stats of this default plan
            if config.num_disabled_rules == 0 {
                default_plan_measurements.insert(config.query_id,
                                                 DefaultStatistics {
                                                     latency_median: am.m_latency_median,
                                                     latency_mean: am.m_latency_mean,
                                                     io: am.m_io,
                                                     io_hits: am.m_io_hits,
                                                     tmp_spills: am.m_tmp_spills,
                                                     rows: am.m_rows,
                                                     rows_width: am.m_rows_width,
                                                 });
            }

            results.push(am);
        }

        // Update all results with the default plans now
        let mut cur_config_idx = 0;
        while cur_config_idx < results.len() {
            // borrow immutable
            let cur_config = &mut results[cur_config_idx];
            let default_config = default_plan_measurements.get(&cur_config.query_id).expect("Could not find a default plan");

            cur_config.m_default_latency_median = default_config.latency_median;
            cur_config.m_default_latency_mean = default_config.latency_mean;
            cur_config.m_default_io = default_config.io;
            cur_config.m_default_io_hits = default_config.io_hits;
            cur_config.m_default_tmp_spills = default_config.tmp_spills;
            cur_config.m_default_rows = default_config.rows;
            cur_config.m_default_rows_width = default_config.rows_width;
            cur_config_idx += 1;
        }

        Some(content::Json(utils::create_json_array(results)))
    }
}

/// Return a specific measurement if it exists
#[get("/<database>/measurement/<mid>")]
pub fn get_measurement(database: String, mid: i32, db_connections: State<DBConnections>) -> Option<Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);

    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        let found_measurements: Vec<Measurement> = measurements.
            filter(measurements::all_columns().0.eq(mid)).
            load::<Measurement>(&*conn).
            expect("Cannot load table");

        if found_measurements.is_empty() { return None; }

        let measurement = found_measurements.get(0).expect("Did not find a measurement");

        let res = serde_json::to_string(measurement).expect("Cannot serialize measurement");
        Some(Json(res))
    }
}

/// Return the query span for a specific query if it exists
#[get("/<database>/span/<queryid>")]
pub fn get_query_span(database: String, queryid: i32, db_connections: State<DBConnections>) -> Option<Json<String>>
{
    let some_conn = db_connections.get_db_from_string(&database);

    if some_conn.is_none() { None } else {
        let conn = some_conn.unwrap();
        // Check if query exists
        let found_queries: Vec<i32> = queries
            .select(queries::all_columns().0)
            .filter(queries::all_columns().0.eq(queryid))
            .load::<i32>(&*conn)
            .expect("Cannot load table Queries");

        if found_queries.is_empty() { return None; }

        let effective: Vec<String> = query_effective_optimizers
            .select(query_effective_optimizers::all_columns().1)
            .filter(query_effective_optimizers::all_columns().0.eq(queryid))
            .load::<String>(&*conn)
            .expect("Cannot load table QueryEffectiveOptimizers");

        let required: Vec<String> = query_required_optimizers
            .select(query_required_optimizers::all_columns().1)
            .filter(query_required_optimizers::all_columns().0.eq(queryid))
            .load::<String>(&*conn)
            .expect("Cannot load table QueryRequiredOptimizers");

        let alternatives: Vec<QueryEffectiveOptimizersDependency> = query_effective_optimizers_dependencies
            .filter(query_effective_optimizers_dependencies::all_columns().0.eq(queryid))
            .load::<QueryEffectiveOptimizersDependency>(&*conn)
            .expect("Cannot load table QueryEffectiveOptimizerDependency");

        let span = QuerySpan { query_id: queryid, effective, required, alternatives };
        Some(Json(serde_json::to_string(&span).expect("Cannot serialize QuerySpan")))
    }
}
