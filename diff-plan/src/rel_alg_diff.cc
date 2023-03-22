//---------------------------------------------------------------------------
// (c) Christoph Anneser 2023
//---------------------------------------------------------------------------
#include "../third-party/json/single_include/nlohmann/json.hpp"
#include "data.h"
#include "postgres_query_plan.h"
#include "presto_query_plan.h"
#include "query_plan.h"
#include "diff/matching_sequence.h"
//---------------------------------------------------------------------------
#ifdef WASM_EXPORT
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif
//---------------------------------------------------------------------------
#include <fstream>
#include <iostream>
//---------------------------------------------------------------------------
using namespace std;
using json = nlohmann::json;
using dir_iterator = filesystem::directory_iterator;
//---------------------------------------------------------------------------
#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif
//---------------------------------------------------------------------------
template<typename QPT>
char *diffQueryPlans(char *planA, char *planB) {
  static_assert(std::is_base_of<QueryPlan, QPT>::value);

  auto matcher = diff::MatchersPipeline::getAdvancedMatcher();

  // Parse the query plans
  json query_plan_a = json::parse(planA);
  json query_plan_b = json::parse(planB);

  // Setup query plans
  QPT qpA("a", json::parse(planA));
  QPT qpB("b", json::parse(planB));

  // Match
  matcher.execute(qpA.root.get(), qpB.root.get());

  // Export both query plans
  json result_plan;
  result_plan["planA"] = qpA.query_plan;
  result_plan["planB"] = qpB.query_plan;

  // Check for same join order
  result_plan["sameJoinOrder"] = qpA.join_order() == qpB.join_order();
  result_plan["planAJoinOrder"] = qpA.join_order();
  result_plan["planBJoinOrder"] = qpB.join_order();

  string result = result_plan.dump();
  void *ptr = malloc(result.size() + 1);
  strcpy((char *) ptr, result.data());
  return reinterpret_cast<char *>(ptr);
}
//---------------------------------------------------------------------------
EXTERN EMSCRIPTEN_KEEPALIVE char *diffPostgresQueryPlans(char *planA, char *planB) {
  return diffQueryPlans<PostgresQueryPlan>(planA, planB);
}
//---------------------------------------------------------------------------
EXTERN EMSCRIPTEN_KEEPALIVE char* greet(char *array) {
  auto my_string = "Hello from C++!";
  memcpy(array, my_string, strlen(my_string));
  return "This is a test from C++";
}
//---------------------------------------------------------------------------
EXTERN EMSCRIPTEN_KEEPALIVE char *diffPrestoQueryPlans(char *planA, char *planB) {
  return diffQueryPlans<PrestoQueryPlan>(planA, planB);
}
//---------------------------------------------------------------------------
EXTERN EMSCRIPTEN_KEEPALIVE int add(int a, int b) {
  cout << "Add in C++ ..." << endl;
  return a + b;
}
//---------------------------------------------------------------------------
template<typename QPT>
void match_query_plans(std::string &&db) {
  static_assert(std::is_base_of<QueryPlan, QPT>::value);

  auto advancedMatcher = diff::MatchersPipeline::getAdvancedMatcher();

  for (const auto &query: dir_iterator("../plans/" + db)) {
    //if (query.path().filename() != "1.sql") continue;
    vector<QPT> plans;
    for (const auto &qplan: dir_iterator(query.path())) {
      if (qplan.path().extension() != ".json") continue;
      std::ifstream ifs(qplan.path());
      auto plan = json::parse(ifs);
      plans.emplace_back(qplan.path().stem(), plan);
    }

    // diff first tree against every other tree
    if (plans.size() < 2) continue;

    auto &plan = plans[0];
    filesystem::path path("../gen/" + db + "/" + query.path().filename().string() + "/" + plan.disabled_rules + "/");
    filesystem::create_directories(path);

    {
      std::ofstream template_file(path.string() + "main.tex", ios::out);
      template_file << R"TEX(
\documentclass[multi=my, crop]{standalone}
\usepackage{tikz}
\usepackage[edges]{forest}
\usetikzlibrary{arrows.meta,shadows.blur}

\begin{document}
    \input{plans}
\end{document}
)TEX";
      std::ofstream all_plans(path.string() + "plans.tex", ios::out);
    }

    for (auto i = 1; i < plans.size(); i++) {
      auto &other_plan = plans[i];

      plan.reset();
      other_plan.reset();

      // Match
      advancedMatcher.execute(plan.root.get(), other_plan.root.get());

      std::ofstream originalPlanWithDiff(path.string() + "original_" + other_plan.disabled_rules + ".tex");
      originalPlanWithDiff << plan.dot();
      std::ofstream dotOtherPlan(path.string() + other_plan.disabled_rules + ".tex");
      dotOtherPlan << other_plan.dot();

      std::ofstream all_plans(path.string() + "plans.tex", ios::app);
      all_plans << "\\begin{my}" << endl;
      all_plans << "\\input{original_" << other_plan.disabled_rules + ".tex}\\hspace*{2cm}" << endl;
      all_plans << "\\input{" << other_plan.disabled_rules + ".tex}\\\\\\vspace*{2cm}" << endl;
      all_plans << "\\end{my}" << endl;
    }
  }
}
//---------------------------------------------------------------------------
int main() {
  match_query_plans<PostgresQueryPlan>("postgres");
  //match_query_plans<PrestoQueryPlan>("presto");
}
//---------------------------------------------------------------------------