export const NOTE_COLORS = {
  sun: { bg: '#FFE08A', ink: '#3B2F0B', label: 'kuning' },
  mint: { bg: '#BFEBC9', ink: '#10382A', label: 'hijau' },
  sky: { bg: '#B9DDF7', ink: '#0F3150', label: 'biru' },
  rose: { bg: '#FFC2C7', ink: '#4A1620', label: 'merah muda' },
  lilac: { bg: '#D9C8F5', ink: '#2D1B52', label: 'ungu' },
  peach: { bg: '#FFCFA3', ink: '#4A2508', label: 'oranye' },
};

export const COLOR_KEYS = Object.keys(NOTE_COLORS);

// Kemiringan tetap per catatan supaya papan terlihat seperti tempelan tangan.
export function tiltFor(id) {
  return (((Number(id) * 37) % 7) - 3) * 0.6;
}

export function timeAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 45) return 'baru saja';
  const m = Math.max(1, Math.floor(s / 60));
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'kemarin';
  if (d < 7) return `${d} hari lalu`;
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}
