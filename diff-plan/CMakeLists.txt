cmake_minimum_required(VERSION 3.22)
project(relalg_diff)

set(CMAKE_CXX_STANDARD 20)

# Required for exporting queries from Auto-Steer's results database
find_library(sqlite3 sqlite3)

# Check if compiler is Emscripten
if (CMAKE_CXX_COMPILER MATCHES "/em\\+\\+(-[a-zA-Z0-9.])?$")
    message(" * C++ compiler: Emscripten")
    set(CMAKE_CXX_COMPILER_ID "Emscripten")
    add_compile_definitions(WASM_EXPORT "WASM")
else ()
    message(" * C++ compiler: ${CMAKE_CXX_COMPILER_ID}")
endif ()

include_directories(include)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/wasm-generated")

set(SRC_CC
        "${CMAKE_SOURCE_DIR}/src/query_plan.cc"
        "${CMAKE_SOURCE_DIR}/src/postgres_query_plan.cpp"
        "${CMAKE_SOURCE_DIR}/src/presto_query_plan.cpp"
        "${CMAKE_SOURCE_DIR}/src/diff/matching_sequence.cpp"
        "${CMAKE_SOURCE_DIR}/src/diff/matcher/fixed_matcher.cpp"
        "${CMAKE_SOURCE_DIR}/src/diff/matcher/topdown_matcher.cpp"
        "${CMAKE_SOURCE_DIR}/src/diff/matcher/bottomup_matcher.cpp"
        "${CMAKE_SOURCE_DIR}/src/diff/matcher/unmatched_pipelines_matcher.cpp"
        )

# === The QPDiff-tool === #
add_executable(qpdiff src/rel_alg_diff.cc ${SRC_CC})
if (CMAKE_CXX_COMPILER_ID STREQUAL "Emscripten")
    #set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
    # Compiled to WASM -> export custom functions
    message("export ccall and cwrap")

    target_link_options(qpdiff PRIVATE -bind
            -Os
            -g1
            --pre-js ../javascript/locateFile.js
            -sASSERTIONS
            -sWASM=1
            -sSTACK_SIZE=32536000
            -sINITIAL_MEMORY=65536000
            -sENVIRONMENT='web'
            -sEXPORT_NAME='createModule'
            -sUSE_ES6_IMPORT_META=0
            -sEXPORT_NAME='QPDiffTester'
            -sMALLOC=emmalloc
            -sEXPORT_ES6=1
            -sMODULARIZE=1
            -sALLOW_MEMORY_GROWTH=1
            -sEXPORTED_RUNTIME_METHODS=['ccall','cwrap']
            -sEXPORTED_FUNCTIONS=['_main','_greet','_diffPostgresQueryPlans','_diffPrestoQueryPlans','_add','_malloc','_free'])

    add_custom_command(TARGET qpdiff POST_BUILD
            COMMAND mv wasm-generated/qpdiff.js wasm-generated/qpdiff.mjs && python3 ${CMAKE_SOURCE_DIR}/postprocess.py wasm-generated/qpdiff.mjs src/qpdiff.mjs /qpdiff.wasm qpdiff.wasm && cp wasm-generated/qpdiff.wasm public/
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
            COMMENT "Running Postprocessing for .mjs file ..."
            )
endif ()
