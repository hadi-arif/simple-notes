import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { chakra } from '@chakra-ui/react';
import { motion, useAnimationControls } from 'framer-motion';
import { errorMessage } from '../api';
import { useAuth } from '../auth';
import { MotionButton, MotionDiv } from '../motion';
import { BOARD, fonts } from '../theme';
import { NOTE_COLORS, tiltFor } from '../utils';

const MODES = {
  login: { tab: 'Masuk', action: 'Masuk', busy: 'Memeriksa...', hint: 'Lanjutkan catatanmu hari ini.' },
  register: { tab: 'Daftar', action: 'Buat akun', busy: 'Membuat akun...', hint: 'Cukup username dan password, tanpa email.' },
};

const SAMPLES = [
  { id: 3, color: 'sun', title: 'Bayar listrik', text: 'Paling lambat tanggal 20.', pinned: true, style: { top: 10, left: 6 } },
  { id: 5, color: 'sky', title: 'Ide akhir pekan', text: 'Sepeda pagi, lalu sarapan bubur.', style: { top: 150, left: 190 } },
  { id: 8, color: 'rose', title: 'Telepon ibu', text: 'Tanya resep sambal yang kemarin.', style: { top: 300, left: 20 } },
];

const lineInput = {
  w: '100%',
  py: '2',
  fontSize: '18px',
  bg: 'transparent',
  border: '0',
  borderBottom: `2px solid ${BOARD.line}`,
  color: BOARD.chalk,
  borderRadius: '0',
  transition: 'border-color .2s, box-shadow .2s',
  _placeholder: { color: BOARD.muted, opacity: 0.7 },
  _focusVisible: { outline: 'none', borderBottomColor: BOARD.sun, boxShadow: `0 2px 0 0 ${BOARD.sun}` },
};

export default function Login() {
  const { isAuthed, authenticate } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  if (isAuthed) return <Navigate to="/" replace />;

  const copy = MODES[mode];

  function fail(message) {
    setError(message);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const name = username.trim().toLowerCase();
    if (!name || !password) return fail('Isi username dan password dulu.');
    if (mode === 'register') {
      if (!/^[a-z0-9_]{3,30}$/.test(name)) return fail('Username 3-30 karakter: huruf, angka, atau garis bawah.');
      if (password.length < 6) return fail('Password minimal 6 karakter.');
    }
    setBusy(true);
    setError('');
    try {
      await authenticate(mode, name, password);
      navigate('/', { replace: true });
    } catch (err) {
      fail(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <chakra.main
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={{ base: '0', lg: '20' }}
      px={{ base: '6', md: '12' }}
      py="12"
    >
      <MotionDiv animate={shake} w="100%" maxW="400px">
        <chakra.h1 fontSize={{ base: '44px', md: '56px' }} fontWeight="800" lineHeight="1" letterSpacing="-0.03em">
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
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
          />
        </svg>
        <chakra.p mt="4" color={BOARD.muted} fontSize="17px">
          {copy.hint}
        </chakra.p>

        <chakra.div role="tablist" aria-label="Pilih masuk atau daftar" display="flex" gap="6" mt="8">
          {Object.entries(MODES).map(([key, m]) => (
            <chakra.button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => {
                setMode(key);
                setError('');
              }}
              position="relative"
              pb="2"
              fontSize="18px"
              fontWeight="700"
              cursor="pointer"
              color={mode === key ? BOARD.chalk : BOARD.muted}
              transition="color .2s"
            >
              {m.tab}
              {mode === key && (
                <MotionDiv
                  layoutId="login-tab"
                  position="absolute"
                  left="0"
                  right="0"
                  bottom="0"
                  h="3px"
                  bg={BOARD.sun}
                  style={{ borderRadius: 2 }}
                />
              )}
            </chakra.button>
          ))}
        </chakra.div>

        <chakra.form onSubmit={submit} noValidate mt="7" display="flex" flexDirection="column" gap="6">
          <chakra.div>
            <chakra.label htmlFor="username" fontSize="14px" color={BOARD.muted}>
              Username
            </chakra.label>
            <chakra.input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: user_01"
              {...lineInput}
            />
          </chakra.div>

          <chakra.div>
            <chakra.div display="flex" justifyContent="space-between" alignItems="baseline">
              <chakra.label htmlFor="password" fontSize="14px" color={BOARD.muted}>
                Password
              </chakra.label>
              <chakra.button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                fontSize="13px"
                color={BOARD.muted}
                cursor="pointer"
                _hover={{ color: BOARD.chalk }}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </chakra.button>
            </chakra.div>
            <chakra.input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'minimal 6 karakter' : 'password kamu'}
              {...lineInput}
            />
          </chakra.div>

          {error && (
            <chakra.p role="alert" color={BOARD.danger} fontSize="15px" fontWeight="600">
              {error}
            </chakra.p>
          )}

          <MotionButton
            type="submit"
            disabled={busy}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            py="3.5"
            fontSize="18px"
            fontWeight="800"
            cursor="pointer"
            bg={BOARD.sun}
            color={BOARD.sunInk}
            boxShadow="0 8px 0 -3px rgba(0,0,0,.35)"
            _disabled={{ opacity: 0.7, cursor: 'wait' }}
            style={{ borderRadius: 6 }}
          >
            {busy ? copy.busy : copy.action}
          </MotionButton>
        </chakra.form>
      </MotionDiv>

      <chakra.div display={{ base: 'none', lg: 'block' }} position="relative" w="400px" h="460px" aria-hidden="true">
        {SAMPLES.map((s, i) => {
          const palette = NOTE_COLORS[s.color];
          return (
            <MotionDiv
              key={s.id}
              initial={{ opacity: 0, y: -60, rotate: tiltFor(s.id) + 10 }}
              animate={{ opacity: 1, y: [0, -9, 0], rotate: tiltFor(s.id) }}
              transition={{
                opacity: { delay: 0.3 + i * 0.15 },
                rotate: { type: 'spring', delay: 0.3 + i * 0.15 },
                y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: 0.3 + i * 0.15 },
              }}
              whileHover={{ rotate: 0, scale: 1.05 }}
              position="absolute"
              w="210px"
              px="5"
              pt="7"
              pb="5"
              bg={palette.bg}
              color={palette.ink}
              boxShadow="0 14px 24px -12px rgba(0,0,0,.6)"
              style={{ ...s.style, borderRadius: 6 }}
            >
              {s.pinned && (
                <chakra.div
                  position="absolute"
                  top="-7px"
                  left="50%"
                  ml="-8px"
                  w="16px"
                  h="16px"
                  bg="radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e5484d 55%, #a52a30 100%)"
                  boxShadow="0 4px 6px rgba(0,0,0,.4)"
                  style={{ borderRadius: 999 }}
                />
              )}
              <chakra.p fontFamily={fonts.hand} fontSize="28px" fontWeight="700" lineHeight="1.05">
                {s.title}
              </chakra.p>
              <chakra.p mt="2" fontSize="15px" lineHeight="1.45">
                {s.text}
              </chakra.p>
            </MotionDiv>
          );
        })}
      </chakra.div>
    </chakra.main>
  );
}
