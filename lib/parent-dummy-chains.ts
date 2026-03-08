import type {Edge, EdgeLabel, Graph, GraphLabel, NodeLabel} from "./types";
import {GRAPH_NODE} from "./util";

export default parentDummyChains;

interface PostorderNum {
    low: number;
    lim: number;
}

interface PathData {
    path: (string | undefined)[];
    lca: string | undefined;
}

function parentDummyChains(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const postorderNums: { [key: string]: PostorderNum } = postorder(graph);

    graph.graph().dummyChains!.forEach(v => {
        let node: NodeLabel = graph.node(v);
        const edgeObj: Edge = node.edgeObj!;
        const pathData: PathData = findPath(graph, postorderNums, edgeObj.v, edgeObj.w);
        const path: (string | undefined)[] = pathData.path;
        const lca: string | undefined = pathData.lca;
        let pathIdx: number = 0;
        let pathV: string | undefined = path[pathIdx];
        let ascending: boolean = true;

        while (v !== edgeObj.w) {
            node = graph.node(v);

            if (ascending) {
                while ((pathV = path[pathIdx]) !== lca &&
                graph.node(pathV!).maxRank! < node.rank!) {
                    pathIdx++;
                }

                if (pathV === lca) {
                    ascending = false;
                }
            }

            if (!ascending) {
                while (pathIdx < path.length - 1 &&
                graph.node((path[pathIdx + 1])!).minRank! <= node.rank!) {
                    pathIdx++;
                }
                pathV = path[pathIdx];
            }

            if (pathV !== undefined) {
                graph.setParent(v, pathV);
            }
            v = graph.successors(v)![0]!;
        }
    });
}

// Find a path from v to w through the lowest common ancestor (LCA). Return the
// full path and the LCA.
function findPath(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    postorderNums: { [key: string]: PostorderNum },
    v: string,
    w: string
): PathData {
    const vPath: (string | undefined)[] = [];
    const wPath: (string | undefined)[] = [];
    const low: number = Math.min(postorderNums[v]!.low, postorderNums[w]!.low);
    const lim: number = Math.max(postorderNums[v]!.lim, postorderNums[w]!.lim);
    let parent: string | undefined;

    // Traverse up from v to find the LCA
    parent = v;
    do {
        parent = graph.parent(parent) as string | undefined;
        vPath.push(parent);
    } while (parent &&
    (postorderNums[parent]!.low > low || lim > postorderNums[parent]!.lim));
    const lca = parent;

    // Traverse from w to LCA
    let wParent: string = w;
    while ((wParent = graph.parent(wParent) as string) !== lca) {
        wPath.push(wParent);
    }

    return {path: vPath.concat(wPath.reverse()), lca: lca};
}

function postorder(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): { [key: string]: PostorderNum } {
    const result: { [key: string]: PostorderNum } = {};
    let lim: number = 0;

    function dfs(v: string): void {
        const low: number = lim;
        graph.children(v).forEach(dfs);
        result[v] = {low: low, lim: lim++};
    }

    graph.children(GRAPH_NODE).forEach(dfs);

    return result;
}
