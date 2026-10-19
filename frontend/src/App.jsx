import { Navigate, Route, Routes } from 'react-router-dom'
import { PreferencesProvider } from './context/PreferencesProvider'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Anomalies from './pages/Anomalies'
import AnomalyDetails from './pages/AnomalyDetails'
import AtmNetwork from './pages/AtmNetwork'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import MlModel from './pages/MlModel'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

/**
 * ATM SENTINEL — application routes.
 *
 * Presentation routes use local demonstration data and deliberately require no
 * authenticated session or role.
 */
function App() {
  return (
    <PreferencesProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/anomalies/:id" element={<AnomalyDetails />} />
            <Route path="/atm-network" element={<AtmNetwork />} />
            <Route path="/ml-model" element={<MlModel />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
    </PreferencesProvider>
  )
}

export default App
