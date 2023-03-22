/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
#[cfg(test)]
mod test {
    use rocket::http::Status;
    use rocket::local::Client;

    use crate::rocket;

    #[test]
    fn test_setup() {
        Client::new(rocket()).expect("valid rocket instance");
    }

    #[test]
    fn test_default_route() {
        let client = Client::new(rocket()).expect("valid rocket instance");
        let mut response = client.get("/").dispatch();
        assert_eq!(response.status(), Status::NotFound);
    }

    #[test]
    fn test_invalid_route() {
        let client = Client::new(rocket()).expect("valid rocket instance");
        let mut response = client.get("/postgres/").dispatch();
        assert_eq!(response.status(), Status::NotFound);
    }

    #[test]
    fn test_benchmarks() {
        let client = Client::new(rocket()).expect("valid rocket instance");
        let mut response = client.get("/postgres/benchmarks").dispatch();
        assert_eq!(response.status(), Status::Ok);
    }

    #[test]
    fn test_query_span() {
        let client = Client::new(rocket()).expect("valid rocket instance");
        let mut response = client.get("/postgres/span/1").dispatch();
        assert_eq!(response.status(), Status::Ok);
    }
}