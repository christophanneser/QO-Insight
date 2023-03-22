#pragma once
//---------------------------------------------------------------------------
#include <query_plan.h>
#include <string>
#include <sstream>
//---------------------------------------------------------------------------
#include "../third-party/json/single_include/nlohmann/json.hpp"
//---------------------------------------------------------------------------
using json = nlohmann::json;
//---------------------------------------------------------------------------
struct PGInnerNode : public InnerNode {
  // The constructor
  explicit PGInnerNode(Node *parent, json &node) : InnerNode(parent, node) {}


  void join_order(stringstream&) override;

  // todo: Add grammar for postgres nodes
};
//---------------------------------------------------------------------------
struct PGLeafNode : public LeafNode {
  // The constructor
  explicit PGLeafNode(Node *parent, json &node) : LeafNode(parent, node) {}

  void join_order(stringstream&) override;
  // todo: Add grammar for postgres nodes
};
//---------------------------------------------------------------------------
class PostgresQueryPlan : public QueryPlan {
 public:
  // The constructor
  PostgresQueryPlan(string disabled_rules, json query_plan);
  // Reset matches and parse again from json
  void reset() override;
  // Return the join order of this query plan
  string join_order() final;

 private:
  unique_ptr<Node> parse_node(json &, Node *parent);
};
//---------------------------------------------------------------------------