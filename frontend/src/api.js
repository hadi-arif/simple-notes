import axios from 'axios';
import { readSession } from './session';

const RAW_API_URL = import.meta.env.VITE_API_URL;

export const API_URL = (RAW_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

// Di build produksi, VITE_API_URL wajib diisi. Kalau lupa, aplikasi akan memanggil localhost
// milik pengunjung, jadi pesan errornya perlu menjelaskan penyebab sebenarnya.
export const API_URL_MISSING = Boolean(import.meta.env.PROD) && !RAW_API_URL;

export const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

export function errorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (API_URL_MISSING) {
    return 'Alamat backend belum diatur. Isi VITE_API_URL di pengaturan hosting frontend, lalu build ulang tanpa cache.';
  }
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return `Server tidak bisa dihubungi. Pastikan backend berjalan di ${API_URL}. Di paket gratis, server yang lama tidak dipakai butuh sekitar satu menit untuk bangun, jadi coba lagi sebentar.`;
  }
  return fallback;
}
