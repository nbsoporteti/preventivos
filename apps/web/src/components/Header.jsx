
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, ShieldAlert, Heart } from 'lucide-react';
import { MercadoPagoDonationButton } from '@/components/MercadoPagoDonationButton.jsx';

const Header = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Biblioteca', href: '/biblioteca' },
    { name: 'Nosotros', href: '/nosotros' },
    { name: 'Contacto', href: '/contacto' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://horizons-cdn.hostinger.com/89367f6c-287f-4262-bcc9-7915f6d4fac1/083e186ef743d0e929c8b69d6a47e650.png" 
                alt="Preventivos CL Logo" 
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-xl tracking-tight hidden sm:block">Preventivos CL</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center mr-2">
            <MercadoPagoDonationButton size="default" label="Donar" />
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Button variant="outline" asChild className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                    <Link to="/admin">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Panel Admin
                    </Link>
                  </Button>
                )}
                <Button variant="secondary" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menú">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full mt-6">
                  <nav className="flex flex-col gap-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`text-lg font-medium p-2 rounded-md ${
                          isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-foreground'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#009ee3]" aria-hidden />
                      Apoyá el proyecto
                    </p>
                    <MercadoPagoDonationButton className="w-full" size="lg" />
                  </div>

                  <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
                    {!isAuthenticated ? (
                      <>
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link to="/login">Iniciar Sesión</Link>
                        </Button>
                        <Button asChild className="w-full justify-start">
                          <Link to="/registro">Registrarse</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        {isAdmin && (
                          <Button variant="outline" asChild className="w-full justify-start border-primary/20 text-primary">
                            <Link to="/admin">
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Panel de Administración
                            </Link>
                          </Button>
                        )}
                        <Button variant="secondary" asChild className="w-full justify-start">
                          <Link to="/dashboard">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Mi Dashboard
                          </Link>
                        </Button>
                        <Button variant="ghost" onClick={logout} className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <LogOut className="w-4 h-4 mr-2" />
                          Cerrar sesión
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
