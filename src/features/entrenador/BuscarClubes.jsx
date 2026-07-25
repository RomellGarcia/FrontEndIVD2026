import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, Alert, Chip, Avatar,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, TextField, InputAdornment,
} from '@mui/material';
import {
  Groups as GroupsIcon, Search as SearchIcon, Check as CheckIcon,
  Close as CloseIcon, Visibility as VisibilityIcon, Send as SendIcon,
  LocationOn as LocationOnIcon, Phone as PhoneIcon, Email as EmailIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { entrenadorAPI, clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// --- Paleta institucional IVD (misma que el resto de la app) ---
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

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

const EstadoSolicitudChip = ({ estado }) => {
  const map = {
    pendiente: { label: 'Solicitud pendiente', icon: <SendIcon sx={{ fontSize: 14 }} /> },
    aceptada: { label: 'Solicitud aceptada', icon: <CheckIcon sx={{ fontSize: 14 }} /> },
    rechazada: { label: 'Solicitud rechazada', icon: <CloseIcon sx={{ fontSize: 14 }} /> },
  };
  const cfg = map[estado];
  if (!cfg) return null;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700, fontSize: '.68rem' }}
    />
  );
};

/** Tarjeta de club disponible para explorar / solicitar unirse. */
const ClubCard = ({ club, onVerPerfil, onSolicitar, estadoSolicitud, procesando }) => (
  <Box
    sx={{
      ...cardSx, overflow: 'hidden',
      transition: 'transform .15s, box-shadow .15s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
    }}
  >
    <Box sx={{ p: 2.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Avatar sx={{ width: 44, height: 44, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
          {club.nombre.charAt(0)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.2 }} noWrap>
            {club.nombre}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple }}>
            {club.totalAtletas} atletas · {club.totalEntrenadores} entrenadores
          </Typography>
        </Box>
      </Box>

      {estadoSolicitud && (
        <Box sx={{ mb: 1.5 }}>
          <EstadoSolicitudChip estado={estadoSolicitud} />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small" variant="outlined" startIcon={<VisibilityIcon fontSize="small" />}
          onClick={onVerPerfil}
          sx={{ borderColor: COLORS.purple, color: COLORS.purple, textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' } }}
        >
          Ver perfil
        </Button>
        <Button
          size="small" variant="contained" startIcon={<SendIcon fontSize="small" />}
          onClick={onSolicitar}
          disabled={procesando || (estadoSolicitud && estadoSolicitud !== 'rechazada')}
          sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700, flex: 1, boxShadow: 'none' }}
        >
          {estadoSolicitud === 'rechazada' ? 'Solicitar de nuevo' : 'Solicitar'}
        </Button>
      </Box>
    </Box>
  </Box>
);

const DatoCampo = ({ icon, label, valor }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
    {icon && <Box sx={{ color: COLORS.purple, mt: 0.3 }}>{icon}</Box>}
    <Box>
      <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{valor || '—'}</Typography>
    </Box>
  </Box>
);

/**
 * "Buscar Clubes" del entrenador — explorar clubes registrados y enviar
 * solicitud para unirse a uno. Solo usa lo que el backend realmente
 * expone para este rol: entrenadorAPI.solicitarClub / getSolicitudes.
 * No hay flujo de aceptar invitaciones ni de salir del club aquí porque
 * esos endpoints no existen para entrenador (a diferencia de atleta).
 */
const BuscarClubes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clubes, setClubes] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogClub, setDialogClub] = useState(null);
  const [mensajeSolicitud, setMensajeSolicitud] = useState('');

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarTodo();
  }, [user, navigate]);

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

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [clubesRes, solicitudesRes] = await Promise.all([
        clubesAPI.getAll(),
        entrenadorAPI.getSolicitudes(),
      ]);

      let clubesData = clubesRes.data.clubes || clubesRes.data || [];
      if (!Array.isArray(clubesData)) clubesData = [];
      setClubes(clubesData.map(normalizarClub));

      let solicitudesData = solicitudesRes.data.solicitudes || solicitudesRes.data || [];
      if (!Array.isArray(solicitudesData)) solicitudesData = [];
      setSolicitudes(solicitudesData);

      setError('');
    } catch (err) {
      console.error('Error al cargar clubes:', err);
      setError('Error al cargar los clubes disponibles.');
    } finally {
      setLoading(false);
    }
  };

  const estadoSolicitudPara = (clubId) => {
    const solicitud = solicitudes.find((s) => s.club_id === clubId);
    return solicitud ? solicitud.estado : null;
  };

  const abrirPerfil = (club) => {
    setDialogClub(club);
    setMensajeSolicitud('');
    setDialogOpen(true);
  };

  const cerrarDialog = () => {
    setDialogOpen(false);
    setDialogClub(null);
  };

  const handleSolicitar = async (clubId) => {
    try {
      setProcesandoId(clubId);
      await entrenadorAPI.solicitarClub({ club_id: clubId, mensaje: mensajeSolicitud });
      cerrarDialog();
      Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: 'Tu solicitud se envió correctamente.',
        confirmButtonColor: COLORS.burgundy,
      });
      await cargarTodo();
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || 'No se pudo enviar la solicitud.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const clubesFiltrados = clubes.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Entrenador
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Buscar Clubes
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Encuentra un club y envía tu solicitud para unirte
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: { xs: -5, md: -6 }, borderRadius: '8px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ ...cardSx, p: 2, mb: 3, mt: error ? 0 : { xs: -5, md: -6 } }}>
          <TextField
            fullWidth
            placeholder="Buscar club por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: COLORS.purple }} /></InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.burgundy },
            }}
          />
        </Box>

        {clubesFiltrados.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <GroupsIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              {clubes.length === 0 ? 'No hay clubes registrados' : 'Ningún club coincide con tu búsqueda'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
            {clubesFiltrados.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                estadoSolicitud={estadoSolicitudPara(club.id)}
                procesando={procesandoId === club.id}
                onVerPerfil={() => abrirPerfil(club)}
                onSolicitar={() => handleSolicitar(club.id)}
              />
            ))}
          </Box>
        )}
      </Container>

      {/* ── Modal: Perfil del Club ── */}
      <Dialog open={dialogOpen} onClose={cerrarDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          Perfil del Club
        </DialogTitle>
        <DialogContent dividers>
          {dialogClub && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: COLORS.burgundy, fontWeight: 700, fontSize: '1.3rem' }}>
                  {dialogClub.nombre.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
                  {dialogClub.nombre}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <DatoCampo icon={<LocationOnIcon fontSize="small" />} label="Dirección" valor={dialogClub.direccion} />
                <DatoCampo icon={<PhoneIcon fontSize="small" />} label="Teléfono" valor={dialogClub.telefono} />
                <DatoCampo icon={<EmailIcon fontSize="small" />} label="Correo" valor={dialogClub.email} />
                <DatoCampo icon={<GroupsIcon fontSize="small" />} label="Plantilla" valor={`${dialogClub.totalAtletas} atletas · ${dialogClub.totalEntrenadores} entrenadores`} />
              </Box>

              <Divider sx={{ borderColor: COLORS.line }} />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: .5 }}>Descripción</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: COLORS.ink }}>{dialogClub.descripcion}</Typography>
              </Box>

              {!estadoSolicitudPara(dialogClub.id) && (
                <TextField
                  label="Mensaje para el club (opcional)"
                  multiline
                  rows={3}
                  value={mensajeSolicitud}
                  onChange={(e) => setMensajeSolicitud(e.target.value)}
                  placeholder="Cuéntale al club tu experiencia y por qué quieres unirte..."
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.burgundy } }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarDialog} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
          {dialogClub && (() => {
            const estado = estadoSolicitudPara(dialogClub.id);
            return (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={procesandoId === dialogClub.id || (estado && estado !== 'rechazada')}
                onClick={() => handleSolicitar(dialogClub.id)}
                sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700 }}
              >
                {estado === 'rechazada' ? 'Solicitar de nuevo' : 'Solicitar unirme'}
              </Button>
            );
          })()}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuscarClubes;