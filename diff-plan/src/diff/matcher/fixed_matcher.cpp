#include "diff/matcher/fixed_matcher.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
void FixedMatcher::match(Node *a, Node *b) {
  a->match_to(b);
}
//---------------------------------------------------------------------------
}// namespace diff