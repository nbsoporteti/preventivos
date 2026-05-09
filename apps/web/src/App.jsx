
import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router, useParams } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import HomePage from '@/pages/HomePage.jsx';
import AboutPage from '@/pages/AboutPage.jsx';
import ContactPage from '@/pages/ContactPage.jsx';
import DonarPage from '@/pages/DonarPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import VerifyEmailPage from '@/pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '@/pages/ResetPasswordPage.jsx';
import CategoryDetailsPage from '@/pages/CategoryDetailsPage.jsx';
import AllResourcesPage from '@/pages/AllResourcesPage.jsx';
import ResourceDetailPage from '@/pages/ResourceDetailPage.jsx';
import UserDashboardLayout from '@/pages/UserDashboardLayout.jsx';
import UserProfilePage from '@/pages/dashboard/UserProfilePage.jsx';
import DownloadHistoryPage from '@/pages/dashboard/DownloadHistoryPage.jsx';
import UserDashboardStats from '@/pages/dashboard/UserDashboardStats.jsx';
import AdminDashboardPage from '@/pages/AdminDashboardPage.jsx';
import LmsCatalogPage from '@/pages/LmsCatalogPage.jsx';
import LmsActivityPage from '@/pages/LmsActivityPage.jsx';
import { Toaster } from '@/components/ui/sonner';

function LegacyAprendeSlugRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/dashboard/aprende/${slug}`} replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/donar" element={<DonarPage />} />
          <Route path="/biblioteca" element={<AllResourcesPage />} />
          <Route path="/recurso/:id" element={<ResourceDetailPage />} />
          <Route path="/category/:id" element={<CategoryDetailsPage />} />
          <Route path="/aprende" element={<Navigate to="/dashboard/aprende" replace />} />
          <Route path="/aprende/:slug" element={<LegacyAprendeSlugRedirect />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<SignupPage />} />
          <Route path="/verificar-email" element={<VerifyEmailPage />} />
          <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/resetear-contrasena/:token" element={<ResetPasswordPage />} />
          
          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<UserProfilePage />} />
            <Route path="historial" element={<DownloadHistoryPage />} />
            <Route path="estadisticas" element={<UserDashboardStats />} />
            <Route path="aprende" element={<LmsCatalogPage />} />
            <Route path="aprende/:slug" element={<LmsActivityPage />} />
          </Route>
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback 404 handled within layout optionally, here just redirect to Home for simplicity or create a 404 */}
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Toaster position="top-center" />
      </AuthProvider>
    </Router>
  );
}

export default App;
