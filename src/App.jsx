import React from 'react'
import { Routes, Route, useParams } from 'react-router-dom'

// Contextos
import { ThemeProvider } from './components/common/ThemeContext.jsx'
import { AuthProvider } from './components/common/AuthContext.jsx'

// Layout
import LayoutConEncabezado from './components/layout/LayoutConEncabezado.jsx'
import LayoutEntrenador from './features/entrenador/LayoutEntrenador.jsx'

// Páginas públicas
import PaginaPrincipal from './pages/PaginaPrincipal.jsx'
import AcercaDe from './components/common/AcercaDe.jsx'
import HotelesP from './features/publico/HotelesP.jsx'
import CuartosP from './features/publico/CuartosP.jsx'
import DetallesHabitacion from './features/publico/DetalleHabitacion.jsx'

// Autenticación
import Login from './features/auth/Login.jsx'
import Registro from './features/auth/Registro.jsx'
import RegistroEntrenador from './features/auth/RegistroEntrenador.jsx'
import RecuperarCorreo from './features/auth/RecuperarCorreo.jsx'
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
import Perfil from './features/admin/Perfil.jsx'
import ClubAdmin from './features/admin/Club.jsx'
import Atleta from './features/admin/Atleta.jsx'
import Eventos from './features/admin/Eventos.jsx'
import GestionResultados from './features/admin/GestionResultados.jsx'
import Reportes from './features/admin/Reportes.jsx'
import ValidacionCategoriaAutomatica from './features/admin/ValidacionCategoriaAutomatica.jsx'
import GestionClubes from './features/admin/GestionClubes.jsx'
import GestionarAtletasAdmin from './features/admin/GestionarAtletas.jsx'
import PromocionarAtleta from './features/admin/PromocionarAtleta.jsx'
import Politicas from './features/admin/Politica.jsx'
import Terminos from './features/admin/Terminos.jsx'
import Vision from './features/admin/Vision.jsx'
import Mision from './features/admin/Mision.jsx'

// Módulos Atleta
import PerfilAtleta from './features/atleta/PerfilAtleta.jsx'
import EventosAtleta from './features/atleta/EventosAtleta.jsx'
import ConvocatoriaAtleta from './features/atleta/ConvocatoriaAtleta.jsx'
import ResultadosAtleta from './features/atleta/ResultadosAtleta.jsx'
import EstadisticasAtleta from './features/atleta/EstadisticasAtleta.jsx'

// Módulos Club
import EventosClub from './features/club/Eventos.jsx'
import GestionAtletas from './features/club/GestionAtletas.jsx'
import PerfilClub from './features/club/PerfilClub.jsx'
import ResultadosClub from './features/club/Resultados.jsx'
import Convocatoria from './features/club/Convocatoria.jsx'

// Módulos Entrenador
import GestionarAtletasEntrenador from './features/entrenador/GestionarAtletas.jsx'
import PerfilEntrenador from './features/entrenador/PerfilEntrenador.jsx'
import EventosEntrenador from './features/entrenador/EventosEntrenador.jsx'
import ReportesEntrenador from './features/entrenador/Reportes.jsx'
import BuscarClubes from './features/entrenador/BuscarClubes.jsx'

const CuartosPWrapper = () => {
  const { idHotel } = useParams()
  return <CuartosP idHotel={idHotel} />
}

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LayoutConEncabezado><PaginaPrincipal /></LayoutConEncabezado>} />
          <Route path="/login" element={<LayoutConEncabezado><Login /></LayoutConEncabezado>} />
          <Route path="/registro" element={<LayoutConEncabezado><Registro /></LayoutConEncabezado>} />
          <Route path="/registro-entrenador" element={<LayoutConEncabezado><RegistroEntrenador /></LayoutConEncabezado>} />
          <Route path="/hotelesp" element={<LayoutConEncabezado><HotelesP /></LayoutConEncabezado>} />
          <Route path="/cuartosp/:idHotel" element={<LayoutConEncabezado><CuartosPWrapper /></LayoutConEncabezado>} />
          <Route path="/detalles-habitacion/:idHabitacion" element={<LayoutConEncabezado><DetallesHabitacion /></LayoutConEncabezado>} />
          <Route path="/acercade" element={<LayoutConEncabezado><AcercaDe /></LayoutConEncabezado>} />
          <Route path="/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />
          <Route path="/recuperar-correo" element={<LayoutConEncabezado><RecuperarCorreo /></LayoutConEncabezado>} />
          <Route path="/verificar-codigo" element={<LayoutConEncabezado><VerificarCodigo /></LayoutConEncabezado>} />
          <Route path="/restablecer-password" element={<LayoutConEncabezado><RestablecerPassword /></LayoutConEncabezado>} />

          {/* Rutas Administrador */}
          <Route path="/administrador" element={<LayoutConEncabezado><PaginaPrincipalAdministrativa /></LayoutConEncabezado>} />
          <Route path="/administrador/perfil" element={<LayoutConEncabezado><Perfil /></LayoutConEncabezado>} />
          <Route path="/administrador/club" element={<LayoutConEncabezado><ClubAdmin /></LayoutConEncabezado>} />
          <Route path="/administrador/atleta" element={<LayoutConEncabezado><Atleta /></LayoutConEncabezado>} />
          <Route path="/administrador/evento" element={<LayoutConEncabezado><Eventos /></LayoutConEncabezado>} />
          <Route path="/administrador/resultados" element={<LayoutConEncabezado><GestionResultados /></LayoutConEncabezado>} />
          <Route path="/administrador/reportes" element={<LayoutConEncabezado><Reportes /></LayoutConEncabezado>} />
          <Route path="/administrador/validacion-categoria" element={<LayoutConEncabezado><ValidacionCategoriaAutomatica /></LayoutConEncabezado>} />
          <Route path="/administrador/gestion-clubes" element={<LayoutConEncabezado><GestionClubes /></LayoutConEncabezado>} />
          <Route path="/administrador/gestionar-atletas" element={<LayoutConEncabezado><GestionarAtletasAdmin /></LayoutConEncabezado>} />
          <Route path="/administrador/promocionar-atleta" element={<LayoutConEncabezado><PromocionarAtleta /></LayoutConEncabezado>} />
          <Route path="/administrador/politicas" element={<LayoutConEncabezado><Politicas /></LayoutConEncabezado>} />
          <Route path="/administrador/terminos" element={<LayoutConEncabezado><Terminos /></LayoutConEncabezado>} />
          <Route path="/administrador/vision" element={<LayoutConEncabezado><Vision /></LayoutConEncabezado>} />
          <Route path="/administrador/mision" element={<LayoutConEncabezado><Mision /></LayoutConEncabezado>} />
          <Route path="/administrador/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/administrador/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />

          {/* Rutas Atleta */}
          <Route path="/atleta" element={<LayoutConEncabezado><PaginaPrincipalAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/perfil" element={<LayoutConEncabezado><PerfilAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/eventos" element={<LayoutConEncabezado><EventosAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/convocatoria" element={<LayoutConEncabezado><ConvocatoriaAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/resultados" element={<LayoutConEncabezado><ResultadosAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/estadisticas" element={<LayoutConEncabezado><EstadisticasAtleta /></LayoutConEncabezado>} />
          <Route path="/atleta/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/atleta/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />

          {/* Rutas Club */}
          <Route path="/club" element={<LayoutConEncabezado><PaginaPrincipalClub /></LayoutConEncabezado>} />
          <Route path="/club/perfil" element={<LayoutConEncabezado><PerfilClub /></LayoutConEncabezado>} />
          <Route path="/club/eventos" element={<LayoutConEncabezado><EventosClub /></LayoutConEncabezado>} />
          <Route path="/club/gestionAtletas" element={<LayoutConEncabezado><GestionAtletas /></LayoutConEncabezado>} />
          <Route path="/club/resultados" element={<LayoutConEncabezado><ResultadosClub /></LayoutConEncabezado>} />
          <Route path="/club/convocatoria" element={<LayoutConEncabezado><Convocatoria /></LayoutConEncabezado>} />
          <Route path="/club/politicaspca" element={<LayoutConEncabezado><PoliticasPCA /></LayoutConEncabezado>} />
          <Route path="/club/terminospca" element={<LayoutConEncabezado><TerminosPCA /></LayoutConEncabezado>} />
          <Route path="/club/visionpca" element={<LayoutConEncabezado><VisionPCA /></LayoutConEncabezado>} />
          <Route path="/club/misionpca" element={<LayoutConEncabezado><MisionPCA /></LayoutConEncabezado>} />

          {/* Rutas Entrenador */}
          <Route path="/entrenador" element={<LayoutEntrenador><PaginaPrincipalEntrenador /></LayoutEntrenador>} />
          <Route path="/entrenador/gestionar-atletas" element={<LayoutEntrenador><GestionarAtletasEntrenador /></LayoutEntrenador>} />
          <Route path="/entrenador/eventos" element={<LayoutEntrenador><EventosEntrenador /></LayoutEntrenador>} />
          <Route path="/entrenador/reportes" element={<LayoutEntrenador><ReportesEntrenador /></LayoutEntrenador>} />
          <Route path="/entrenador/buscar-clubes" element={<LayoutEntrenador><BuscarClubes /></LayoutEntrenador>} />
          <Route path="/entrenador/perfil" element={<LayoutEntrenador><PerfilEntrenador /></LayoutEntrenador>} />
          <Route path="/entrenador/politicaspca" element={<LayoutEntrenador><PoliticasPCA /></LayoutEntrenador>} />
          <Route path="/entrenador/terminospca" element={<LayoutEntrenador><TerminosPCA /></LayoutEntrenador>} />
          <Route path="/entrenador/visionpca" element={<LayoutEntrenador><VisionPCA /></LayoutEntrenador>} />
          <Route path="/entrenador/misionpca" element={<LayoutEntrenador><MisionPCA /></LayoutEntrenador>} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
