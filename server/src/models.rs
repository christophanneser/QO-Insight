/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
use std::io::Write;

use diesel::{deserialize, serialize};
use diesel::backend::Backend;
use diesel::serialize::Output;
use diesel::sql_types::{Integer, Text, Bool};
use diesel::sqlite::Sqlite;
use diesel::types::{FromSql, ToSql};
pub use serde::{Deserialize, Serialize};

use crate::schema::{measurements, query_optimizer_configs};

#[derive(AsExpression, Debug, Deserialize, Serialize, FromSqlRow)]
#[sql_type = "Text"]
pub struct QPJson(serde_json::Value);

impl QPJson {
    pub fn new(v: serde_json::Value) -> QPJson {
        QPJson(v)
    }
}

#[derive(AsExpression, Debug, Deserialize, Serialize, FromSqlRow, Eq, PartialEq, Hash)]
#[sql_type = "Text"]
pub struct OptimizerList(Vec<String>);


impl FromSql<Text, Sqlite> for QPJson
{
    fn from_sql(
        value: Option<&<Sqlite as Backend>::RawValue>,
    ) -> deserialize::Result<Self> {
        let t = <String as FromSql<Text, Sqlite>>::from_sql(value)?;
        Ok(Self(serde_json::from_str(&t)?))
    }
}

impl<DB> ToSql<Text, DB> for QPJson
    where
        DB: Backend,
{
    fn to_sql<W: Write>(&self, out: &mut Output<W, DB>) -> serialize::Result {
        let s = serde_json::to_string(&self.0)?;
        <String as ToSql<Text, DB>>::to_sql(&s, out)
    }
}


impl FromSql<Text, Sqlite> for OptimizerList
{
    fn from_sql(
        value: Option<&<Sqlite as Backend>::RawValue>,
    ) -> deserialize::Result<Self> {
        let t = <String as FromSql<Text, Sqlite>>::from_sql(value)?;
        if t.eq("None") {
            return Ok(Self(Vec::new()));
        } else {
            let mut result: Vec<String> = Vec::new();
            for s in t.split(",") {
                result.push(String::from(s));
            }
            Ok(Self(result))
        }
    }
}

//------------------------------------------------------------
// DATABASE TABLE MAPPED TYPES
//------------------------------------------------------------
#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct Benchmark {
    pub benchmark_id: i32,
    pub name: String,
}

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct Query {
    pub query_id: i32,
    pub benchmark_id: i32,
    pub query_path: String,
    pub fingerprint: Option<i32>,
}

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct QueryRequiredOptimizer {
    pub query_id: i32,
    pub optimizer: String,
}

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct QueryEffectiveOptimizer {
    pub query_id: i32,
    pub optimizer: String,
}

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct QueryEffectiveOptimizersDependency {
    pub query_id: i32,
    pub optimizer: String,
    pub dependent_optimizer: String,
}

#[derive(QueryableByName, Identifiable, Queryable, Debug, Serialize, Deserialize)]
pub struct QueryOptimizerConfig {
    #[sql_type = "Integer"]
    pub id: i32,
    #[sql_type = "Integer"]
    pub query_id: i32,
    #[sql_type = "Text"]
    pub disabled_rules: OptimizerList,
    #[sql_type = "Text"]
    pub query_plan: QPJson,
    #[sql_type = "Text"]
    pub analyzed_query_plan: QPJson,
    #[sql_type = "Integer"]
    pub num_disabled_rules: i32,
    #[sql_type = "Integer"]
    pub hash: i32,
    #[sql_type = "Bool"]
    pub duplicated_plan: bool,
}

#[derive(Identifiable, Queryable, Debug, Serialize, Deserialize, Associations)]
#[belongs_to(QueryOptimizerConfig)]
pub struct Measurement {
    pub id: i32,
    pub query_optimizer_config_id: i32,
    pub walltime: i32,
    pub io: Option<i32>, // page faults
    pub rows: Option<i32>,
    pub rows_width: Option<i32>,
    pub machine: String,
    pub time: String,
    pub input_data_size: i32,
    pub num_compute_nodes: i32,
    pub io_hits: Option<i32>, // access page in memory
    pub tmp_io_writes: Option<i32>, // OOM -> spill to disk
}

//------------------------------------------------------------
// CONSTRUCTED TYPES (FOR API CONVENIENCE)
//------------------------------------------------------------
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryOptimizerConfigMeasurements {
    pub id: i32,
    pub query_id: i32,
    pub query_path: String,
    pub benchmark_id: i32,
    pub benchmark_name: String,
    pub disabled_rules: OptimizerList,
    pub num_disabled_rules: i32,
    pub hash: i32,
    pub duplicated_plan: bool,
    pub m_latency_median: i64,
    pub m_latency_mean: f32,
    pub m_io: i32,
    pub m_io_hits: i32,
    pub m_tmp_spills: i32,
    pub m_rows: i32,
    pub m_rows_width: i32,
    pub m_default_latency_median: i64,
    pub m_default_latency_mean: f32,
    pub m_default_io: i32,
    pub m_default_io_hits: i32,
    pub m_default_tmp_spills: i32,
    pub m_default_rows: i32,
    pub m_default_rows_width: i32,
    pub query_plan: QPJson,
    // pub measurement_walltimes: Vec<i64>,
    // pub measurement_mean: f32,
}

// Removed for simplicity
//pub measurement_walltimes: Vec<i64>,
//pub default_walltimes: Vec<i64>,
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryMeasurements {
    pub config_id: i32,
    pub default_config_id: i32,
    pub query_id: i32,
    pub query_path: String,
    pub benchmark_id: i32,
    pub benchmark_name: String,
    // *** this plan statistics
    pub m_latency_median: i64,
    pub m_latency_mean: f32,
    pub m_io: i32,
    pub m_io_hits: i32,
    pub m_tmp_spills: i32,
    pub m_rows: i32,
    pub m_rows_widths: i32,
    // *** the default plan statistics
    pub m_default_latency_median: i64,
    pub m_default_latency_mean: f32,
    pub m_default_io: i32,
    pub m_default_io_hits: i32,
    pub m_default_tmp_spills: i32,
    pub m_default_rows: i32,
    pub m_default_rows_widths: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DisabledRulesQueries {
    pub disabled_rules: OptimizerList,
    pub queries: Vec<QueryMeasurements>
}
//pub best_case_relative: f32,
//pub best_case_absolute: i64,
//pub worst_case_relative: f32,
//pub worst_case_absolute: i64,

/// Constructed type showing
#[derive(Debug, Deserialize, Serialize)]
pub struct QuerySpan {
    pub query_id: i32,
    pub effective: Vec<String>,
    pub required: Vec<String>,
    pub alternatives: Vec<QueryEffectiveOptimizersDependency>,
}

#[derive(Queryable, Debug, Serialize, Deserialize)]
pub struct QueryImprovement {
    pub query_id: i32,
    pub benchmark_id: i32,
    pub optimizer: String,
    pub fingerprint: Option<i32>,
    pub improvement: f32,
}

#[derive(QueryableByName, Debug, Serialize)]
pub struct DefaultRuntimeMeasurement {
    #[sql_type = "Integer"]
    pub benchmark_id: i32,
    #[sql_type = "Text"]
    pub benchmark_name: String,
    #[sql_type = "Integer"]
    pub query_id: i32,
    #[sql_type = "Text"]
    pub query_path: String,
    #[sql_type = "Integer"]
    pub latency: i32,
    #[sql_type = "Integer"]
    pub io: i32,
    #[sql_type = "Integer"]
    pub io_hits: i32,
    #[sql_type = "Integer"]
    pub tmp_io_writes: i32,
    #[sql_type = "Integer"]
    pub rows: i32,
    #[sql_type = "Integer"]
    pub rows_widths: i32,
    #[sql_type = "Integer"]
    pub qoc_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DefaultRuntime {
    pub benchmark_id: i32,
    pub benchmark_name: String,
    pub query_id: i32,
    pub query_path: String,
    pub qoc_id: i32,
    pub latency_median: i32,
    pub latency_mean: f32,
    pub io: i32,
    pub io_hits: i32,
    pub tmp_io_writes: i32,
    pub rows: i32,
    pub rows_widths: i32,
}
