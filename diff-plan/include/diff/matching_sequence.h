#pragma once
#include <vector>
//---------------------------------------------------------------------------
#include "matcher/matcher.h"
#include "query_plan.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
class MatchersPipeline {
 private:
  MatchersPipeline(std::vector<std::unique_ptr<Matcher>> &&matchers) : matchers(std::move(matchers)) {}

 public:
  static MatchersPipeline getTopDownMatcher();
  static MatchersPipeline getBottomUpMatcher();
  static MatchersPipeline getTopDownAndBottomUpMatcher();
  static MatchersPipeline getAdvancedMatcher();

  void execute(Node *a, Node *b);

 private:
  std::vector<std::unique_ptr<Matcher>> matchers;
};
//---------------------------------------------------------------------------
}// namespace diff
 //---------------------------------------------------------------------------