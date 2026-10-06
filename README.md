# PteroMonaco

A native **Pterodactyl Panel 2** extension that replaces the server file editor's CodeMirror surface with **Monaco Editor**. It uses `server.files.editor`; no panel source patches are needed.

The panel keeps its breadcrumbs, `.pteroignore` notice, language picker, Save/Create button, permissions, filename dialog, write requests, new-file drafts, and unsaved-change guard. Monaco reports each edit to the panel-owned buffer and calls the native save action with **Ctrl+S / Cmd+S**.

## Features

- Monaco syntax highlighting, completion, search/replace, folding, bracket matching, undo/redo, and command palette.
- JSON, JavaScript/TypeScript, HTML, and CSS language-service workers, bundled locally. No CDN, external editor scripts, or external file-content services.
- The native language picker maps to Monaco's languages. Extra syntax-only modes cover TOML, NGINX, HTTP, and diffs. Properties use INI, Vue uses HTML, and Sass uses SCSS; these are approximate highlighting modes, not full language servers. Unknown MIME types safely use plain text. YAML is syntax-only.
- Editor colors follow the panel's CSS theme tokens, including light/dark theme changes.
- Read-only permissions and in-flight saves lock editing. Save buttons and API permissions remain controlled by core.
- Lazy loading: the extension entry is tiny; Monaco loads only when a document opens. Its TypeScript worker is the largest asset and loads only for JS/TS language services.
- Per-document editor, model, listeners, and keyboard-action cleanup. Language changes and dirty-state updates preserve the current buffer and undo history.
- Loading or initialization errors propagate to the panel's replacement boundary, which restores its native editor. Successful edits are already in the panel's live buffer.

## Requirements

- Panel `2.0-develop` with SDK **2.0.0-beta.4** and the `server.files.editor` replacement contract. Pterodactyl 1.x is unsupported. The v2 API is prerelease; compatibility must be rechecked when updating the panel.
- A modern desktop browser with ES modules, Web Workers, and CSS `dvh` support. Touch editing inherits Monaco's mobile limitations.

Release archives include the editor and worker assets. Node.js is not needed on the panel host.

## Install

Download `pteromonaco-1.0.0.pteroext` from the repository’s GitHub Releases, then upload it in **Admin → Extensions** and enable **PteroMonaco**, then reload the browser.

Alternatively, from the panel root, install the built directory or archive:

```bash
php artisan p:extension:doctor /path/to/pteromonaco
php artisan p:extension:install /path/to/pteromonaco --enable
# Or:
php artisan p:extension:install /path/to/pteromonaco-1.0.0.pteroext --enable
```

Only one enabled extension should claim `server.files.editor`. Disable another replacement before enabling this one. To restore CodeMirror, disable PteroMonaco in Admin → Extensions and reload.

Custom Content Security Policies must allow same-origin editor scripts, styles, fonts, and workers. Monaco also uses inline styles for editor layout. The default v2 webserver configuration does not need extra CSP changes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, builds, tests, project structure, verification notes, and release instructions.

## License

MIT licensed; see [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
