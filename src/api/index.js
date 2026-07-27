import axios from 'axios'

// En local, Vite lee VITE_API_URL de tu .env; si no existe, cae en
// localhost para que el desarrollo siga funcionando igual que siempre.
// En producción (Vercel), esta variable DEBE estar configurada apuntando
// a tu backend real — si no, todo el sitio intentará hablar con
// localhost:5000, que no existe fuera de tu máquina.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`
        return config
      }
    } catch (e) {}
  }

  // Fallback: token del SDK de Supabase en localStorage
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-'))
  const session = keys
    .map((k) => {
      try {
        return JSON.parse(localStorage.getItem(k))
      } catch {
        return null
      }
    })
    .find((v) => v?.access_token)

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// NUEVO: flujo de "olvidé mi contraseña" (correo → código → nueva
// contraseña) — antes cada pantalla le pegaba directo a
// http://localhost:5000/api/recuperar/... con axios a mano, en vez de
// pasar por aquí.
export const recuperarAPI = {
  forgotPassword: (data) => api.post('/recuperar/forgot-password', data),
  verifyCode: (data) => api.post('/recuperar/verify-code', data),
  resetPassword: (data) => api.post('/recuperar/reset-password', data),
}

export const perfilEmpresaAPI = {
  get: () => api.get('/perfil-empresa'),
  update: (data) => api.put('/perfil-empresa', data),
  updateLogo: (data) => api.put('/perfil-empresa/logo', data),
}

export const contenidoAPI = {
  get: (tipo) => api.get(`/contenido/${tipo}`),
  update: (tipo, data) => api.put(`/contenido/${tipo}`, data),
}

export const clubesAPI = {
  getAll: () => api.get('/clubes'),
  getById: (id) => api.get(`/clubes/${id}`),
  create: (data) => api.post('/clubes', data),
  update: (id, data) => api.put(`/clubes/${id}`, data),
  remove: (id) => api.delete(`/clubes/${id}`),
  getAtletas: (id) => api.get(`/clubes/${id}/atletas`),
  getEntrenadores: (id) => api.get(`/clubes/${id}/entrenadores`),
}

export const atletasAPI = {
  getAll: (params) => api.get('/atletas', { params }),
  getById: (id) => api.get(`/atletas/${id}`),
  getPerfil: () => api.get('/atletas/perfil'),
  updatePerfil: (data) => api.put('/atletas/perfil', data),
  updateAdmin: (id, data) => api.put(`/atletas/${id}`, data),
  updateClub: (id, data) => api.put(`/atletas/${id}/club`, data),
  remove: (id) => api.delete(`/atletas/${id}`),
  crearSolicitud: (data) => api.post('/atletas/solicitudes-club', data),
  getSolicitudes: (params) => api.get('/atletas/solicitudes-club', { params }),
  procesarSolicitud: (id, data) => api.put(`/atletas/solicitudes-club/${id}`, data),
  // NUEVO: el club invita a un atleta independiente (POST /atletas/:id/invitar-club).
  invitarClub: (id, data) => api.post(`/atletas/${id}/invitar-club`, data),
}

export const entrenadorAPI = {
  getPerfil: () => api.get('/entrenador/perfil'),
  updatePerfil: (data) => api.put('/entrenador/perfil', data),
  getStats: () => api.get('/entrenador/stats'),
  getActividad: () => api.get('/entrenador/actividad'),
  getAtletas: () => api.get('/entrenador/atletas'),
  getSolicitudes: () => api.get('/entrenador/solicitudes'),
  solicitarClub: (data) => api.post('/entrenador/solicitar-club', data),
  // NUEVO: sugerencias de certificaciones/especialidades (para el
  // Autocomplete de Registro.jsx y PerfilEntrenador.jsx) — sacadas de lo
  // que ya escribieron otros entrenadores, no un catálogo fijo.
  getCertificacionesSugeridas: () => api.get('/entrenador/certificaciones-sugeridas'),
  getEspecialidadesSugeridas: () => api.get('/entrenador/especialidades-sugeridas'),
}

export const entrenadoresAPI = {
  getAll: (params) => api.get('/entrenadores', { params }),
  getById: (id) => api.get(`/entrenadores/${id}`),
  getByClub: (clubId) => api.get(`/entrenadores/club/${clubId}`),
  getSolicitudesByClub: (clubId, params) => api.get(`/entrenadores/solicitudes-club/${clubId}`, { params }),
  updateSolicitud: (id, data) => api.put(`/entrenadores/solicitudes/${id}`, data),
  updateAdmin: (id, data) => api.put(`/entrenadores/${id}`, data),
  updateClub: (id, data) => api.put(`/entrenadores/${id}/club`, data),
  // NUEVO: el club invita a un entrenador independiente.
  invitarClub: (id, data) => api.post(`/entrenadores/${id}/invitar-club`, data),
  // NUEVO: eliminar por completo (solo admin) — bloqueado en el backend
  // si el entrenador tiene resultados registrados.
  remove: (id) => api.delete(`/entrenadores/${id}`),
}

export const eventosAPI = {
  getAll: (params) => api.get('/eventos', { params }),
  getById: (id) => api.get(`/eventos/${id}`),
  create: (data) => api.post('/eventos', data),
  addConvocatoria: (id, data) => api.post(`/eventos/${id}/convocatorias`, data),
  updateFechaCierre: (id, data) => api.put(`/eventos/${id}/fecha-cierre`, data),
  getParticipantes: (id, params) => api.get(`/eventos/${id}/participantes`, { params }),
  getParticipantesPorConvocatoria: (convocatoriaId, params) => api.get(`/eventos/convocatorias/${convocatoriaId}/participantes`, { params }),
  getMisConvocatorias: () => api.get('/eventos/mis-convocatorias'),
  getMisInscripciones: () => api.get('/eventos/mis-inscripciones'),
  inscribir: (data) => api.post('/eventos/inscripciones', data),
  cancelarInscripcion: (id) => api.delete(`/eventos/inscripciones/${id}`),
  // Flujo de convocatorias del lado del club (inscribir a uno de sus atletas)
  getConvocatoriasAbiertas: () => api.get('/eventos/convocatorias-abiertas'),
  getMisInscripcionesClub: () => api.get('/eventos/mis-inscripciones-club'),
  inscribirClub: (data) => api.post('/eventos/inscripciones/club', data),
  // Edición, borrado y estado del evento (admin)
  update: (id, data) => api.put(`/eventos/${id}`, data),
  toggleEstado: (id, estado) => api.put(`/eventos/${id}/estado`, { estado }),
  // Finalizar/reabrir el evento por completo (distinto de toggleEstado, que
  // es cancelar/activar). Al finalizar, cierra en cascada sus convocatorias.
  finalizarEvento: (id, finalizar) => api.patch(`/eventos/${id}/finalizar`, { finalizado: finalizar }),
  deleteEvento: (id) => api.delete(`/eventos/${id}`),
  deleteConvocatoria: (convocatoriaId) => api.delete(`/eventos/convocatorias/${convocatoriaId}`),
  removerAtletaDeConvocatoria: (inscripcionId) => api.delete(`/eventos/participantes/${inscripcionId}`),
  getConvocatoriasByEvento: (eventoId) => api.get(`/eventos/${eventoId}/convocatorias`),
  subirResultadoConvocatoria: (convocatoriaId, formData) =>
    api.post(`/eventos/convocatorias/${convocatoriaId}/resultado`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  eliminarResultadoConvocatoria: (convocatoriaId) => api.delete(`/eventos/convocatorias/${convocatoriaId}/resultado`),
  updateConvocatoria: (convocatoriaId, data) => api.put(`/eventos/convocatorias/${convocatoriaId}`, data),

  finalizarConvocatoria: (convocatoriaId, finalizar) =>
  api.patch(`/eventos/convocatorias/${convocatoriaId}/estado`, { estado: !finalizar }),
}

export const notificacionesAPI = {
  getMias: () => api.get('/notificaciones/mias'),
  marcarLeidas: (ids) => api.put('/notificaciones/marcar-leidas', { ids }),
  getMiasClub: () => api.get('/notificaciones/club/mias'),
  marcarLeidasClub: (ids) => api.put('/notificaciones/club/marcar-leidas', { ids }),
}

export const resultadosAPI = {
  getAll: (params) => api.get('/resultados', { params }),
  getById: (id) => api.get(`/resultados/${id}`),
  getByEvento: (id) => api.get(`/resultados/evento/${id}`),
  getByAtleta: (id) => api.get(`/resultados/atleta/${id}`),
  getByClub: (id) => api.get(`/resultados/club/${id}`),
  getByEntrenador: (id) => api.get(`/resultados/entrenador/${id}`),
  getEstadisticasGenerales: () => api.get('/resultados/estadisticas/generales'),
  getMejoresMarcas: (params) => api.get('/resultados/mejores-marcas', { params }),
  getEstadisticasByClub: (id) => api.get(`/resultados/estadisticas/club/${id}`),
  create: (data) => api.post('/resultados', data),
  update: (id, data) => api.put(`/resultados/${id}`, data),
  remove: (id) => api.delete(`/resultados/${id}`),
  getByConvocatoria: (convocatoriaId) => api.get(`/resultados/convocatoria/${convocatoriaId}`),
  crearMasivo: (data) => api.post('/resultados/masivo', data),
  removeByConvocatoria: (convocatoriaId) => api.delete(`/resultados/convocatoria/${convocatoriaId}`),
}


export const catalogosAPI = {
  getDisciplinas: () => api.get('/catalogos/disciplinas'),
  getCategorias: () => api.get('/catalogos/categorias'),
  getGeneros: () => api.get('/catalogos/generos'),
}