#pragma once
//---------------------------------------------------------------------------
#include <query_plan.h>
#include <sstream>
//---------------------------------------------------------------------------
#include "../third-party/json/single_include/nlohmann/json.hpp"
//---------------------------------------------------------------------------
using json = nlohmann::json;
//---------------------------------------------------------------------------
struct PrestoInnerNode : public InnerNode {
  // The constructor
  explicit PrestoInnerNode(Node *parent, json &node) : InnerNode(parent, node) {}

  bool equals(Node *other) override;
  void dot(stringstream &) override;
  void join_order(stringstream&) override;

  std::string identifier;
  std::string details;
};
//---------------------------------------------------------------------------
struct PrestoLeafNode : public LeafNode {
  // The constructor
  explicit PrestoLeafNode(Node *parent, json &node) : LeafNode(parent, node) {}

  bool equals(Node *other) override;
  void dot(stringstream &) override;
  void join_order(stringstream&) override;

  std::string identifier;
  std::string details;
};
//---------------------------------------------------------------------------
class PrestoQueryPlan : public QueryPlan {
 public:
  // The constructor
  PrestoQueryPlan(string disabled_rules, json query_plan);
  // Reset matches and parse again from json
  void reset() override;
  // Return the join order of this query plan
  string join_order() override;

 private:
  unique_ptr<Node> parse_node(json &, Node *parent);
};
//---------------------------------------------------------------------------