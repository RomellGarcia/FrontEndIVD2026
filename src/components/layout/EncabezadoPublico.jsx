import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";


const PRIMARY = "#720F3C";
const GOLD_LIGHT = "#DEDAD0";
const GOLD_LIGHT_ALT = "#DDDAD0";
const MUSTARD = "#AA983F";
const DARK_TEXT = "#49453C";
const MOBILE_BG = "#333333";
const MOBILE_ROW = "#49453C";
const MOBILE_ROW_HOVER = "#6b6767";

const LOGO_IVD =
  "https://res.cloudinary.com/dtnxbeqox/image/upload/v1782881553/IVD_TITULO_th3ydc.png";

const EncabezadoPublico = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const menuRef = useRef(null);

  React.useEffect(() => {
    const cerrar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const navegar = (ruta) => {
    navigate(ruta);
    setMobileMenu(false);
  };

  const menu = [
    { texto: "Inicio", ruta: "/" },
    { texto: "Eventos", ruta: "/eventos-publico" },
    { texto: "Resultados", ruta: "/resultados-publico" },
  ];

  const loginItem = { texto: "Iniciar Sesión", ruta: "/login" };

  const activo = (ruta) => location.pathname === ruta;

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        * {
          box-sizing: border-box;
        }

        .ivd-header {
          width: 100%;
          background: #ffffff;
          font-family: "Ubuntu", Arial, Helvetica, sans-serif;
        }

        /* Franja superior dorada, al estilo de ivd.gob.mx / veracruz.gob.mx */
        .ivd-top {
          background-color: ${GOLD_LIGHT};
          background-repeat: repeat-x;
          padding: 15px 0;
        }

        .ivd-brand {
          max-width: 1200px;
          margin: auto;
          display: flex;
          align-items: center;
          padding: 6px 30px;
        }

        .ivd-logo-link {
          display: inline-block;
          margin-right: 40px;
          margin-top: 15px;
          margin-bottom: 15px;
          cursor: pointer;
        }

        .ivd-logo {
          max-width: 500px;
          width: 100%;
          height: auto;
          display: block;
        }

        .ivd-nav {
          background: ${PRIMARY};
          width: 100%;
        }

        .ivd-nav-container {
          max-width: 1280px;
          margin: auto;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .ivd-menu {
          display: flex;
          list-style: none;
          padding: 0px;
          margin: 0;
        }

        .ivd-item {
          cursor: pointer;
          padding: 3px;
        }

        .ivd-link,
        .ivd-login-btn {
          display: block;
          padding: 7px 35px 7px;
          font-size: 1.064em;
          font-weight: 500;
          color: #ffffff;
          text-transform: uppercase;
          transition: .25s;
        }

        .ivd-item:hover {
          background: #800020;
        }

        .ivd-item.active {
          background: #800020;
        }

        .mobile-button {
          display: none;
          border: none;
          background: none;
          color: white;
          font-size: 26px;
          padding: 14px 20px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        /* RESPONSIVE */

        @media (max-width: 992px) {
          .ivd-brand {
            padding: 18px 20px;
            flex-direction: column;
            gap: 16px;
          }

          .ivd-brand-left {
            justify-content: center;
          }

          .ivd-right {
            justify-content: center;
          }

          .ivd-nav-container {
            justify-content: flex-start;
          }

          .mobile-button {
            display: block;
          }

          .ivd-menu {
            display: none;
            flex-direction: column;
            width: 100%;
            background: ${PRIMARY};
          }

          .ivd-menu.open {
            display: flex;
          }

          .ivd-item {
            width: 100%;
            border-top: 1px solid rgba(255, 255, 255, .08);
          }

          .ivd-link,
          .ivd-login-btn {
            padding: 16px 22px;
          }
        }

        @media (max-width: 600px) {
          .ivd-logo {
            max-width: 280px;
          }

          .ivd-social {
            font-size: 21px;
          }
        }
      `}</style>

      <header className="ivd-header" ref={menuRef}>
        {/* Franja superior */}
        <div className="ivd-top"></div>

        {/* Logo */}
        <div className="ivd-brand">
          <div className="ivd-logo-link" onClick={() => navegar("/")}>
            <img
              src={LOGO_IVD}
              alt="Instituto Veracruzano del Deporte"
              className="ivd-logo"
            />
          </div>
        </div>

        {/* Menú */}
        <nav className="ivd-nav">
          <div className="ivd-nav-container">
            <ul className={`ivd-menu ${mobileMenu ? "open" : ""}`}>
              {menu.map((item) => (
                <li
                  key={item.ruta}
                  className={`ivd-item ${activo(item.ruta) ? "active" : ""}`}
                  onClick={() => navegar(item.ruta)}
                >
                  <span className="ivd-link">{item.texto}</span>
                </li>
              ))}

              <li
                className={`ivd-item ivd-login-item ${activo(loginItem.ruta) ? "active" : ""}`}
                onClick={() => navegar(loginItem.ruta)}
              >
                <span className="ivd-login-btn">{loginItem.texto}</span>
              </li>
            </ul>

            <button
              className="mobile-button"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <ion-icon
                name={mobileMenu ? "close-outline" : "menu-outline"}
              ></ion-icon>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
};

export default EncabezadoPublico;