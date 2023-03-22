#include "presto_query_plan.h"
#include <iostream>
#include <regex>
#include <utility>
#include <sstream>
//---------------------------------------------------------------------------
using namespace std;
//---------------------------------------------------------------------------
static constexpr const char *CHILD_NODES = "children";
static constexpr const char *IDENTIFIER = "identifier";
static constexpr const char *DETAILS = "details";
static constexpr const char *OPERATOR_TYPE = "name";
//---------------------------------------------------------------------------
inline string fix_operator_typename(string &str) {
  const regex reg(R"(/\(.*\)|\[.*\]|\{.*\}/gm)");
  return regex_replace(str, reg, "");
}
//---------------------------------------------------------------------------
inline string fix_details(string &str) {
  const regex reg(R"(/\(|\)|\[|\]|\{|\}|:=|_|\,|, |\$|$/gm)");
  return regex_replace(str, reg, "");
}
//---------------------------------------------------------------------------
inline string parse_table_name(string str) {
  const regex table_name_reg(R"(TableHandle \{connectorId='(.*)', connectorHandle='(.*)', layout)");
  smatch sm;
  bool found_matches = regex_search(str, sm, table_name_reg);
  assert(found_matches);
  return sm[1].str() + "-" + sm[2].str();
}
//---------------------------------------------------------------------------
PrestoQueryPlan::PrestoQueryPlan(string disabled_rules, json query_plan) : QueryPlan(std::move(disabled_rules), std::move(query_plan)) {
  root = parse_node(this->query_plan, nullptr);
}
//---------------------------------------------------------------------------
unique_ptr<Node> PrestoQueryPlan::parse_node(json &plan, Node *parent) {
  auto operator_type = plan[OPERATOR_TYPE].get<string>();
  operator_type = fix_operator_typename(operator_type);
  plan[MATCHED] = false;
  json &child_nodes = plan[CHILD_NODES];

  if (!child_nodes.empty()) {
    // Process InnerNode
    auto node = make_unique<PrestoInnerNode>(parent, plan);
    node->node_type = operator_type;
    node->identifier = plan[IDENTIFIER];
    node->details = plan[DETAILS];
    for (auto &child: child_nodes)
      node->child_nodes.emplace_back(parse_node(child, node.get()));
    return std::move(node);
  } else {
    // Process LeafNode
    auto node = make_unique<PrestoLeafNode>(parent, plan);
    node->node_type = operator_type;
    node->relation_name = parse_table_name(plan[IDENTIFIER]);
    node->identifier = plan[IDENTIFIER];
    node->details = plan[DETAILS];
    return std::move(node);
  }
}
//---------------------------------------------------------------------------
void PrestoQueryPlan::reset() {
  root = parse_node(query_plan, nullptr);
}
string PrestoQueryPlan::join_order() {
  throw "not yet implemented";
}
//---------------------------------------------------------------------------
bool PrestoInnerNode::equals(Node *other) {
  return InnerNode::equals(other) && details == dynamic_cast<PrestoInnerNode *>(other)->details;
}
//---------------------------------------------------------------------------
void PrestoInnerNode::dot(stringstream &ss) {
  ss << "[" << node_type << fix_details(details) << ", color=" << (!match_partner ? "red" : "black");
  for (auto &child: child_nodes) child->dot(ss);
  ss << "]";
}
//---------------------------------------------------------------------------
void PrestoInnerNode::join_order(stringstream &) {
  // todo
}
//---------------------------------------------------------------------------
bool PrestoLeafNode::equals(Node *other) {
  return LeafNode::equals(other) && details == dynamic_cast<PrestoLeafNode *>(other)->details;
}
//---------------------------------------------------------------------------
void PrestoLeafNode::dot(stringstream &ss) {
  ss << "[" << node_type << ":" << fix_details(relation_name) << ", color=" << (!match_partner ? "red" : "black") << "]" << endl;
}
//---------------------------------------------------------------------------
void PrestoLeafNode::join_order(stringstream &) {
  // todo
}
