import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import PainelPage from './pages/PainelPage';
import RegistrarPage from './pages/RegistrarPage';
import DemandasPage from './pages/DemandasPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/painel" replace />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/registrar" element={<RegistrarPage />} />
        <Route path="/demandas" element={<DemandasPage />} />
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </AppShell>
  );
}
