import { Component, StrictMode, type ReactNode } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileEditorModel, DefaultComponentProps } from '@pterodactyl/sdk';
import MonacoEditor from '../src/client/MonacoEditor';
import FileEditor from '../src/client/FileEditor';
import extension from '../src/client/index';

const mocks = vi.hoisted(() => ({ load: vi.fn(), theme: vi.fn(), define: vi.fn(), stopTheme: vi.fn(), readTheme: vi.fn(), onThemeChange: vi.fn() }));
vi.mock('../src/client/loadRuntime', () => ({ loadRuntime: mocks.load }));
vi.mock('../src/client/theme', () => ({ readTheme: mocks.readTheme }));
vi.mock('@pterodactyl/sdk', () => ({
    definePterodactylExtension: (value: unknown) => value,
    useExtensionAction: (_name: string, callback: () => Promise<void>) => callback,
    onThemeChange: mocks.onThemeChange,
}));

function fixture(overrides: Partial<FileEditorModel> = {}): FileEditorModel {
    return {
        path: '/server.properties', name: 'server.properties', isNew: false,
        content: 'motd=Hello\r\n', language: 'text/x-properties', readOnly: false, dirty: false, saving: false,
        change: vi.fn(), save: vi.fn().mockResolvedValue(true), saveAs: vi.fn().mockResolvedValue(true),
        ...overrides,
    };
}

function mockRuntime() {
    let buffer = '';
    let change: (() => void) | undefined;
    let action: { run: () => Promise<void> } | undefined;
    const document = { getValue: () => buffer, dispose: vi.fn() };
    const listener = { dispose: vi.fn() };
    const command = { dispose: vi.fn() };
    const instance = {
        dispose: vi.fn(), updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn((callback: () => void) => { change = callback; return listener; }),
        addAction: vi.fn((value) => { action = value; return command; }),
    };
    const monaco = {
        editor: {
            createModel: vi.fn((initial: string) => { buffer = initial; return document; }),
            create: vi.fn((_element: HTMLElement, _options: { readOnly: boolean }) => instance), setModelLanguage: vi.fn(),
            defineTheme: mocks.define, setTheme: mocks.theme,
        },
        KeyMod: { CtrlCmd: 2048 }, KeyCode: { KeyS: 49 },
    };
    return { monaco, document, instance, listener, command,
        edit: (value: string) => { buffer = value; change!(); },
        save: () => action!.run(),
    };
}

let runtime: ReturnType<typeof mockRuntime>;
beforeEach(() => { mocks.define.mockClear(); mocks.theme.mockClear(); mocks.onThemeChange.mockReset().mockReturnValue(mocks.stopTheme); mocks.readTheme.mockReset().mockReturnValue({ base: 'vs-dark', inherit: true, colors: {}, rules: [] }); runtime = mockRuntime(); mocks.load.mockReset().mockResolvedValue({ monaco: runtime.monaco }); });
afterEach(cleanup);
async function ready() { await waitFor(() => expect(runtime.monaco.editor.create).toHaveBeenCalled()); }

describe('editor contract', () => {
    it('ignores stylesheet notifications for unchanged theme colors but applies a real theme change', async () => {
        const model = fixture();
        render(<MonacoEditor model={model} />);
        await ready();
        const notify = mocks.onThemeChange.mock.calls[0][0];
        expect(mocks.define).toHaveBeenCalledTimes(1);
        // Simulate the panel reporting Monaco's own stylesheet write repeatedly.
        act(() => { for (let i = 0; i < 10; i++) notify(); });
        expect(mocks.define).toHaveBeenCalledTimes(1);
        expect(mocks.theme).toHaveBeenCalledTimes(1);
        mocks.readTheme.mockReturnValue({ base: 'vs', inherit: true, colors: {}, rules: [] });
        act(() => notify());
        expect(mocks.define).toHaveBeenCalledTimes(2);
        act(() => notify());
        expect(mocks.define).toHaveBeenCalledTimes(2);
        expect(model.change).not.toHaveBeenCalled();
        expect(model.save).not.toHaveBeenCalled();
    });

    it('registers only the native editor replacement with a lazy importer', () => {
        const replace = vi.fn();
        extension.setup({ components: { replace } } as unknown as Parameters<typeof extension.setup>[0]);
        expect(replace).toHaveBeenCalledExactlyOnceWith('server.files.editor', { load: expect.any(Function) });
    });

    it('overrides only the native editor part', () => {
        const Default = vi.fn((_props: DefaultComponentProps<'server.files.editor'>) => <div>Native controls</div>);
        render(<FileEditor model={fixture()} Default={Default} parts={{} as never} />);
        expect(screen.getByText('Native controls')).toBeTruthy();
        expect(Default.mock.calls[0][0]).toEqual({ parts: { editor: MonacoEditor } });
    });

    it('reports the complete buffer, preserving line endings, and saves with the native callback', async () => {
        const model = fixture();
        render(<MonacoEditor model={model} />);
        await ready();
        expect(runtime.monaco.editor.createModel).toHaveBeenCalledWith('motd=Hello\r\n', 'ini');
        expect(runtime.monaco.editor.create.mock.calls[0][1]).toMatchObject({
            fixedOverflowWidgets: true, useShadowDOM: false,
        });
        act(() => runtime.edit('motd=Changed\r\n'));
        expect(model.change).toHaveBeenCalledExactlyOnceWith('motd=Changed\r\n');
        await act(() => runtime.save());
        expect(model.save).toHaveBeenCalledExactlyOnceWith();
    });

    it('changes language and save callbacks without recreating or overwriting the edited document', async () => {
        const original = fixture();
        const view = render(<MonacoEditor model={original} />);
        await ready();
        act(() => runtime.edit('unsaved text'));
        const next = fixture({ language: 'application/json', dirty: true });
        view.rerender(<MonacoEditor model={next} />);
        expect(runtime.monaco.editor.setModelLanguage).toHaveBeenLastCalledWith(runtime.document, 'json');
        expect(runtime.monaco.editor.createModel).toHaveBeenCalledTimes(1);
        expect(runtime.document.getValue()).toBe('unsaved text');
        await act(() => runtime.save());
        expect(next.save).toHaveBeenCalledTimes(1);
        expect(original.save).not.toHaveBeenCalled();
        act(() => runtime.edit('new changes'));
        expect(next.change).toHaveBeenCalledWith('new changes');
    });

    it('locks read-only and saving documents and blocks keyboard saves', async () => {
        const model = fixture({ readOnly: true });
        const view = render(<MonacoEditor model={model} />);
        await ready();
        expect(runtime.monaco.editor.create.mock.calls[0][1].readOnly).toBe(true);
        await act(() => runtime.save());
        expect(model.save).not.toHaveBeenCalled();
        const saving = fixture({ saving: true });
        view.rerender(<MonacoEditor model={saving} />);
        expect(runtime.instance.updateOptions).toHaveBeenLastCalledWith({ readOnly: true });
        expect(screen.getByRole('status').textContent).toBe('Saving…');
        await act(() => runtime.save());
        expect(saving.save).not.toHaveBeenCalled();
        view.rerender(<MonacoEditor model={fixture()} />);
        expect(runtime.instance.updateOptions).toHaveBeenLastCalledWith({ readOnly: false });
    });

    it('opens a restored new-file draft and delegates naming to the panel', async () => {
        const model = fixture({ content: 'restored draft', name: '', isNew: true });
        render(<MonacoEditor model={model} />);
        await ready();
        expect(runtime.document.getValue()).toBe('restored draft');
        await act(() => runtime.save());
        expect(model.save).toHaveBeenCalledTimes(1);
        expect(model.saveAs).not.toHaveBeenCalled();
    });

    it('disposes the editor, model, listener and keyboard action on unmount', async () => {
        const view = render(<MonacoEditor model={fixture()} />);
        await ready();
        view.unmount();
        for (const item of [runtime.document, runtime.instance, runtime.listener, runtime.command]) {
            expect(item.dispose).toHaveBeenCalledTimes(1);
        }
        expect(mocks.stopTheme).toHaveBeenCalled();
    });

    it('does not create an editor when a pending load finishes after unmount', async () => {
        let resolve!: (runtime: unknown) => void;
        mocks.load.mockReturnValue(new Promise((done) => { resolve = done; }));
        const view = render(<MonacoEditor model={fixture()} />);
        expect(screen.getByRole('status').textContent).toBe('Loading editor…');
        view.unmount();
        await act(async () => resolve({ monaco: runtime.monaco }));
        expect(runtime.monaco.editor.create).not.toHaveBeenCalled();
    });

    it('survives React Strict Mode without duplicate live editors', async () => {
        const view = render(<StrictMode><MonacoEditor model={fixture()} /></StrictMode>);
        await ready();
        expect(runtime.monaco.editor.create).toHaveBeenCalledTimes(1);
        view.unmount();
        expect(runtime.document.dispose).toHaveBeenCalledTimes(1);
    });

    it('sends loading failures to the host error boundary', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.load.mockRejectedValue(new Error('Worker assets unavailable'));
        class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
            state = { failed: false };
            static getDerivedStateFromError() { return { failed: true }; }
            render() { return this.state.failed ? <div>Native fallback</div> : this.props.children; }
        }
        render(<Boundary><MonacoEditor model={fixture()} /></Boundary>);
        expect(await screen.findByText('Native fallback')).toBeTruthy();
    });
});
