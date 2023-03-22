/*
    Copyright (c) 2023 Christoph Anneser <anneser@in.tum.de>
    SPDX-License-Identifier: MIT
*/
use serde::Serialize;

/// Create a json array of the passed vector
pub fn create_json_array<T>(arg: Vec<T>) -> String where T: Serialize {
    let mut result: Vec<String> = Vec::new();
    result.push(String::from('['));
    for a in &arg {
        let serialized_benchmark = serde_json::to_string(&a).expect("Serialization failed");
        result.push(serialized_benchmark);
        result.push(String::from(','));
    };
    if arg.len() > 0 { result.pop(); }
    result.push(String::from(']'));
    return result.join("");
}

pub(crate) fn median<T: Copy + std::cmp::Ord>(vec: &mut Vec<T>) -> Option<T> {
    if !vec.is_empty() {
        vec.sort();
        return Some(*(vec.get(vec.len() / 2).expect("Cannot dereference")));
    }
    None
}
