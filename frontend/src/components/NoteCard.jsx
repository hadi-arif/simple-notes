import { useEffect, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv } from '../motion';
import { fonts } from '../theme';
import { NOTE_COLORS, tiltFor, timeAgo } from '../utils';
import { PinIcon, TrashIcon } from './Icons';

const clamp = {
  display: '-webkit-box',
  WebkitLineClamp: 7,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export default function NoteCard({ note, index = 0, intro = false, onOpen, onTogglePin, onDelete }) {
  const palette = NOTE_COLORS[note.color] || NOTE_COLORS.sun;
  const tilt = tiltFor(note.id);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return undefined;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const title = note.title || 'Tanpa judul';

  return (
    <MotionDiv
      layout
      layoutId={`note-${note.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Buka catatan ${title}`}
      onClick={() => onOpen(note)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen(note);
        }
      }}
      initial={{ opacity: 0, y: -70, rotate: tilt + 8, scale: 0.92 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: tilt,
        scale: 1,
        transition: { type: 'spring', stiffness: 240, damping: 19, delay: intro ? Math.min(index, 12) * 0.06 : 0 },
      }}
      exit={{ opacity: 0, y: 90, rotate: tilt + 16, scale: 0.8, transition: { duration: 0.26 } }}
      whileHover={{ y: -6, rotate: 0, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      position="relative"
      cursor="pointer"
      display="flex"
      flexDirection="column"
      gap="2"
      minH="150px"
      px="5"
      pt="7"
      pb="3"
      bg={palette.bg}
      color={palette.ink}
      boxShadow="0 1px 0 rgba(255,255,255,.35) inset, 0 14px 24px -12px rgba(0,0,0,.55)"
      css={{
        '& .actions': { opacity: 0, transition: 'opacity .15s' },
        '&:hover .actions, &:focus-within .actions': { opacity: 1 },
        '@media (hover: none)': { '& .actions': { opacity: 1 } },
      }}
      style={{ borderRadius: 6 }}
    >
      <AnimatePresence>
        {note.pinned && (
          <MotionDiv
            key="pin"
            initial={{ scale: 0, y: -24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            position="absolute"
            top="-7px"
            left="50%"
            ml="-8px"
            w="16px"
            h="16px"
            bg="radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e5484d 55%, #a52a30 100%)"
            boxShadow="0 4px 6px rgba(0,0,0,.4)"
            style={{ borderRadius: 999 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <chakra.h3 fontFamily={fonts.hand} fontSize="28px" fontWeight="700" lineHeight="1.05" wordBreak="break-word">
        {title}
      </chakra.h3>

      {note.content && (
        <chakra.p fontSize="15px" lineHeight="1.45" whiteSpace="pre-wrap" wordBreak="break-word" style={clamp}>
          {note.content}
        </chakra.p>
      )}

      <chakra.div mt="auto" pt="2" display="flex" alignItems="center" justifyContent="space-between" gap="2">
        <chakra.span fontSize="12px" opacity={0.7}>
          {timeAgo(note.updated_at)}
        </chakra.span>

        <chakra.div className="actions" display="flex" alignItems="center" gap="1">
          <chakra.button
            type="button"
            aria-label={note.pinned ? 'Lepas sematan' : 'Sematkan catatan'}
            aria-pressed={note.pinned}
            title={note.pinned ? 'Lepas sematan' : 'Sematkan'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note);
            }}
            p="1.5"
            display="inline-flex"
            borderRadius="6px"
            cursor="pointer"
            _hover={{ bg: 'rgba(0,0,0,.1)' }}
          >
            <PinIcon filled={note.pinned} />
          </chakra.button>

          <chakra.button
            type="button"
            aria-label={confirming ? 'Klik lagi untuk menghapus' : 'Hapus catatan'}
            title="Hapus"
            onClick={(e) => {
              e.stopPropagation();
              if (confirming) onDelete(note);
              else setConfirming(true);
            }}
            display="inline-flex"
            alignItems="center"
            gap="1"
            p="1.5"
            px={confirming ? '2.5' : '1.5'}
            borderRadius="6px"
            cursor="pointer"
            fontSize="12px"
            fontWeight="700"
            bg={confirming ? palette.ink : 'transparent'}
            color={confirming ? palette.bg : 'inherit'}
            _hover={confirming ? {} : { bg: 'rgba(0,0,0,.1)' }}
          >
            <TrashIcon />
            {confirming && 'Hapus?'}
          </chakra.button>
        </chakra.div>
      </chakra.div>
    </MotionDiv>
  );
}
