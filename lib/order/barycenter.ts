import type {Graph} from '../types';

interface BarycenterEntry {
    v: string;
    barycenter?: number;
    weight?: number;
}

export default function barycenter(graph: Graph, movable: string[] = []): BarycenterEntry[] {
    return movable.map(v => {
        const inV = graph.inEdges(v);
        if (!inV || !inV.length) {
            return {v: v};
        } else {
            const result = inV.reduce((acc, e) => {
                const edge = graph.edge(e);
                const nodeU = graph.node(e.v);
                return {
                    sum: acc.sum + (edge.weight * nodeU.order),
                    weight: acc.weight + edge.weight
                };
            }, {sum: 0, weight: 0});

            return {
                v: v,
                barycenter: result.sum / result.weight,
                weight: result.weight
            };
        }
    });
}
