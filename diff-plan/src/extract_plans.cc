#include <filesystem>
#include <fstream>
#include <iostream>
#include <sqlite3.h>

using namespace std;

static int save_query_plan(void *_unused, int _argc, char **argv, char **_colNames) {
  // save the query plan to a file
  namespace fs = filesystem;
  fs::path query_path(argv[2]);

  auto path = "../plans/presto/" + query_path.filename().string();
  fs::create_directories(path);

  ofstream query_info;
  query_info.open(path + "/query.txt");
  query_info << argv[2];
  query_info.close();

  ofstream query_plan;
  query_plan.open(path + "/" + argv[6] + ".json");
  query_plan << argv[7];
  query_plan.close();

  return 0;
}

int main() {
  sqlite3 *db;
  char *zErrMsg;
  int rc;
  rc = sqlite3_open("../data/presto.sqlite", &db);

  if (rc) {
    fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
    return (0);
  } else {
    fprintf(stderr, "Opened database successfully\n");
  }

  // Export query plans generated with AutoSteer
  auto sql = "select * from queries q, query_optimizer_configs qoc where q.id= qoc.query_id and benchmark_id = 1;";
  rc = sqlite3_exec(db, sql, save_query_plan, nullptr, &zErrMsg);

  if (rc != SQLITE_OK) {
    fprintf(stderr, "SQL error: %s\n", zErrMsg);
    sqlite3_free(zErrMsg);
  } else {
  }

  sqlite3_close(db);
  return 0;
}
