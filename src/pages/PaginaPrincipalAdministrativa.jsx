import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { atletasAPI, clubesAPI, eventosAPI, resultadosAPI } from '../api/index.js';

// --- Paleta institucional IVD (misma que ClubAtleta.jsx / PaginaPrincipalAtleta.jsx) ---
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

const SectionCard = ({ icon, eyebrow, title, action, children }) => (
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

/** Chip de estado sin colores semánticos default de MUI: borde purple = positivo/activo, borde ink = neutral/negativo. */
const EstadoChip = ({ label, positivo = true }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 20,
      fontSize: '0.68rem',
      fontWeight: 700,
      bgcolor: 'transparent',
      border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`,
      color: positivo ? COLORS.purple : COLORS.ink,
    }}
  />
);

const PaginaPrincipalAdministrativa = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAtletas: 0, totalClubes: 0, totalEventos: 0, totalResultados: 0,
    atletasRecientes: 0, clubesRecientes: 0,
  });
  const [recentActivity, setRecentActivity] = useState({
    atletas: [], clubes: [], eventos: [], resultados: [],
  });
  const [error, setError] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [atletasRes, clubesRes, eventosRes, resultadosRes] = await Promise.all([
        atletasAPI.getAll(), clubesAPI.getAll(), eventosAPI.getAll(), resultadosAPI.getAll(),
      ]);

      const atletas    = atletasRes.data.atletas       || [];
      const clubes     = clubesRes.data.clubes         || [];
      const eventos     = eventosRes.data.eventos       || [];
      const resultados = resultadosRes.data.resultados || [];

      const hace7 = new Date(); hace7.setDate(hace7.getDate() - 7);
      const atletasNuevos = atletas.filter(a => new Date(a.fecha_ingreso_club || a.created_at) >= hace7).length;
      const clubesNuevos  = clubes.filter(c  => new Date(c.fecha_creacion    || c.created_at) >= hace7).length;

      setStats({
        totalAtletas: atletas.length, totalClubes: clubes.length,
        totalEventos: eventos.length, totalResultados: resultados.length,
        atletasRecientes: atletasNuevos, clubesRecientes: clubesNuevos,
      });

      setRecentActivity({
        atletas: atletas.slice(0, 5),
        clubes:  clubes.slice(0, 5),
        eventos: eventos
          .filter(e => new Date(e.fecha) >= new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .slice(0, 5),
        resultados: resultados.slice(0, 5),
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.cream }}>

      {/* ── Franja superior ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Instituto Veracruzano del Deporte
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Panel Administrativo
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Resumen general del sistema
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

        {/* ── Stat-strip flotante ── */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 5,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <PeopleIcon sx={{ fontSize: 24 }} />, value: stats.totalAtletas, label: 'Atletas', sub: `+${stats.atletasRecientes} esta semana` },
            { icon: <GroupsIcon sx={{ fontSize: 24 }} />, value: stats.totalClubes, label: 'Clubes', sub: `+${stats.clubesRecientes} esta semana` },
            { icon: <EventIcon sx={{ fontSize: 24 }} />, value: stats.totalEventos, label: 'Eventos', sub: 'En el sistema' },
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: stats.totalResultados, label: 'Resultados', sub: 'Marcas y tiempos' },
          ].map((s, i) => (
            <Box
              key={i}
              sx={{
                p: { xs: 2, md: 2.75 }, textAlign: 'center',
                borderRight: { md: i < 3 ? `1px solid ${COLORS.line}` : 'none' },
                borderBottom: { xs: i < 2 ? `1px solid ${COLORS.line}` : 'none', md: 'none' },
              }}
            >
              <Box sx={{ color: i % 2 === 0 ? COLORS.burgundy : COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '0.66rem', color: COLORS.purple }}>{s.sub}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Actividad reciente — fila 1 ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>

          {/* Atletas */}
          <SectionCard icon={<PeopleIcon sx={{ fontSize: 16 }} />} eyebrow="Recién ingresados" title="Atletas Recientes">
            {recentActivity.atletas.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay atletas registrados.</Typography>
            ) : (
              <List disablePadding>
                {recentActivity.atletas.map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.burgundy, width: 38, height: 38, fontSize: '0.85rem' }}>
                          {a.nombre?.[0]}{a.apellido_paterno?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{a.nombre} {a.apellido_paterno} {a.apellido_materno || ''}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: COLORS.purple }}>{a.municipio || 'Sin municipio'} · {a.club_nombre || 'Independiente'}</Typography>}
                      />
                      <EstadoChip label={a.genero === 'femenino' ? 'F' : 'M'} positivo={a.genero === 'femenino'} />
                    </ListItem>
                    {i < recentActivity.atletas.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Clubes */}
          <SectionCard icon={<GroupsIcon sx={{ fontSize: 16 }} />} eyebrow="Registro" title="Clubes Registrados">
            {recentActivity.clubes.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay clubes registrados.</Typography>
            ) : (
              <List disablePadding>
                {recentActivity.clubes.map((c, i) => (
                  <React.Fragment key={c.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.purple, width: 38, height: 38, fontSize: '0.85rem' }}>{c.nombre?.[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{c.nombre}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: COLORS.purple }}>{c.direccion || 'Sin dirección'} · {c.email || ''}</Typography>}
                      />
                      <EstadoChip label={c.estado === 'activo' ? 'Activo' : 'Inactivo'} positivo={c.estado === 'activo'} />
                    </ListItem>
                    {i < recentActivity.clubes.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>

        {/* ── Actividad reciente — fila 2 ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>

          {/* Próximos Eventos */}
          <SectionCard icon={<CalendarIcon sx={{ fontSize: 16 }} />} eyebrow="Agenda" title="Próximos Eventos">
            {recentActivity.eventos.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay eventos próximos.</Typography>
            ) : (
              <List disablePadding>
                {recentActivity.eventos.map((e, i) => (
                  <React.Fragment key={e.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.burgundy, width: 38, height: 38 }}>
                          <EventIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{e.titulo}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                              <CalendarIcon sx={{ fontSize: 13 }} /> {fmt(e.fecha)}{e.hora && ` · ${e.hora.slice(0, 5)}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 13 }} /> {e.lugar}
                            </Typography>
                          </Box>
                        }
                      />
                      <EstadoChip label="Activo" positivo />
                    </ListItem>
                    {i < recentActivity.eventos.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Resultados */}
          <SectionCard icon={<TrophyIcon sx={{ fontSize: 16 }} />} eyebrow="Marcas y tiempos" title="Resultados Recientes">
            {recentActivity.resultados.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, gap: 2 }}>
                <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center' }}>
                  Los resultados de eventos pasados aparecerán aquí.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/administrativo/reportes')}
                  sx={{ bgcolor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  Ver Reportes
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {recentActivity.resultados.map((r, i) => (
                  <React.Fragment key={r.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.purple, width: 38, height: 38 }}>
                          <TrophyIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{r.nombre_atleta || r.nombreAtleta || 'Atleta'}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: COLORS.purple }}>{r.nombre_evento || r.nombreEvento || 'Evento'} · {fmt(r.fecha_registro)}</Typography>}
                      />
                    </ListItem>
                    {i < recentActivity.resultados.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>
      </Container>
    </Box>
  );
};

export default PaginaPrincipalAdministrativa;