
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { mergeVerificarEmailCms } from '@/lib/cms/authCmsModels.js';
import { fillTemplate } from '@/lib/cms/cmsCore.js';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [cms, setCms] = useState(() => mergeVerificarEmailCms({}));

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/verificar_email');
        if (!r.ok || c) return;
        const data = await r.json();
        if (!c) setCms(mergeVerificarEmailCms(data));
      } catch {
        /* */
      }
    })();
    return () => { c = true; };
  }, []);

  const z = cms.bloques;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiServerClient.fetch('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: code })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Código inválido o expirado');
      }

      toast.success('¡Email verificado correctamente! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      setIsResending(true);
      const response = await apiServerClient.fetch('/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Error al reenviar el código');
      }

      toast.success('Nuevo código enviado a tu correo');
      setCountdown(60);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsResending(false);
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
          <Card className="w-full max-w-md shadow-xl border-border/50 text-center">
            <CardHeader className="space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <MailCheck className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">{z.cardTitle}</CardTitle>
              <CardDescription className="text-base px-4">
                {z.cardDescBefore} <br/>
                <strong className="text-foreground font-medium">{email}</strong>
                {z.cardDescAfter ? (
                  <>
                    <br />
                    {z.cardDescAfter}
                  </>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2 max-w-[200px] mx-auto">
                  <Input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" 
                    className="text-center text-3xl tracking-widest h-16 bg-background font-mono font-medium"
                    required 
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
                  disabled={isLoading || code.length !== 6}
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
              <Button 
                variant="ghost" 
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                className="text-muted-foreground hover:text-primary"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className={`w-4 h-4 mr-2 ${countdown > 0 ? 'opacity-50' : ''}`} />
                )}
                {countdown > 0 ? fillTemplate(z.resendWait, { s: countdown }) : z.resendReady}
              </Button>
            </CardFooter>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VerifyEmailPage;
