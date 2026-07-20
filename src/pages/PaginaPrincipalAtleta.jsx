import React, { useState, useEffect } from 'react';
import { atletasAPI, eventosAPI, notificacionesAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Chip, Avatar, Divider, CircularProgress, Alert, IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  Groups as GroupIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  DirectionsRun as RunIcon,
  CheckCircle as CheckIcon,
  LocationOn as LocationIcon,
  SportsScore as SportsIcon,
  ArrowForward as ArrowForwardIcon,
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// --- Paleta institucional IVD (misma que ClubAtleta.jsx / GestionAtletas.jsx) ---
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const SectionCard = ({ icon, eyebrow, title, action, children, filled }) => (
  <Box
    sx={{
      bgcolor: filled ? COLORS.burgundy : COLORS.paper,
      color: filled ? '#fff' : 'inherit',
      borderRadius: '10px',
      boxShadow: filled ? '0 6px 20px rgba(128,0,32,0.25)' : '0 2px 12px rgba(128,0,32,0.07)',
      border: filled ? 'none' : `1px solid ${COLORS.line}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ p: 3, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{
              color: filled ? 'rgba(255,255,255,0.75)' : COLORS.purple,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 0.5,
            }}
          >
            {icon}
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ color: filled ? '#fff' : COLORS.burgundy, fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
    </Box>
    <Divider sx={{ borderColor: filled ? 'rgba(255,255,255,0.18)' : COLORS.line }} />
    <Box sx={{ p: 3, pt: 2.5, flex: 1 }}>{children}</Box>
  </Box>
);

/** Franja de notificaciones no leídas (eventos/convocatorias cancelados, etc). */
const BannerNotificaciones = ({ notificaciones, onDescartar, onDescartarTodas }) => {
  if (!notificaciones.length) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          onClick={onDescartarTodas}
          sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, fontSize: '.75rem' }}
        >
          Marcar todas como leídas
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {notificaciones.map((n) => (
          <Box
            key={n.id}
            sx={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5,
              bgcolor: '#faf2f4', border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.burgundy}`,
              borderRadius: '6px', p: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <NotificationsActiveIcon sx={{ color: COLORS.burgundy, fontSize: 18, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{n.mensaje}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: COLORS.purple, mt: 0.2 }}>
                  {n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => onDescartar(n.id)} sx={{ color: COLORS.purple, flexShrink: 0 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const DatoCampo = ({ icon, valor }) => (
  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.5 }}>
    {icon}
    {valor}
  </Typography>
);

/** Tarjeta de evento próximo, estilo expediente. */
const EventoCard = ({ evento, fmt }) => {
  const cerrada = evento.fecha_cierre && new Date(evento.fecha_cierre) < new Date();
  return (
    <Box sx={{ border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.burgundy}`, borderRadius: '6px', mb: 1.5, '&:last-of-type': { mb: 0 } }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem' }}>{evento.titulo}</Typography>
          <Chip
            label={cerrada ? 'Inscripción cerrada' : 'Inscripción abierta'}
            size="small"
            sx={{
              flexShrink: 0,
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'transparent',
              border: `1px solid ${cerrada ? COLORS.line : COLORS.purple}`,
              color: cerrada ? COLORS.ink : COLORS.purple,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          <DatoCampo icon={<CalendarIcon sx={{ fontSize: 13 }} />} valor={fmt(evento.fecha)} />
          {evento.lugar && <DatoCampo icon={<LocationIcon sx={{ fontSize: 13 }} />} valor={evento.lugar} />}
          {(evento.disciplina || evento.categoria) && (
            <DatoCampo icon={<SportsIcon sx={{ fontSize: 13 }} />} valor={`${evento.disciplina || ''}${evento.disciplina && evento.categoria ? ' — ' : ''}${evento.categoria || ''}`} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

/** Tarjeta de participación, estilo expediente. */
const ParticipacionCard = ({ participacion, fmt }) => (
  <Box sx={{ border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.purple}`, borderRadius: '6px', mb: 1.5, '&:last-of-type': { mb: 0 } }}>
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem' }}>
          {participacion.evento?.titulo || participacion.titulo || 'Evento'}
        </Typography>
        <Chip
          label={participacion.validado ? 'Validado' : 'Pendiente'}
          size="small"
          sx={{
            flexShrink: 0,
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: 'transparent',
            border: `1px solid ${COLORS.purple}`,
            color: COLORS.purple,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <DatoCampo icon={<CalendarIcon sx={{ fontSize: 13 }} />} valor={fmt(participacion.fecha || participacion.fechaInscripcion)} />
        {(participacion.evento?.disciplina || participacion.disciplina) && (
          <DatoCampo icon={<SportsIcon sx={{ fontSize: 13 }} />} valor={participacion.evento?.disciplina || participacion.disciplina} />
        )}
      </Box>
    </Box>
  </Box>
);

const PaginaPrincipalAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atletaData, setAtletaData] = useState(null);
  const [eventosProximos, setEventosProximos] = useState([]);
  const [eventosParticipacion, setEventosParticipacion] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalEventos: 0, eventosGanados: 0, sesionesCompletadas: 0, clubActual: null,
  });
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => { if (user) { cargarDatosAtleta(); cargarNotificaciones(); } }, [user]);
  useEffect(() => { if (atletaData) calcularEstadisticas(atletaData, eventosParticipacion); }, [atletaData, eventosParticipacion]);

  const cargarNotificaciones = async () => {
    try {
      const res = await notificacionesAPI.getMias();
      setNotificaciones(res.data.notificaciones || []);
    } catch { setNotificaciones([]); }
  };

  const handleDescartarNotificacion = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try { await notificacionesAPI.marcarLeidas([id]); } catch { /* silencioso, no bloquea la UI */ }
  };

  const handleDescartarTodasNotificaciones = async () => {
    const idsPrevios = notificaciones.map((n) => n.id);
    setNotificaciones([]);
    try { await notificacionesAPI.marcarLeidas(idsPrevios); } catch { /* silencioso */ }
  };

  const cargarDatosAtleta = async () => {
    try {
      setLoading(true); setError('');
      const atletaResponse = await atletasAPI.getPerfil();
      const atleta = atletaResponse.data.atleta;
      setAtletaData(atleta);

      try {
        const edad = calcularEdad(atleta.fecha_nacimiento);
        const genero = atleta.genero?.toLowerCase();
        if (edad && genero) {
          const eventosRes = await eventosAPI.getMisConvocatorias();
          const convocatorias = eventosRes.data.convocatorias || [];
          const soloFuturos = convocatorias.filter(e => new Date(e.fecha) >= new Date());
          setEventosProximos(soloFuturos.slice(0, 5));
        } else { setEventosProximos([]); }
      } catch { setEventosProximos([]); }

      try {
        const partRes = await eventosAPI.getMisInscripciones();
        setEventosParticipacion((partRes.data.inscripciones || []).slice(0, 5));
      } catch { setEventosParticipacion([]); }
    } catch (err) {
      setError(`Error al cargar los datos: ${err.response?.data?.error || err.message}`);
    } finally { setLoading(false); }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date(); const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const calcularEstadisticas = (atleta, participaciones = []) => {
    setEstadisticas({
      totalEventos: participaciones.length,
      eventosGanados: participaciones.filter(p => p.resultado === 'ganador').length,
      sesionesCompletadas: 0,
      clubActual: atleta.club_nombre || 'Sin club',
    });
  };

  const fmt = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Fecha inválida'; }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>{error}</Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={cargarDatosAtleta}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              Intentar de Nuevo
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 6 }, pb: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Avatar
            sx={{
              width: 72, height: 72, mx: 'auto', mt: 1.5, mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.14)', fontSize: '1.7rem', fontWeight: 800,
              border: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            {atletaData?.nombre?.[0]}{atletaData?.apellido_paterno?.[0] || ''}
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ¡Bienvenido, {atletaData?.nombre}!
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Tu centro de control deportivo personal
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        <Box sx={{ mt: { xs: -5, md: -6 } }}>
          <BannerNotificaciones
            notificaciones={notificaciones}
            onDescartar={handleDescartarNotificacion}
            onDescartarTodas={handleDescartarTodasNotificaciones}
          />
        </Box>

        {/* ── Stat-strip: una sola tarjeta dividida, flotando sobre la franja ── */}
        <Box
          sx={{
            mt: notificaciones.length ? 0 : { xs: -5, md: -6 },
            mb: 5,
            bgcolor: COLORS.paper,
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <EventIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalEventos, label: 'Eventos Participados' },
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: estadisticas.eventosGanados, label: 'Victorias' },
            { icon: <RunIcon sx={{ fontSize: 24 }} />, value: estadisticas.sesionesCompletadas, label: 'Sesiones Completadas' },
            { icon: <GroupIcon sx={{ fontSize: 24 }} />, value: estadisticas.clubActual, label: 'Club Actual' },
          ].map((s, i) => (
            <Box
              key={i}
              sx={{
                p: { xs: 2, md: 2.75 },
                textAlign: 'center',
                borderRight: { sm: i < 3 ? `1px solid ${COLORS.line}` : 'none' },
                borderBottom: { xs: i < 2 ? `1px solid ${COLORS.line}` : 'none', sm: 'none' },
              }}
            >
              <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography
                sx={{
                  fontWeight: 800, color: COLORS.ink, lineHeight: 1.1,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── Contenido principal ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>

          {/* ── Mi Club (destacada, enlaza a /atleta/club) ── */}
          <SectionCard filled icon={<GroupIcon sx={{ fontSize: 16 }} />} eyebrow="Membresía" title="Mi Club">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5, py: 2 }}>
              {atletaData?.club_id ? (
                <>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.16)', fontWeight: 700, border: '2px solid rgba(255,255,255,0.35)' }}>
                    {atletaData.club_nombre?.[0] || 'C'}
                  </Avatar>
                  <Typography sx={{ fontWeight: 700 }}>{atletaData.club_nombre}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', opacity: 0.8 }}>Perteneces a este club</Typography>
                </>
              ) : (
                <>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.14)', border: '2px solid rgba(255,255,255,0.3)' }}>
                    <GroupIcon />
                  </Avatar>
                  <Typography sx={{ fontWeight: 700 }}>Aún no perteneces a un club</Typography>
                  <Typography sx={{ fontSize: '0.78rem', opacity: 0.8 }}>
                    Explora clubes disponibles o revisa tus invitaciones pendientes.
                  </Typography>
                </>
              )}
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => navigate('/atleta/club')}
                sx={{
                  bgcolor: '#fff', color: COLORS.burgundy, textTransform: 'none', fontWeight: 700, mt: 1,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
                }}
              >
                Ir a Mi Club
              </Button>
            </Box>
          </SectionCard>

          {/* ── Próximos Eventos ── */}
          <SectionCard icon={<CalendarIcon sx={{ fontSize: 16 }} />} eyebrow="Agenda" title="Próximos Eventos">
            {eventosProximos.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                No hay eventos próximos para tu categoría.
              </Typography>
            ) : (
              eventosProximos.slice(0, 4).map((evento, i) => (
                <EventoCard key={evento.id || i} evento={evento} fmt={fmt} />
              ))
            )}
          </SectionCard>

          {/* ── Mis Participaciones ── */}
          <SectionCard icon={<CheckIcon sx={{ fontSize: 16 }} />} eyebrow="Historial" title="Mis Participaciones">
            {eventosParticipacion.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                No estás inscrito en ningún evento.
              </Typography>
            ) : (
              eventosParticipacion.map((p, i) => (
                <ParticipacionCard key={p.id || i} participacion={p} fmt={fmt} />
              ))
            )}
          </SectionCard>
        </Box>
      </Container>
    </Box>
  );
};

export default PaginaPrincipalAtleta;