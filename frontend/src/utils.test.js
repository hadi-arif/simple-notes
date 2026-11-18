import { COLOR_KEYS, NOTE_COLORS, sortNotes, tiltFor, timeAgo } from './utils';

describe('timeAgo', () => {
  const now = new Date('2026-11-17T12:00:00Z').getTime();
  const ago = (ms) => new Date(now - ms).toISOString();

  it('menulis waktu relatif dalam bahasa Indonesia', () => {
    expect(timeAgo(ago(10 * 1000), now)).toBe('baru saja');
    expect(timeAgo(ago(5 * 60 * 1000), now)).toBe('5 menit lalu');
    expect(timeAgo(ago(3 * 3600 * 1000), now)).toBe('3 jam lalu');
    expect(timeAgo(ago(30 * 3600 * 1000), now)).toBe('kemarin');
    expect(timeAgo(ago(3 * 86400 * 1000), now)).toBe('3 hari lalu');
  });

  it('mengembalikan teks kosong untuk tanggal tidak valid', () => {
    expect(timeAgo('bukan tanggal', now)).toBe('');
  });
});

describe('tiltFor', () => {
  it('selalu menghasilkan nilai sama untuk id yang sama dan tetap kecil', () => {
    expect(tiltFor(12)).toBe(tiltFor(12));
    for (let id = 1; id < 50; id++) expect(Math.abs(tiltFor(id))).toBeLessThanOrEqual(1.8);
  });
});

describe('sortNotes', () => {
  it('menaruh catatan tersemat lebih dulu, lalu yang terbaru', () => {
    const sorted = sortNotes([
      { id: 1, pinned: false, updated_at: '2026-11-17T10:00:00Z' },
      { id: 2, pinned: false, updated_at: '2026-11-17T11:00:00Z' },
      { id: 3, pinned: true, updated_at: '2026-11-01T11:00:00Z' },
    ]);
    expect(sorted.map((n) => n.id)).toEqual([3, 2, 1]);
  });
});

describe('palet warna', () => {
  it('sama dengan daftar warna yang diizinkan backend', () => {
    expect(COLOR_KEYS.sort()).toEqual(['lilac', 'mint', 'peach', 'rose', 'sky', 'sun']);
    COLOR_KEYS.forEach((k) => expect(NOTE_COLORS[k].bg).toMatch(/^#/));
  });
});
