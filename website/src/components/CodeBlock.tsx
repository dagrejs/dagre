import type {ReactElement} from 'react';

type CodeBlockProps = {
    code: string;
};

export function CodeBlock({code}: CodeBlockProps): ReactElement {
    return (
        <pre className="code-block">
            <code>{code}</code>
        </pre>
    );
}
