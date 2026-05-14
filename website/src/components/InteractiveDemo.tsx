import {useMemo, useState} from 'react';
import {CodeBlock} from './CodeBlock';
import {D3DagreDemo} from './D3DagreDemo';
import {DemoControls} from './DemoControls';
import type {DemoDefinition} from '../content/types';
import type {ReactElement} from 'react';

type InteractiveDemoProps = {
    demo: DemoDefinition;
};

export function InteractiveDemo({demo}: InteractiveDemoProps): ReactElement {
    const [settings, setSettings] = useState(demo.initialSettings);
    const graph = useMemo(() => demo.buildGraph(settings), [demo, settings]);
    const code = useMemo(() => demo.code(settings), [demo, settings]);

    return (
        <div className="demo-block">
            <div className="demo-heading">
                <div>
                    <h3>{demo.title}</h3>
                    <p>{demo.caption}</p>
                </div>
                <DemoControls demo={demo} settings={settings} onChange={setSettings} />
            </div>
            <D3DagreDemo graph={graph} />
            <CodeBlock code={code} />
        </div>
    );
}
