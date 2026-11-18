import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './api';
import { sortNotes } from './utils';

// Mengelola daftar catatan: muat, tambah, ubah, sematkan, hapus.
export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const { data } = await api.get('/notes');
      setNotes(sortNotes(Array.isArray(data) ? data : []));
      setStatus('ready');
    } catch (err) {
      setError(errorMessage(err, 'Catatan gagal dimuat.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (input) => {
    const { data } = await api.post('/notes', input);
    setNotes((prev) => sortNotes([data, ...prev]));
    return data;
  }, []);

  const update = useCallback(async (id, patch) => {
    const { data } = await api.put(`/notes/${id}`, patch);
    setNotes((prev) => sortNotes(prev.map((n) => (n.id === id ? data : n))));
    return data;
  }, []);

  // Pin langsung terlihat berubah (optimistis); kalau server menolak, dikembalikan.
  const togglePin = useCallback(async (note) => {
    const next = !note.pinned;
    setNotes((prev) => sortNotes(prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n))));
    try {
      const { data } = await api.put(`/notes/${note.id}`, { pinned: next });
      setNotes((prev) => sortNotes(prev.map((n) => (n.id === note.id ? data : n))));
      return next;
    } catch (err) {
      setNotes((prev) => sortNotes(prev.map((n) => (n.id === note.id ? { ...n, pinned: note.pinned } : n))));
      throw err;
    }
  }, []);

  const remove = useCallback(async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, status, error, reload: load, create, update, togglePin, remove };
}
