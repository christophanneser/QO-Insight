#pragma once
//---------------------------------------------------------------------------
#include "matcher.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
struct UnmatchedPipeline {
  // The constructor
  UnmatchedPipeline(Node* a, Node* b) : top(a), bottom(b) {}
  // The length of the unmatched pipeline
  size_t length() const;
  // Check if the unmatched pipeline must be updated (here the top node)
  void update();

  Node *top;   // the first parent that is still matched
  Node *bottom;// the first node in the subtree that is not yet matched
};
//---------------------------------------------------------------------------
class UnmatchedPipelinesMatcher : public Matcher {
 public:
  void match(Node *a, Node *b) override;

 private:
  void findUnmatchedPipelines(Node *node, Node *last_match, vector<UnmatchedPipeline> &);
  void processUnmatchedPipelines(vector<UnmatchedPipeline>&);
};
//---------------------------------------------------------------------------
}// namespace diff