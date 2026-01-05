import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import MainPage from './pages/MainPage';
import AdminExpenditure from './pages/AdminExpenditure';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // Or spinner
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

const AdminRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
         <Route path="/dashboard" element={<MainPage />} />
         
         <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminExpenditure />} />
         </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
