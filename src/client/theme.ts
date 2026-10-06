import type * as Monaco from 'monaco-editor';

/** Monaco needs hex colors; panel themes may use OKLCH or RGB CSS variables. */
export function readTheme(container: HTMLElement): Monaco.editor.IStandaloneThemeData {
    const styles = getComputedStyle(container);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function color(token: string, fallback: string) {
        const value = styles.getPropertyValue(token).trim();
        if (!value || !context || !CSS.supports('color', value)) return fallback;
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
        return `#${hex}${a === 255 ? '' : a.toString(16).padStart(2, '0')}`;
    }
    const background = color('--editor-background', '#18181b');
    const channels = background.slice(1, 7).match(/../g)!.map((v) => parseInt(v, 16));
    const light = channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 150;
    return {
        base: light ? 'vs' : 'vs-dark', inherit: true,
        colors: {
            'editor.background': background,
            'editor.foreground': color('--editor-foreground', light ? '#18181b' : '#e4e4e7'),
            'editorCursor.foreground': color('--editor-caret', '#a5b4fc'),
            'editor.selectionBackground': color('--editor-selection', '#3730a366'),
            'editor.lineHighlightBackground': color('--editor-active-line', '#ffffff08'),
            'editorLineNumber.foreground': color('--editor-muted', '#71717a'),
            'editorWidget.background': color('--editor-tooltip', light ? '#ffffff' : '#27272a'),
            'editorWidget.border': color('--editor-tooltip-border', '#52525b'),
            'editorGutter.background': background,
            'menu.background': color('--editor-tooltip', light ? '#ffffff' : '#27272a'),
            'menu.foreground': color('--editor-foreground', light ? '#18181b' : '#e4e4e7'),
            'menu.border': color('--editor-tooltip-border', '#52525b'),
            'menu.separatorBackground': color('--editor-border', '#52525b'),
            'menu.selectionBackground': color('--editor-selection', light ? '#e0e7ff' : '#3730a3'),
            'menu.selectionForeground': color('--editor-selected-foreground', light ? '#18181b' : '#ffffff'),
        },
        rules: [
            { token: 'comment', foreground: color('--editor-muted', '#71717a').slice(1, 7) },
            { token: 'keyword', foreground: color('--editor-syntax-keyword', '#c4b5fd').slice(1, 7) },
            { token: 'string', foreground: color('--editor-syntax-string', '#86efac').slice(1, 7) },
            { token: 'number', foreground: color('--editor-syntax-type', '#fdba74').slice(1, 7) },
        ],
    };
}
