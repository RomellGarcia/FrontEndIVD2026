import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Alert,
  Chip,
  Avatar,
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
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PersonRemove as PersonRemoveIcon,
  Warning as WarningIcon,
  FitnessCenter as FitnessCenterIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { atletasAPI, clubesAPI, entrenadoresAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

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
      height: '100%',
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

// Muestra un campo con etiqueta y valor
const DatoCampo = ({ label, valor }) => (
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
);

// Tarjeta de solicitud de atleta o entrenador
const ExpedienteSolicitud = ({ folio, nombre, campos, fecha, onAceptar, onRechazar }) => (
  <Box
    sx={{
      border: `1px solid ${COLORS.line}`,
      borderLeft: `4px solid ${COLORS.burgundy}`,
      borderRadius: '8px',
      overflow: 'hidden',
      mb: 1.5,
      '&:last-of-type': { mb: 0 },
    }}
  >
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
        label="Pendiente"
        size="small"
        sx={{
          bgcolor: 'transparent',
          border: `1px solid ${COLORS.purple}`,
          color: COLORS.purple,
          fontWeight: 700,
          fontSize: '0.68rem',
          height: 22,
        }}
      />
    </Box>
    <Box sx={{ p: 2 }}>
      <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.25 }}>{nombre}</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          columnGap: 2,
          rowGap: 1,
          mb: 1.5,
        }}
      >
        {campos.map((c) => (
          <DatoCampo key={c.label} label={c.label} valor={c.valor} />
        ))}
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple, mb: 1.5 }}>
        Solicitado el {fecha}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<CheckIcon fontSize="small" />}
          onClick={onAceptar}
          sx={{
            bgcolor: COLORS.burgundy,
            '&:hover': { bgcolor: COLORS.burgundyDark },
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
          }}
        >
          Aceptar
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloseIcon fontSize="small" />}
          onClick={onRechazar}
          sx={{
            borderColor: COLORS.purple,
            color: COLORS.purple,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' },
          }}
        >
          Rechazar
        </Button>
      </Box>
    </Box>
  </Box>
);

const estilosCabeceraTabla = {
  fontWeight: 700,
  color: COLORS.cream,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// Tarjeta de perfil de atleta disponible
const AtletaPerfilCard = ({ atleta, invitacionPendiente, onInvitar, onVerPerfil }) => (
  <Box
    sx={{
      border: `1px solid ${COLORS.line}`,
      borderTop: `3px solid ${COLORS.purple}`,
      borderRadius: '8px',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
        {atleta.nombreCompleto.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem', lineHeight: 1.2 }} noWrap>
          {atleta.nombreCompleto}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple }}>
          {atleta.sexo} · {atleta.edad !== null ? `${atleta.edad} años` : 'Edad N/A'}
        </Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 1.5, rowGap: 0.75 }}>
      <DatoCampo label="Municipio" valor={atleta.municipio} />
      <DatoCampo label="Teléfono" valor={atleta.telefono} />
    </Box>

    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<VisibilityIcon fontSize="small" />}
        onClick={onVerPerfil}
        sx={{
          borderColor: COLORS.purple,
          color: COLORS.purple,
          textTransform: 'none',
          fontWeight: 700,
          flex: 1,
          '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' },
        }}
      >
        Ver perfil
      </Button>
      {invitacionPendiente ? (
        <Chip
          label="Invitación enviada"
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: `1px solid ${COLORS.purple}`,
            color: COLORS.purple,
            fontWeight: 700,
            fontSize: '0.68rem',
          }}
        />
      ) : (
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon fontSize="small" />}
          onClick={onInvitar}
          sx={{
            bgcolor: COLORS.burgundy,
            '&:hover': { bgcolor: COLORS.burgundyDark },
            textTransform: 'none',
            fontWeight: 700,
            flex: 1,
            boxShadow: 'none',
          }}
        >
          Invitar
        </Button>
      )}
    </Box>
  </Box>
);

// Tarjeta de perfil de entrenador disponible
const EntrenadorPerfilCard = ({ entrenador, invitacionPendiente, onInvitar, onVerPerfil }) => (
  <Box
    sx={{
      border: `1px solid ${COLORS.line}`,
      borderTop: `3px solid ${COLORS.purple}`,
      borderRadius: '8px',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
        {entrenador.nombreCompleto.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink, fontSize: '0.9rem', lineHeight: 1.2 }} noWrap>
          {entrenador.nombreCompleto}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: COLORS.purple }}>
          {entrenador.añosExperiencia !== null && entrenador.añosExperiencia !== 'N/A'
            ? `${entrenador.añosExperiencia} años de experiencia`
            : 'Experiencia N/A'}
        </Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 1.5, rowGap: 0.75 }}>
      <DatoCampo label="Teléfono" valor={entrenador.telefono} />
      <DatoCampo label="Correo" valor={entrenador.gmail} />
    </Box>

    {Array.isArray(entrenador.especialidades) && entrenador.especialidades.length > 0 && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {entrenador.especialidades.map((esp, idx) => (
          <Chip
            key={idx}
            label={esp.nombre || esp}
            size="small"
            sx={{
              fontSize: '0.68rem',
              bgcolor: 'transparent',
              border: `1px solid ${COLORS.purple}`,
              color: COLORS.purple,
            }}
          />
        ))}
      </Box>
    )}

    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<VisibilityIcon fontSize="small" />}
        onClick={onVerPerfil}
        sx={{
          borderColor: COLORS.purple,
          color: COLORS.purple,
          textTransform: 'none',
          fontWeight: 700,
          flex: 1,
          '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' },
        }}
      >
        Ver perfil
      </Button>
      {invitacionPendiente ? (
        <Chip
          label="Invitación enviada"
          size="small"
          sx={{
            bgcolor: 'transparent',
            border: `1px solid ${COLORS.purple}`,
            color: COLORS.purple,
            fontWeight: 700,
            fontSize: '0.68rem',
          }}
        />
      ) : (
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon fontSize="small" />}
          onClick={onInvitar}
          sx={{
            bgcolor: COLORS.burgundy,
            '&:hover': { bgcolor: COLORS.burgundyDark },
            textTransform: 'none',
            fontWeight: 700,
            flex: 1,
            boxShadow: 'none',
          }}
        >
          Invitar
        </Button>
      )}
    </Box>
  </Box>
);

const GestionAtletas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [cargandoEntrenadores, setCargandoEntrenadores] = useState(false);
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false);
  const [cargandoDisponiblesEntrenadores, setCargandoDisponiblesEntrenadores] = useState(false);
  const [error, setError] = useState('');
  const [atletas, setAtletas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [solicitudesEntrenadores, setSolicitudesEntrenadores] = useState([]);
  const [atletasDisponibles, setAtletasDisponibles] = useState([]);
  const [invitacionesEnviadas, setInvitacionesEnviadas] = useState([]);
  const [entrenadoresDisponibles, setEntrenadoresDisponibles] = useState([]);
  const [invitacionesEnviadasEntrenador, setInvitacionesEnviadasEntrenador] = useState([]);
  const [invitando, setInvitando] = useState(null);
  const [invitandoEntrenador, setInvitandoEntrenador] = useState(null);
  const [perfilDialogAbierto, setPerfilDialogAbierto] = useState(false);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [perfilEntrenadorDialogAbierto, setPerfilEntrenadorDialogAbierto] = useState(false);
  const [perfilEntrenadorSeleccionado, setPerfilEntrenadorSeleccionado] = useState(null);
  const [cargandoPerfilEntrenador, setCargandoPerfilEntrenador] = useState(false);
  const [modalExpulsionAbierto, setModalExpulsionAbierto] = useState(false);
  const [atletaParaExpulsar, setAtletaParaExpulsar] = useState(null);
  const [modalExpulsionEntrenadorAbierto, setModalExpulsionEntrenadorAbierto] = useState(false);
  const [entrenadorParaExpulsar, setEntrenadorParaExpulsar] = useState(null);
  const [pestaniaActiva, setPestaniaActiva] = useState(0);
  const [idClub, setIdClub] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    obtenerClubYCargar();
  }, [user, navigate]);

  // Obtiene el club del usuario y carga todos los datos
  const obtenerClubYCargar = async () => {
    try {
      const response = await clubesAPI.getAll();
      let clubes = response.data.clubes || response.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find((c) => c.email === user.email);
      if (!club) {
        setError('No se encontró un club asociado a este usuario.');
        setCargando(false);
        return;
      }
      const idClubObtenido = club.id || club._id;
      setIdClub(idClubObtenido);
      await Promise.all([
        cargarAtletas(idClubObtenido),
        cargarSolicitudes(idClubObtenido),
        cargarEntrenadores(idClubObtenido),
        cargarSolicitudesEntrenadores(idClubObtenido),
        cargarInvitacionesEnviadas(idClubObtenido),
        cargarAtletasDisponibles(),
        cargarEntrenadoresDisponibles(),
        cargarInvitacionesEnviadasEntrenador(idClubObtenido),
      ]);
      setCargando(false);
    } catch (error) {
      console.error('Error al obtener clubId:', error);
      setError('Error al cargar los datos del club.');
      setCargando(false);
    }
  };

  // Normaliza los datos de un atleta
  const normalizarAtleta = (a) => ({
    id: a.id,
    nombreCompleto: [a.nombre, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre',
    curp: a.curp || 'N/A',
    telefono: a.telefono || 'N/A',
    gmail: a.email || 'N/A',
    sexo: a.genero || 'N/A',
    edad: a.edad ?? null,
    municipio: a.municipio || 'N/A',
    fechaNacimiento: a.fecha_nacimiento || null,
    estadoNacimiento: a.estado_nacimiento || 'N/A',
    lugarEntrenamiento: a.lugar_entrenamiento || 'N/A',
    fechaIngresoClub: a.fecha_ingreso_club || null,
  });

  // Carga los atletas del club
  const cargarAtletas = async (idClub) => {
    try {
      const response = await atletasAPI.getAll({ club_id: idClub });
      let data = response.data.atletas || response.data || [];
      if (!Array.isArray(data)) data = [];
      setAtletas(data.map(normalizarAtleta));
      setError('');
    } catch (error) {
      console.error('Error al obtener atletas:', error);
      setAtletas([]);
      if (!error.response || error.response.status !== 401) {
        setError('Error al cargar los atletas.');
      }
    }
  };

  // Carga los atletas sin club
  const cargarAtletasDisponibles = async () => {
    try {
      setCargandoDisponibles(true);
      const response = await atletasAPI.getAll({ sin_club: true });
      let data = response.data.atletas || response.data || [];
      if (!Array.isArray(data)) data = [];
      setAtletasDisponibles(data.map(normalizarAtleta));
    } catch (error) {
      console.error('Error al obtener atletas disponibles:', error);
      setAtletasDisponibles([]);
    } finally {
      setCargandoDisponibles(false);
    }
  };

  // Carga las solicitudes de atletas para el club
  const cargarSolicitudes = async (idClub) => {
    try {
      setCargandoSolicitudes(true);
      const response = await atletasAPI.getSolicitudes({ club_id: idClub, tipo: 'asociar' });
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientes = data.filter((s) => s.estado === 'pendiente').map((s) => ({
        id: s.id,
        atletaId: s.atleta_id ?? null,
        nombreCompleto: [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ') || 'Atleta sin nombre',
        edad: s.edad ?? null,
        genero: s.genero || null,
        telefono: s.telefono || null,
        email: s.email || null,
        tipo: s.tipo || null,
        fechaSolicitud: s.fecha_solicitud || null,
      }));
      setSolicitudes(pendientes);
    } catch (error) {
      console.error('Error al cargar solicitudes de atletas:', error);
      setSolicitudes([]);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  // Carga las invitaciones enviadas a atletas (pendientes)
  const cargarInvitacionesEnviadas = async (idClub) => {
    try {
      const response = await atletasAPI.getSolicitudes({ club_id: idClub, tipo: 'invitacion' });
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientesIds = data.filter((s) => s.estado === 'pendiente').map((s) => s.atleta_id);
      setInvitacionesEnviadas(pendientesIds);
    } catch (error) {
      console.error('Error al cargar invitaciones enviadas:', error);
      setInvitacionesEnviadas([]);
    }
  };

  // Acepta una solicitud de atleta
  const manejarAceptarSolicitud = async (solicitudId) => {
    try {
      await atletasAPI.procesarSolicitud(solicitudId, { estado: 'aceptada' });
      setError('');
      await cargarSolicitudes(idClub);
      await cargarAtletas(idClub);
      await cargarAtletasDisponibles();
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      setError('Error al procesar la solicitud. Intente de nuevo.');
    }
  };

  // Rechaza una solicitud de atleta
  const manejarRechazarSolicitud = async (solicitudId) => {
    try {
      await atletasAPI.procesarSolicitud(solicitudId, { estado: 'rechazada' });
      setError('');
      await cargarSolicitudes(idClub);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      setError('Error al procesar la solicitud. Intente de nuevo.');
    }
  };

  // Invita a un atleta al club
  const manejarInvitarAtleta = async (atletaId) => {
    try {
      setInvitando(atletaId);
      await atletasAPI.invitarClub(atletaId, { club_id: idClub });
      setError('');
      await cargarInvitacionesEnviadas(idClub);
    } catch (error) {
      console.error('Error al invitar atleta:', error);
      setError(error.response?.data?.error || 'Error al enviar la invitación. Intente de nuevo.');
    } finally {
      setInvitando(null);
    }
  };

  // Abre el diálogo de perfil de atleta
  const manejarVerPerfil = async (atletaId) => {
    setPerfilDialogAbierto(true);
    setPerfilSeleccionado(null);
    setCargandoPerfil(true);
    try {
      const response = await atletasAPI.getById(atletaId);
      const data = response.data.atleta || response.data;
      setPerfilSeleccionado(normalizarAtleta(data));
    } catch (error) {
      console.error('Error al obtener el perfil del atleta:', error);
      setPerfilSeleccionado(null);
    } finally {
      setCargandoPerfil(false);
    }
  };

  const cerrarPerfilDialog = () => {
    setPerfilDialogAbierto(false);
    setPerfilSeleccionado(null);
  };

  // Expulsa un atleta del club
  const manejarExpulsarAtleta = (atleta) => {
    setAtletaParaExpulsar(atleta);
    setModalExpulsionAbierto(true);
  };

  const confirmarExpulsion = async () => {
    try {
      await atletasAPI.updateClub(atletaParaExpulsar.id, { club_id: null });
      setError('');
      setModalExpulsionAbierto(false);
      setAtletaParaExpulsar(null);
      await cargarAtletas(idClub);
      await cargarAtletasDisponibles();
    } catch (error) {
      console.error('Error al expulsar atleta:', error);
      setError('Error al expulsar al atleta. Intente de nuevo.');
    }
  };

  const cancelarExpulsion = () => {
    setModalExpulsionAbierto(false);
    setAtletaParaExpulsar(null);
  };

  // Carga los entrenadores del club
  const cargarEntrenadores = async (idClub) => {
    try {
      setCargandoEntrenadores(true);
      const response = await entrenadoresAPI.getByClub(idClub);
      let data = response.data.entrenadores || response.data || [];
      if (!Array.isArray(data)) data = [];
      const entrenadoresNorm = data.map((e) => ({
        id: e.id,
        nombreCompleto: [e.nombre, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre',
        gmail: e.email || 'N/A',
        telefono: e.telefono || 'N/A',
        especialidades: e.especialidades || [],
        añosExperiencia: e.anos_experiencia ?? 'N/A',
      }));
      setEntrenadores(entrenadoresNorm);
    } catch (error) {
      console.error('Error al obtener entrenadores:', error);
      setEntrenadores([]);
    } finally {
      setCargandoEntrenadores(false);
    }
  };

  // Carga las solicitudes de entrenadores
  const cargarSolicitudesEntrenadores = async (idClub) => {
    try {
      const response = await entrenadoresAPI.getSolicitudesByClub(idClub);
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientes = data.filter((s) => s.estado === 'pendiente').map((s) => ({
        id: s.id,
        nombreCompleto: [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ') || 'Entrenador sin nombre',
        email: s.email || null,
        telefono: s.telefono || null,
        añosExperiencia: s.anos_experiencia ?? null,
        mensaje: s.mensaje || null,
        fechaSolicitud: s.fecha_solicitud || null,
      }));
      setSolicitudesEntrenadores(pendientes);
    } catch (error) {
      console.error('Error al cargar solicitudes de entrenadores:', error);
      setSolicitudesEntrenadores([]);
    }
  };

  // Acepta una solicitud de entrenador
  const manejarAceptarSolicitudEntrenador = async (solicitudId) => {
    try {
      await entrenadoresAPI.updateSolicitud(solicitudId, { estado: 'aceptada' });
      setError('');
      await cargarSolicitudesEntrenadores(idClub);
      await cargarEntrenadores(idClub);
    } catch (error) {
      console.error('Error al aceptar solicitud de entrenador:', error);
      setError('Error al procesar la solicitud del entrenador.');
    }
  };

  // Rechaza una solicitud de entrenador
  const manejarRechazarSolicitudEntrenador = async (solicitudId) => {
    try {
      await entrenadoresAPI.updateSolicitud(solicitudId, { estado: 'rechazada' });
      setError('');
      await cargarSolicitudesEntrenadores(idClub);
    } catch (error) {
      console.error('Error al rechazar solicitud de entrenador:', error);
      setError('Error al procesar la solicitud del entrenador.');
    }
  };

  // Expulsa un entrenador del club
  const manejarExpulsarEntrenador = (entrenador) => {
    setEntrenadorParaExpulsar(entrenador);
    setModalExpulsionEntrenadorAbierto(true);
  };

  const confirmarExpulsionEntrenador = async () => {
    try {
      await entrenadoresAPI.updateClub(entrenadorParaExpulsar.id, { club_id: null });
      setError('');
      setModalExpulsionEntrenadorAbierto(false);
      setEntrenadorParaExpulsar(null);
      await cargarEntrenadores(idClub);
    } catch (error) {
      console.error('Error al expulsar entrenador:', error);
      setError('Error al expulsar al entrenador. Intente de nuevo.');
    }
  };

  const cancelarExpulsionEntrenador = () => {
    setModalExpulsionEntrenadorAbierto(false);
    setEntrenadorParaExpulsar(null);
  };

  // Carga los entrenadores sin club
  const cargarEntrenadoresDisponibles = async () => {
    try {
      setCargandoDisponiblesEntrenadores(true);
      const response = await entrenadoresAPI.getAll({ sin_club: true });
      let data = response.data.entrenadores || response.data || [];
      if (!Array.isArray(data)) data = [];
      setEntrenadoresDisponibles(data.map((e) => ({
        id: e.id,
        nombreCompleto: [e.nombre, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre',
        gmail: e.email || 'N/A',
        telefono: e.telefono || 'N/A',
        especialidades: e.especialidades || [],
        certificaciones: e.certificaciones || [],
        añosExperiencia: e.anos_experiencia ?? 'N/A',
        curp: e.curp || 'N/A',
        fechaNacimiento: e.fecha_nacimiento || null,
        estadoNacimiento: e.estado_nacimiento || 'N/A',
        sexo: e.genero || 'N/A',
      })));
    } catch (error) {
      console.error('Error al obtener entrenadores disponibles:', error);
      setEntrenadoresDisponibles([]);
    } finally {
      setCargandoDisponiblesEntrenadores(false);
    }
  };

  // Carga las invitaciones enviadas a entrenadores
  const cargarInvitacionesEnviadasEntrenador = async (idClub) => {
    try {
      const response = await entrenadoresAPI.getSolicitudesByClub(idClub, { tipo: 'invitacion' });
      let data = response.data.solicitudes || response.data || [];
      if (!Array.isArray(data)) data = [];
      const pendientesIds = data.filter((s) => s.estado === 'pendiente').map((s) => s.entrenador_id);
      setInvitacionesEnviadasEntrenador(pendientesIds);
    } catch (error) {
      console.error('Error al cargar invitaciones enviadas a entrenadores:', error);
      setInvitacionesEnviadasEntrenador([]);
    }
  };

  // Invita a un entrenador al club
  const manejarInvitarEntrenador = async (entrenadorId) => {
    try {
      setInvitandoEntrenador(entrenadorId);
      await entrenadoresAPI.invitarClub(entrenadorId, { club_id: idClub });
      setError('');
      await cargarInvitacionesEnviadasEntrenador(idClub);
    } catch (error) {
      console.error('Error al invitar entrenador:', error);
      setError(error.response?.data?.error || 'Error al enviar la invitación. Intente de nuevo.');
    } finally {
      setInvitandoEntrenador(null);
    }
  };

  // Abre el diálogo de perfil de entrenador
  const manejarVerPerfilEntrenador = async (entrenadorId) => {
    setPerfilEntrenadorDialogAbierto(true);
    setPerfilEntrenadorSeleccionado(null);
    setCargandoPerfilEntrenador(true);
    try {
      const response = await entrenadoresAPI.getById(entrenadorId);
      const data = response.data.entrenador || response.data;
      setPerfilEntrenadorSeleccionado({
        id: data.id,
        nombreCompleto: [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ') || 'Sin nombre',
        gmail: data.email || 'N/A',
        telefono: data.telefono || 'N/A',
        especialidades: data.especialidades || [],
        certificaciones: data.certificaciones || [],
        añosExperiencia: data.anos_experiencia ?? 'N/A',
        curp: data.curp || 'N/A',
        fechaNacimiento: data.fecha_nacimiento || null,
        estadoNacimiento: data.estado_nacimiento || 'N/A',
        sexo: data.genero || 'N/A',
      });
    } catch (error) {
      console.error('Error al obtener el perfil del entrenador:', error);
      setPerfilEntrenadorSeleccionado(null);
    } finally {
      setCargandoPerfilEntrenador(false);
    }
  };

  const cerrarPerfilEntrenadorDialog = () => {
    setPerfilEntrenadorDialogAbierto(false);
    setPerfilEntrenadorSeleccionado(null);
  };

  const manejarCambioPestania = (event, newValue) => {
    setPestaniaActiva(newValue);
  };

  // Genera un folio a partir de un ID
  const folioDe = (id) => String(id ?? '').replace(/\D/g, '').slice(-6).padStart(6, '0') || '000000';

  // Calcula edad a partir de fecha de nacimiento
  const calcularEdad = (fecha) => {
    if (!fecha) return 'N/A';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  // Formatea fecha en formato largo
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
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Gestión del Club
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: `2px solid ${COLORS.line}`, mb: 4 }}>
          <Tabs
            value={pestaniaActiva}
            onChange={manejarCambioPestania}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                color: COLORS.purple,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                minWidth: 120,
              },
              '& .Mui-selected': { color: `${COLORS.burgundy} !important` },
              '& .MuiTabs-indicator': { backgroundColor: COLORS.burgundy, height: 3 },
            }}
          >
            <Tab label="Atletas" icon={<PeopleIcon />} iconPosition="start" />
            <Tab label="Entrenadores" icon={<FitnessCenterIcon />} iconPosition="start" />
            <Tab label="Atletas Disponibles" icon={<SearchIcon />} iconPosition="start" />
            <Tab label="Entrenadores Disponibles" icon={<SearchIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Pestaña Atletas */}
        {pestaniaActiva === 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 7fr)' }, gap: { xs: 2, md: 3 }, alignItems: 'start' }}>
            <Box sx={{ minWidth: 0 }}>
              <SectionCard
                icon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                eyebrow="Bandeja de entrada"
                title="Solicitudes de Atletas"
                action={
                  solicitudes.length > 0 && (
                    <Chip
                      label={solicitudes.length}
                      size="small"
                      sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                    />
                  )
                }
              >
                {cargandoSolicitudes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
                  </Box>
                ) : solicitudes.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                    No hay solicitudes pendientes en este momento.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: 2,
                    }}
                  >
                    {solicitudes.map((s) => (
                      <ExpedienteSolicitud
                        key={s.id}
                        folio={folioDe(s.id)}
                        nombre={s.nombreCompleto}
                        fecha={formatearFecha(s.fechaSolicitud)}
                        campos={[
                          { label: 'Edad', valor: s.edad ? `${s.edad} años` : 'N/A' },
                          { label: 'Género', valor: s.genero },
                          { label: 'Teléfono', valor: s.telefono },
                          { label: 'Correo', valor: s.email },
                        ]}
                        onAceptar={() => manejarAceptarSolicitud(s.id)}
                        onRechazar={() => manejarRechazarSolicitud(s.id)}
                      />
                    ))}
                  </Box>
                )}
              </SectionCard>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <SectionCard
                icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                eyebrow="Plantilla registrada"
                title="Atletas del Club"
                action={
                  atletas.length > 0 && (
                    <Chip
                      label={`${atletas.length} atletas`}
                      size="small"
                      sx={{ bgcolor: COLORS.purple, color: '#fff', fontWeight: 700 }}
                    />
                  )
                }
              >
                {atletas.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                    Aún no hay atletas registrados en este club.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                          <TableCell sx={estilosCabeceraTabla}>Nombre</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>CURP</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Teléfono</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Correo</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Género</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Edad</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Fecha Ingreso</TableCell>
                          <TableCell sx={estilosCabeceraTabla} align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {atletas.map((a) => (
                          <TableRow
                            key={a.id}
                            hover
                            sx={{ '&:hover': { bgcolor: COLORS.lineSoft }, borderBottom: `1px solid ${COLORS.line}` }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 26, height: 26, bgcolor: COLORS.burgundy, fontSize: '0.72rem' }}>
                                  {a.nombreCompleto.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.ink }}>
                                  {a.nombreCompleto}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{a.curp}</TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{a.telefono}</TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{a.gmail}</TableCell>
                            <TableCell>
                              <Chip
                                label={a.sexo}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  bgcolor: 'transparent',
                                  border: `1px solid ${COLORS.purple}`,
                                  color: COLORS.purple,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{calcularEdad(a.fechaNacimiento)} años</TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{formatearFecha(a.fechaIngresoClub)}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" onClick={() => manejarExpulsarAtleta(a)} title="Expulsar" size="small">
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
            </Box>
          </Box>
        )}

        {/* Pestaña Entrenadores */}
        {pestaniaActiva === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 7fr)' }, gap: { xs: 2, md: 3 }, alignItems: 'start' }}>
            <Box sx={{ minWidth: 0 }}>
              <SectionCard
                icon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                eyebrow="Bandeja de entrada"
                title="Solicitudes de Entrenadores"
                action={
                  solicitudesEntrenadores.length > 0 && (
                    <Chip
                      label={solicitudesEntrenadores.length}
                      size="small"
                      sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }}
                    />
                  )
                }
              >
                {cargandoEntrenadores ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
                  </Box>
                ) : solicitudesEntrenadores.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                    No hay solicitudes de entrenadores pendientes.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: 2,
                    }}
                  >
                    {solicitudesEntrenadores.map((s) => (
                      <ExpedienteSolicitud
                        key={s.id}
                        folio={folioDe(s.id)}
                        nombre={s.nombreCompleto}
                        fecha={formatearFecha(s.fechaSolicitud)}
                        campos={[
                          { label: 'Correo', valor: s.email },
                          { label: 'Teléfono', valor: s.telefono },
                          { label: 'Años de experiencia', valor: s.añosExperiencia != null ? s.añosExperiencia : 'N/A' },
                          { label: 'Mensaje', valor: s.mensaje || 'Sin mensaje' },
                        ]}
                        onAceptar={() => manejarAceptarSolicitudEntrenador(s.id)}
                        onRechazar={() => manejarRechazarSolicitudEntrenador(s.id)}
                      />
                    ))}
                  </Box>
                )}
              </SectionCard>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <SectionCard
                icon={<FitnessCenterIcon sx={{ fontSize: 16 }} />}
                eyebrow="Plantilla registrada"
                title="Entrenadores del Club"
                action={
                  entrenadores.length > 0 && (
                    <Chip
                      label={`${entrenadores.length} entrenadores`}
                      size="small"
                      sx={{ bgcolor: COLORS.purple, color: '#fff', fontWeight: 700 }}
                    />
                  )
                }
              >
                {entrenadores.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                    Aún no hay entrenadores registrados.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                          <TableCell sx={estilosCabeceraTabla}>Nombre</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Email</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Teléfono</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Especialidades</TableCell>
                          <TableCell sx={estilosCabeceraTabla}>Años Exp.</TableCell>
                          <TableCell sx={estilosCabeceraTabla} align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entrenadores.map((e) => (
                          <TableRow
                            key={e.id}
                            hover
                            sx={{ '&:hover': { bgcolor: COLORS.lineSoft }, borderBottom: `1px solid ${COLORS.line}` }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 26, height: 26, bgcolor: COLORS.burgundy, fontSize: '0.72rem' }}>
                                  {e.nombreCompleto.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.ink }}>
                                  {e.nombreCompleto}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{e.gmail}</TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{e.telefono}</TableCell>
                            <TableCell>
                              {Array.isArray(e.especialidades) && e.especialidades.length > 0 ? (
                                e.especialidades.map((esp, idx) => (
                                  <Chip
                                    key={idx}
                                    label={esp.nombre || esp}
                                    size="small"
                                    sx={{
                                      mr: 0.5,
                                      mb: 0.5,
                                      fontSize: '0.7rem',
                                      bgcolor: 'transparent',
                                      border: `1px solid ${COLORS.purple}`,
                                      color: COLORS.purple,
                                    }}
                                  />
                                ))
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell sx={{ color: COLORS.ink }}>{e.añosExperiencia}</TableCell>
                            <TableCell align="center">
                              <IconButton color="error" onClick={() => manejarExpulsarEntrenador(e)} title="Expulsar" size="small">
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
            </Box>
          </Box>
        )}

        {/* Pestaña Atletas Disponibles */}
        {pestaniaActiva === 2 && (
          <Box>
            <SectionCard
              icon={<SearchIcon sx={{ fontSize: 16 }} />}
              eyebrow="Atletas sin club"
              title="Atletas Disponibles"
              action={
                atletasDisponibles.length > 0 && (
                  <Chip
                    label={`${atletasDisponibles.length} disponibles`}
                    size="small"
                    sx={{ bgcolor: COLORS.purple, color: '#fff', fontWeight: 700 }}
                  />
                )
              }
            >
              {cargandoDisponibles ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
                </Box>
              ) : atletasDisponibles.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                  No hay atletas independientes disponibles en este momento.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 2,
                  }}
                >
                  {atletasDisponibles.map((a) => (
                    <AtletaPerfilCard
                      key={a.id}
                      atleta={a}
                      invitacionPendiente={invitacionesEnviadas.includes(a.id) || invitando === a.id}
                      onInvitar={() => manejarInvitarAtleta(a.id)}
                      onVerPerfil={() => manejarVerPerfil(a.id)}
                    />
                  ))}
                </Box>
              )}
            </SectionCard>
          </Box>
        )}

        {/* Pestaña Entrenadores Disponibles */}
        {pestaniaActiva === 3 && (
          <Box>
            <SectionCard
              icon={<SearchIcon sx={{ fontSize: 16 }} />}
              eyebrow="Entrenadores sin club"
              title="Entrenadores Disponibles"
              action={
                entrenadoresDisponibles.length > 0 && (
                  <Chip
                    label={`${entrenadoresDisponibles.length} disponibles`}
                    size="small"
                    sx={{ bgcolor: COLORS.purple, color: '#fff', fontWeight: 700 }}
                  />
                )
              }
            >
              {cargandoDisponiblesEntrenadores ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
                </Box>
              ) : entrenadoresDisponibles.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 4 }}>
                  No hay entrenadores independientes disponibles en este momento.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 2,
                  }}
                >
                  {entrenadoresDisponibles.map((e) => (
                    <EntrenadorPerfilCard
                      key={e.id}
                      entrenador={e}
                      invitacionPendiente={invitacionesEnviadasEntrenador.includes(e.id) || invitandoEntrenador === e.id}
                      onInvitar={() => manejarInvitarEntrenador(e.id)}
                      onVerPerfil={() => manejarVerPerfilEntrenador(e.id)}
                    />
                  ))}
                </Box>
              )}
            </SectionCard>
          </Box>
        )}
      </Container>

      {/* Diálogo de perfil de atleta */}
      <Dialog open={perfilDialogAbierto} onClose={cerrarPerfilDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Perfil del Atleta</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {cargandoPerfil ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
            </Box>
          ) : !perfilSeleccionado ? (
            <Typography variant="body2" color="textSecondary">
              No se pudo cargar el perfil del atleta.
            </Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
                  {perfilSeleccionado.nombreCompleto.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ color: COLORS.ink, fontWeight: 700 }}>
                  {perfilSeleccionado.nombreCompleto}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 1.5 }}>
                <DatoCampo label="CURP" valor={perfilSeleccionado.curp} />
                <DatoCampo label="Género" valor={perfilSeleccionado.sexo} />
                <DatoCampo label="Edad" valor={perfilSeleccionado.edad !== null ? `${perfilSeleccionado.edad} años` : 'N/A'} />
                <DatoCampo label="Fecha de nacimiento" valor={formatearFecha(perfilSeleccionado.fechaNacimiento)} />
                <DatoCampo label="Estado de nacimiento" valor={perfilSeleccionado.estadoNacimiento} />
                <DatoCampo label="Municipio" valor={perfilSeleccionado.municipio} />
                <DatoCampo label="Teléfono" valor={perfilSeleccionado.telefono} />
                <DatoCampo label="Correo" valor={perfilSeleccionado.gmail} />
                <DatoCampo label="Lugar de entrenamiento" valor={perfilSeleccionado.lugarEntrenamiento} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarPerfilDialog} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
          {perfilSeleccionado && (
            <Button
              variant="contained"
              startIcon={<SendIcon fontSize="small" />}
              disabled={invitacionesEnviadas.includes(perfilSeleccionado.id) || invitando === perfilSeleccionado.id}
              onClick={() => manejarInvitarAtleta(perfilSeleccionado.id)}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              {invitacionesEnviadas.includes(perfilSeleccionado.id) ? 'Invitación enviada' : 'Invitar al club'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de perfil de entrenador */}
      <Dialog open={perfilEntrenadorDialogAbierto} onClose={cerrarPerfilEntrenadorDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Perfil del Entrenador</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {cargandoPerfilEntrenador ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} sx={{ color: COLORS.burgundy }} />
            </Box>
          ) : !perfilEntrenadorSeleccionado ? (
            <Typography variant="body2" color="textSecondary">
              No se pudo cargar el perfil del entrenador.
            </Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: COLORS.burgundy, fontWeight: 700 }}>
                  {perfilEntrenadorSeleccionado.nombreCompleto.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ color: COLORS.ink, fontWeight: 700 }}>
                  {perfilEntrenadorSeleccionado.nombreCompleto}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 1.5, mb: 2 }}>
                <DatoCampo label="CURP" valor={perfilEntrenadorSeleccionado.curp} />
                <DatoCampo label="Género" valor={perfilEntrenadorSeleccionado.sexo} />
                <DatoCampo label="Fecha de nacimiento" valor={formatearFecha(perfilEntrenadorSeleccionado.fechaNacimiento)} />
                <DatoCampo label="Estado de nacimiento" valor={perfilEntrenadorSeleccionado.estadoNacimiento} />
                <DatoCampo label="Teléfono" valor={perfilEntrenadorSeleccionado.telefono} />
                <DatoCampo label="Correo" valor={perfilEntrenadorSeleccionado.gmail} />
                <DatoCampo
                  label="Años de experiencia"
                  valor={perfilEntrenadorSeleccionado.añosExperiencia !== 'N/A' ? `${perfilEntrenadorSeleccionado.añosExperiencia} años` : 'N/A'}
                />
              </Box>
              {Array.isArray(perfilEntrenadorSeleccionado.especialidades) && perfilEntrenadorSeleccionado.especialidades.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                    Especialidades
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {perfilEntrenadorSeleccionado.especialidades.map((esp, idx) => (
                      <Chip
                        key={idx}
                        label={esp.nombre || esp}
                        size="small"
                        sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {Array.isArray(perfilEntrenadorSeleccionado.certificaciones) && perfilEntrenadorSeleccionado.certificaciones.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                    Certificaciones
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {perfilEntrenadorSeleccionado.certificaciones.map((cert, idx) => (
                      <Chip
                        key={idx}
                        label={cert.nombre || cert}
                        size="small"
                        sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.burgundy}`, color: COLORS.burgundy }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarPerfilEntrenadorDialog} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
          {perfilEntrenadorSeleccionado && (
            <Button
              variant="contained"
              startIcon={<SendIcon fontSize="small" />}
              disabled={invitacionesEnviadasEntrenador.includes(perfilEntrenadorSeleccionado.id) || invitandoEntrenador === perfilEntrenadorSeleccionado.id}
              onClick={() => manejarInvitarEntrenador(perfilEntrenadorSeleccionado.id)}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
            >
              {invitacionesEnviadasEntrenador.includes(perfilEntrenadorSeleccionado.id) ? 'Invitación enviada' : 'Invitar al club'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo confirmar expulsión atleta */}
      <Dialog open={modalExpulsionAbierto} onClose={cancelarExpulsion} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Confirmar Expulsión</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            ¿Estás seguro de que quieres expulsar a{' '}
            <strong>{atletaParaExpulsar?.nombreCompleto}</strong> del club?
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
          <Button onClick={cancelarExpulsion} sx={{ color: COLORS.purple, fontWeight: 600 }}>
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
      <Dialog open={modalExpulsionEntrenadorAbierto} onClose={cancelarExpulsionEntrenador} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Confirmar Expulsión de Entrenador</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            ¿Estás seguro de que quieres expulsar a{' '}
            <strong>{entrenadorParaExpulsar?.nombreCompleto}</strong> del club?
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
          <Button onClick={cancelarExpulsionEntrenador} sx={{ color: COLORS.purple, fontWeight: 600 }}>
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