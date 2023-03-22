#include "diff/matcher/topdown_matcher.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
void TopDownMatcher::match(Node *a, Node *b) {
  // match as long as nodes are the same
  if (a->equals(b)) {
    // Root note has already been matched
    if (a->parent != nullptr) {
      a->match_to(b);
    }

    for (int child_idx = 0; child_idx < a->get_num_children(); child_idx++)
      match(a->get_child(child_idx), b->get_child(child_idx));
  }
}
//---------------------------------------------------------------------------
}// namespace diff