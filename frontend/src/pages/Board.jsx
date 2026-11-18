import { useEffect, useMemo, useRef, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { errorMessage } from '../api';
import { useAuth } from '../auth';
import { CloseIcon, LogoutIcon, PlusIcon, SearchIcon } from '../components/Icons';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import { useNotes } from '../hooks';
import { MotionButton, MotionDiv } from '../motion';
import { useToast } from '../toast';
import { BOARD, fonts } from '../theme';
import { COLOR_KEYS, NOTE_COLORS } from '../utils';

const gridProps = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '28px',
  alignItems: 'start',
};

function Skeletons() {
  return (
    <chakra.div {...gridProps} aria-busy="true" aria-label="Memuat catatan">
      {[170, 130, 200, 150, 120, 180].map((h, i) => (
        <chakra.div key={i} className="skeleton" style={{ height: h, borderRadius: 6 }} />
      ))}
    </chakra.div>
  );
}

function EmptyState({ filtered, query, onClear, onCreate }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      mx="auto"
      mt="10"
      maxW="360px"
      px="7"
      pt="8"
      pb="7"
      bg={NOTE_COLORS.sun.bg}
      color={NOTE_COLORS.sun.ink}
      boxShadow="0 20px 40px -20px rgba(0,0,0,.6)"
      style={{ borderRadius: 6 }}
    >
      <chakra.h2 fontFamily={fonts.hand} fontSize="36px" fontWeight="700" lineHeight="1.05">
        {filtered ? 'Tidak ada yang cocok' : 'Papan masih kosong'}
      </chakra.h2>
      <chakra.p mt="2" fontSize="16px">
        {filtered
          ? query
            ? `Tidak ada catatan yang memuat "${query}". Coba kata lain atau hapus filter.`
            : 'Belum ada catatan dengan warna ini.'
          : 'Tempel catatan pertamamu. Tekan N di keyboard atau pakai tombol di bawah.'}
      </chakra.p>
      <chakra.button
        type="button"
        onClick={filtered ? onClear : onCreate}
        mt="5"
        px="5"
        py="2.5"
        fontWeight="800"
        cursor="pointer"
        bg={NOTE_COLORS.sun.ink}
        color={NOTE_COLORS.sun.bg}
        style={{ borderRadius: 6 }}
      >
        {filtered ? 'Hapus filter' : 'Tulis catatan'}
      </chakra.button>
    </MotionDiv>
  );
}

export default function Board() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { notes, status, error, reload, create, update, togglePin, remove } = useNotes();
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState(null);
  const [editor, setEditor] = useState(null); // { note } | { note: null } untuk catatan baru
  const [introDone, setIntroDone] = useState(false);
  const searchRef = useRef(null);

  // Animasi jatuh bertahap hanya dimainkan saat papan pertama kali terisi.
  useEffect(() => {
    if (status !== 'ready') return undefined;
    const t = setTimeout(() => setIntroDone(true), 1800);
    return () => clearTimeout(t);
  }, [status]);

  // Pintasan: N = catatan baru, / = fokus ke pencarian.
  useEffect(() => {
    function onKey(e) {
      if (editor || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditor({ note: null });
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);

  const filtered = Boolean(query.trim() || colorFilter);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter(
      (n) => (!colorFilter || n.color === colorFilter) && (!q || `${n.title} ${n.content}`.toLowerCase().includes(q)),
    );
  }, [notes, query, colorFilter]);
  const pinned = visible.filter((n) => n.pinned);
  const others = visible.filter((n) => !n.pinned);
  const pinnedTotal = notes.filter((n) => n.pinned).length;

  async function handleSave(data) {
    if (editor.note) {
      await update(editor.note.id, data);
      toast('Catatan disimpan');
    } else {
      await create(data);
      toast('Catatan ditambahkan');
    }
    setEditor(null);
  }

  async function handleDelete(note) {
    await remove(note.id);
    setEditor(null);
    toast('Catatan dihapus');
  }

  async function handleTogglePin(note) {
    try {
      const next = await togglePin(note);
      toast(next ? 'Catatan disematkan' : 'Sematan dilepas');
    } catch (err) {
      toast(errorMessage(err, 'Gagal mengubah sematan.'), 'error');
    }
  }

  async function handleDeleteFromCard(note) {
    try {
      await remove(note.id);
      toast('Catatan dihapus');
    } catch (err) {
      toast(errorMessage(err, 'Catatan gagal dihapus.'), 'error');
    }
  }

  function renderGrid(list, offset = 0) {
    return (
      <chakra.div {...gridProps}>
        <AnimatePresence mode="popLayout">
          {list.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={offset + i}
              intro={!introDone}
              onOpen={(n) => setEditor({ note: n })}
              onTogglePin={handleTogglePin}
              onDelete={handleDeleteFromCard}
            />
          ))}
        </AnimatePresence>
      </chakra.div>
    );
  }

  const sectionTitle = (text) => (
    <chakra.h2 fontSize="18px" fontWeight="700" color={BOARD.muted} mb="5">
      {text}
    </chakra.h2>
  );

  let summary = '';
  if (status === 'ready') {
    if (notes.length === 0) summary = 'Papan masih kosong.';
    else if (pinnedTotal === 0) summary = `${notes.length} catatan.`;
    else summary = `${notes.length} catatan, ${pinnedTotal} disematkan.`;
  }

  return (
    <chakra.div maxW="1200px" mx="auto" px={{ base: '5', md: '10' }} pt={{ base: '8', md: '12' }} pb="140px">
      <chakra.header display="flex" flexWrap="wrap" alignItems="flex-end" justifyContent="space-between" gap="5">
        <chakra.div>
          <chakra.h1 fontSize={{ base: '38px', md: '52px' }} fontWeight="800" lineHeight="1" letterSpacing="-0.03em">
            Catatan Harian
          </chakra.h1>
          <svg width="230" height="14" viewBox="0 0 230 14" aria-hidden="true" style={{ marginTop: 6 }}>
            <motion.path
              d="M3 9 C 42 2, 86 12, 126 6 S 200 4, 227 8"
              fill="none"
              stroke={BOARD.sun}
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            />
          </svg>
          <chakra.p mt="3" color={BOARD.muted} fontSize="16px">
            Halo, {user?.username}. {summary}
          </chakra.p>
        </chakra.div>

        <chakra.div display="flex" alignItems="center" gap="3" flexWrap="wrap">
          <chakra.div position="relative" w={{ base: '100%', sm: '260px' }} order={{ base: 2, sm: 1 }}>
            <chakra.span position="absolute" left="2" top="50%" mt="-9px" color={BOARD.muted} pointerEvents="none">
              <SearchIcon />
            </chakra.span>
            <chakra.input
              ref={searchRef}
              type="search"
              aria-label="Cari catatan"
              placeholder="Cari catatan (tekan /)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              w="100%"
              py="2"
              pl="9"
              pr="9"
              bg="transparent"
              border="0"
              borderBottom={`2px solid ${BOARD.line}`}
              color={BOARD.chalk}
              transition="border-color .2s, box-shadow .2s"
              _placeholder={{ color: BOARD.muted, opacity: 0.8 }}
              _focusVisible={{ outline: 'none', borderBottomColor: BOARD.sun, boxShadow: `0 2px 0 0 ${BOARD.sun}` }}
              css={{ '&::-webkit-search-cancel-button': { display: 'none' } }}
            />
            {query && (
              <chakra.button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                position="absolute"
                right="1"
                top="50%"
                mt="-12px"
                p="1.5"
                color={BOARD.muted}
                cursor="pointer"
                _hover={{ color: BOARD.chalk }}
              >
                <CloseIcon size={16} />
              </chakra.button>
            )}
          </chakra.div>

          <chakra.button
            type="button"
            onClick={signOut}
            order={{ base: 1, sm: 2 }}
            display="inline-flex"
            alignItems="center"
            gap="2"
            px="3.5"
            py="2"
            fontWeight="700"
            cursor="pointer"
            color={BOARD.chalk}
            border={`1.5px solid ${BOARD.line}`}
            transition="border-color .2s, background .2s"
            _hover={{ borderColor: BOARD.chalk, bg: 'rgba(233,240,227,.06)' }}
            style={{ borderRadius: 6 }}
          >
            <LogoutIcon />
            Keluar
          </chakra.button>
        </chakra.div>
      </chakra.header>

      <chakra.div role="group" aria-label="Saring menurut warna" display="flex" alignItems="center" gap="3" mt="8" mb="9">
        <chakra.span fontSize="14px" color={BOARD.muted}>
          Warna
        </chakra.span>
        {COLOR_KEYS.map((key) => {
          const active = colorFilter === key;
          return (
            <MotionButton
              key={key}
              type="button"
              aria-label={`Tampilkan catatan ${NOTE_COLORS[key].label}`}
              aria-pressed={active}
              onClick={() => setColorFilter(active ? null : key)}
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: active ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              w="24px"
              h="24px"
              cursor="pointer"
              bg={NOTE_COLORS[key].bg}
              boxShadow={active ? `0 0 0 3px ${BOARD.deep}, 0 0 0 5px ${BOARD.chalk}` : 'none'}
              style={{ borderRadius: 999 }}
            />
          );
        })}
        {colorFilter && (
          <chakra.button
            type="button"
            onClick={() => setColorFilter(null)}
            fontSize="14px"
            color={BOARD.muted}
            cursor="pointer"
            _hover={{ color: BOARD.chalk }}
          >
            Semua warna
          </chakra.button>
        )}
      </chakra.div>

      {status === 'loading' && <Skeletons />}

      {status === 'error' && (
        <chakra.div role="alert" mt="6" maxW="420px">
          <chakra.p fontSize="18px" fontWeight="700" color={BOARD.danger}>
            {error}
          </chakra.p>
          <chakra.button
            type="button"
            onClick={reload}
            mt="4"
            px="5"
            py="2.5"
            fontWeight="800"
            cursor="pointer"
            bg={BOARD.sun}
            color={BOARD.sunInk}
            style={{ borderRadius: 6 }}
          >
            Coba lagi
          </chakra.button>
        </chakra.div>
      )}

      {status === 'ready' && (
        <>
          {visible.length === 0 && (
            <EmptyState
              filtered={filtered}
              query={query.trim()}
              onClear={() => {
                setQuery('');
                setColorFilter(null);
              }}
              onCreate={() => setEditor({ note: null })}
            />
          )}

          {pinned.length > 0 && (
            <chakra.section mb="12">
              {others.length > 0 && sectionTitle('Disematkan')}
              {renderGrid(pinned)}
            </chakra.section>
          )}

          {others.length > 0 && (
            <chakra.section>
              {pinned.length > 0 && sectionTitle('Lainnya')}
              {renderGrid(others, pinned.length)}
            </chakra.section>
          )}
        </>
      )}

      <MotionButton
        layoutId="note-new"
        type="button"
        aria-label="Catatan baru"
        title="Catatan baru (N)"
        onClick={() => setEditor({ note: null })}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        position="fixed"
        right={{ base: '20px', md: '36px' }}
        bottom={{ base: '20px', md: '32px' }}
        w="64px"
        h="64px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        bg={NOTE_COLORS.sun.bg}
        color={NOTE_COLORS.sun.ink}
        boxShadow="0 16px 30px -8px rgba(0,0,0,.6)"
        zIndex="900"
        style={{ borderRadius: 32 }}
      >
        <motion.span whileHover={{ rotate: 90 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} style={{ display: 'flex' }}>
          <PlusIcon size={30} />
        </motion.span>
      </MotionButton>

      <AnimatePresence>
        {editor && (
          <NoteEditor
            key={editor.note ? editor.note.id : 'new'}
            note={editor.note}
            onClose={() => setEditor(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </chakra.div>
  );
}
