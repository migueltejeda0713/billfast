import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './Pages/Register';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import PastMonth from './Pages/PastMonth';
import Budgets from './Pages/Budgets';
import { useAuth } from './context/AuthContext';

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/budgets"
        element={token ? <Budgets /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/past-month"
        element={token ? <PastMonth /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;

