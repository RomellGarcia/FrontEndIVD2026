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

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: '#8000202E',
  lineSoft: '#80002014',
};

// Componente base para secciones
const SectionCard = ({ icon, eyebrow, title, action, children }) => (
  <Box
    sx={{
      bgcolor: COLORS.paper,
      borderRadius: '10px',
      border: `1px solid ${COLORS.line}`,
      boxShadow: '0 2px 12px #80002012',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
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
    <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, flex: 1 }}>{children}</Box>
  </Box>
);

// Chip de estado con borde de color según estado
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
  const [estadisticas, setEstadisticas] = useState({
    totalAtletas: 0, totalClubes: 0, totalEventos: 0, totalResultados: 0,
    atletasRecientes: 0, clubesRecientes: 0,
  });
  const [actividadReciente, setActividadReciente] = useState({
    atletas: [], clubes: [], eventos: [], resultados: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  // Obtiene los datos del dashboard y calcula estadísticas
  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      const [atletasRes, clubesRes, eventosRes, resultadosRes] = await Promise.all([
        atletasAPI.getAll(), clubesAPI.getAll(), eventosAPI.getAll(), resultadosAPI.getAll(),
      ]);

      const atletas = atletasRes.data.atletas || [];
      const clubes = clubesRes.data.clubes || [];
      const eventos = eventosRes.data.eventos || [];
      const resultados = resultadosRes.data.resultados || [];

      const fechaLimiteSemana = new Date();
      fechaLimiteSemana.setDate(fechaLimiteSemana.getDate() - 7);
      
      const nuevosAtletas = atletas.filter(a => new Date(a.fecha_ingreso_club || a.created_at) >= fechaLimiteSemana).length;
      const nuevosClubes = clubes.filter(c => new Date(c.fecha_creacion || c.created_at) >= fechaLimiteSemana).length;

      setEstadisticas({
        totalAtletas: atletas.length,
        totalClubes: clubes.length,
        totalEventos: eventos.length,
        totalResultados: resultados.length,
        atletasRecientes: nuevosAtletas,
        clubesRecientes: nuevosClubes,
      });

      setActividadReciente({
        atletas: atletas.slice(0, 5),
        clubes: clubes.slice(0, 5),
        eventos: eventos
          .filter(e => new Date(e.fecha) >= new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .slice(0, 3),
        resultados: resultados.slice(0, 5),
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Formatea fecha en formato corto
  const formatearFechaCorta = (fecha) => {
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
      {/* Cabecera */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Instituto Veracruzano del Deporte
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Panel Administrativo
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Resumen general del sistema
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

        {/* Tarjeta de estadísticas flotante */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: { xs: 3, md: 5 },
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px #00000024',
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <PeopleIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalAtletas, label: 'Atletas', sub: `+${estadisticas.atletasRecientes} esta semana` },
            { icon: <GroupsIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalClubes, label: 'Clubes', sub: `+${estadisticas.clubesRecientes} esta semana` },
            { icon: <EventIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalEventos, label: 'Eventos', sub: 'En el sistema' },
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: estadisticas.totalResultados, label: 'Resultados', sub: 'Marcas y tiempos' },
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

        {/* Fila 1: Atletas y Clubes recientes */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
          {/* Atletas recientes */}
          <SectionCard icon={<PeopleIcon sx={{ fontSize: 16 }} />} eyebrow="Recién ingresados" title="Atletas Recientes">
            {actividadReciente.atletas.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay atletas registrados.</Typography>
            ) : (
              <List disablePadding>
                {actividadReciente.atletas.map((a, i) => (
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
                      <EstadoChip label={a.genero?.toLowerCase() === 'femenino' ? 'F' : 'M'} positivo={a.genero?.toLowerCase() === 'femenino'} />
                    </ListItem>
                    {i < actividadReciente.atletas.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Clubes registrados */}
          <SectionCard icon={<GroupsIcon sx={{ fontSize: 16 }} />} eyebrow="Registro" title="Clubes Registrados">
            {actividadReciente.clubes.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay clubes registrados.</Typography>
            ) : (
              <List disablePadding>
                {actividadReciente.clubes.map((c, i) => (
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
                    {i < actividadReciente.clubes.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>

        {/* Fila 2: Próximos Eventos y Resultados recientes */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
          {/* Próximos eventos */}
          <SectionCard icon={<CalendarIcon sx={{ fontSize: 16 }} />} eyebrow="Agenda" title="Próximos Eventos">
            {actividadReciente.eventos.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>No hay eventos próximos.</Typography>
            ) : (
              <List disablePadding>
                {actividadReciente.eventos.map((e, i) => (
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
                              <CalendarIcon sx={{ fontSize: 13 }} /> {formatearFechaCorta(e.fecha)}{e.hora && ` · ${e.hora.slice(0, 5)}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 13 }} /> {e.lugar}
                            </Typography>
                          </Box>
                        }
                      />
                      <EstadoChip label="Activo" positivo />
                    </ListItem>
                    {i < actividadReciente.eventos.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Resultados recientes */}
          <SectionCard icon={<TrophyIcon sx={{ fontSize: 16 }} />} eyebrow="Marcas y tiempos" title="Resultados Recientes">
            {actividadReciente.resultados.length === 0 ? (
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
                {actividadReciente.resultados.map((r, i) => (
                  <React.Fragment key={r.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS.purple, width: 38, height: 38 }}>
                          <TrophyIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{r.nombre_atleta || r.nombreAtleta || 'Atleta'}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: COLORS.purple }}>{r.nombre_evento || r.nombreEvento || 'Evento'} · {formatearFechaCorta(r.fecha_registro)}</Typography>}
                      />
                    </ListItem>
                    {i < actividadReciente.resultados.length - 1 && <Divider sx={{ borderColor: COLORS.line }} />}
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