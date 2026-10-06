import type * as Monaco from 'monaco-editor';

// Load the picker grammars with the runtime rather than waiting for Monaco's
// asynchronous first-language encounter. Existing content is tokenized on first paint.
const grammars = import.meta.glob<{
    conf: Monaco.languages.LanguageConfiguration;
    language: Monaco.languages.IMonarchLanguage;
}>([
    '/node_modules/monaco-editor/esm/vs/languages/definitions/cpp/cpp.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/csharp/csharp.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/css/css.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/dockerfile/dockerfile.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/go/go.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/html/html.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/ini/ini.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/javascript/javascript.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/lua/lua.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/markdown/markdown.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/mysql/mysql.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/pgsql/pgsql.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/php/php.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/pug/pug.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/python/python.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/ruby/ruby.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/rust/rust.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/scss/scss.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/shell/shell.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/sql/sql.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/typescript/typescript.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/xml/xml.js',
    '/node_modules/monaco-editor/esm/vs/languages/definitions/yaml/yaml.js'
], { eager: true });

export function registerGrammars(monaco: typeof Monaco) {
    for (const [path, grammar] of Object.entries(grammars)) {
        const id = path.split('/').at(-2)!;
        monaco.languages.setLanguageConfiguration(id, grammar.conf);
        monaco.languages.setMonarchTokensProvider(id, grammar.language);
    }
}
