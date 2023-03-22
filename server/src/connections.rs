/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
use std::collections::HashMap;

use diesel::r2d2::{ConnectionManager, PooledConnection};
use diesel::r2d2::Pool;
use diesel::SqliteConnection;

#[derive(Eq, PartialEq, Hash)]
pub enum TestedDB {
    POSTGRES,
    PRESTO,
    DUCKDB,
    MYSQL,
    SPARK,
}

fn match_str_to_db(db: &str) -> Option<TestedDB> {
    let db_lower = db.to_lowercase();

    if db_lower.eq("postgres") {
        return Some(TestedDB::POSTGRES);
    }
    if db_lower.eq("presto") {
        return Some(TestedDB::PRESTO);
    }
    if db_lower.eq("duckdb") {
        return Some(TestedDB::DUCKDB);
    }
    if db_lower.eq("mysql") {
        return Some(TestedDB::MYSQL);
    }
    if db_lower.eq("spark") {
        return Some(TestedDB::SPARK);
    }
    // Unkown database
    None
}

pub struct DBConnections {
    connections: HashMap<TestedDB, Pool<ConnectionManager<SqliteConnection>>>,
}

impl DBConnections {
    pub fn new() -> DBConnections {
        let mut db_connections: DBConnections = DBConnections { connections: Default::default() };
        for (key, filename) in [
            (TestedDB::POSTGRES, String::from("postgres.sqlite")),
            (TestedDB::PRESTO, String::from("presto.sqlite"))
        ] {
            let manager = diesel::r2d2::ConnectionManager::<SqliteConnection>::new(format!("data/{}", filename));
            let pool = diesel::r2d2::Pool::builder().build(manager).unwrap();
            db_connections.connections.insert(key, pool);
        }

        db_connections
    }


    pub fn get_db_from_string(&self, tested_db: &str) -> Option<PooledConnection<ConnectionManager<SqliteConnection>>> {
        let res = match_str_to_db(tested_db);
        match res {
            Some(tested_db) => {
                let db = self.connections.get(&tested_db);
                match db {
                    Some(pool) => {
                        Some(pool.get().unwrap())
                    }
                    None => None
                }
            }
            None => None
        }
    }
}