import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import EncabezadoPublico from './EncabezadoPublico.jsx';
import EncabezadoAdministrativo from './EncabezadoAdministrativo.jsx';
import EncabezadoAtleta from './EncabezadoAtleta.jsx';
import PieDePaginaAtleta from './PieDePaginaAtleta.jsx';
import PieDePaginaAdmin from './PieDePaginaAdmin.jsx';
import PieDePagina from './PieDePagina.jsx';
import EncabezadoClub from './EncabezadoClub.jsx';
import { useTheme } from '../common/ThemeContext.jsx';
import { useAuth } from '../common/AuthContext.jsx';

const LayoutConEncabezado = ({ children }) => {
  const location = useLocation();
  const { user, login } = useAuth();
  const { theme } = useTheme();

  // Inicializar user desde localStorage si existe
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && !user) {
      login(JSON.parse(savedUser).curp, JSON.parse(savedUser).tipo, JSON.parse(savedUser));
    }
  }, [login, user]);

  let encabezado;
  let pieDePagina;

  // Determinar encabezado y pie de página basado en el rol del usuario
  if (user) {
    switch (user.tipo) {
      case 'admin':
        encabezado = <EncabezadoAdministrativo />;
        pieDePagina = <PieDePaginaAdmin />;
        break;
      case 'atleta':
        encabezado = <EncabezadoAtleta />;
        pieDePagina = <PieDePaginaAtleta />;
        break;
      case 'club':
        encabezado = <EncabezadoClub />;
        pieDePagina = <PieDePaginaAtleta />;
        break;
      default:
        encabezado = <EncabezadoPublico />;
        pieDePagina = <PieDePagina />;
    }
  } else {
    // Si no hay usuario autenticado, usar encabezado público
    encabezado = <EncabezadoPublico />;
    pieDePagina = <PieDePagina />;
  }

  // Redirección si el usuario intenta acceder a una ruta protegida sin autenticación
  const isProtectedRoute = location.pathname.startsWith('/administrador') ||
                          location.pathname.startsWith('/atleta') ||
                          location.pathname.startsWith('/club') ||
                          location.pathname === '/eventosA' ||
                          location.pathname === '/convocatoria' ||
                          location.pathname === '/perfilA' ||
                          location.pathname === '/resultadosA' ||
                          location.pathname === '/eventosC' ||
                          location.pathname === '/gestionAtletas' ||
                          location.pathname === '/perfilC' ||
                          location.pathname === '/resultados' ||
                          location.pathname === '/admin/atleta' ||
                          location.pathname === '/admin/evento';
  if (isProtectedRoute && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className={`layout-container ${theme}`}>
      <header>{encabezado}</header>
      <main className="content">{children}</main>
      <footer>{pieDePagina}</footer>

      <style>{`
        :root {
          --min-header-footer-height: 60px; 
        }

        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }

        .layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .content {
          flex-grow: 1;
          background-color: ${theme === 'dark' ? '#1d1d1d' : '#ffffff'};
          color: ${theme === 'dark' ? '#ffffff' : '#000000'};
        }

        header, footer {
          width: 100%;
          min-height: var(--min-header-footer-height);
          box-sizing: border-box;
          background-color: ${theme === 'dark' ? '#333' : '#FFA500'};
        }

        footer {
          background-color: ${theme === 'dark' ? '#d45d00' : '#d45d00'};
        }
      `}</style>
    </div>
  );
};

export default LayoutConEncabezado;