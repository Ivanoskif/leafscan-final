import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Diseases from './pages/Diseases/Diseases';
import Plants from './pages/Plants/Plants';
import Users from './pages/Users/Users';
import AnalysisHistory from './pages/AnalysisHistory/AnalysisHistory';
import Statistics from './pages/Statistics/Statistics';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route index        element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"  element={<Dashboard />} />
                <Route path="diseases"   element={<Diseases />} />
                <Route path="plants"     element={<Plants />} />
                <Route path="users"      element={<Users />} />
                <Route path="analyses"   element={<AnalysisHistory />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="settings"   element={<Settings />} />
                <Route path="profile"    element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}