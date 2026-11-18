import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { chakra } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv } from './motion';
import { BOARD, fonts } from './theme';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const counter = useRef(0);

  const push = useCallback((message, tone = 'ok') => {
    const id = ++counter.current;
    setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <chakra.div
        role="status"
        aria-live="polite"
        position="fixed"
        left="0"
        right="0"
        bottom="24px"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="2"
        pointerEvents="none"
        zIndex="2000"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <MotionDiv
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              px="4"
              py="2.5"
              fontFamily={fonts.ui}
              fontSize="sm"
              fontWeight="600"
              bg={t.tone === 'error' ? '#3A1D1D' : BOARD.chalk}
              color={t.tone === 'error' ? BOARD.danger : '#12302B'}
              border={t.tone === 'error' ? '1px solid #7A3A3A' : 'none'}
              boxShadow="0 10px 30px rgba(0,0,0,.35)"
              style={{ borderRadius: 8 }}
            >
              {t.message}
            </MotionDiv>
          ))}
        </AnimatePresence>
      </chakra.div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
