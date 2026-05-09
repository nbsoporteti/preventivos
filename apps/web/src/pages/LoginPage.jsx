
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock } from 'lucide-react';
import { mergeLoginCms } from '@/lib/cms/authCmsModels.js';
import apiServerClient from '@/lib/apiServerClient.js';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [cms, setCms] = useState(() => mergeLoginCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/login');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeLoginCms(data));
      } catch {
        /* */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const z = cms.bloques;
  
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success('¡Bienvenido de nuevo!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{cms.meta_title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
          <Card className="w-full max-w-md shadow-xl border-border/50">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold tracking-tight">{z.cardTitle}</CardTitle>
              <CardDescription className="text-base">
                {z.cardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{z.labelEmail}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder={z.placeholderEmail} 
                      className="pl-10 bg-background"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{z.labelPassword}</Label>
                    <Link to="/recuperar-contrasena" className="text-sm font-medium text-primary hover:underline">
                      {z.linkForgot}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      className="pl-10 bg-background"
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {z.btnLoading}
                    </>
                  ) : (
                    z.btnSubmit
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/50 pt-6">
              <p className="text-sm text-muted-foreground">
                {z.footerPrefix}{' '}
                <Link to="/registro" className="font-semibold text-primary hover:underline">
                  {z.footerLink}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;
