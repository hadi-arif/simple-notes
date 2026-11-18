import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MotionConfig } from 'framer-motion';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { api } from './api';
import { saveSession } from './session';
import { system } from './theme';

const NOTES = [
  { id: 1, title: 'Belanja', content: 'susu dan telur', color: 'mint', pinned: true, created_at: '2026-11-17T08:00:00Z', updated_at: '2026-11-17T08:00:00Z' },
  { id: 2, title: 'Ide akhir pekan', content: 'sepeda pagi', color: 'sky', pinned: false, created_at: '2026-11-16T08:00:00Z', updated_at: '2026-11-16T08:00:00Z' },
];

function renderApp(path = '/') {
  return render(
    <ChakraProvider value={system}>
      <MotionConfig reducedMotion="always">
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </MotionConfig>
    </ChakraProvider>,
  );
}

function signIn() {
  saveSession({ token: 'token-tes', user: { id: 1, username: 'hadi' } });
}

afterEach(() => vi.restoreAllMocks());

describe('halaman masuk', () => {
  it('tampil saat belum login dan bisa pindah ke tab Daftar', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Catatan Harian' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Daftar' }));
    expect(screen.getByRole('button', { name: 'Buat akun' })).toBeInTheDocument();
  });

  it('menolak formulir kosong dengan pesan yang jelas', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(api, 'post');
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Isi username dan password dulu.');
    expect(post).not.toHaveBeenCalled();
  });

  it('menampilkan pesan dari server saat password salah', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'post').mockRejectedValue({ response: { status: 401, data: { error: 'Username atau password salah' } } });
    renderApp();
    await user.type(await screen.findByLabelText('Username'), 'hadi');
    await user.type(screen.getByLabelText('Password'), 'salahsalah');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Username atau password salah');
  });

  it('masuk lalu menampilkan papan catatan', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'abc', user: { id: 1, username: 'hadi' } } });
    vi.spyOn(api, 'get').mockResolvedValue({ data: NOTES });
    renderApp();
    await user.type(await screen.findByLabelText('Username'), 'Hadi');
    await user.type(screen.getByLabelText('Password'), 'rahasia1');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(post).toHaveBeenCalledWith('/login', { username: 'hadi', password: 'rahasia1' });
    expect(await screen.findByText('Belanja')).toBeInTheDocument();
  });
});

describe('papan catatan', () => {
  beforeEach(() => {
    signIn();
    vi.spyOn(api, 'get').mockResolvedValue({ data: NOTES });
  });

  it('mengarahkan ke halaman masuk kalau belum login', async () => {
    localStorage.clear();
    renderApp('/');
    expect(await screen.findByRole('button', { name: 'Masuk' })).toBeInTheDocument();
  });

  it('menampilkan catatan, ringkasan, dan bisa dicari', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(await screen.findByText('Belanja')).toBeInTheDocument();
    expect(screen.getByText('Ide akhir pekan')).toBeInTheDocument();
    expect(screen.getByText(/2 catatan, 1 disematkan/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Cari catatan'), 'sepeda');
    await waitFor(() => expect(screen.queryByText('Belanja')).not.toBeInTheDocument());
    expect(screen.getByText('Ide akhir pekan')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Cari catatan'));
    await user.type(screen.getByLabelText('Cari catatan'), 'tidak-ada');
    expect(await screen.findByText('Tidak ada yang cocok')).toBeInTheDocument();
  });

  it('membuat catatan baru lewat editor', async () => {
    const user = userEvent.setup();
    const created = { id: 3, title: 'Baru', content: 'isi baru', color: 'rose', pinned: false, created_at: '2026-11-17T09:00:00Z', updated_at: '2026-11-17T09:00:00Z' };
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: created });
    renderApp();
    await screen.findByText('Belanja');

    await user.click(screen.getByRole('button', { name: 'Catatan baru' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Judul catatan'), 'Baru');
    await user.type(within(dialog).getByLabelText('Isi catatan'), 'isi baru');
    await user.click(within(dialog).getByRole('button', { name: 'Warna merah muda' }));
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    expect(post).toHaveBeenCalledWith('/notes', { title: 'Baru', content: 'isi baru', color: 'rose', pinned: false });
    expect(await screen.findByText('Catatan ditambahkan')).toBeInTheDocument();
  });

  it('menolak menyimpan catatan kosong', async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(api, 'post');
    renderApp();
    await screen.findByText('Belanja');
    await user.click(screen.getByRole('button', { name: 'Catatan baru' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Tulis judul atau isi catatan dulu.');
    expect(post).not.toHaveBeenCalled();
  });

  it('mengubah catatan yang ada', async () => {
    const user = userEvent.setup();
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { ...NOTES[1], title: 'Ide baru' } });
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Buka catatan Ide akhir pekan' }));
    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText('Judul catatan');
    await user.clear(title);
    await user.type(title, 'Ide baru');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    expect(put).toHaveBeenCalledWith('/notes/2', { title: 'Ide baru', content: 'sepeda pagi', color: 'sky', pinned: false });
    expect(await screen.findByText('Catatan disimpan')).toBeInTheDocument();
  });

  it('menghapus catatan setelah konfirmasi dua langkah', async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(api, 'delete').mockResolvedValue({});
    renderApp();
    await screen.findByText('Ide akhir pekan');
    const card = screen.getByRole('button', { name: 'Buka catatan Ide akhir pekan' });

    await user.click(within(card).getByRole('button', { name: 'Hapus catatan' }));
    expect(del).not.toHaveBeenCalled();
    await user.click(within(card).getByRole('button', { name: 'Klik lagi untuk menghapus' }));

    expect(del).toHaveBeenCalledWith('/notes/2');
    expect(await screen.findByText('Catatan dihapus')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Ide akhir pekan')).not.toBeInTheDocument());
  });

  it('menampilkan tombol coba lagi saat catatan gagal dimuat', async () => {
    api.get.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    renderApp();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server tidak bisa dihubungi');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
