import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemSecondaryAction,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  PersonRemove as PersonRemoveIcon,
  Warning as WarningIcon,
  FitnessCenter as FitnessCenterIcon,
  SportsBaseball as SportsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { entrenadoresAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// --- Constantes de estilo ---
const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e4e4e5';
const GREEN = '#2E7D32';

const SectionCard = ({ icon, title, color, action, children }) => (
  <Card sx={{
    borderRadius: 3,
    height: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: '#fff',
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

const ListItemCustom = ({ primary, secondary, actions }) => (
  <ListItem
    sx={{
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      mb: 1,
      py: 1.5,
      px: 2,
      '&:hover': { backgroundColor: '#f9f9f9' },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body1" sx={{ fontWeight: 600, color: BURGUNDY, component: 'span' }}>
        {primary}
      </Typography>
      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
        {secondary}
      </Box>
    </Box>
    {actions && (
      <ListItemSecondaryAction sx={{ position: 'relative', transform: 'none', right: 0, top: 0 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>{actions}</Box>
      </ListItemSecondaryAction>
    )}
  </ListItem>
);

const GestionAtletas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [loadingEntrenadores, setLoadingEntrenadores] = useState(false);
  const [error, setError] = useState('');
  const [atletas, setAtletas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [solicitudesEntrenadores, setSolicitudesEntrenadores] = useState([]);
  const [modalExpulsionOpen, setModalExpulsionOpen] = useState(false);
  const [atletaAExpulsar, setAtletaAExpulsar] = useState(null);
  const [modalExpulsionEntrenadorOpen, setModalExpulsionEntrenadorOpen] = useState(false);
  const [entrenadorAExpulsar, setEntrenadorAExpulsar] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [clubId, setClubId] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    obtenerClubIdYcargar();
  }, [user, navigate]);

  const obtenerClubIdYcargar = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clubes');
      let clubes = response.data.clubes || response.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find(c => c.email === user.email);
      if (!club) {
        setError('No se encontró un club asociado a este usuario.');
        setLoading(false);
        return;
      }
      const idClub = club.id || club._id;
      setClubId(idClub);
      await Promise.all([
        fetchAtletas(idClub),
        fetchSolicitudes(idClub),
        fetchEntrenadores(idClub),
        fetchSolicitudesEntrenadores(idClub),
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener clubId:', error);
      setError('Error al cargar los datos del club.');
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAtletas = async (idClub) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/atletas?club_id=${idClub}`, {
        headers: getAuthHeaders(),
      });
      let data = response.data.atletas || response.data || [];
      if (!Array.isArray(data)) data = [];
      const atletasNorm = data.map((a) => ({
        id: a.id || a._id,
        nombreCompleto: a.nombre
          ? `${a.nombre} ${a.apellidopa || ''} ${a.apellidoma || ''}`.trim()
          : a.usuario
          ? `${a.usuario.nombre} ${a.usuario.apellido_paterno || ''} ${a.usuario.apellido_materno || ''}`.trim()
          : 'Sin nombre',
        curp: a.curp || a.usuario?.curp || 'N/A',
        telefono: a.telefono || a.usuario?.telefono || 'N/A',
        gmail: a.email || a.usuario?.email || 'N/A',
        sexo: a.genero || a.usuario?.genero || 'N/A',
        fechaNacimiento: a.fecha_nacimiento || a.usuario?.fecha_nacimiento || null,
        fechaIngresoClub: a.fechaIngresoClub || a.createdAt || null,
      }));
      setAtletas(atletasNorm);
      setError('');
    } catch (error) {
      console.error('Error al obtener atletas:', error);
      setAtletas([]);
      if (!error.response || error.response.status !== 401) {
        setError('Error al cargar los atletas.');
      }
    }
  };

  const fetchSolicitudes = async (idClub) => {
    try {
      setLoadingSolicitudes(true);
      const response = await axios.get(`http://localhost:5000/api/atletas/solicitudes-club?clubId=${idClub}`, {
        headers: getAuthHeaders(),
      });
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientes = data.filter((s) => s.estado === 'pendiente');
      setSolicitudes(pendientes);
    } catch (error) {
      console.error('Error al cargar solicitudes de atletas:', error);
      setSolicitudes([]);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const handleAceptarSolicitud = async (solicitudId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/atletas/solicitudes-club/${solicitudId}`,
        { estado: 'aceptada' },
        { headers: getAuthHeaders() }
      );
      setError('');
      await fetchSolicitudes(clubId);
      await fetchAtletas(clubId);
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      setError('Error al procesar la solicitud. Intente de nuevo.');
    }
  };

  const handleRechazarSolicitud = async (solicitudId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/atletas/solicitudes-club/${solicitudId}`,
        { estado: 'rechazada' },
        { headers: getAuthHeaders() }
      );
      setError('');
      await fetchSolicitudes(clubId);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      setError('Error al procesar la solicitud. Intente de nuevo.');
    }
  };

  const handleVerSolicitud = (solicitud) => {
    console.log('Ver solicitud:', solicitud);
  };

  const handleExpulsarAtleta = (atleta) => {
    setAtletaAExpulsar(atleta);
    setModalExpulsionOpen(true);
  };

  const confirmarExpulsion = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/atletas/${atletaAExpulsar.id}/club`,
        { clubId: null },
        { headers: getAuthHeaders() }
      );
      setError('');
      setModalExpulsionOpen(false);
      setAtletaAExpulsar(null);
      await fetchAtletas(clubId);
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError('Error al expulsar al atleta. Intente de nuevo.');
    }
  };

  const cancelarExpulsion = () => {
    setModalExpulsionOpen(false);
    setAtletaAExpulsar(null);
  };

  const calcularEdad = (fecha) => {
    if (!fecha) return 'N/A';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const fetchEntrenadores = async (idClub) => {
    try {
      setLoadingEntrenadores(true);
      const response = await entrenadoresAPI.getByClub(idClub);
      let data = response.data.entrenadores || response.data || [];
      if (!Array.isArray(data)) data = [];
      const entrenadoresNorm = data.map((e) => ({
        id: e.id || e._id,
        nombreCompleto: e.nombre
          ? `${e.nombre} ${e.apellidopa || ''} ${e.apellidoma || ''}`.trim()
          : e.usuario
          ? `${e.usuario.nombre} ${e.usuario.apellido_paterno || ''} ${e.usuario.apellido_materno || ''}`.trim()
          : 'Sin nombre',
        gmail: e.email || e.usuario?.email || 'N/A',
        telefono: e.telefono || e.usuario?.telefono || 'N/A',
        especialidades: e.especialidades || [],
        añosExperiencia: e.anos_experiencia || e.añosExperiencia || 'N/A',
      }));
      setEntrenadores(entrenadoresNorm);
    } catch (error) {
      console.error('Error al obtener entrenadores:', error);
      setEntrenadores([]);
    } finally {
      setLoadingEntrenadores(false);
    }
  };

  const fetchSolicitudesEntrenadores = async (idClub) => {
    try {
      const response = await entrenadoresAPI.getSolicitudesByClub(idClub);
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientes = data.filter((s) => s.estado === 'pendiente');
      setSolicitudesEntrenadores(pendientes);
    } catch (error) {
      console.error('Error al cargar solicitudes de entrenadores:', error);
      setSolicitudesEntrenadores([]);
    }
  };

  const handleAceptarSolicitudEntrenador = async (solicitudId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/entrenadores/solicitudes/${solicitudId}`,
        { estado: 'aceptada' },
        { headers: getAuthHeaders() }
      );
      setError('');
      await fetchSolicitudesEntrenadores(clubId);
      await fetchEntrenadores(clubId);
    } catch (error) {
      console.error('Error al aceptar solicitud de entrenador:', error);
      setError('Error al procesar la solicitud del entrenador.');
    }
  };

  const handleRechazarSolicitudEntrenador = async (solicitudId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/entrenadores/solicitudes/${solicitudId}`,
        { estado: 'rechazada' },
        { headers: getAuthHeaders() }
      );
      setError('');
      await fetchSolicitudesEntrenadores(clubId);
    } catch (error) {
      console.error('Error al rechazar solicitud de entrenador:', error);
      setError('Error al procesar la solicitud del entrenador.');
    }
  };

  const handleExpulsarEntrenador = (entrenador) => {
    setEntrenadorAExpulsar(entrenador);
    setModalExpulsionEntrenadorOpen(true);
  };

  const confirmarExpulsionEntrenador = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/entrenadores/${entrenadorAExpulsar.id}/club`,
        { clubId: null },
        { headers: getAuthHeaders() }
      );
      setError('');
      setModalExpulsionEntrenadorOpen(false);
      setEntrenadorAExpulsar(null);
      await fetchEntrenadores(clubId);
    } catch (error) {
      console.error('Error al expulsar entrenador:', error);
      setError('Error al expulsar al entrenador. Intente de nuevo.');
    }
  };

  const cancelarExpulsionEntrenador = () => {
    setModalExpulsionEntrenadorOpen(false);
    setEntrenadorAExpulsar(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', width: '100%', py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Título principal */}
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: BURGUNDY, fontWeight: 800, mb: 4 }}
        >
          Gestión del Club
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: PURPLE,
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
                minWidth: 120,
              },
              '& .Mui-selected': { color: `${BURGUNDY} !important` },
              '& .MuiTabs-indicator': { backgroundColor: BURGUNDY },
            }}
          >
            <Tab
              label="Atletas"
              icon={<PeopleIcon />}
              iconPosition="start"
            />
            <Tab
              label="Entrenadores"
              icon={<FitnessCenterIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Solicitudes de atletas */}
            <Grid item xs={12} md={6}>
              <SectionCard
                icon={<PersonAddIcon sx={{ fontSize: 20 }} />}
                title="Solicitudes de Atletas"
                color={BURGUNDY}
                action={
                  solicitudes.length > 0 && (
                    <Chip
                      label={solicitudes.length}
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )
                }
              >
                {loadingSolicitudes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={30} sx={{ color: BURGUNDY }} />
                  </Box>
                ) : solicitudes.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                    No hay solicitudes pendientes.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {solicitudes.map((s) => {
                      const nombre = s.datosAtleta?.nombreCompleto || s.datosAtleta?.nombre || 'Atleta';
                      return (
                        <ListItemCustom
                          key={s._id}
                          primary={nombre}
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                                <strong>Edad:</strong> {s.datosAtleta?.edad || 'N/A'} años
                              </Typography>
                              <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                                <strong>Género:</strong> {s.datosAtleta?.genero || 'N/A'}
                              </Typography>
                              <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                                <strong>Fecha:</strong> {formatearFecha(s.fechaSolicitud)}
                              </Typography>
                            </Box>
                          }
                          actions={
                            <>
                              <IconButton
                                color="success"
                                onClick={() => handleAceptarSolicitud(s._id)}
                                title="Aceptar"
                                size="small"
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleRechazarSolicitud(s._id)}
                                title="Rechazar"
                                size="small"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="primary"
                                onClick={() => handleVerSolicitud(s)}
                                title="Ver detalles"
                                size="small"
                              >
                                <GroupIcon fontSize="small" />
                              </IconButton>
                            </>
                          }
                        />
                      );
                    })}
                  </List>
                )}
              </SectionCard>
            </Grid>

            {/* Atletas del club */}
            <Grid item xs={12}>
              <SectionCard
                icon={<PeopleIcon sx={{ fontSize: 20 }} />}
                title="Atletas del Club"
                color={PURPLE}
                action={
                  atletas.length > 0 && (
                    <Chip
                      label={`${atletas.length} atletas`}
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )
                }
              >
                {atletas.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                    No hay atletas registrados.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Nombre</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>CURP</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Teléfono</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Correo</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Género</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Edad</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Fecha Ingreso</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }} align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {atletas.map((a) => (
                          <TableRow key={a.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: BURGUNDY, fontSize: '0.75rem' }}>
                                  {a.nombreCompleto.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {a.nombreCompleto}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{a.curp}</TableCell>
                            <TableCell>{a.telefono}</TableCell>
                            <TableCell>{a.gmail}</TableCell>
                            <TableCell>
                              <Chip
                                label={a.sexo}
                                size="small"
                                color={a.sexo === 'masculino' ? 'primary' : 'secondary'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>{calcularEdad(a.fechaNacimiento)} años</TableCell>
                            <TableCell>{formatearFecha(a.fechaIngresoClub)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => handleExpulsarAtleta(a)}
                                title="Expulsar"
                                size="small"
                              >
                                <PersonRemoveIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        )}

        {/* Contenido pestaña Entrenadores */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Solicitudes de entrenadores */}
            <Grid item xs={12} md={6}>
              <SectionCard
                icon={<PersonAddIcon sx={{ fontSize: 20 }} />}
                title="Solicitudes de Entrenadores"
                color={BURGUNDY}
                action={
                  solicitudesEntrenadores.length > 0 && (
                    <Chip
                      label={solicitudesEntrenadores.length}
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )
                }
              >
                {loadingEntrenadores ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={30} sx={{ color: BURGUNDY }} />
                  </Box>
                ) : solicitudesEntrenadores.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                    No hay solicitudes de entrenadores pendientes.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {solicitudesEntrenadores.map((s) => (
                      <ListItemCustom
                        key={s._id}
                        primary={s.nombreEntrenador || 'Entrenador'}
                        secondary={
                          <Box component="span">
                            <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                              <strong>Email:</strong> {s.emailEntrenador || 'N/A'}
                            </Typography>
                            <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                              <strong>Teléfono:</strong> {s.telefonoEntrenador || 'N/A'}
                            </Typography>
                            <Typography variant="body2" component="span" display="block" sx={{ color: '#555' }}>
                              <strong>Mensaje:</strong> {s.mensaje || 'Sin mensaje'}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ color: '#888' }}>
                              {formatearFecha(s.fechaSolicitud)}
                            </Typography>
                          </Box>
                        }
                        actions={
                          <>
                            <IconButton
                              color="success"
                              onClick={() => handleAceptarSolicitudEntrenador(s._id)}
                              title="Aceptar"
                              size="small"
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleRechazarSolicitudEntrenador(s._id)}
                              title="Rechazar"
                              size="small"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </>
                        }
                      />
                    ))}
                  </List>
                )}
              </SectionCard>
            </Grid>

            {/* Entrenadores del club */}
            <Grid item xs={12}>
              <SectionCard
                icon={<FitnessCenterIcon sx={{ fontSize: 20 }} />}
                title="Entrenadores del Club"
                color={PURPLE}
                action={
                  entrenadores.length > 0 && (
                    <Chip
                      label={`${entrenadores.length} entrenadores`}
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )
                }
              >
                {entrenadores.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                    No hay entrenadores registrados.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Nombre</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Teléfono</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Especialidades</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }}>Años Exp.</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: BURGUNDY }} align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entrenadores.map((e) => (
                          <TableRow key={e.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: BURGUNDY, fontSize: '0.75rem' }}>
                                  {e.nombreCompleto.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {e.nombreCompleto}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{e.gmail}</TableCell>
                            <TableCell>{e.telefono}</TableCell>
                            <TableCell>
                              {Array.isArray(e.especialidades) && e.especialidades.length > 0 ? (
                                e.especialidades.map((esp, idx) => (
                                  <Chip
                                    key={idx}
                                    label={esp.nombre || esp}
                                    size="small"
                                    color="primary"
                                    sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                                  />
                                ))
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>{e.añosExperiencia}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => handleExpulsarEntrenador(e)}
                                title="Expulsar"
                                size="small"
                              >
                                <PersonRemoveIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Diálogo confirmar expulsión atleta */}
      <Dialog open={modalExpulsionOpen} onClose={cancelarExpulsion} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Confirmar Expulsión</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            ¿Estás seguro de que quieres expulsar a{' '}
            <strong>{atletaAExpulsar?.nombreCompleto}</strong> del club?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Esta acción:
          </Typography>
          <ul>
            <li>Desvinculará al atleta del club</li>
            <li>El atleta quedará como independiente</li>
            <li>No se podrá deshacer automáticamente</li>
          </ul>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelarExpulsion} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarExpulsion}
            color="error"
            variant="contained"
            startIcon={<PersonRemoveIcon />}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            Confirmar Expulsión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo confirmar expulsión entrenador */}
      <Dialog open={modalExpulsionEntrenadorOpen} onClose={cancelarExpulsionEntrenador} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: BURGUNDY, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Confirmar Expulsión de Entrenador</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            ¿Estás seguro de que quieres expulsar a{' '}
            <strong>{entrenadorAExpulsar?.nombreCompleto}</strong> del club?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Esta acción:
          </Typography>
          <ul>
            <li>Desvinculará al entrenador del club</li>
            <li>El entrenador quedará como independiente</li>
            <li>No se podrá deshacer automáticamente</li>
          </ul>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelarExpulsionEntrenador} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarExpulsionEntrenador}
            color="error"
            variant="contained"
            startIcon={<PersonRemoveIcon />}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            Confirmar Expulsión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionAtletas;