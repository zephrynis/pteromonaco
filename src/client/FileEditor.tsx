import type { ReplacementProps } from '@pterodactyl/sdk';
import MonacoEditor from './MonacoEditor';

// Preserve the native notice, language picker, Save button, and document session.
const parts = { editor: MonacoEditor };

export default function FileEditor({ Default }: ReplacementProps<'server.files.editor'>) {
    return <Default parts={parts} />;
}
