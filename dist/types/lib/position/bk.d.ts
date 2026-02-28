import { Graph } from "../graph-lib";
import type { EdgeLabel, GraphLabel, NodeLabel } from "../types";
export { positionX, findType1Conflicts, findType2Conflicts, addConflict, hasConflict, verticalAlignment, horizontalCompaction, alignCoordinates, findSmallestWidthAlignment, balance };
type Conflicts = {
    [key: string]: {
        [key: string]: boolean;
    };
};
type PositionMap = {
    [key: string]: number;
};
type AlignmentResult = {
    root: {
        [key: string]: string;
    };
    align: {
        [key: string]: string;
    };
};
type XssMap = {
    [key: string]: PositionMap;
};
declare function findType1Conflicts(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][]): Conflicts;
declare function findType2Conflicts(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][]): Conflicts;
declare function addConflict(conflicts: Conflicts, v: string, w: string): void;
declare function hasConflict(conflicts: Conflicts, v: string, w: string): boolean;
declare function verticalAlignment(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][], conflicts: Conflicts, neighborFn: (v: string) => string[]): AlignmentResult;
declare function horizontalCompaction(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][], root: {
    [key: string]: string;
}, align: {
    [key: string]: string;
}, reverseSep?: boolean): PositionMap;
declare function findSmallestWidthAlignment(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, xss: XssMap): PositionMap;
declare function alignCoordinates(xss: XssMap, alignTo: PositionMap): void;
declare function balance(xss: XssMap, align?: string | undefined): PositionMap;
declare function positionX(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): PositionMap;
//# sourceMappingURL=bk.d.ts.map