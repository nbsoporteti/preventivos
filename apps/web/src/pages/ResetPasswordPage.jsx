
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { mergeResetearContrasenaCms } from '@/lib/cms/authCmsModels.js';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[\W_]/.test(password);
  const isPasswordValid = minLength && hasUpper && hasLower && hasNumber && hasSymbol;

  const [cms, setCms] = useState(() => mergeResetearContrasenaCms({}));
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/resetear_contrasena');
        if (!r.ok || c) return;
        const data = await r.json();
        if (!c) setCms(mergeResetearContrasenaCms(data));
      } catch {
        /* */
      }
    })();
    return () => { c = true; };
  }, []);

  const z = cms.bloques;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const confirmPassword = formData.get('confirmPassword');

    if (!isPasswordValid) {
      toast.error('La contraseña no cumple con los requisitos');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiServerClient.fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token inválido o expirado');
      }

      toast.success('Contraseña restablecida exitosamente. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const RequirementItem = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-success' : 'text-muted-foreground'}`}>
      {met ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{cms.meta_title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
          <Card className="w-full max-w-lg shadow-xl border-border/50">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight">{z.cardTitle}</CardTitle>
              <CardDescription className="text-base">
                {z.cardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">{z.labelPassword}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-background"
                      required 
                    />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2 border border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <RequirementItem met={minLength} text={z.reqLen} />
                    <RequirementItem met={hasUpper} text={z.reqUpper} />
                    <RequirementItem met={hasLower} text={z.reqLower} />
                    <RequirementItem met={hasNumber} text={z.reqNum} />
                    <RequirementItem met={hasSymbol} text={z.reqSym} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{z.labelConfirm}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      className="pl-10 bg-background"
                      required 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
                  disabled={isLoading || !isPasswordValid}
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
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ResetPasswordPage;
