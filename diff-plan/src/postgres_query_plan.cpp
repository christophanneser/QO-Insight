#include "postgres_query_plan.h"
#include <regex>
#include <utility>
//---------------------------------------------------------------------------
using namespace std;
//---------------------------------------------------------------------------
static constexpr const char *CHILD_NODES = "Plans";
static constexpr const char *INDEX_NAME = "Index Name";
static constexpr const char *RELATION_NAME = "Relation Name";
static constexpr const char *OPERATOR_TYPE = "Node Type";
//---------------------------------------------------------------------------
PostgresQueryPlan::PostgresQueryPlan(string disabled_rules, json query_plan) : QueryPlan(std::move(disabled_rules), std::move(query_plan)) {
  root = parse_node(this->query_plan, nullptr);
}
//---------------------------------------------------------------------------
unique_ptr<Node> PostgresQueryPlan::parse_node(json &plan, Node *parent) {
  auto operator_type = plan[OPERATOR_TYPE].get<std::string>();
  plan[MATCHED] = false;

  if (plan.contains(CHILD_NODES)) {
    // Process InnerNode
    json &child_nodes = plan[CHILD_NODES];
    auto node = make_unique<PGInnerNode>(parent, plan);
    node->node_type = operator_type;
    for (auto &child: child_nodes)
      node->child_nodes.emplace_back(parse_node(child, node.get()));
    return std::move(node);
  } else {
    // Process LeafNode
    auto node = make_unique<PGLeafNode>(parent, plan);
    node->node_type = operator_type;
    if (plan.contains(RELATION_NAME)) {
      node->relation_name = plan[RELATION_NAME];
    } else if (plan.contains(INDEX_NAME)) {
      node->relation_name = plan[INDEX_NAME];
    }
    return std::move(node);
  }
}
//---------------------------------------------------------------------------
void PostgresQueryPlan::reset() {
  root = parse_node(query_plan, nullptr);
}
//---------------------------------------------------------------------------
string PostgresQueryPlan::join_order() {
  stringstream rep;
  root->join_order(rep);
  return rep.str();
}
//---------------------------------------------------------------------------
void PGInnerNode::join_order(stringstream &rep) {
  if (InnerNode::get_num_children() == 1) {
    InnerNode::get_child(0)->join_order(rep);
  } else {
    rep << "(";
    for (auto i = 0; i < InnerNode::get_num_children(); i++)
      InnerNode::get_child(i)->join_order(rep);
    rep << ")";
  }
}
//---------------------------------------------------------------------------
void PGLeafNode::join_order(stringstream &rep) {
  rep << "[" << std::regex_replace(relation_name, std::regex("_pkey"), "") << "]";
}
//---------------------------------------------------------------------------
