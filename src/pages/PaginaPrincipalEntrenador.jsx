import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button,
  Chip, Avatar, CircularProgress, Alert, Divider, List,
  ListItem, ListItemText, ListItemAvatar,
} from '@mui/material';
import {
  People as PeopleIcon, Event as EventIcon,
  Assessment as AssessmentIcon, Group as GroupIcon, CalendarToday as CalendarIcon,
  LocationOn as LocationIcon, School as SchoolIcon,
  FitnessCenter as FitnessIcon,
} from '@mui/icons-material';
import { clubesAPI, eventosAPI } from '../api/index.js';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Paleta de colores institucional
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

// Componente base para las secciones del panel
const TarjetaSeccion = ({ icon, eyebrow, title, action, children }) => (
  <Box
    sx={{
      bgcolor: COLORS.paper,
      borderRadius: '10px',
      border: `1px solid ${COLORS.line}`,
      boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
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
              color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5,
            }}
          >
            {icon}
            {eyebrow}
          </Typography>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
    </Box>
    <Divider sx={{ borderColor: COLORS.line }} />
    <Box sx={{ p: 3, pt: 2.5, flex: 1 }}>{children}</Box>
  </Box>
);

// Chip de estado
const ChipEstado = ({ label, positivo = true, sx = {} }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 20, fontSize: '0.68rem', fontWeight: 700,
      bgcolor: 'transparent',
      border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`,
      color: positivo ? COLORS.purple : COLORS.ink,
      ...sx,
    }}
  />
);

// Tarjeta de acción rápida
const TarjetaAccion = ({ icon, title, subtitle, accent, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      bgcolor: COLORS.paper,
      borderRadius: '10px',
      border: `1px solid ${COLORS.line}`,
      boxShadow: '0 2px 10px rgba(128,0,32,0.06)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 2,
      p: 2.25,
      transition: 'box-shadow .15s ease',
      '&:hover': { boxShadow: '0 4px 16px rgba(128,0,32,0.13)' },
    }}
  >
    <Avatar sx={{ bgcolor: accent, width: 44, height: 44 }}>
      {React.cloneElement(icon, { sx: { fontSize: 22 } })}
    </Avatar>
    <Box>
      <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem' }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple }}>{subtitle}</Typography>
    </Box>
  </Box>
);

// Formatea fecha en formato corto
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PaginaPrincipalEntrenador = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState({ atletasActivos: 0, eventosProximos: 0 });
  const [infoClub, setInfoClub] = useState(null);
  const [atletasDelClub, setAtletasDelClub] = useState([]);
  const [eventosProximos, setEventosProximos] = useState([]);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { replace: true }); return; }
    if (user && (!user.id || !user.nombre)) { navigate('/login', { replace: true }); return; }
    cargarDatos();
  }, [user]);

  // Carga los datos del entrenador: club, atletas y eventos próximos
  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (!isAuthenticated()) { setError('Usuario no autenticado'); return; }

      if (user.clubId) {
        try {
          const clubRes = await clubesAPI.getById(user.clubId);
          setInfoClub(clubRes.data.club || clubRes.data);
        } catch { setInfoClub(null); }

        try {
          const atletasRes = await clubesAPI.getAtletas(user.clubId);
          const lista = atletasRes.data.atletas || atletasRes.data || [];
          setAtletasDelClub(lista);
          setEstadisticas(prev => ({ ...prev, atletasActivos: lista.length }));
        } catch {
          setAtletasDelClub([]);
          setEstadisticas(prev => ({ ...prev, atletasActivos: 0 }));
        }
      }

      try {
        const eventosRes = await eventosAPI.getAll();
        const todos = eventosRes.data.eventos || eventosRes.data || [];
        const futuros = todos
          .filter(e => new Date(e.fecha) >= new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setEventosProximos(futuros.slice(0, 5));
        setEstadisticas(prev => ({ ...prev, eventosProximos: futuros.length }));
      } catch {
        setEventosProximos([]);
        setEstadisticas(prev => ({ ...prev, eventosProximos: 0 }));
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setCargando(false);
    }
  };

  if (!isAuthenticated()) return null;

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.cream }}>
      {/* Cabecera de bienvenida */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Entrenador
          </Typography>
          <Avatar
            sx={{
              width: 72, height: 72, mx: 'auto', mt: 1.5, mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.14)', fontSize: '1.7rem', fontWeight: 800,
              border: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            {user?.nombre?.[0]}{user?.apellido_paterno?.[0] || ''}
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ¡Bienvenido, {user?.nombre}!
          </Typography>
          {infoClub && (
            <Chip
              icon={<GroupIcon sx={{ fontSize: 16, color: '#fff !important' }} />}
              label={infoClub.nombre}
              sx={{
                mt: 1.5, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            />
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <PeopleIcon sx={{ fontSize: 24 }} />, value: estadisticas.atletasActivos, label: 'Atletas del Club', sub: infoClub ? `Club ${infoClub.nombre}` : 'Sin club asignado' },
            { icon: <EventIcon sx={{ fontSize: 24 }} />, value: estadisticas.eventosProximos, label: 'Eventos Próximos', sub: 'Competencias por venir' },
          ].map((s, i) => (
            <Box
              key={i}
              sx={{
                p: { xs: 2, md: 2.75 }, textAlign: 'center',
                borderRight: i === 0 ? `1px solid ${COLORS.line}` : 'none',
              }}
            >
              <Box sx={{ color: i === 0 ? COLORS.burgundy : COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.purple }}>{s.sub}</Typography>
            </Box>
          ))}
        </Box>

        {/* Acciones rápidas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <TarjetaAccion
            icon={<GroupIcon />}
            title="Gestionar Atletas"
            subtitle="Ver y administrar atletas asignados"
            accent={COLORS.burgundy}
            onClick={() => navigate('/entrenador/gestionar-atletas')}
          />
          <TarjetaAccion
            icon={<EventIcon />}
            title="Ver Eventos"
            subtitle="Consultar competencias y calendario"
            accent={COLORS.purple}
            onClick={() => navigate('/entrenador/eventos')}
          />
          <TarjetaAccion
            icon={<AssessmentIcon />}
            title="Ver Reportes"
            subtitle="Análisis de rendimiento del equipo"
            accent={COLORS.burgundy}
            onClick={() => navigate('/entrenador/reportes')}
          />
        </Box>

        {/* Contenido principal */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          {/* Atletas del club */}
          <TarjetaSeccion icon={<PeopleIcon sx={{ fontSize: 16 }} />} eyebrow="Plantilla" title="Atletas del Club">
            {atletasDelClub.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                {infoClub ? 'No hay atletas en tu club aún.' : 'No tienes un club asignado.'}
              </Typography>
            ) : (
              <List disablePadding>
                {atletasDelClub.map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.burgundy, width: 38, height: 38, fontSize: '0.85rem' }}>
                          {a.nombre?.[0]}{a.apellido_paterno?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{a.nombre} {a.apellido_paterno} {a.apellido_materno || ''}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: COLORS.purple }}>{a.edad ? `${a.edad} años` : ''} · {a.genero || ''} · {a.municipio || 'Sin municipio'}</Typography>}
                      />
                      <ChipEstado label={a.genero === 'femenino' ? 'F' : 'M'} positivo={a.genero === 'femenino'} />
                    </ListItem>
                    {i < atletasDelClub.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TarjetaSeccion>

          {/* Próximos eventos */}
          <TarjetaSeccion icon={<CalendarIcon sx={{ fontSize: 16 }} />} eyebrow="Agenda" title="Próximos Eventos">
            {eventosProximos.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay eventos próximos.</Typography>
            ) : (
              <List disablePadding>
                {eventosProximos.map((e, i) => (
                  <React.Fragment key={e.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.purple, width: 38, height: 38 }}>
                          <EventIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{e.titulo}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                              <CalendarIcon sx={{ fontSize: 13 }} /> {formatearFecha(e.fecha)}{e.hora && ` · ${String(e.hora).slice(0, 5)}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 13 }} /> {e.lugar}
                            </Typography>
                          </Box>
                        }
                      />
                      <ChipEstado label="Activo" positivo />
                    </ListItem>
                    {i < eventosProximos.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TarjetaSeccion>
        </Box>

        {/* Información profesional */}
        <TarjetaSeccion icon={<SchoolIcon sx={{ fontSize: 16 }} />} eyebrow="Perfil" title="Información Profesional">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>
                Especialidades
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .8 }}>
                {user?.especialidades?.length > 0 ? (
                  user.especialidades.map((esp, i) => (
                    <Chip
                      key={i} label={esp} size="small"
                      icon={<FitnessIcon sx={{ fontSize: 14, color: `${COLORS.burgundy} !important` }} />}
                      sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy, fontWeight: 600 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple }}>No especificadas</Typography>
                )}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>
                Certificaciones
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .8 }}>
                {user?.certificaciones?.length > 0 ? (
                  user.certificaciones.map((cert, i) => (
                    <Chip
                      key={i} label={cert} size="small"
                      icon={<SchoolIcon sx={{ fontSize: 14, color: `${COLORS.purple} !important` }} />}
                      sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple }}>No especificadas</Typography>
                )}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: .5 }}>
                Años de Experiencia
              </Typography>
              <Typography sx={{ color: COLORS.ink, fontWeight: 800, fontSize: '1.4rem' }}>
                {user?.anos_experiencia || user?.añosExperiencia || '—'}
                <Typography component="span" variant="body2" sx={{ color: COLORS.purple, ml: .5 }}>años</Typography>
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: .5 }}>
                Estado
              </Typography>
              <ChipEstado label={user?.estado || 'Activo'} positivo />
            </Box>
          </Box>
        </TarjetaSeccion>
      </Container>
    </Box>
  );
};

export default PaginaPrincipalEntrenador;