import { useCallback, useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import { useAnimationControls } from 'framer-motion';
import { errorMessage } from '../api';
import { MotionButton, MotionDiv } from '../motion';
import { fonts } from '../theme';
import { COLOR_KEYS, NOTE_COLORS } from '../utils';
import { PinIcon, TrashIcon } from './Icons';

export default function NoteEditor({ note, onClose, onSave, onDelete }) {
  const isNew = !note;
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [color, setColor] = useState(note?.color ?? 'sun');
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shake = useAnimationControls();

  const palette = NOTE_COLORS[color];
  const dirty =
    title !== (note?.title ?? '') ||
    content !== (note?.content ?? '') ||
    color !== (note?.color ?? 'sun') ||
    pinned !== (note?.pinned ?? false);

  const wiggle = useCallback(() => {
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  }, [shake]);

  // Klik di luar atau Esc tidak membuang tulisan yang belum disimpan.
  const guardedClose = useCallback(() => {
    if (busy) return;
    if (dirty) {
      setError('Ada perubahan yang belum disimpan. Pilih Simpan, atau Batal untuk membuangnya.');
      wiggle();
      return;
    }
    onClose();
  }, [busy, dirty, onClose, wiggle]);

  const save = useCallback(async () => {
    if (busy) return;
    if (!title.trim() && !content.trim()) {
      setError('Tulis judul atau isi catatan dulu.');
      wiggle();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({ title, content, color, pinned });
    } catch (err) {
      setError(errorMessage(err, 'Catatan gagal disimpan.'));
      setBusy(false);
      wiggle();
    }
  }, [busy, title, content, color, pinned, onSave, wiggle]);

  const remove = useCallback(async () => {
    setBusy(true);
    try {
      await onDelete(note);
    } catch (err) {
      setError(errorMessage(err, 'Catatan gagal dihapus.'));
      setBusy(false);
      setConfirmDelete(false);
    }
  }, [note, onDelete]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') guardedClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guardedClose, save]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <MotionDiv
      initial={{ backgroundColor: 'rgba(6,18,16,0)' }}
      animate={{ backgroundColor: 'rgba(6,18,16,0.74)' }}
      exit={{ backgroundColor: 'rgba(6,18,16,0)' }}
      transition={{ duration: 0.2 }}
      position="fixed"
      inset="0"
      zIndex="1500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p="4"
      overflowY="auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) guardedClose();
      }}
    >
      <MotionDiv
        layoutId={isNew ? 'note-new' : `note-${note.id}`}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Catatan baru' : 'Ubah catatan'}
        animate={shake}
        w="100%"
        maxW="560px"
        display="flex"
        flexDirection="column"
        gap="3"
        px={{ base: '5', md: '7' }}
        pt="8"
        pb="5"
        color={palette.ink}
        boxShadow="0 40px 80px -20px rgba(0,0,0,.7)"
        css={{ transition: 'background-color .25s, color .25s' }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{ borderRadius: 10, backgroundColor: palette.bg }}
      >
        <chakra.input
          autoFocus
          aria-label="Judul catatan"
          placeholder="Judul"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          fontFamily={fonts.hand}
          fontSize="40px"
          fontWeight="700"
          lineHeight="1.05"
          bg="transparent"
          border="0"
          w="100%"
          color="inherit"
          _placeholder={{ color: palette.ink, opacity: 0.4 }}
          _focusVisible={{ outline: 'none' }}
        />

        <chakra.textarea
          aria-label="Isi catatan"
          placeholder="Tulis apa saja di sini..."
          value={content}
          maxLength={10000}
          onChange={(e) => setContent(e.target.value)}
          minH="200px"
          maxH="50vh"
          w="100%"
          p="0"
          bg="transparent"
          border="0"
          color="inherit"
          fontSize="16px"
          lineHeight="1.55"
          resize="vertical"
          _placeholder={{ color: palette.ink, opacity: 0.45 }}
          _focusVisible={{ outline: 'none' }}
        />

        <chakra.div display="flex" alignItems="center" justifyContent="space-between" gap="3" flexWrap="wrap">
          <chakra.div role="group" aria-label="Warna catatan" display="flex" gap="2">
            {COLOR_KEYS.map((key) => (
              <MotionButton
                type="button"
                key={key}
                aria-label={`Warna ${NOTE_COLORS[key].label}`}
                aria-pressed={color === key}
                onClick={() => setColor(key)}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: color === key ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                w="26px"
                h="26px"
                cursor="pointer"
                bg={NOTE_COLORS[key].bg}
                border="2px solid"
                borderColor={color === key ? palette.ink : 'rgba(0,0,0,.22)'}
                style={{ borderRadius: 999 }}
              />
            ))}
          </chakra.div>

          <chakra.button
            type="button"
            aria-pressed={pinned}
            onClick={() => setPinned((p) => !p)}
            display="inline-flex"
            alignItems="center"
            gap="1.5"
            px="3"
            py="1.5"
            fontSize="14px"
            fontWeight="700"
            cursor="pointer"
            borderRadius="6px"
            border="1.5px solid"
            borderColor={palette.ink}
            bg={pinned ? palette.ink : 'transparent'}
            color={pinned ? palette.bg : 'inherit'}
          >
            <PinIcon filled={pinned} size={16} />
            {pinned ? 'Disematkan' : 'Sematkan'}
          </chakra.button>
        </chakra.div>

        {error && (
          <chakra.p role="alert" fontSize="14px" fontWeight="600">
            {error}
          </chakra.p>
        )}

        <chakra.div display="flex" alignItems="center" justifyContent="space-between" gap="3" pt="1">
          <chakra.div>
            {!isNew && (
              <chakra.button
                type="button"
                disabled={busy}
                onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
                display="inline-flex"
                alignItems="center"
                gap="1.5"
                px="2.5"
                py="1.5"
                fontSize="14px"
                fontWeight="700"
                cursor="pointer"
                borderRadius="6px"
                bg={confirmDelete ? palette.ink : 'transparent'}
                color={confirmDelete ? palette.bg : 'inherit'}
                _hover={confirmDelete ? {} : { bg: 'rgba(0,0,0,.1)' }}
              >
                <TrashIcon size={16} />
                {confirmDelete ? 'Yakin hapus?' : 'Hapus'}
              </chakra.button>
            )}
          </chakra.div>

          <chakra.div display="flex" gap="2">
            <chakra.button
              type="button"
              onClick={onClose}
              disabled={busy}
              px="4"
              py="2"
              fontSize="15px"
              fontWeight="700"
              cursor="pointer"
              borderRadius="6px"
              _hover={{ bg: 'rgba(0,0,0,.1)' }}
            >
              Batal
            </chakra.button>
            <chakra.button
              type="button"
              onClick={save}
              disabled={busy}
              px="5"
              py="2"
              fontSize="15px"
              fontWeight="700"
              cursor="pointer"
              borderRadius="6px"
              bg={palette.ink}
              color={palette.bg}
              _disabled={{ opacity: 0.6, cursor: 'wait' }}
            >
              {busy ? 'Menyimpan...' : 'Simpan'}
            </chakra.button>
          </chakra.div>
        </chakra.div>
      </MotionDiv>
    </MotionDiv>
  );
}
