dagre.parseDot = function(str) {
  var parseTree = dot_parser.parse(str);
  var nodes = {};
  var edges = [];
  var undir = parseTree.type === "graph";

  function createNode(id, attrs) {
    if (!(id in nodes)) {
      nodes[id] = { id: id, label: id };
    }
    if (attrs) {
      mergeAttributes(attrs, nodes[id]);
    }
  }

  var edgeCount = {};
  function createEdge(source, target, attrs) {
    var edgeKey = source + "-" + target;
    var count = edgeCount[edgeKey];
    if (!count) {
      count = edgeCount[edgeKey] = 0;
    }
    edgeCount[edgeKey]++;

    var edge = {};
    mergeAttributes(attrs, edge);
    mergeAttributes({ id: edgeKey + "-" + count,
                      source: nodes[source],
                      target: nodes[target]}, edge);
    edges.push(edge);
  }

  function handleStmt(stmt) {
    switch (stmt.type) {
      case "node":
        createNode(stmt.id, stmt.attrs);
        break;
      case "edge":
        var prev;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node":
              var curr = elem.id;

              if (prev) {
                createEdge(prev, curr, stmt.attrs);
                if (undir) {
                  createEdge(curr, prev, stmt.attrs);
                }
              }
              prev = curr;
              break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }
        });
        break;
      case "attr":
        // Ignore for now
        break;
      default:
        throw new Error("Unsupported statement type: " + stmt.type);
    }
  }

  if (parseTree.stmts) {
    parseTree.stmts.forEach(function(stmt) {
      handleStmt(stmt);
    });
  }

  return { nodes: values(nodes), edges: edges };
}
