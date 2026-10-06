import { definePterodactylExtension } from '@pterodactyl/sdk';

export default definePterodactylExtension({
    setup({ components }) {
        components.replace('server.files.editor', { load: () => import('./FileEditor') });
    },
});
