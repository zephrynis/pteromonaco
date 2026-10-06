# Contributing to PteroMonaco

For features, panel requirements, and installation instructions, see [README.md](README.md).

## Development setup

- Node.js **22.12+** and npm.
- Python 3 for packaging `.pteroext` archives.
- A compatible Pterodactyl Panel 2 installation for integration checks; see the [panel requirements](README.md#requirements).

The SDK's types and Vite preset are vendored from a pinned upstream revision because the SDK was not published to npm; see [provenance](vendor/pterodactyl-sdk/NOTICE.md).

## Build and test

```bash
npm ci
npm run check       # TypeScript, behavior tests, and production build
npm run package     # Also creates release/pteromonaco-1.0.0.pteroext
```

`dist/client.js` is an ES module. React and `@pterodactyl/sdk` remain external and use the panel's import map. All chunks, styles, fonts, and workers resolve relative to the versioned extension asset path. Copy the **entire** `dist` directory, not just `client.js`.

The `.pteroext` is a ZIP with `extension.json` at its root and a runtime-only `dist/`. It omits source maps, source code, node_modules, tests, and the development SDK. Third-party license notices are included.

## Project structure

- `src/client/index.tsx`: lazy component registration.
- `src/client/FileEditor.tsx`: retains the native layout and overrides only `parts.editor`.
- `src/client/MonacoEditor.tsx`: lifecycle, live buffer notifications, permissions, and save shortcut.
- `src/client/runtime.ts`: Monaco, local workers, and extra syntax definitions.
- `src/client/language.ts` and `src/client/theme.ts`: native MIME mapping and panel theme integration.
- `tests/`: editor contract/lifecycle tests with a mocked Monaco runtime, and MIME mapping tests.

Tests focus on keeping edits safe: reporting complete buffers including CRLF, using updated callbacks after rerenders, retaining unsaved text across language changes, blocking read-only/repeated saves, restored drafts, unmount races, React Strict Mode, and initialization failures. They do not emulate the whole panel backend.

## Verification

Verified against the installed v2 panel on 2026-10-06: `p:extension:doctor` passed manifest, compatibility, and built-asset checks. TypeScript checking and all 23 automated tests passed.

A temporary browser host loaded the production bundle through an import map at `/assets/extensions/pteromonaco/test-version/`. Chrome/Playwright checks passed at 1440×1000 and 390×844 for buffer editing, keyboard save, language switching without text loss, JSON and TypeScript workers, read-only blocking, theme switching, new-file naming, model cleanup, and absence of horizontal overflow. No browser console errors or failing asset requests occurred. This validates the built frontend against the SDK contract; a full live-panel file-save workflow is still to be checked after installation.

Official references: [Pterodactyl extensions](https://docs.pterodactyl.io/v2/extensions), [component replacement contract](https://github.com/pterodactyl/panel/blob/2.0-develop/packages/sdk/README.md#file-editor), and [Monaco integration](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md).

The 1.0.0 release includes correct context-menu colors by keeping fixed menus in the document DOM, where Monaco’s theme stylesheet applies. Menu background, text, borders, separators, and selection colors use panel theme tokens.

It registers the native picker’s bundled syntax grammars before creating Monaco documents, so highlighting does not depend on the first edit. Cold browser loads were checked for visible properties token colors, unchanged content, a clean buffer, and no save calls.

It compares resolved themes before writing Monaco styles. This stops the panel’s stylesheet observer from repeatedly reapplying an unchanged theme and invalidating syntax highlighting. Browser checks use the panel’s head stylesheet observer and sample idle highlighting repeatedly before any edit.

## Releases

The GitHub Actions release workflow runs when a version tag beginning with a digit (for example, `1.0.0`) is pushed. The tag must match the version in `package.json`, `package-lock.json`, and `extension.json`. It installs dependencies with `npm ci`, runs all checks, builds the archive, and attaches `pteromonaco-<version>.pteroext` to a GitHub Release with generated notes and the version number as its title. Tags containing a hyphen publish prereleases. Rerunning a successful workflow replaces the archive on the existing release.

To publish the current version after its changes are committed and pushed:

```bash
git tag 1.0.0
git push origin 1.0.0
```

For later releases, update the package and lockfile together with `npm version <version> --no-git-tag-version`, update `extension.json` and the archive examples in README.md and CONTRIBUTING.md, then commit, push, and tag that version. The workflow uses GitHub's built-in token; no additional secret is needed.
