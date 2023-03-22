#include "diff/matcher/bottomup_matcher.h"
#include "diff/matcher/fixed_matcher.h"
#include "diff/matcher/topdown_matcher.h"
#include "diff/matcher/unmatched_pipelines_matcher.h"
#include "diff/matching_sequence.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
void MatchersPipeline::execute(Node *a, Node *b) {
  for (const auto &matcher: this->matchers)
    matcher->match(a, b);
}
//---------------------------------------------------------------------------
MatchersPipeline MatchersPipeline::getTopDownMatcher() {
  std::vector<std::unique_ptr<Matcher>> matchers;
  matchers.emplace_back(std::make_unique<FixedMatcher>());
  matchers.emplace_back(std::make_unique<TopDownMatcher>());
  return matchers;
}
//---------------------------------------------------------------------------
MatchersPipeline MatchersPipeline::getBottomUpMatcher() {
  std::vector<std::unique_ptr<Matcher>> matchers;
  matchers.emplace_back(std::make_unique<FixedMatcher>());
  matchers.emplace_back(std::make_unique<BottomUpMatcher>());
  return matchers;
}
//---------------------------------------------------------------------------
MatchersPipeline MatchersPipeline::getTopDownAndBottomUpMatcher() {
  std::vector<std::unique_ptr<Matcher>> matchers;
  matchers.emplace_back(std::make_unique<FixedMatcher>());
  matchers.emplace_back(std::make_unique<TopDownMatcher>());
  matchers.emplace_back(std::make_unique<BottomUpMatcher>());
  return matchers;
}
//---------------------------------------------------------------------------
MatchersPipeline MatchersPipeline::getAdvancedMatcher() {
  std::vector<std::unique_ptr<Matcher>> matchers;
  matchers.emplace_back(std::make_unique<FixedMatcher>());
  matchers.emplace_back(std::make_unique<TopDownMatcher>());
  matchers.emplace_back(std::make_unique<BottomUpMatcher>());
  matchers.emplace_back(std::make_unique<UnmatchedPipelinesMatcher>());
  return matchers;
}
//---------------------------------------------------------------------------
}// namespace diff