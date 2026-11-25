import {Graph} from '../lib/graph-lib';
import {layout} from '../lib/layout';

describe.each(['TB', 'BT', 'LR', 'RL'])('tree sibling ordering (%s)', rankdir => {
    it.each(['a', 'b'])('keeps the same tie direction below %s', parent => {
        const g = new Graph().setGraph({rankdir}).setDefaultEdgeLabel(() => ({}));
        const edges = [
            ['root', 'b'], ['root', 'a'],
            [parent, 'b2'], [parent, 'b1'],
            ['b1', 'x2'], ['b1', 'x1']
        ];
        edges.forEach(([v, w]) => g.setEdge(v!, w!));
        g.nodes().forEach(v => g.setNode(v, {width: 50, height: 50}));

        layout(g);

        const axis = rankdir === 'TB' || rankdir === 'BT' ? 'x' : 'y';
        for (const siblings of [['a', 'b'], ['b1', 'b2'], ['x1', 'x2']]) {
            const ordered = [...siblings].sort((v, w) => g.node(v)[axis] - g.node(w)[axis]);
            expect(ordered).toEqual(siblings);
        }
    });
});
