This directory vendors the build preset, runtime stubs, manifest schema, and generated TypeScript declarations from `packages/sdk` in https://github.com/pterodactyl/panel.

Source branch: `2.0-develop`
Source commit: `5fdc4ec5f67bb976871324ef813869666367a688`
SDK version: `2.0.0-beta.4`

The source files are unmodified. package.json is reduced to the build/type exports this extension uses; the panel supplies the actual SDK and React runtime through its import map. No SDK runtime is bundled in the extension.

The SDK was not available in the public npm registry when this extension was developed. Vendoring makes a standalone checkout build without a sibling panel checkout. Update these files together from a compatible panel source revision. See LICENSE.md for the upstream MIT license.
