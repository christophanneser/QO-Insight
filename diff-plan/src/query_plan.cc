#include "query_plan.h"
#include <iostream>
#include <sstream>
#include <string>
#include <utility>
//---------------------------------------------------------------------------
using namespace std;
//---------------------------------------------------------------------------
size_t SEED = 0x3e213a92ull;
//---------------------------------------------------------------------------
inline void hash_combine(std::size_t &seed) {}
//---------------------------------------------------------------------------
template<typename T, typename... Rest>
inline void hash_combine(std::size_t &seed, const T &v, Rest... rest) {
  std::hash<T> hasher;
  seed ^= hasher(v) + 0x9e3779b9 + (seed << 4) + (seed >> 2);
  hash_combine(seed, rest...);
}
//---------------------------------------------------------------------------
QueryPlan::QueryPlan(string disabled_rules, json query_plan) : disabled_rules(std::move(disabled_rules)), query_plan(std::move(query_plan)) {}
//---------------------------------------------------------------------------
string QueryPlan::dot() const {
  stringstream ss;
  ss << R"TIKZ(\begin{forest}for tree={draw=black,rounded corners})TIKZ";
  root->dot(ss);
  ss << R"TIKZ(\end{forest})TIKZ";
  return ss.str();
}
//---------------------------------------------------------------------------
vector<string> split(string s, string delimiter) {
  size_t pos_start = 0, pos_end, delim_len = delimiter.length();
  string token;
  vector<string> res;

  while ((pos_end = s.find(delimiter, pos_start)) != string::npos) {
    token = s.substr(pos_start, pos_end - pos_start);
    pos_start = pos_end + delim_len;
    res.push_back(token);
  }

  res.push_back(s.substr(pos_start));
  return res;
}
//---------------------------------------------------------------------------
void QueryPlan::diff(QueryPlan &other) {
  auto patch = json::diff(query_plan, other.query_plan);
  for (auto &entry: patch) {
    // todo go through patch and apply it to the query plan
    if (entry["op"] == "add") continue;// skip adds
    //assert(entry["op"] == "remove" || entry["op"] == "replace");
    auto path = split(entry["path"], "/");
    auto changed_field = path.back();
    if (ignored_types.contains(changed_field)) continue;

    cout << entry << endl;
    path.pop_back();
    auto modified_node = traverse(root.get(), path, 1);
    modified_node->mark_changed();
  }
}
//---------------------------------------------------------------------------
Node *QueryPlan::traverse(Node *node, vector<string> &path, int index) const {
  if (index >= path.size()) return node;
  if (path[index] == "Plans") {// go to child node
    index++;
    if (path[index] == "-") {
      return node;
    }
    auto child_idx = stoi(path[index]);
    return traverse(node->get_child(child_idx), path, index + 1);
  } else {
    return node;
  }
}
//---------------------------------------------------------------------------
uint64_t LeafNode::hash() {
  if (this->precalculated_hash) return this->pc_hash;
  size_t seed = SEED;
  hash_combine(seed, node_type, relation_name);
  this->pc_hash = seed;
  this->precalculated_hash = true;
  return seed;
}
//---------------------------------------------------------------------------
void LeafNode::dot(stringstream &ss) {
  ss << "[" << node_type << ":" << preprocessStringForDot(relation_name) << ", color=" << (!match_partner ? "red" : "black") << "]" << endl;
}
//---------------------------------------------------------------------------
Node *LeafNode::get_child(int i) {
  throw;
}
//---------------------------------------------------------------------------
bool LeafNode::equals(Node *other) {
  return Node::equals(other) && relation_name == dynamic_cast<LeafNode *>(other)->relation_name;
}
//---------------------------------------------------------------------------
size_t LeafNode::get_num_children() {
  return 0;
}
//---------------------------------------------------------------------------
uint64_t InnerNode::hash() {
  if (this->precalculated_hash) return this->pc_hash;
  size_t seed = SEED;
  // todo
  //hash_combine(seed, node_type, left_hash, right_hash);
  this->pc_hash = seed;
  this->precalculated_hash = true;
  return seed;
}
//---------------------------------------------------------------------------
void InnerNode::dot(stringstream &ss) {
  ss << "[" << node_type << ", color=" << (!match_partner ? "red" : "black");
  for (auto &child: child_nodes) child->dot(ss);
  ss << "]";
}
//---------------------------------------------------------------------------
Node *InnerNode::get_child(int i) {
  assert(i < child_nodes.size());
  return child_nodes[i].get();
}
//---------------------------------------------------------------------------
bool InnerNode::equals(Node *other) {
  return Node::equals(other);
}
//---------------------------------------------------------------------------
size_t InnerNode::get_num_children() {
  return child_nodes.size();
}
//---------------------------------------------------------------------------
bool Node::equals(Node *other) {
  return this->node_type_t == other->node_type_t && this->node_type == other->node_type && this->get_num_children() == other->get_num_children();
}
//---------------------------------------------------------------------------
void Node::match_to(Node *other) {
  assert(this->match_partner == nullptr && other->match_partner == nullptr);
  this->json_node["Matched"] = true;
  this->json_node["MatchId"] = MATCHED_NODE_ID;
  other->json_node["Matched"] = true;
  other->json_node["MatchId"] = MATCHED_NODE_ID;
  match_partner = other;
  other->match_partner = this;

  MATCHED_NODE_ID++;
}
//---------------------------------------------------------------------------
static std::string preprocessStringForDot(std::string &s) {
  s.erase(std::remove_if(s.begin(), s.end(), [](char c) { return !isalpha(c) && c != '_'; }), s.end());
  return s;
}
//---------------------------------------------------------------------------