import { expect, it } from 'vitest';
import { resolveLanguage } from '../src/client/language';

it.each([
    ['text/x-yaml', 'yaml'], ['application/json', 'json'], ['text/x-properties', 'ini'],
    ['text/x-sh', 'shell'], ['application/typescript', 'typescript'],
    ['text/x-toml', 'pteromonaco-toml'], ['text/x-nginx-conf', 'pteromonaco-nginx'],
    ['application/x-httpd-php', 'php'], ['text/x-rustsrc', 'rust'],
    ['text/plain', 'plaintext'], ['application/octet-stream', 'plaintext'],
    ['Application/JSON; charset=utf-8', 'json'],
])('maps %s to %s', (mime, language) => {
    expect(resolveLanguage(mime)).toBe(language);
});
