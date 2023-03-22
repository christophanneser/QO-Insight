/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
// @generated automatically by Diesel CLI.

diesel::table! {
    benchmarks (id) {
        id -> Integer,
        name -> Text,
    }
}

diesel::table! {
    measurements (id) {
        id -> Integer,
        query_optimizer_config_id -> Integer,
        walltime -> Integer,
        io -> Nullable<Integer>,
        rows -> Nullable<Integer>,
        rows_width -> Nullable<Integer>,
        machine -> Text,
        time -> Timestamp,
        input_data_size -> Integer,
        num_compute_nodes -> Integer,
        io_hits -> Nullable<Integer>,
        tmp_io_writes -> Nullable<Integer>,
    }
}

diesel::table! {
    queries (id) {
        id -> Integer,
        benchmark_id -> Integer,
        query_path -> Text,
        result_fingerprint -> Nullable<Integer>,
    }
}

diesel::table! {
    query_effective_optimizers (query_id, optimizer) {
        query_id -> Integer,
        optimizer -> Text,
    }
}

diesel::table! {
    query_effective_optimizers_dependencies (query_id, optimizer, dependent_optimizer) {
        query_id -> Integer,
        optimizer -> Text,
        dependent_optimizer -> Text,
    }
}

diesel::table! {
    query_optimizer_configs (id) {
        id -> Integer,
        query_id -> Integer,
        disabled_rules -> Text,
        query_plan -> Text,
        analyzed_query_plan -> Text,
        num_disabled_rules -> Integer,
        hash -> Integer,
        duplicated_plan -> Bool,
    }
}

diesel::table! {
    query_required_optimizers (query_id, optimizer) {
        query_id -> Integer,
        optimizer -> Text,
    }
}

diesel::joinable!(measurements -> query_optimizer_configs (query_optimizer_config_id));
diesel::joinable!(queries -> benchmarks (benchmark_id));
diesel::joinable!(query_effective_optimizers -> queries (query_id));
diesel::joinable!(query_effective_optimizers_dependencies -> queries (query_id));
diesel::joinable!(query_optimizer_configs -> queries (query_id));
diesel::joinable!(query_required_optimizers -> queries (query_id));

diesel::allow_tables_to_appear_in_same_query!(
    benchmarks,
    measurements,
    queries,
    query_effective_optimizers,
    query_effective_optimizers_dependencies,
    query_optimizer_configs,
    query_required_optimizers,
);
