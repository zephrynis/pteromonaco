import { registerGrammars } from './grammars';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker';
import CssWorker from 'monaco-editor/language/css/css.worker.js?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker.js?worker';
import TypeScriptWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';

// Vite builds these as same-origin files, relative to this extension's versioned asset path.
globalThis.MonacoEnvironment = {
    getWorker(_moduleId, label) {
        if (label === 'json') return new JsonWorker();
        if (['css', 'scss', 'less'].includes(label)) return new CssWorker();
        if (['html', 'handlebars', 'razor'].includes(label)) return new HtmlWorker();
        if (['typescript', 'javascript'].includes(label)) return new TypeScriptWorker();
        return new EditorWorker();
    },
};

registerGrammars(monaco);

// Monarch highlighting for native picker modes not shipped by Monaco.
const extraLanguages: Record<string, monaco.languages.IMonarchLanguage> = {
    'pteromonaco-toml': { tokenizer: { root: [
        [/#.*$/, 'comment'], [/\[.*?\]/, 'type'], [/"(?:[^"\\]|\\.)*"|'[^']*'/, 'string'],
        [/\b(?:true|false)\b/, 'keyword'], [/\b[+-]?\d[\d_.:-]*\b/, 'number'],
        [/^[\w.-]+(?=\s*=)/, 'key'], [/[=,{}]/, 'delimiter'],
    ] } },
    'pteromonaco-nginx': { tokenizer: { root: [
        [/#.*$/, 'comment'], [/"(?:[^"\\]|\\.)*"|'[^']*'/, 'string'],
        [/\$\w+/, 'variable'], [/\b\d+\b/, 'number'], [/\b(?:on|off)\b/, 'keyword'],
        [/^\s*[\w_]+/, 'keyword'], [/[{};]/, 'delimiter'],
    ] } },
    'pteromonaco-http': { tokenizer: { root: [
        [/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/, 'keyword'],
        [/^HTTP\/\S+\s+\d+/, 'keyword'], [/^[\w-]+(?=:)/, 'key'], [/https?:\/\/\S+/, 'string'],
    ] } },
    'pteromonaco-diff': { tokenizer: { root: [
        [/^\+.*$/, 'string'], [/^-.*$/, 'invalid'], [/^@@.*$/, 'keyword'], [/^diff.*$/, 'comment'],
    ] } },
};
for (const [id, definition] of Object.entries(extraLanguages)) {
    monaco.languages.register({ id });
    monaco.languages.setMonarchTokensProvider(id, definition);
}

export { monaco };
