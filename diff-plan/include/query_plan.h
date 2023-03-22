#pragma once
#include "../third-party/json/single_include/nlohmann/json.hpp"
#include <string>
#include <sstream>
#include <unordered_set>
//---------------------------------------------------------------------------
struct Node;
struct QueryPlan;
//---------------------------------------------------------------------------
using namespace std;
using json = nlohmann::json;
//---------------------------------------------------------------------------
static unordered_set<string> ignored_types;
//---------------------------------------------------------------------------
enum NodeType : uint8_t { LEAF,
                          INNER };
//---------------------------------------------------------------------------
static constexpr const char *MATCHED = "Matched";
static size_t MATCHED_NODE_ID = 0;
//---------------------------------------------------------------------------
static std::string preprocessStringForDot(std::string &);
//---------------------------------------------------------------------------
struct Node {
  NodeType node_type_t;
  Node *parent = nullptr;       // null if this is the root node
  Node *match_partner = nullptr;// potential mach partner in another query plan
  string node_type;
  size_t pc_hash;
  json &json_node;
  bool precalculated_hash;
  // Is this node changed?
  bool changed;

  // The constructor
  Node(NodeType node_type_t, Node *parent, json &json_node) : node_type_t(node_type_t), parent(parent), json_node(json_node) {}
  virtual ~Node() = default;


  std::ostream &operator<<(std::ostream &out) const {
    out << node_type;
    return out;
  }

  void match_to(Node *other);
  virtual size_t get_num_children() = 0;
  virtual bool equals(Node *other);
  virtual void mark_changed() { changed = true; };
  virtual uint64_t hash() = 0;
  virtual void dot(stringstream &) = 0;
  virtual Node *get_child(int i) = 0;
  virtual void join_order(stringstream&) = 0;
};
//---------------------------------------------------------------------------
struct LeafNode : public Node {
  // The constructor
  explicit LeafNode(Node *parent, json &node) : Node(LEAF, parent, node) {}

  string relation_name;

  size_t get_num_children() override;
  bool equals(Node *other) override;
  uint64_t hash() override;
  void dot(stringstream &) override;
  Node *get_child(int i) override;
  virtual void join_order(stringstream&) = 0;
};
//---------------------------------------------------------------------------
struct InnerNode : public Node {
  // The constructor
  explicit InnerNode(Node *parent, json &node) : Node(INNER, parent, node) {}

  vector<unique_ptr<Node>> child_nodes;

  size_t get_num_children() override;
  bool equals(Node *other) override;
  uint64_t hash() override;
  void dot(stringstream &) override;
  Node *get_child(int i) override;
  virtual void join_order(stringstream&) = 0;
};
//---------------------------------------------------------------------------
class QueryPlan {
 public:
  // The constructor
  QueryPlan(string disabled_rules, json query_plan);
  // Create dot representation for graph
  string dot() const;
  // Calculate the difference based on json diff tool
  void diff(QueryPlan &);
  // Return the join order of this query plan
  virtual string join_order() = 0;
  // Reset matches and parse again from json
  virtual void reset() = 0;

 private:
  Node *traverse(Node *node, vector<string> &, int index) const;

 public:
  json query_plan;
  unique_ptr<Node> root;
  string disabled_rules;
};
//---------------------------------------------------------------------------