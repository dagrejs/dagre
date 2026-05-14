import {useEffect, useRef} from 'react';
import * as d3 from 'd3';
import * as dagre from '@dagrejs/dagre';
import type {EdgeLabel, GraphLabel, NodeLabel} from '@dagrejs/dagre';
import type {Edge, Graph} from '@dagrejs/graphlib';
import type {ReactElement} from 'react';

type D3DagreDemoProps = {
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>;
};

type RenderNode = NodeLabel & {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

type RenderEdge = EdgeLabel & {
    id: string;
    edge: Edge;
};

export function D3DagreDemo({graph}: D3DagreDemoProps): ReactElement {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!svgRef.current) {
            return;
        }

        dagre.layout(graph);

        const graphLabel = graph.graph();
        const width = Math.max(520, Number(graphLabel.width ?? 520) + 48);
        const height = Math.max(300, Number(graphLabel.height ?? 300) + 48);
        const nodes = graph.nodes().map((id): RenderNode => {
            const node = graph.node(id);

            return {
                ...node,
                id,
                label: typeof node.label === 'string' ? node.label : id,
                x: Number(node.x ?? 0),
                y: Number(node.y ?? 0),
                width: Number(node.width),
                height: Number(node.height),
            };
        });
        const edges = graph.edges().map((edge): RenderEdge => ({
            ...graph.edge(edge),
            id: `${edge.v}-${edge.w}-${edge.name ?? 'edge'}`,
            edge,
        }));

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('viewBox', `0 0 ${width} ${height}`);

        const root = svg.append('g').attr('class', 'graph-root');
        const content = root
            .append('g')
            .attr('transform', 'translate(24, 24)');

        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.35, 2])
                .on('zoom', (event) => {
                    root.attr('transform', event.transform.toString());
                }),
        );

        const line = d3.line<{x: number; y: number}>()
            .x((point) => point.x)
            .y((point) => point.y)
            .curve(d3.curveBasis);

        content
            .append('g')
            .attr('class', 'edges')
            .selectAll('path')
            .data(edges)
            .join('path')
            .attr('class', (edge) => `edge-path ${typeof edge.class === 'string' ? edge.class : ''}`)
            .style('stroke-width', (edge) => {
                const weight = Number(edge.weight ?? 1);
                return typeof edge.class === 'string' && edge.class.includes('focus')
                    ? 1.8 + weight * 0.28
                    : 1.8;
            })
            .attr('d', (edge) => line(edge.points ?? []) ?? '');

        const edgeLabelGroups = content
            .append('g')
            .attr('class', 'edge-labels')
            .selectAll('g')
            .data(edges.filter((edge) => typeof edge.label === 'string'))
            .join('g')
            .attr('class', (edge) => `edge-label ${typeof edge.class === 'string' ? edge.class : ''}`)
            .attr('transform', (edge) => `translate(${Number(edge.x ?? 0)}, ${Number(edge.y ?? 0)})`);

        edgeLabelGroups
            .append('rect')
            .attr('x', (edge) => -Number(edge.width ?? 0) / 2)
            .attr('y', (edge) => -Number(edge.height ?? 0) / 2)
            .attr('width', (edge) => Number(edge.width ?? 0))
            .attr('height', (edge) => Number(edge.height ?? 0))
            .attr('rx', 5)
            .attr('ry', 5);

        edgeLabelGroups
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text((edge) => String(edge.label));

        const nodeGroups = content
            .append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', (node) => `node ${typeof node.class === 'string' ? node.class : ''}`)
            .attr('transform', (node) => `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`);

        nodeGroups
            .append('rect')
            .attr('width', (node) => node.width)
            .attr('height', (node) => node.height)
            .attr('rx', 7)
            .attr('ry', 7);

        nodeGroups
            .append('text')
            .attr('x', (node) => node.width / 2)
            .attr('y', (node) => node.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text((node) => node.label);
    }, [graph]);

    return (
        <div className="graph-stage">
            <svg ref={svgRef} role="img" aria-label="Dagre graph rendered with D3" />
        </div>
    );
}
