import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('errorMessage', () => {
  it('menjelaskan penyebab kalau VITE_API_URL lupa diisi di build produksi', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_URL', '');
    const { errorMessage } = await import('./api');
    expect(errorMessage({ code: 'ERR_NETWORK' })).toMatch(/VITE_API_URL/);
  });

  it('menyebut alamat backend yang dipakai saat server tidak terjangkau', async () => {
    vi.stubEnv('VITE_API_URL', 'https://notes-api.example.com/');
    const { errorMessage, API_URL } = await import('./api');
    expect(API_URL).toBe('https://notes-api.example.com');
    expect(errorMessage({ code: 'ERR_NETWORK' })).toContain('https://notes-api.example.com');
  });

  it('memakai pesan dari server kalau ada', async () => {
    const { errorMessage } = await import('./api');
    expect(errorMessage({ response: { data: { error: 'Username sudah dipakai' } } })).toBe('Username sudah dipakai');
  });
});
