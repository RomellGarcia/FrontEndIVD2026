import { entrenadorAPI } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarsIcon from '@mui/icons-material/Stars';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Paleta de colores institucionalS
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

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px #80002012',
};

const fieldFocusSx = {
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.burgundy },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.burgundy },
};

const ReadOnlyField = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 2, px: 1 }}>
    <Box sx={{ color: COLORS.burgundy, mt: 0.4, flexShrink: 0, fontSize: 22 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ color: COLORS.ink, fontWeight: 600, wordBreak: 'break-word', fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.4 }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

// Lista de chips editable (certificaciones / especialidades)
const ListaChipsEditable = ({ icon, titulo, valores, onAgregar, onQuitar, editando, nuevoValor, onCambiarNuevoValor, placeholder }) => (
  <Box>
    <Typography sx={{ color: COLORS.purple, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {icon} {titulo}
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: editando ? 1.5 : 0 }}>
      {valores.length === 0 && (
        <Typography variant="body2" sx={{ color: COLORS.ink, opacity: 0.55 }}>Sin {titulo.toLowerCase()} registradas.</Typography>
      )}
      {valores.map((v) => (
        <Chip
          key={v}
          label={v}
          onDelete={editando ? () => onQuitar(v) : undefined}
          sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 600 }}
        />
      ))}
    </Box>
    {editando && (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small" fullWidth placeholder={placeholder}
          value={nuevoValor}
          onChange={(e) => onCambiarNuevoValor(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAgregar(); } }}
          sx={fieldFocusSx}
        />
        <IconButton onClick={onAgregar} sx={{ color: COLORS.burgundy }}>
          <AddIcon />
        </IconButton>
      </Box>
    )}
  </Box>
);

const PerfilEntrenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [telefono, setTelefono] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [lugarEntrenamiento, setLugarEntrenamiento] = useState('');
  const [lugarEntrenamientoEditable, setLugarEntrenamientoEditable] = useState(true);
  const [certificaciones, setCertificaciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [nuevaCertificacion, setNuevaCertificacion] = useState('');
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('');

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    cargarPerfil();
  }, [user]);

  const cargarPerfil = async () => {
    try {
      if (!user?.id) return;
      setCargando(true);
      const response = await entrenadorAPI.getPerfil();
      const data = response.data.entrenador;
      if (data) {
        setPerfil(data);
        setTelefono(data.telefono || '');
        setAnosExperiencia(data.anos_experiencia ?? '');
        setLugarEntrenamiento(data.lugar_entrenamiento || '');
        setLugarEntrenamientoEditable(data.lugar_entrenamiento_editable !== false);
        setCertificaciones((data.certificaciones || []).map((c) => c.nombre));
        setEspecialidades((data.especialidades || []).map((e) => e.nombre));
        setMensajeError('');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setMensajeError('Error al cargar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  const manejarEditar = () => setModoEdicion(true);
  const manejarCancelarEdicion = () => {
    setModoEdicion(false);
    setNuevaCertificacion('');
    setNuevaEspecialidad('');
    cargarPerfil();
  };

  const handleAgregarCertificacion = () => {
    const valor = nuevaCertificacion.trim();
    if (!valor || certificaciones.includes(valor)) return;
    setCertificaciones((prev) => [...prev, valor]);
    setNuevaCertificacion('');
  };

  const handleAgregarEspecialidad = () => {
    const valor = nuevaEspecialidad.trim();
    if (!valor || especialidades.includes(valor)) return;
    setEspecialidades((prev) => [...prev, valor]);
    setNuevaEspecialidad('');
  };

  const manejarGuardar = async () => {
    try {
      setGuardando(true);
      await entrenadorAPI.updatePerfil({
        telefono,
        anos_experiencia: anosExperiencia === '' ? null : Number(anosExperiencia),
        ...(lugarEntrenamientoEditable && { lugar_entrenamiento: lugarEntrenamiento }),
        certificaciones,
        especialidades,
      });
      setModoEdicion(false);
      await cargarPerfil();
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tus datos se guardaron correctamente.',
        confirmButtonColor: COLORS.burgundy,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Error al actualizar el perfil.',
        confirmButtonColor: COLORS.burgundy,
      });
    } finally {
      setGuardando(false);
    }
  };

  const limpiarError = () => setMensajeError('');

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const nombreCompleto = perfil ? [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' ') : '';

  const obtenerIniciales = () => {
    if (!perfil) return '?';
    const n = perfil.nombre?.[0] || '';
    const a = perfil.apellido_paterno?.[0] || '';
    return (n + a).toUpperCase();
  };

  const clubNombre = perfil?.club_id ? (perfil.club_nombre || 'Club asignado') : 'Independiente';

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: COLORS.cream, width: '100%' }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  if (!perfil) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%' }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box sx={{ ...cardSx, textAlign: 'center', p: 4 }}>
            <PersonIcon sx={{ fontSize: 64, color: COLORS.purple, opacity: 0.4, mb: 2 }} />
            <Typography variant="h5" sx={{ color: COLORS.burgundy, mb: 1, fontWeight: 800 }}>
              No se pudieron cargar los datos
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, mb: 3 }}>
              ID de usuario: {user?.id || 'No disponible'}
            </Typography>
            <Button
              variant="contained"
              onClick={cargarPerfil}
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
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {mensajeError && (
          <Alert
            severity="error"
            onClose={limpiarError}
            sx={{ mb: 2, borderRadius: '8px' }}
          >
            {mensajeError}
          </Alert>
        )}

        <Box sx={{ ...cardSx, mb: 3, overflow: 'visible', position: 'relative' }}>
          <Box sx={{ bgcolor: COLORS.burgundy, height: { xs: 80, md: 100 }, borderRadius: '10px 10px 0 0' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: '-40px', md: '-48px' }, pb: 3 }}>
            <Avatar
              sx={{
                width: { xs: 80, md: 96 }, height: { xs: 80, md: 96 },
                bgcolor: COLORS.purple, fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800,
                border: '4px solid #fff', boxShadow: '0 4px 14px #00000026', mb: 1.5,
              }}
            >
              {obtenerIniciales()}
            </Avatar>

            <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, textAlign: 'center', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {nombreCompleto}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                icon={<GroupIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label={clubNombre}
                size="small"
                sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy, fontWeight: 700 }}
              />
              {perfil.anos_experiencia != null && (
                <Chip
                  icon={<WorkHistoryIcon sx={{ fontSize: 16, color: `${COLORS.purple} !important` }} />}
                  label={`${perfil.anos_experiencia} años de experiencia`}
                  size="small"
                  sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ ...cardSx, mb: 3, p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
              Información Personal
            </Typography>
            {!modoEdicion ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={manejarEditar}
                sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
              >
                Editar
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={manejarCancelarEdicion}
                  disabled={guardando}
                  sx={{ borderColor: COLORS.purple, color: COLORS.purple, fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={manejarGuardar}
                  disabled={guardando}
                  sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2, borderColor: COLORS.line }} />

          {modoEdicion ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Chip label="Campos editables" size="small" sx={{ alignSelf: 'flex-start', bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontSize: '0.75rem' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} fullWidth size="small" sx={fieldFocusSx} />
                <TextField label="Años de experiencia" type="number" value={anosExperiencia} onChange={(e) => setAnosExperiencia(e.target.value)} fullWidth size="small" inputProps={{ min: 0 }} sx={fieldFocusSx} />
              </Box>

              <Box>
                <TextField
                  label="Lugar de entrenamiento"
                  value={lugarEntrenamiento}
                  onChange={(e) => setLugarEntrenamiento(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={!lugarEntrenamientoEditable}
                  sx={fieldFocusSx}
                />
                {!lugarEntrenamientoEditable && (
                  <Typography variant="caption" sx={{ color: COLORS.purple, opacity: 0.8, display: 'block', mt: 0.5 }}>
                    Este campo lo define tu club — mientras pertenezcas a él, no se puede cambiar aquí.
                  </Typography>
                )}
              </Box>

              <ListaChipsEditable
                icon={<EmojiEventsIcon sx={{ fontSize: 15 }} />}
                titulo="Certificaciones"
                valores={certificaciones}
                onAgregar={handleAgregarCertificacion}
                onQuitar={(v) => setCertificaciones((prev) => prev.filter((x) => x !== v))}
                editando
                nuevoValor={nuevaCertificacion}
                onCambiarNuevoValor={setNuevaCertificacion}
                placeholder="Nueva certificación..."
              />

              <ListaChipsEditable
                icon={<StarsIcon sx={{ fontSize: 15 }} />}
                titulo="Especialidades"
                valores={especialidades}
                onAgregar={handleAgregarEspecialidad}
                onQuitar={(v) => setEspecialidades((prev) => prev.filter((x) => x !== v))}
                editando
                nuevoValor={nuevaEspecialidad}
                onCambiarNuevoValor={setNuevaEspecialidad}
                placeholder="Nueva especialidad..."
              />

              <Divider sx={{ my: 1, borderColor: COLORS.line }}>
                <Chip label="Datos no editables" size="small" sx={{ color: COLORS.ink, bgcolor: COLORS.cream, fontSize: '0.75rem' }} />
              </Divider>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Nombre completo" value={nombreCompleto} fullWidth disabled size="small" />
                <TextField label="CURP" value={perfil.curp || ''} fullWidth disabled size="small" />
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  value={perfil.fecha_nacimiento ? perfil.fecha_nacimiento.slice(0, 10) : ''}
                  fullWidth disabled size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField label="Género" value={perfil.genero || ''} fullWidth disabled size="small" />
                <TextField label="Correo Electrónico" value={perfil.email || ''} fullWidth disabled size="small" sx={{ gridColumn: { sm: '1 / -1' } }} />
              </Box>
              <Typography variant="caption" sx={{ color: COLORS.purple, opacity: 0.8 }}>
                Estos datos vienen de tu cuenta de usuario. Si necesitas corregir alguno, contacta al administrador.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Nombre completo" value={nombreCompleto} />
                <ReadOnlyField icon={<BadgeIcon fontSize="small" />} label="CURP" value={perfil.curp} />
                <ReadOnlyField icon={<CalendarTodayIcon fontSize="small" />} label="Fecha de nacimiento" value={formatearFecha(perfil.fecha_nacimiento)} />
                <ReadOnlyField icon={<PersonIcon fontSize="small" />} label="Género" value={perfil.genero} />
                <ReadOnlyField icon={<PhoneIcon fontSize="small" />} label="Teléfono" value={telefono} />
                <ReadOnlyField icon={<EmailIcon fontSize="small" />} label="Correo electrónico" value={perfil.email} />
                <ReadOnlyField icon={<WorkHistoryIcon fontSize="small" />} label="Años de experiencia" value={anosExperiencia !== '' ? `${anosExperiencia} años` : null} />
                <ReadOnlyField icon={<LocationOnIcon fontSize="small" />} label="Lugar de entrenamiento" value={lugarEntrenamiento} />
              </Box>

              <Divider sx={{ my: 2, borderColor: COLORS.line }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ListaChipsEditable
                  icon={<EmojiEventsIcon sx={{ fontSize: 15 }} />}
                  titulo="Certificaciones"
                  valores={certificaciones}
                  editando={false}
                />
                <ListaChipsEditable
                  icon={<StarsIcon sx={{ fontSize: 15 }} />}
                  titulo="Especialidades"
                  valores={especialidades}
                  editando={false}
                />
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
            Mi Club
          </Typography>
          <Divider sx={{ mb: 2.5, borderColor: COLORS.line }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: perfil.club_id ? COLORS.burgundy : COLORS.lineSoft, color: perfil.club_id ? '#fff' : COLORS.purple, width: 44, height: 44 }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography sx={{ color: COLORS.purple, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {perfil.club_id ? 'Club actual' : 'Estado'}
                </Typography>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>
                  {clubNombre}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              onClick={() => navigate('/entrenador/buscar-clubes')}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
            >
              {perfil.club_id ? 'Ver clubes' : 'Buscar club'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PerfilEntrenador;