/*
Copyright (c) 2012-2013 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var util = require("../util");

module.exports = function() {
  // External configuration
  var config = {
    debugLevel: 0
  };

  var timer = util.createTimer();

  var self = {};

  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Acyclic Phase", run);

  self.undo = function(g) {
    g.eachEdge(function(e, s, t, a) {
      if (a.reversed) {
        delete a.reversed;
        g.delEdge(e);
        g.addEdge(e, t, s, a);
      }
    });
  };

  return self;

  function run(g) {
    var onStack = {},
        visited = {},
        reverseCount = 0;

    function dfs(u) {
      if (u in visited) return;

      visited[u] = onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var t = g.target(e),
            a;

        if (t in onStack) {
          a = g.edge(e);
          g.delEdge(e);
          a.reversed = true;
          ++reverseCount;
          g.addEdge(e, t, u, a);
        } else {
          dfs(t);
        }
      });

      delete onStack[u];
    }

    g.eachNode(function(u) { dfs(u); });

    if (config.debugLevel >= 2) console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
  }
};
