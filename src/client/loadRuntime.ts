let pending: Promise<typeof import('./runtime')> | undefined;

export function loadRuntime() {
    // Loading starts only on a file editor, outside the panel's replacement-import deadline.
    pending ??= import('./runtime').catch((error: unknown) => {
        pending = undefined;
        throw error;
    });
    return pending;
}
