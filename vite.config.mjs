import { defineExtensionConfig } from '@pterodactyl/sdk/vite';
import react from '@vitejs/plugin-react';
export default {
    ...defineExtensionConfig({ entry: 'src/client/index.tsx', plugins: [react()] }),
    // Panel asset paths contain the extension ID and version.
    base: './',
    worker: { format: 'es' },
};
