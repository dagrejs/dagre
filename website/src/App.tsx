import {useEffect, useMemo, useState} from 'react';
import {Compass, Github, Menu, MoveHorizontal, Rocket, Scaling, SlidersHorizontal, Table2, Tags, X} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ReactElement} from 'react';
import {InteractiveDemo} from './components/InteractiveDemo';
import {pages} from './content/pages';
import type {AttributeDefinition} from './content/types';

const navIcons: Record<string, LucideIcon> = {
    'getting-started': Rocket,
    attributes: Table2,
    'layout-direction': Compass,
    spacing: SlidersHorizontal,
    'node-sizes': Scaling,
    'edge-labels': Tags,
};

function pageIdFromHash(): string | undefined {
    const hashId = window.location.hash.replace(/^#/, '');
    return pages.find((page) => page.id === hashId || page.sections.some((section) => section.id === hashId))?.id;
}

function AttributeTable({attributes}: {attributes: AttributeDefinition[]}): ReactElement {
    return (
        <div className="attribute-table-wrap">
            <table className="attribute-table">
                <thead>
                    <tr>
                        <th>Target</th>
                        <th>Name</th>
                        <th>Default</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {attributes.map((attribute) => (
                        <tr key={`${attribute.target}-${attribute.name}`}>
                            <td>{attribute.target}</td>
                            <td>
                                <code>{attribute.name}</code>
                            </td>
                            <td>
                                <code>{attribute.defaultValue}</code>
                            </td>
                            <td>{attribute.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function App(): ReactElement {
    const firstPage = pages[0];

    if (!firstPage) {
        throw new Error('No demo pages configured');
    }

    const fallbackPageId = firstPage.id;
    const [activePageId, setActivePageId] = useState(() => pageIdFromHash() ?? fallbackPageId);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const activePage = useMemo(
        () => pages.find((page) => page.id === activePageId) ?? firstPage,
        [activePageId],
    );

    useEffect(() => {
        function syncPageFromHash(): void {
            const hashPageId = pageIdFromHash();
            if (hashPageId) {
                setActivePageId(hashPageId);
            }
        }

        window.addEventListener('hashchange', syncPageFromHash);
        return () => window.removeEventListener('hashchange', syncPageFromHash);
    }, [fallbackPageId]);

    useEffect(() => {
        const hashId = window.location.hash.replace(/^#/, '');
        const target = hashId ? document.getElementById(hashId) : null;

        if (target) {
            requestAnimationFrame(() => target.scrollIntoView());
        }
    }, [activePageId]);

    return (
        <div className="app-shell">
            <header className="topbar">
                <button className="icon-button nav-toggle" type="button" onClick={() => setIsNavOpen(true)} aria-label="Open navigation">
                    <Menu size={20} />
                </button>
                <a className="topbar-link" href="https://github.com/dagrejs/dagre" target="_blank" rel="noreferrer">
                    <Github size={18} />
                    GitHub
                </a>
                <div className="version-pill">Dagre v3.0.1-pre</div>
            </header>

            <div className="docs-frame">
                <nav className={`sidebar ${isNavOpen ? 'is-open' : ''}`} aria-label="Demo pages" tabIndex={-1}>
                    <div className="sidebar-gradient" />
                    <div className="sidebar-container">
                        <div className="sidebar-top">
                            <a className="sidebar-wordmark" href="#getting-started" onClick={() => setActivePageId('getting-started')}>
                                Dagre
                            </a>
                            <button className="icon-button mobile-only" type="button" onClick={() => setIsNavOpen(false)} aria-label="Close navigation">
                                <X size={18} />
                            </button>
                        </div>
                        <ul className="nav-list">
                            {pages.map((page) => {
                                const Icon = navIcons[page.id] ?? MoveHorizontal;

                                return (
                                    <li key={page.id}>
                                        <a
                                            className={page.id === activePage.id ? 'active' : ''}
                                            href={`#${page.id}`}
                                            aria-current={page.id === activePage.id ? 'page' : undefined}
                                            onClick={() => {
                                                setActivePageId(page.id);
                                                setIsNavOpen(false);
                                            }}
                                        >
                                            <Icon size={24} strokeWidth={1.7} />
                                            <span>{page.navTitle}</span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                {isNavOpen && (
                    <button className="nav-scrim" type="button" onClick={() => setIsNavOpen(false)} aria-label="Close navigation">
                        <span />
                    </button>
                )}

                <main className="content">
                    <section className="page-card" id={activePage.id}>
                        <div className="page-card-icon">D</div>
                        <div>
                            <p className="eyebrow">{activePage.eyebrow}</p>
                            <h1>{activePage.title}</h1>
                            <p className="lead">{activePage.description}</p>
                        </div>
                    </section>

                    {activePage.sections.map((section) => (
                        <section className="doc-section" id={section.id} key={section.id}>
                            <div className="section-copy">
                                <h2>{section.title}</h2>
                                {section.body.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            {section.demo && <InteractiveDemo demo={section.demo} />}
                            {section.attributes && <AttributeTable attributes={section.attributes} />}
                        </section>
                    ))}

                    <footer className="site-footer">
                        <p>© 2026 • MIT License</p>
                        <p>
                            Inspired by{' '}
                            <a href="https://floating-ui.com/" target="_blank" rel="noreferrer">
                                Floating UI
                            </a>{' '}
                            design.
                        </p>
                    </footer>
                </main>

                <aside className="toc">
                    <span>On this page</span>
                    {activePage.sections.map((section) => (
                        <a href={`#${section.id}`} key={section.id}>
                            {section.title}
                        </a>
                    ))}
                </aside>
            </div>
        </div>
    );
}
