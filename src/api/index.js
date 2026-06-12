import axios from 'axios'

const BASE = 'http://localhost:5000/api'

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
  updateClub: (id, data) => api.put(`/atletas/${id}/club`, data),
  remove: (id) => api.delete(`/atletas/${id}`),
  crearSolicitud: (data) => api.post('/atletas/solicitudes-club', data),
  getSolicitudes: (params) => api.get('/atletas/solicitudes-club', { params }),
  procesarSolicitud: (id, data) => api.put(`/atletas/solicitudes-club/${id}`, data),
}

export const entrenadorAPI = {
  getPerfil: () => api.get('/entrenador/perfil'),
  updatePerfil: (data) => api.put('/entrenador/perfil', data),
  getStats: () => api.get('/entrenador/stats'),
  getActividad: () => api.get('/entrenador/actividad'),
  getAtletas: () => api.get('/entrenador/atletas'),
  getSolicitudes: () => api.get('/entrenador/solicitudes'),
  solicitarClub: (data) => api.post('/entrenador/solicitar-club', data),
}

export const entrenadoresAPI = {
  getByClub: (clubId) => api.get(`/entrenadores/club/${clubId}`),
  getSolicitudesByClub: (clubId) => api.get(`/entrenadores/solicitudes-club/${clubId}`),
  updateSolicitud: (id, data) => api.put(`/entrenadores/solicitudes/${id}`, data),
}

export const eventosAPI = {
  getAll: (params) => api.get('/eventos', { params }),
  getById: (id) => api.get(`/eventos/${id}`),
  create: (data) => api.post('/eventos', data),
  addConvocatoria: (id, data) => api.post(`/eventos/${id}/convocatorias`, data),
  updateFechaCierre: (id, data) => api.put(`/eventos/${id}/fecha-cierre`, data),
  getParticipantes: (id) => api.get(`/eventos/${id}/participantes`),
  getMisConvocatorias: () => api.get('/eventos/mis-convocatorias'),
  getMisInscripciones: () => api.get('/eventos/mis-inscripciones'),
  inscribir: (data) => api.post('/eventos/inscripciones', data),
}

export const resultadosAPI = {
  getAll: (params) => api.get('/resultados', { params }),
  getById: (id) => api.get(`/resultados/${id}`),
  getByEvento: (id) => api.get(`/resultados/evento/${id}`),
  getByAtleta: (id) => api.get(`/resultados/atleta/${id}`),
  getByClub: (id) => api.get(`/resultados/club/${id}`),
  getByEntrenador: (id) => api.get(`/resultados/entrenador/${id}`),
  getEstadisticasGenerales: () => api.get('/resultados/estadisticas/generales'),
  getEstadisticasByClub: (id) => api.get(`/resultados/estadisticas/club/${id}`),
  create: (data) => api.post('/resultados', data),
  update: (id, data) => api.put(`/resultados/${id}`, data),
  remove: (id) => api.delete(`/resultados/${id}`),
}
