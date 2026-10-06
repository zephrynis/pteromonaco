const languages: Record<string, string> = {
    'text/x-csrc': 'cpp', 'text/x-c++src': 'cpp', 'text/x-csharp': 'csharp',
    'text/css': 'css', 'text/x-cassandra': 'sql', 'text/x-diff': 'pteromonaco-diff',
    'text/x-dockerfile': 'dockerfile', 'text/x-gfm': 'markdown', 'text/x-go': 'go',
    'text/html': 'html', 'message/http': 'pteromonaco-http',
    'text/javascript': 'javascript', 'text/ecmascript': 'javascript',
    'application/javascript': 'javascript', 'application/x-javascript': 'javascript',
    'application/ecmascript': 'javascript', 'application/json': 'json', 'application/x-json': 'json',
    'text/x-lua': 'lua', 'text/x-markdown': 'markdown', 'text/x-mariadb': 'mysql',
    'text/x-mssql': 'sql', 'text/x-mysql': 'mysql', 'text/x-nginx-conf': 'pteromonaco-nginx',
    'text/x-php': 'php', 'application/x-httpd-php': 'php', 'application/x-httpd-php-open': 'php',
    'text/plain': 'plaintext', 'text/x-pgsql': 'pgsql', 'text/x-properties': 'ini',
    'text/x-pug': 'pug', 'text/x-jade': 'pug', 'text/x-python': 'python',
    'text/x-ruby': 'ruby', 'text/x-rustsrc': 'rust', 'text/x-sass': 'scss', 'text/x-scss': 'scss',
    'text/x-sh': 'shell', 'application/x-sh': 'shell', 'text/x-sql': 'sql', 'text/x-sqlite': 'sql',
    'text/x-toml': 'pteromonaco-toml', 'application/typescript': 'typescript', 'text/typescript': 'typescript',
    'script/x-vue': 'html', 'text/x-vue': 'html', 'application/xml': 'xml', 'text/xml': 'xml',
    'text/x-yaml': 'yaml', 'text/yaml': 'yaml', 'application/yaml': 'yaml',
};

/** Respect an explicit Plain Text selection rather than guessing again from the filename. */
export function resolveLanguage(mime: string): string {
    return languages[mime.toLowerCase().split(';', 1)[0].trim()] ?? 'plaintext';
}
