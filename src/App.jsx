import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Contextos
import { ThemeProvider } from './components/common/ThemeContext.jsx'
import { AuthProvider } from './components/common/AuthContext.jsx'

// Layout
import LayoutConEncabezado from './components/layout/LayoutConEncabezado.jsx'

// Páginas públicas
import PaginaPrincipal from './pages/PaginaPrincipal.jsx'
import EventosPublico from './pages/EventosPublico.jsx'
import ResultadosPublico from './pages/ResultadosPublico.jsx'

// Autenticación
import Login from './features/auth/Login.jsx'
import Registro from './features/auth/Registro.jsx'
import RecuperarCorreo from './features/auth/EnviarCorreo.jsx'
import VerificarCodigo from './features/auth/VerificarCodigo.jsx'
import RestablecerPassword from './features/auth/RestablecerPassword.jsx'

// Contenido compartido
import PoliticasPCA from './components/common/PoliticasPCA.jsx'
import TerminosPCA from './components/common/TerminosPCA.jsx'
import VisionPCA from './components/common/VisionPCA.jsx'
import MisionPCA from './components/common/MisionPCA.jsx'

// Páginas de rol
import PaginaPrincipalAdministrativa from './pages/PaginaPrincipalAdministrativa.jsx'
import PaginaPrincipalAtleta from './pages/PaginaPrincipalAtleta.jsx'
import PaginaPrincipalClub from './pages/PaginaPrincipalClub.jsx'
import PaginaPrincipalEntrenador from './pages/PaginaPrincipalEntrenador.jsx'

// Módulos Administrativos
import Eventos from "./features/admin/GestionarEventos.jsx";
import GestionResultados from './features/admin/GestionarResultados.jsx'
import Reportes from './features/admin/Reportes.jsx'
import GestionClubes from './features/admin/GestionarClubes.jsx'
import GestionarAtletasAdmin from './features/admin/GestionarUsuarios.jsx'
import GestionContenido from './features/admin/GestionarContenido.jsx'
import PerfilAdministrador from './features/admin/PerfilAdministrador.jsx'

// Módulos Atleta
import PerfilAtleta from './features/atleta/PerfilAtleta.jsx'
import EventosAtleta from './features/atleta/EventosAtleta.jsx'
import ConvocatoriaAtleta from './features/atleta/ConvocatoriaAtleta.jsx'
import MisConvocatoriasAtleta from './features/atleta/MisConvocatoriasAtleta.jsx'
import ResultadosAtleta from './features/atleta/ResultadosAtleta.jsx'
import ClubAtleta from './features/atleta/ClubAtleta.jsx'

// Módulos Club
import EventosClub from './features/club/EventosClub.jsx'
import GestionAtletas from './features/club/GestionarAtletas.jsx'
import PerfilClub from './features/club/PerfilClub.jsx'
import ResultadosClub from './features/club/ResultadosClub.jsx'
import Convocatoria from './features/club/ConvocatoriaClub.jsx'
import MisConvocatoriasClub from './features/club/MisConvocatoriasClub.jsx'

// Módulos Entrenador
import GestionarAtletasEntrenador from './features/entrenador/GestionarAtletas.jsx'
import PerfilEntrenador from './features/entrenador/PerfilEntrenador.jsx'
import EventosEntrenador from './features/entrenador/EventosEntrenador.jsx'
import ReportesEntrenador from './features/entrenador/ReportesEntrenador.jsx'
import BuscarClubes from './features/entrenador/BuscarClubes.jsx'
import ConvocatoriaEntrenador from "./features/entrenador/ConvocatoriaEntrenador.jsx";
import ConvocatoriasClubEntrenador from "./features/entrenador/ConvocatoriasClubEntrenador.jsx";
import ResultadosEntrenador from "./features/entrenador/ResultadosEntrenador.jsx";


const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LayoutConEncabezado><PaginaPrincipal /></LayoutConEncabezado>} />
          <Route path="/login" element={<LayoutConEncabezado><Login /></LayoutConEncabezado>} />
          <Route path="/registro" element={<LayoutConEncabezado><Registro /></LayoutConEncabezado>} />
          <Route path="/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />
          <Route path="/recuperar-correo" element={<LayoutConEncabezado><RecuperarCorreo /></LayoutConEncabezado>} />
          <Route path="/verificar-codigo" element={<LayoutConEncabezado><VerificarCodigo /></LayoutConEncabezado>} />
          <Route path="/restablecer-password" element={<LayoutConEncabezado><RestablecerPassword /></LayoutConEncabezado>} />
          <Route path="/eventos-publico" element={<LayoutConEncabezado><EventosPublico /></LayoutConEncabezado>} />
          <Route path="/resultados-publico" element={<LayoutConEncabezado><ResultadosPublico /></LayoutConEncabezado>} />

          {/* Rutas Administrador */}
          <Route path="/administrador" element={<LayoutConEncabezado><PaginaPrincipalAdministrativa /></LayoutConEncabezado>} />
          <Route path="/administrador/evento" element={<LayoutConEncabezado><Eventos /></LayoutConEncabezado>} />
          <Route path="/administrador/resultados" element={<LayoutConEncabezado><GestionResultados /></LayoutConEncabezado>} />
          <Route path="/administrador/reportes" element={<LayoutConEncabezado><Reportes /></LayoutConEncabezado>} />
          <Route path="/administrador/gestion-clubes" element={<LayoutConEncabezado><GestionClubes /></LayoutConEncabezado>} />
          <Route path="/administrador/gestionar-atletas" element={<LayoutConEncabezado><GestionarAtletasAdmin /></LayoutConEncabezado>} />
          <Route path="/administrador/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/contenido" element={<LayoutConEncabezado><GestionContenido /></LayoutConEncabezado>} />
          <Route path="/administrador/perfil" element={<LayoutConEncabezado><PerfilAdministrador /></LayoutConEncabezado>} />

          {/* Rutas Atleta */}
          <Route path="/atleta" element={<LayoutConEncabezado><PaginaPrincipalAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/perfil" element={<LayoutConEncabezado><PerfilAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/eventos" element={<LayoutConEncabezado><EventosAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/convocatoria" element={<LayoutConEncabezado><ConvocatoriaAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/mis-convocatorias" element={<LayoutConEncabezado><MisConvocatoriasAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/resultados" element={<LayoutConEncabezado><ResultadosAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/club" element={<LayoutConEncabezado><ClubAtleta /></LayoutConEncabezado>} />

          {/* Rutas Club */}
          <Route path="/club" element={<LayoutConEncabezado><PaginaPrincipalClub /></LayoutConEncabezado>} />
          <Route path="/club/perfil" element={<LayoutConEncabezado><PerfilClub /></LayoutConEncabezado>} />
          <Route path="/club/eventos" element={<LayoutConEncabezado><EventosClub /></LayoutConEncabezado>} />
          <Route path="/club/gestionAtletas" element={<LayoutConEncabezado><GestionAtletas /></LayoutConEncabezado>} />
          <Route path="/club/resultados" element={<LayoutConEncabezado><ResultadosClub /></LayoutConEncabezado>} />
          <Route path="/club/convocatoria" element={<LayoutConEncabezado><Convocatoria /></LayoutConEncabezado>} />
          <Route path="/club/mis-convocatorias" element={<LayoutConEncabezado><MisConvocatoriasClub /></LayoutConEncabezado>} />
          <Route path="/club/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/club/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/club/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/club/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />

          {/* Rutas Entrenador */}
          <Route path="/entrenador" element={<LayoutConEncabezado><PaginaPrincipalEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/gestionar-atletas" element={<LayoutConEncabezado><GestionarAtletasEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/eventos" element={<LayoutConEncabezado><EventosEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/reportes" element={<LayoutConEncabezado><ReportesEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/buscar-clubes" element={<LayoutConEncabezado><BuscarClubes /></LayoutConEncabezado>} />
          <Route path="/entrenador/perfil" element={<LayoutConEncabezado><PerfilEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/entrenador/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/entrenador/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/entrenador/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />
          <Route path="/entrenador/convocatorias" element={<LayoutConEncabezado><ConvocatoriaEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/convocatorias-club" element={<LayoutConEncabezado><ConvocatoriasClubEntrenador /></LayoutConEncabezado>} />
          <Route path="/entrenador/resultados" element={<LayoutConEncabezado><ResultadosEntrenador /></LayoutConEncabezado>} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App