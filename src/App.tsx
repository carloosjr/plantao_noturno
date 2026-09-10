import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { AcompanhamentoProvider } from './lib/acompanhamento/store';
import PainelPage from './pages/PainelPage';
import RegistrarPage from './pages/RegistrarPage';
import DemandasPage from './pages/DemandasPage';
import AcompanhamentoPage from './pages/AcompanhamentoPage';
import ProdutividadePage from './pages/ProdutividadePage';
import ValidacaoAgendaPage from './pages/ValidacaoAgendaPage';
import FechamentoPage from './pages/FechamentoPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/painel" replace />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/registrar" element={<RegistrarPage />} />
        <Route path="/demandas" element={<DemandasPage />} />

        <Route
          element={
            <AcompanhamentoProvider>
              <Outlet />
            </AcompanhamentoProvider>
          }
        >
          <Route path="/acompanhamento" element={<AcompanhamentoPage />} />
          <Route path="/produtividade" element={<ProdutividadePage />} />
          <Route path="/validacao-agenda" element={<ValidacaoAgendaPage />} />
          <Route path="/fechamento" element={<FechamentoPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </AppShell>
  );
}
