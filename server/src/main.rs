/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
#![feature(proc_macro_hygiene, decl_macro)]
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
extern crate rocket_cors;

use rocket_contrib::serve::StaticFiles;

use crate::connections::DBConnections;
use rocket_cors::{AllowedOrigins};

#[cfg(test)]
mod tests;
mod schema;
mod models;
mod utils;
mod connections;
mod routes;


fn rocket() -> rocket::Rocket {
    let allowed_origins = AllowedOrigins::some_exact(&["http://localhost:3001"]);// &["http://131.159.17.146"]);
    let cors = rocket_cors::CorsOptions::default()
        .allowed_origins(allowed_origins)
        .to_cors()
        .unwrap();

    rocket::ignite()
        .mount("/", routes![
            routes::get_benchmarks,
            routes::get_measurement,
            routes::get_queries,
            routes::get_optimizer_configs,
            routes::get_optimizer_configs_and_measurements,
            routes::get_query_span,
            routes::get_grouped_hints,
        ])
        // Serve the React frontend from the `files` endpoint
        .mount("/files", StaticFiles::from("./static-files"))
        .mount("/static", StaticFiles::from("./static-files/static"))
        // Setup the database connections using rockets managed state
        .manage(DBConnections::new())
        .attach(cors)
}

fn main() {
    rocket().launch();
}
