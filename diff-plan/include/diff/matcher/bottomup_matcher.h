#pragma once
//---------------------------------------------------------------------------
#include "matcher.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
class BottomUpMatcher : public Matcher {
 public:
  void match(Node *a, Node *b) override;
};
//---------------------------------------------------------------------------
}// namespace diff