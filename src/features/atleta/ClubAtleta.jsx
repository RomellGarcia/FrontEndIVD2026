import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Inbox as MailOutlineIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  ExitToApp as ExitToAppIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { atletasAPI, clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Paleta de colores
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
      overflow: 'hidden',
    }}
  >
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{
              color: COLORS.purple,
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

// Muestra un dato con ícono
const DatoCampo = ({ icon, label, valor }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
    {icon && <Box sx={{ color: COLORS.purple, mt: 0.3 }}>{icon}</Box>}
    <Box>
      <Typography
        sx={{
          fontSize: '0.65rem',
          color: COLORS.purple,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: COLORS.ink }}>{valor || 'N/A'}</Typography>
    </Box>
  </Box>
);

// Tarjeta de invitación recibida
const ExpedienteInvitacion = ({ invitacion, onVerPerfil, onAceptar, onRechazar, procesando }) => {
  const folio = String(invitacion.id ?? '').replace(/\D/g, '').slice(-6).padStart(6, '0') || '000000';
  return (
    <Box sx={{ border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${COLORS.burgundy}`, borderRadius: '8px', overflow: 'hidden', mb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.75,
          bgcolor: COLORS.cream,
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.burgundy, letterSpacing: '0.06em' }}>
          FOLIO #{folio}
        </Typography>
        <Chip
          label="Invitación pendiente"
          size="small"
          sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
        />
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.25, fontSize: '1rem' }}>
          {invitacion.clubNombre}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple, mb: 1.5 }}>
          Invitación recibida el {invitacion.fechaFormateada}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="text"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={onVerPerfil}
            sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700 }}
          >
            Ver perfil del club
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckIcon fontSize="small" />}
            onClick={onAceptar}
            disabled={procesando}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            Aceptar
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={onRechazar}
            disabled={procesando}
            sx={{ borderColor: COLORS.purple, color: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' } }}
          >
            Rechazar
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// Tarjeta de club disponible para solicitar unirse
const ClubCard = ({ club, onVerPerfil, onSolicitar, solicitudBloqueada }) => (
  <Box sx={{ border: `1px solid ${COLORS.line}`, borderTop: `3px solid ${COLORS.purple}`, borderRadius: '8px', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
        {club.nombre.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem', lineHeight: 1.2 }} noWrap>
          {club.nombre}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple }}>
          {club.totalAtletas} atletas · {club.totalEntrenadores} entrenadores
        </Typography>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<VisibilityIcon fontSize="small" />}
        onClick={onVerPerfil}
        sx={{ borderColor: COLORS.purple, color: COLORS.purple, textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' } }}
      >
        Ver perfil
      </Button>
      <Button
        size="small"
        variant="contained"
        startIcon={<SendIcon fontSize="small" />}
        onClick={onSolicitar}
        disabled={solicitudBloqueada}
        sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700, flex: 1, boxShadow: 'none' }}
      >
        Solicitar
      </Button>
    </Box>
  </Box>
);

// Formatea fecha a formato largo en español
const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

const ClubAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [perfil, setPerfil] = useState(null);
  const [clubActual, setClubActual] = useState(null);
  const [clubesDisponibles, setClubesDisponibles] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [solicitudPendiente, setSolicitudPendiente] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [busquedaClub, setBusquedaClub] = useState('');

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [clubDialogo, setClubDialogo] = useState(null);
  const [contextoDialogo, setContextoDialogo] = useState(null);
  const [solicitudDialogoId, setSolicitudDialogoId] = useState(null);
  const [cargandoDialogo, setCargandoDialogo] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    cargarDatosCompletos();
  }, [user, navigate]);

  // Normaliza la estructura de un club para uso interno
  const normalizarClub = (c) => ({
    id: c.id,
    nombre: c.nombre || 'Club sin nombre',
    direccion: c.direccion || 'N/A',
    telefono: c.telefono || 'N/A',
    email: c.email || 'N/A',
    descripcion: c.descripcion || 'Este club no tiene una descripción registrada.',
    totalAtletas: c.total_atletas ?? 0,
    totalEntrenadores: c.total_entrenadores ?? 0,
  });

  // Carga todos los datos del atleta relacionados con clubes
  const cargarDatosCompletos = async () => {
    setCargando(true);
    setError('');
    try {
      const perfilRes = await atletasAPI.getPerfil();
      const datosPerfil = perfilRes.data.atleta;
      setPerfil(datosPerfil);

      if (datosPerfil?.club_id) {
        const clubRes = await clubesAPI.getById(datosPerfil.club_id);
        setClubActual(normalizarClub(clubRes.data.club || clubRes.data));
        setClubesDisponibles([]);
        setInvitaciones([]);
        setSolicitudPendiente(null);
      } else {
        setClubActual(null);
        const [clubesRes, solicitudesRes] = await Promise.all([
          clubesAPI.getAll(),
          atletasAPI.getSolicitudes({ atleta_id: datosPerfil.id }),
        ]);

        let clubes = clubesRes.data.clubes || clubesRes.data || [];
        if (!Array.isArray(clubes)) clubes = [];
        setClubesDisponibles(clubes.map(normalizarClub));

        let solicitudes = solicitudesRes.data.solicitudes || solicitudesRes.data || [];
        if (!Array.isArray(solicitudes)) solicitudes = [];
        const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');

        const invitacionesRecibidas = pendientes
          .filter((s) => s.tipo === 'invitacion')
          .map((s) => ({
            id: s.id,
            clubId: s.club_id,
            clubNombre: s.club_nombre || 'Club',
            fechaFormateada: formatearFecha(s.fecha_solicitud),
          }));
        setInvitaciones(invitacionesRecibidas);

        const propiaPendiente = pendientes.find((s) => s.tipo === 'asociar') || null;
        setSolicitudPendiente(propiaPendiente);
      }
    } catch (err) {
      console.error('Error al cargar la sección de club:', err);
      setError('Error al cargar la información del club.');
    } finally {
      setCargando(false);
    }
  };

  // Abre el diálogo para un club disponible
  const abrirDialogoDisponible = (clubResumen) => {
    setDialogoAbierto(true);
    setContextoDialogo('disponible');
    setSolicitudDialogoId(null);
    setClubDialogo(clubResumen);
    setCargandoDialogo(false);
  };

  // Abre el diálogo para una invitación (carga el perfil del club)
  const abrirDialogoInvitacion = async (invitacion) => {
    setDialogoAbierto(true);
    setContextoDialogo('invitacion');
    setSolicitudDialogoId(invitacion.id);
    setClubDialogo(null);
    setCargandoDialogo(true);
    try {
      const clubRes = await clubesAPI.getById(invitacion.clubId);
      setClubDialogo(normalizarClub(clubRes.data.club || clubRes.data));
    } catch (err) {
      console.error('Error al cargar el perfil del club invitante:', err);
    } finally {
      setCargandoDialogo(false);
    }
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setClubDialogo(null);
    setContextoDialogo(null);
    setSolicitudDialogoId(null);
  };

  // Solicita unirse a un club
  const manejarSolicitarUnirse = async (clubId) => {
    try {
      setProcesandoId(clubId);
      await atletasAPI.crearSolicitud({ club_id: clubId, tipo: 'asociar' });
      cerrarDialogo();
      Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: 'Tu solicitud se envió correctamente. Espera la respuesta del club antes de solicitar a otro.',
        confirmButtonColor: COLORS.burgundy,
      });
      await cargarDatosCompletos();
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setError(err.response?.data?.error || 'Error al enviar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Acepta una invitación
  const manejarAceptarInvitacion = async (solicitudId) => {
    try {
      setProcesandoId(solicitudId);
      await atletasAPI.procesarSolicitud(solicitudId, { estado: 'aceptada' });
      cerrarDialogo();
      Swal.fire({
        icon: 'success',
        title: 'Invitación aceptada',
        text: 'Ya formas parte del club.',
        confirmButtonColor: COLORS.burgundy,
      });
      await cargarDatosCompletos();
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
      setError(err.response?.data?.error || 'Error al aceptar la invitación.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Rechaza una invitación
  const manejarRechazarInvitacion = async (solicitudId) => {
    try {
      setProcesandoId(solicitudId);
      await atletasAPI.procesarSolicitud(solicitudId, { estado: 'rechazada' });
      cerrarDialogo();
      Swal.fire({
        icon: 'success',
        title: 'Invitación rechazada',
        confirmButtonColor: COLORS.burgundy,
        timer: 1800,
        showConfirmButton: false,
      });
      await cargarDatosCompletos();
    } catch (err) {
      console.error('Error al rechazar invitación:', err);
      setError(err.response?.data?.error || 'Error al rechazar la invitación.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Sale del club actual
  const manejarSalirClub = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar salida del club?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await atletasAPI.updateClub(perfil.id, { club_id: null });
      await cargarDatosCompletos();
    } catch (err) {
      console.error('Error al salir del club:', err);
      setError('Error al salir del club.');
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
      {/* Cabecera superior */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Mi Club
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {clubActual ? (
          <SectionCard icon={<GroupsIcon sx={{ fontSize: 16 }} />} eyebrow="Club actual" title={clubActual.nombre}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 2, mb: 3 }}>
              <DatoCampo icon={<LocationOnIcon fontSize="small" />} label="Dirección" valor={clubActual.direccion} />
              <DatoCampo icon={<PhoneIcon fontSize="small" />} label="Teléfono" valor={clubActual.telefono} />
              <DatoCampo icon={<EmailIcon fontSize="small" />} label="Correo" valor={clubActual.email} />
              <DatoCampo icon={<GroupsIcon fontSize="small" />} label="Plantilla" valor={`${clubActual.totalAtletas} atletas · ${clubActual.totalEntrenadores} entrenadores`} />
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
              Descripción
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: COLORS.ink, mb: 3 }}>{clubActual.descripcion}</Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitToAppIcon />}
              onClick={manejarSalirClub}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Salir del club
            </Button>
          </SectionCard>
        ) : (
          <Box>
            {solicitudPendiente && (
              <Alert severity="info" sx={{ borderRadius: '8px', mb: 3 }}>
                Tienes una solicitud pendiente con <strong>{solicitudPendiente.club_nombre || 'un club'}</strong>. Espera su respuesta antes de solicitar otro.
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 9fr' }, gap: { xs: 2, md: 3 }, alignItems: 'start' }}>
              <Box>
                <SectionCard
                  icon={<MailOutlineIcon sx={{ fontSize: 16 }} />}
                  eyebrow="Bandeja de entrada"
                  title="Invitaciones Recibidas"
                  action={
                    invitaciones.length > 0 && (
                      <Chip label={invitaciones.length} size="small" sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }} />
                    )
                  }
                >
                  {invitaciones.length === 0 ? (
                    <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                      No tienes invitaciones pendientes.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                      {invitaciones.map((inv) => (
                        <ExpedienteInvitacion
                          key={inv.id}
                          invitacion={inv}
                          procesando={procesandoId === inv.id}
                          onVerPerfil={() => abrirDialogoInvitacion(inv)}
                          onAceptar={() => manejarAceptarInvitacion(inv.id)}
                          onRechazar={() => manejarRechazarInvitacion(inv.id)}
                        />
                      ))}
                    </Box>
                  )}
                </SectionCard>
              </Box>

              <Box>
                <SectionCard
                  icon={<SearchIcon sx={{ fontSize: 16 }} />}
                  eyebrow="Explorar"
                  title="Clubes Disponibles"
                  action={
                    clubesDisponibles.length > 0 && (
                      <Chip label={`${clubesDisponibles.length} clubes`} size="small" sx={{ bgcolor: COLORS.purple, color: '#fff', fontWeight: 700 }} />
                    )
                  }
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar club por nombre..."
                    value={busquedaClub}
                    onChange={(e) => setBusquedaClub(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: COLORS.purple }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2.5,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        '& fieldset': { borderColor: COLORS.line },
                        '&:hover fieldset': { borderColor: COLORS.burgundy },
                        '&.Mui-focused fieldset': { borderColor: COLORS.burgundy },
                      },
                    }}
                  />
                  {(() => {
                    const clubesFiltrados = clubesDisponibles.filter((c) =>
                      c.nombre.toLowerCase().includes(busquedaClub.trim().toLowerCase())
                    );
                    if (clubesDisponibles.length === 0) {
                      return (
                        <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                          No hay clubes disponibles en este momento.
                        </Typography>
                      );
                    }
                    if (clubesFiltrados.length === 0) {
                      return (
                        <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                          Ningún club coincide con "{busquedaClub}".
                        </Typography>
                      );
                    }
                    return (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
                        {clubesFiltrados.map((c) => (
                          <ClubCard
                            key={c.id}
                            club={c}
                            solicitudBloqueada={!!solicitudPendiente || procesandoId === c.id}
                            onVerPerfil={() => abrirDialogoDisponible(c)}
                            onSolicitar={() => manejarSolicitarUnirse(c.id)}
                          />
                        ))}
                      </Box>
                    );
                  })()}
                </SectionCard>
              </Box>
            </Box>
          </Box>
        )}
      </Container>

      {/* Diálogo de perfil del club */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Perfil del Club</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {cargandoDialogo ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
            </Box>
          ) : !clubDialogo ? (
            <Typography variant="body2" color="textSecondary">
              No se pudo cargar el perfil del club.
            </Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
                  {clubDialogo.nombre.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ color: COLORS.ink, fontWeight: 700 }}>
                  {clubDialogo.nombre}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 1.5, mb: 2 }}>
                <DatoCampo icon={<LocationOnIcon fontSize="small" />} label="Dirección" valor={clubDialogo.direccion} />
                <DatoCampo icon={<PhoneIcon fontSize="small" />} label="Teléfono" valor={clubDialogo.telefono} />
                <DatoCampo icon={<EmailIcon fontSize="small" />} label="Correo" valor={clubDialogo.email} />
                <DatoCampo icon={<GroupsIcon fontSize="small" />} label="Plantilla" valor={`${clubDialogo.totalAtletas} atletas · ${clubDialogo.totalEntrenadores} entrenadores`} />
              </Box>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                Descripción
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: COLORS.ink }}>{clubDialogo.descripcion}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarDialogo} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
          {clubDialogo && contextoDialogo === 'disponible' && (
            <Button
              variant="contained"
              startIcon={<SendIcon fontSize="small" />}
              disabled={!!solicitudPendiente || procesandoId === clubDialogo.id}
              onClick={() => manejarSolicitarUnirse(clubDialogo.id)}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              Solicitar unirme
            </Button>
          )}
          {clubDialogo && contextoDialogo === 'invitacion' && (
            <>
              <Button
                variant="outlined"
                startIcon={<CloseIcon fontSize="small" />}
                disabled={procesandoId === solicitudDialogoId}
                onClick={() => manejarRechazarInvitacion(solicitudDialogoId)}
                sx={{ borderColor: COLORS.purple, color: COLORS.purple }}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckIcon fontSize="small" />}
                disabled={procesandoId === solicitudDialogoId}
                onClick={() => manejarAceptarInvitacion(solicitudDialogoId)}
                sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
              >
                Aceptar invitación
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubAtleta;