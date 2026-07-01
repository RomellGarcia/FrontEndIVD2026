import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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

const BURGUNDY = '#800020';
const PURPLE  = '#7A4069';
const CREAM   = '#e4e4e5';

const StatCard = ({ icon, value, label, sub, gradient }) => (
  <Card sx={{
    background: gradient,
    color: '#fff',
    borderRadius: 3,
    transition: 'transform .2s, box-shadow .2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,.15)' },
  }}>
    <CardContent sx={{ py: 3, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body1" sx={{ opacity: .95, mt: .5, fontWeight: 600 }}>{label}</Typography>
          {sub && <Typography variant="caption" sx={{ opacity: .75 }}>{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,.18)', width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const SectionCard = ({ icon, title, color, children, minHeight = 360 }) => (
  <Card sx={{
    borderRadius: 3,
    height: '100%',
    minHeight,
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
  }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>{icon}</Avatar>
        <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ flex: 1 }}>{children}</Box>
    </CardContent>
  </Card>
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
      const eventos    = eventosRes.data.eventos       || [];
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: CREAM, py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, mb: 1, textAlign: 'center' }}>
          Panel Administrativo
        </Typography>
        <Typography variant="body1" sx={{ color: PURPLE, textAlign: 'center', mb: 4, opacity: .8 }}>
          Instituto Veracruzano del Deporte — Resumen general
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* ── Estadísticas ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 5,
        }}>
          <StatCard
            icon={<PeopleIcon />}
            value={stats.totalAtletas}
            label="Atletas"
            sub={`+${stats.atletasRecientes} esta semana`}
            gradient={`linear-gradient(135deg, ${BURGUNDY} 0%, ${PURPLE} 100%)`}
          />
          <StatCard
            icon={<GroupsIcon />}
            value={stats.totalClubes}
            label="Clubes"
            sub={`+${stats.clubesRecientes} esta semana`}
            gradient={`linear-gradient(135deg, ${PURPLE} 0%, ${BURGUNDY} 100%)`}
          />
          <StatCard
            icon={<EventIcon />}
            value={stats.totalEventos}
            label="Eventos"
            sub="Eventos en el sistema"
            gradient="linear-gradient(135deg, #2E7D32 0%, #43A047 100%)"
          />
          <StatCard
            icon={<TrophyIcon />}
            value={stats.totalResultados}
            label="Resultados"
            sub="Marcas y tiempos"
            gradient={`linear-gradient(135deg, ${PURPLE} 0%, #5c2d50 100%)`}
          />
        </Box>

        {/* ── Actividad reciente — fila 1 ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}>
          {/* Atletas */}
          <SectionCard icon={<PeopleIcon sx={{ fontSize: 20 }} />} title="Atletas Recientes" color={BURGUNDY}>
            {recentActivity.atletas.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No hay atletas registrados
              </Typography>
            ) : (
              <List disablePadding>
                {recentActivity.atletas.map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: BURGUNDY, width: 40, height: 40, fontSize: '0.9rem' }}>
                          {a.nombre?.[0]}{a.apellido_paterno?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {a.nombre} {a.apellido_paterno} {a.apellido_materno || ''}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {a.municipio || 'Sin municipio'} · {a.club_nombre || 'Independiente'}
                          </Typography>
                        }
                      />
                      <Chip
                        label={a.genero === 'femenino' ? 'F' : 'M'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: a.genero === 'femenino' ? 'rgba(122,64,105,.12)' : 'rgba(128,0,32,.1)',
                          color: a.genero === 'femenino' ? PURPLE : BURGUNDY,
                          minWidth: 32,
                        }}
                      />
                    </ListItem>
                    {i < recentActivity.atletas.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Clubes */}
          <SectionCard icon={<GroupsIcon sx={{ fontSize: 20 }} />} title="Clubes Registrados" color={PURPLE}>
            {recentActivity.clubes.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No hay clubes registrados
              </Typography>
            ) : (
              <List disablePadding>
                {recentActivity.clubes.map((c, i) => (
                  <React.Fragment key={c.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40, fontSize: '0.9rem' }}>
                          {c.nombre?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {c.nombre}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {c.direccion || 'Sin dirección'} · {c.email || ''}
                          </Typography>
                        }
                      />
                      <Chip
                        label={c.estado || 'activo'}
                        size="small"
                        color={c.estado === 'activo' ? 'success' : 'error'}
                      />
                    </ListItem>
                    {i < recentActivity.clubes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>

        {/* ── Actividad reciente — fila 2 ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}>
          {/* Próximos Eventos */}
          <SectionCard icon={<CalendarIcon sx={{ fontSize: 20 }} />} title="Próximos Eventos" color="#2E7D32">
            {recentActivity.eventos.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                No hay eventos próximos
              </Typography>
            ) : (
              <List disablePadding>
                {recentActivity.eventos.map((e, i) => (
                  <React.Fragment key={e.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#2E7D32', width: 40, height: 40 }}>
                          <EventIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {e.titulo}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5, mt: .3 }}>
                              <CalendarIcon sx={{ fontSize: 13 }} /> {fmt(e.fecha)}
                              {e.hora && ` · ${e.hora.slice(0, 5)}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 13 }} /> {e.lugar}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label="Activo"
                        size="small"
                        color="success"
                        sx={{ mt: .5 }}
                      />
                    </ListItem>
                    {i < recentActivity.eventos.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Resultados + Acceso rápido a reportes */}
          <SectionCard icon={<TrophyIcon sx={{ fontSize: 20 }} />} title="Resultados Recientes" color={PURPLE}>
            {recentActivity.resultados.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 2 }}>
                <Avatar sx={{ bgcolor: PURPLE, width: 64, height: 64 }}>
                  <AssessmentIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>
                  Los resultados de eventos pasados aparecerán aquí
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/administrativo/reportes')}
                  sx={{
                    bgcolor: BURGUNDY,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#600018' },
                  }}
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
                        <Avatar sx={{ bgcolor: PURPLE, width: 40, height: 40 }}>
                          <TrophyIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {r.nombre_atleta || r.nombreAtleta || 'Atleta'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {r.nombre_evento || r.nombreEvento || 'Evento'} · {fmt(r.fecha_registro)}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {i < recentActivity.resultados.length - 1 && <Divider />}
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