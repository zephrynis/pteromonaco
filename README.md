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
- Node.js **22.12+** to build, Python 3 for the optional packaging command.
- A modern desktop browser with ES modules, Web Workers, and CSS `dvh` support. Touch editing inherits Monaco's mobile limitations.

The release ships the editor and worker assets. Node.js is not needed on the panel host. The SDK's types and Vite preset are vendored from a pinned upstream revision because the SDK was not published to npm; see [provenance](vendor/pterodactyl-sdk/NOTICE.md).

## Build and test

```bash
npm ci
npm run check       # TypeScript, behavior tests, and production build
npm run package     # Also creates release/pteromonaco-1.0.0.pteroext
```

`dist/client.js` is an ES module. React and `@pterodactyl/sdk` remain external and use the panel's import map. All chunks, styles, fonts, and workers resolve relative to the versioned extension asset path. Copy the **entire** `dist` directory, not just `client.js`.

The `.pteroext` is a ZIP with `extension.json` at its root and a runtime-only `dist/`. It omits source maps, source code, node_modules, tests, and the development SDK. Third-party license notices are included.

## Releases

The GitHub Actions release workflow runs when a `v*` tag is pushed. The tag must match the version in `package.json`, `package-lock.json`, and `extension.json`. It installs dependencies with `npm ci`, runs all checks, builds the archive, and attaches `pteromonaco-<version>.pteroext` to a GitHub Release with generated notes. Tags containing a hyphen publish prereleases. Rerunning a successful workflow replaces the archive on the existing release.

To publish the current version after its changes are committed and pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

For later releases, update the package and lockfile together with `npm version <version> --no-git-tag-version`, update `extension.json` and the README's archive examples, then commit, push, and tag that version. The workflow uses GitHub's built-in token; no additional secret is needed.

## Install

Upload `release/pteromonaco-1.0.0.pteroext` in **Admin → Extensions** and enable **PteroMonaco**, then reload the browser.

Alternatively, from the panel root, install the built directory or archive:

```bash
php artisan p:extension:doctor /path/to/pteromonaco
php artisan p:extension:install /path/to/pteromonaco --enable
# Or:
php artisan p:extension:install /path/to/pteromonaco-1.0.0.pteroext --enable
```

Only one enabled extension should claim `server.files.editor`. Disable another replacement before enabling this one. To restore CodeMirror, disable PteroMonaco in Admin → Extensions and reload.

Custom Content Security Policies must allow same-origin editor scripts, styles, fonts, and workers. Monaco also uses inline styles for editor layout. The default v2 webserver configuration does not need extra CSP changes.

## Development

- `src/client/index.tsx`: lazy component registration.
- `FileEditor.tsx`: retains the native layout and overrides only `parts.editor`.
- `MonacoEditor.tsx`: lifecycle, live buffer notifications, permissions, and save shortcut.
- `runtime.ts`: Monaco, local workers, and extra syntax definitions.
- `language.ts` and `theme.ts`: native MIME mapping and panel theme integration.
- `tests/`: editor contract/lifecycle tests with a mocked Monaco runtime, and MIME mapping tests.

Tests focus on keeping edits safe: reporting complete buffers including CRLF, using updated callbacks after rerenders, retaining unsaved text across language changes, blocking read-only/repeated saves, restored drafts, unmount races, React Strict Mode, and initialization failures. They do not emulate the whole panel backend.

MIT licensed; see [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Verification

Verified against the installed v2 panel on 2026-10-06: `p:extension:doctor` passed manifest, compatibility, and built-asset checks. TypeScript checking and all 23 automated tests passed.

A temporary browser host loaded the production bundle through an import map at `/assets/extensions/pteromonaco/test-version/`. Chrome/Playwright checks passed at 1440×1000 and 390×844 for buffer editing, keyboard save, language switching without text loss, JSON and TypeScript workers, read-only blocking, theme switching, new-file naming, model cleanup, and absence of horizontal overflow. No browser console errors or failing asset requests occurred. This validates the built frontend against the SDK contract; a full live-panel file-save workflow is still to be checked after installation.

Official references: [Pterodactyl extensions](https://docs.pterodactyl.io/v2/extensions), [component replacement contract](https://github.com/pterodactyl/panel/blob/2.0-develop/packages/sdk/README.md#file-editor), and [Monaco integration](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md).

The 1.0.0 release includes correct context-menu colors by keeping fixed menus in the document DOM, where Monaco’s theme stylesheet applies. Menu background, text, borders, separators, and selection colors use panel theme tokens.

It registers the native picker’s bundled syntax grammars before creating Monaco documents, so highlighting does not depend on the first edit. Cold browser loads were checked for visible properties token colors, unchanged content, a clean buffer, and no save calls.

It compares resolved themes before writing Monaco styles. This stops the panel’s stylesheet observer from repeatedly reapplying an unchanged theme and invalidating syntax highlighting. Browser checks use the panel’s head stylesheet observer and sample idle highlighting repeatedly before any edit.
