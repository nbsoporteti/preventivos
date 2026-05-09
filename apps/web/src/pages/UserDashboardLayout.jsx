import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { User, DownloadCloud, Activity, BookOpen } from 'lucide-react';

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
  }`;

const UserDashboardLayout = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Mi Dashboard | Preventivos CL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mi Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Bienvenido, {user?.nombre || user?.name || 'Usuario'}. Perfil, historial, estadísticas y
                actividades de aprendizaje.
              </p>
            </div>
          </div>

          <nav
            className="flex flex-wrap gap-1 bg-card border border-border/50 rounded-lg p-1 mb-8"
            aria-label="Secciones del dashboard"
          >
            <NavLink to="/dashboard/perfil" className={linkClass} end>
              <User className="w-4 h-4 shrink-0" />
              Perfil
            </NavLink>
            <NavLink to="/dashboard/historial" className={linkClass}>
              <DownloadCloud className="w-4 h-4 shrink-0" />
              Historial
            </NavLink>
            <NavLink to="/dashboard/estadisticas" className={linkClass}>
              <Activity className="w-4 h-4 shrink-0" />
              Estadísticas
            </NavLink>
            <NavLink
              to="/dashboard/aprende"
              className={linkClass}
              isActive={(_match, location) => location.pathname.startsWith('/dashboard/aprende')}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Aprende
            </NavLink>
          </nav>

          <Outlet />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default UserDashboardLayout;
