import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  Chip, Avatar, CircularProgress, Alert, Divider, List,
  ListItem, ListItemText, ListItemAvatar,
} from '@mui/material';
import {
  People as PeopleIcon, Event as EventIcon, TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon, Group as GroupIcon, CalendarToday as CalendarIcon,
  Sports as SportsIcon, Work as WorkIcon, Person as PersonIcon,
  LocationOn as LocationIcon, School as SchoolIcon,
  FitnessCenter as FitnessIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BURGUNDY = '#800020';
const PURPLE   = '#7A4069';
const CREAM    = '#F5E8C7';
const GREEN    = '#2E7D32';

/* ── Tarjeta de estadística ── */
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
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,.18)', width: 56, height: 56 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

/* ── Sección con título ── */
const SectionCard = ({ icon, title, color, children, action }) => (
  <Card sx={{
    borderRadius: 3,
    height: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
  }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>{icon}</Avatar>
          <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>{title}</Typography>
        </Box>
        {action}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ flex: 1 }}>{children}</Box>
    </CardContent>
  </Card>
);

/* ── Tarjeta de acción rápida ── */
const ActionCard = ({ icon, title, subtitle, color, onClick }) => (
  <Card sx={{
    borderRadius: 2.5,
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all .25s ease',
    '&:hover': {
      borderColor: color,
      transform: 'translateY(-3px)',
      boxShadow: `0 8px 20px ${color}22`,
    },
  }}
  onClick={onClick}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
      <Avatar sx={{ bgcolor: `${color}14`, width: 48, height: 48 }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Avatar>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: '#888' }}>{subtitle}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const PaginaPrincipalEntrenador = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ atletasActivos: 0, eventosProximos: 0 });
  const [clubInfo, setClubInfo] = useState(null);
  const [atletasClub, setAtletasClub] = useState([]);
  const [eventosProximos, setEventosProximos] = useState([]);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { replace: true }); return; }
    if (user && (!user.id || !user.nombre)) { navigate('/login', { replace: true }); return; }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      if (!isAuthenticated()) { setError('Usuario no autenticado'); return; }

      // Club info
      if (user.clubId) {
        try {
          const clubRes = await axios.get(`http://localhost:5000/api/clubes/${user.clubId}`);
          setClubInfo(clubRes.data.club || clubRes.data);
        } catch { setClubInfo(null); }

        // Atletas del club
        try {
          const atletasRes = await axios.get(`http://localhost:5000/api/clubes/${user.clubId}/atletas`);
          const lista = atletasRes.data.atletas || atletasRes.data || [];
          setAtletasClub(lista);
          setStats(prev => ({ ...prev, atletasActivos: lista.length }));
        } catch {
          setAtletasClub([]);
          setStats(prev => ({ ...prev, atletasActivos: 0 }));
        }
      }

      // Eventos próximos
      try {
        const eventosRes = await axios.get('http://localhost:5000/api/eventos');
        const todos = eventosRes.data.eventos || eventosRes.data || [];
        const futuros = todos
          .filter(e => new Date(e.fecha) >= new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setEventosProximos(futuros.slice(0, 5));
        setStats(prev => ({ ...prev, eventosProximos: futuros.length }));
      } catch {
        setEventosProximos([]);
        setStats(prev => ({ ...prev, eventosProximos: 0 }));
      }
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

  if (!isAuthenticated()) return null;

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
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Avatar sx={{
            width: 88, height: 88, mx: 'auto', mb: 2,
            bgcolor: BURGUNDY, fontSize: '2rem', fontWeight: 'bold',
          }}>
            {user?.nombre?.[0]}{user?.apellido_paterno?.[0] || ''}
          </Avatar>
          <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, mb: .5 }}>
            ¡Bienvenido, {user?.nombre}!
          </Typography>
          <Typography variant="body1" sx={{ color: PURPLE, opacity: .8, mb: 1.5 }}>
            Panel de Entrenador
          </Typography>
          {clubInfo && (
            <Chip
              icon={<GroupIcon sx={{ fontSize: 16 }} />}
              label={clubInfo.nombre}
              sx={{
                bgcolor: 'rgba(46,125,50,.1)', color: GREEN,
                fontWeight: 600, '& .MuiChip-icon': { color: GREEN },
              }}
            />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Estadísticas ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 3, mb: 4,
        }}>
          <StatCard
            icon={<PeopleIcon />}
            value={stats.atletasActivos}
            label="Atletas del Club"
            sub={clubInfo ? `Club ${clubInfo.nombre}` : 'Sin club asignado'}
            gradient={`linear-gradient(135deg, ${BURGUNDY} 0%, ${PURPLE} 100%)`}
          />
          <StatCard
            icon={<EventIcon />}
            value={stats.eventosProximos}
            label="Eventos Próximos"
            sub="Competencias por venir"
            gradient={`linear-gradient(135deg, ${GREEN} 0%, #43A047 100%)`}
          />
        </Box>

        {/* ── Acciones rápidas ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2, mb: 4,
        }}>
          <ActionCard
            icon={<GroupIcon />}
            title="Gestionar Atletas"
            subtitle="Ver y administrar atletas asignados"
            color={BURGUNDY}
            onClick={() => navigate('/entrenador/gestionar-atletas')}
          />
          <ActionCard
            icon={<EventIcon />}
            title="Ver Eventos"
            subtitle="Consultar competencias y calendario"
            color={GREEN}
            onClick={() => navigate('/entrenador/eventos')}
          />
          <ActionCard
            icon={<AssessmentIcon />}
            title="Ver Reportes"
            subtitle="Análisis de rendimiento del equipo"
            color={PURPLE}
            onClick={() => navigate('/entrenador/reportes')}
          />
        </Box>

        {/* ── Contenido principal ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3, mb: 4,
        }}>
          {/* Atletas del club */}
          <SectionCard
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            title="Atletas del Club"
            color={BURGUNDY}
          >
            {atletasClub.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: `${BURGUNDY}12`, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                  <PeopleIcon sx={{ color: BURGUNDY }} />
                </Avatar>
                <Typography variant="body2" sx={{ color: '#999' }}>
                  {clubInfo ? 'No hay atletas en tu club aún' : 'No tienes un club asignado'}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {atletasClub.map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: BURGUNDY, width: 40, height: 40, fontSize: '.85rem' }}>
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
                            {a.edad ? `${a.edad} años` : ''} · {a.genero || ''} · {a.municipio || 'Sin municipio'}
                          </Typography>
                        }
                      />
                      <Chip
                        label={a.genero === 'femenino' ? 'F' : 'M'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: a.genero === 'femenino' ? `${PURPLE}1A` : `${BURGUNDY}1A`,
                          color: a.genero === 'femenino' ? PURPLE : BURGUNDY,
                          minWidth: 32,
                        }}
                      />
                    </ListItem>
                    {i < atletasClub.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>

          {/* Próximos eventos */}
          <SectionCard
            icon={<CalendarIcon sx={{ fontSize: 20 }} />}
            title="Próximos Eventos"
            color={GREEN}
          >
            {eventosProximos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: `${GREEN}12`, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                  <EventIcon sx={{ color: GREEN }} />
                </Avatar>
                <Typography variant="body2" sx={{ color: '#999' }}>No hay eventos próximos</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {eventosProximos.map((e, i) => (
                  <React.Fragment key={e.id || i}>
                    <ListItem sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: GREEN, width: 40, height: 40 }}>
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
                              {e.hora && ` · ${String(e.hora).slice(0, 5)}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 13 }} /> {e.lugar}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip label="Activo" size="small" color="success" sx={{ mt: .5 }} />
                    </ListItem>
                    {i < eventosProximos.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Box>

        {/* ── Información profesional ── */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 36, height: 36 }}>
                <SchoolIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: PURPLE, fontWeight: 'bold' }}>
                Información Profesional
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}>
              {/* Especialidades */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: BURGUNDY, fontWeight: 700, mb: 1 }}>
                  Especialidades
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .8 }}>
                  {user?.especialidades?.length > 0 ? (
                    user.especialidades.map((esp, i) => (
                      <Chip
                        key={i} label={esp} size="small"
                        icon={<FitnessIcon sx={{ fontSize: 14 }} />}
                        sx={{ bgcolor: `${CREAM}`, color: BURGUNDY, fontWeight: 500 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#999' }}>No especificadas</Typography>
                  )}
                </Box>
              </Box>

              {/* Certificaciones */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: GREEN, fontWeight: 700, mb: 1 }}>
                  Certificaciones
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .8 }}>
                  {user?.certificaciones?.length > 0 ? (
                    user.certificaciones.map((cert, i) => (
                      <Chip
                        key={i} label={cert} size="small"
                        icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                        sx={{ bgcolor: '#E8F5E9', color: GREEN, fontWeight: 500 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#999' }}>No especificadas</Typography>
                  )}
                </Box>
              </Box>

              {/* Experiencia */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: PURPLE, fontWeight: 700, mb: .5 }}>
                  Años de Experiencia
                </Typography>
                <Typography variant="h5" sx={{ color: '#1a1a1a', fontWeight: 700 }}>
                  {user?.anos_experiencia || user?.añosExperiencia || '—'}
                  <Typography component="span" variant="body2" sx={{ color: '#888', ml: .5 }}>años</Typography>
                </Typography>
              </Box>

              {/* Estado */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: PURPLE, fontWeight: 700, mb: .5 }}>
                  Estado
                </Typography>
                <Chip
                  label={user?.estado || 'Activo'}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

      </Container>
    </Box>
  );
};

export default PaginaPrincipalEntrenador;