#include <vector>
//---------------------------------------------------------------------------
#include "diff/matcher/bottomup_matcher.h"
//---------------------------------------------------------------------------
namespace diff {
//---------------------------------------------------------------------------
using namespace std;
//---------------------------------------------------------------------------
struct LeafNodeMatches {
  LeafNode *leaf_node;
  vector<tuple<LeafNode *, int>> candidates;
};
//---------------------------------------------------------------------------
// Functor to compare by the Mth element
template<int M, template<typename> class F = std::less>
struct TupleCompare {
  template<typename T>
  bool operator()(T const &t1, T const &t2) {
    return F<typename tuple_element<M, T>::type>()(std::get<M>(t1), std::get<M>(t2));
  }
};
//---------------------------------------------------------------------------
void getLeafNodes(Node *n, vector<LeafNodeMatches> &leaves) {
  if (n->node_type_t == LEAF)
    leaves.emplace_back(LeafNodeMatches{.leaf_node = static_cast<LeafNode *>(n), .candidates = {}});

  // recurse down for all child nodes
  for (auto i = 0; i < n->get_num_children(); i++)
    getLeafNodes(n->get_child(i), leaves);
}
//---------------------------------------------------------------------------
int getLCS(Node *a, Node *b) {
  int lcs = 0;
  do {
    lcs += 1;
    a = a->parent;
    b = b->parent;
  } while (a != nullptr && b != nullptr && !a->match_partner && !b->match_partner && a->equals(b));
  return lcs;
}
//---------------------------------------------------------------------------
void matchLCS(Node *a, Node *b) {
  while (a != nullptr && b != nullptr && !a->match_partner && !b->match_partner && a->equals(b)) {
    a->match_to(b);
    a = a->parent;
    b = b->parent;
  }
}
//---------------------------------------------------------------------------
void BottomUpMatcher::match(Node *a, Node *b) {
  vector<LeafNodeMatches> leafNodesA, leafNodesB;
  getLeafNodes(a, leafNodesA);
  getLeafNodes(b, leafNodesB);

  for (auto &lnma: leafNodesA) {
    if (lnma.leaf_node->match_partner)
      continue;// has already been matched in a previous run, skip it
    for (auto &lnmb: leafNodesB) {
      if (lnma.leaf_node->equals(lnmb.leaf_node) && !lnmb.leaf_node->match_partner) {
        lnma.candidates.emplace_back(lnmb.leaf_node, getLCS(lnma.leaf_node, lnmb.leaf_node));
      }
    }

    // sort by length of common subsequence
    sort(lnma.candidates.begin(), lnma.candidates.end(), TupleCompare<1>());

    if (!lnma.candidates.empty())
      // match with the other candidate
      matchLCS(lnma.leaf_node, get<0>(lnma.candidates.back()));
  }
}
//---------------------------------------------------------------------------
}// namespace diff