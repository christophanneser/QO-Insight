#include "diff/matcher/unmatched_pipelines_matcher.h"
#include <iostream>
#include <unordered_set>
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
void UnmatchedPipelinesMatcher::match(Node *a, Node *b) {
  assert(a->match_partner && b->match_partner);

  vector<UnmatchedPipeline> unmatched_pipelines;
  for (auto i = 0; i < a->get_num_children(); i++)
    findUnmatchedPipelines(a->get_child(i), a, unmatched_pipelines);

//  cout << "found unmatched pipelines: " << unmatched_pipelines.size() << endl;

  processUnmatchedPipelines(unmatched_pipelines);
}
//---------------------------------------------------------------------------
void UnmatchedPipelinesMatcher::findUnmatchedPipelines(Node *node, Node *last_match, vector<UnmatchedPipeline> &unmatched) {
  // Traverse the tree in Pre-Order
  bool isPipelineEnd = last_match != node->parent && node->match_partner;
  if (isPipelineEnd)
    unmatched.emplace_back(last_match, node);

  // Recurse downwards the tree
  for (auto i = 0; i < node->get_num_children(); i++)
    findUnmatchedPipelines(node->get_child(i), isPipelineEnd ? node : last_match, unmatched);
}
//---------------------------------------------------------------------------
void UnmatchedPipelinesMatcher::processUnmatchedPipelines(vector<UnmatchedPipeline> &unmatched) {
  for (auto &pipeline: unmatched) {
    pipeline.update();
    auto length = pipeline.length();

    const auto bottomLeft = pipeline.bottom;
    const auto topLeft = pipeline.top;
    const auto topRight = pipeline.top->match_partner;

    if (length > 0 && length < 30) {
      auto runnerLeft = bottomLeft->parent;
      auto lastMatchedNodeRight = bottomLeft->match_partner;

      while (runnerLeft != topLeft) {
        auto runnerRight = lastMatchedNodeRight->parent;

        while (runnerRight && runnerRight != topRight && !runnerRight->match_partner) {
          if (runnerLeft->equals(runnerRight)) {
            // cout << "sandwich found match!" << endl;
            runnerLeft->match_to(runnerRight);
            lastMatchedNodeRight = runnerRight;
            break;
          } else {
            // todo skip to next unmatched node to the right!
            do { runnerRight = runnerRight->parent; } while (runnerRight && runnerRight->match_partner && runnerRight != topRight);
          }
        }
        runnerLeft = runnerLeft->parent;
      }
    } else {
      // pipeline too long for exact matching
      cerr << "pipeline too short or too long" << length << endl;
    }

    // hash all nodes in the unmatched pipeline
    // Todo: implement an n`2 algorithm here instead, when the length is smaller than 30 nodes 30*2 = 900 this is still fine for us...
  }
}
//---------------------------------------------------------------------------
size_t UnmatchedPipeline::length() const {
  Node *runner = bottom;
  size_t len = 0;
  while (runner != top) {
    len++;
    runner = runner->parent;
  }
  return len;
}
//---------------------------------------------------------------------------
void UnmatchedPipeline::update() {
  Node *runner = bottom->parent;
  while (runner && !runner->match_partner)
    runner = runner->parent;
  top = runner;
}
//---------------------------------------------------------------------------
}// namespace diff