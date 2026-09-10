import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const MENU = [
  { to: '/painel', icone: '▥', rotulo: 'Painel do plantão', oculto: true },
  { to: '/registrar', icone: '✎', rotulo: 'Registrar continuações', secao: 'Origem das demandas' },
  { to: '/demandas', icone: '▤', rotulo: 'Demandas registradas' },
  { to: '/acompanhamento', icone: '☑', rotulo: 'Acompanhamento' },
  { to: '/produtividade', icone: '📈', rotulo: 'Produtividade' },
  { to: '/validacao-agenda', icone: '🗓', rotulo: 'Validação de agenda' },
  { to: '/fechamento', icone: '✔', rotulo: 'Fechamento' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div className="app">
      <button
        type="button"
        className="sidebar-toggle"
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
        onClick={() => setMenuAberto((aberto) => !aberto)}
      >
        {menuAberto ? '✕' : '☰'}
      </button>

      <aside className={`sidebar${menuAberto ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          Softcom
        </div>

        <div className="pill">🌙 Plantão Noturno</div>

        <nav>
          {MENU.filter((item) => !item.oculto).map((item) => (
            <div key={item.to}>
              {item.secao ? <div className="nav-section-label">{item.secao}</div> : null}
              <NavLink to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <span aria-hidden="true">{item.icone}</span>
                {item.rotulo}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">Origem das demandas recebidas pelo plantão.</div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
