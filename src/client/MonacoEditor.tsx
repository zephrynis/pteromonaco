import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { onThemeChange, useExtensionAction, type ComponentPartProps } from '@pterodactyl/sdk';
import type * as Monaco from 'monaco-editor';
import { loadRuntime } from './loadRuntime';
import { resolveLanguage } from './language';
import { readTheme } from './theme';
import './styles.css';

export default function MonacoEditor({ model }: ComponentPartProps<'server.files.editor'>) {
    const mount = useRef<HTMLDivElement>(null);
    const editor = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const text = useRef<Monaco.editor.ITextModel | null>(null);
    const runtime = useRef<typeof import('./runtime') | null>(null);
    const latest = useRef(model);
    const [content] = useState(model.content);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const save = useExtensionAction('save', async () => {
        if (!latest.current.readOnly && !latest.current.saving) await latest.current.save();
    });
    const saveRef = useRef(save);

    useLayoutEffect(() => {
        latest.current = model;
        saveRef.current = save;
    });

    useEffect(() => {
        let disposed = false;
        let release: (() => void) | undefined;
        loadRuntime().then(({ monaco }) => {
            if (disposed || !mount.current) return;
            const disposables: Monaco.IDisposable[] = [];
            let stopTheme: (() => void) | undefined;
            let instance: Monaco.editor.IStandaloneCodeEditor | undefined;
            let document: Monaco.editor.ITextModel | undefined;
            const cleanup = () => {
                stopTheme?.();
                disposables.forEach((item) => item.dispose());
                instance?.dispose();
                document?.dispose();
                editor.current = null;
                text.current = null;
                runtime.current = null;
            };
            try {
                runtime.current = { monaco };
                let appliedTheme: string | undefined;
                const updateTheme = () => {
                    const theme = readTheme(mount.current!);
                    const signature = JSON.stringify(theme);
                    // The panel observes stylesheet mutations, including Monaco's own.
                    // Reapplying an identical theme would trigger this callback indefinitely
                    // and keep invalidating the document's syntax tokens.
                    if (signature === appliedTheme) return;
                    appliedTheme = signature;
                    monaco.editor.defineTheme('pteromonaco', theme);
                    monaco.editor.setTheme('pteromonaco');
                };
                updateTheme();
                document = monaco.editor.createModel(content, resolveLanguage(latest.current.language));
                text.current = document;
                instance = monaco.editor.create(mount.current, {
                    model: document, theme: 'pteromonaco', automaticLayout: true,
                    readOnly: latest.current.readOnly || latest.current.saving,
                    ariaLabel: 'File editor', fontSize: 13,
                    fontFamily: getComputedStyle(mount.current).fontFamily,
                    tabSize: 4, insertSpaces: true, wordWrap: 'on',
                    minimap: { enabled: false }, padding: { top: 12, bottom: 12 },
                    scrollBeyondLastLine: true, fixedOverflowWidgets: true,
                    // Fixed menus are portalled outside the editor. A shadow root there cannot
                    // see Monaco's document-level theme stylesheet and renders black on transparent.
                    useShadowDOM: false,
                });
                editor.current = instance;
                disposables.push(instance.onDidChangeModelContent(() => {
                    latest.current.change(document!.getValue());
                }));
                disposables.push(instance.addAction({
                    id: 'pteromonaco.save', label: 'Save File',
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                    run: () => saveRef.current(),
                }));
                stopTheme = onThemeChange(updateTheme);
                release = cleanup;
                setReady(true);
            } catch (cause) {
                cleanup();
                throw cause;
            }
        }).catch((cause: unknown) => {
            if (!disposed) setError(cause instanceof Error ? cause : new Error(String(cause)));
        });
        return () => { disposed = true; release?.(); };
    }, [content]);

    useEffect(() => {
        const monaco = runtime.current?.monaco;
        if (monaco && text.current) monaco.editor.setModelLanguage(text.current, resolveLanguage(model.language));
    }, [model.language, ready]);

    useEffect(() => {
        editor.current?.updateOptions({ readOnly: model.readOnly || model.saving });
    }, [model.readOnly, model.saving, ready]);

    // Core's boundary restores CodeMirror from its live buffer on load/render failure.
    if (error) throw error;
    return (
        <div className='pteromonaco-editor' aria-busy={!ready || model.saving}>
            <div className='pteromonaco-editor__mount' ref={mount} />
            {!ready && <div className='pteromonaco-editor__status' role='status'>Loading editor…</div>}
            {ready && model.saving && <div className='pteromonaco-editor__status' role='status'>Saving…</div>}
        </div>
    );
}
