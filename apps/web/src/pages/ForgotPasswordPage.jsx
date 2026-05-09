
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, Send } from 'lucide-react';
import { mergeRecuperarContrasenaCms } from '@/lib/cms/authCmsModels.js';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cms, setCms] = useState(() => mergeRecuperarContrasenaCms({}));

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/recuperar_contrasena');
        if (!r.ok || c) return;
        const data = await r.json();
        if (!c) setCms(mergeRecuperarContrasenaCms(data));
      } catch {
        /* */
      }
    })();
    return () => { c = true; };
  }, []);

  const z = cms.bloques;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');

    if (!email) return;

    try {
      setIsLoading(true);
      const response = await apiServerClient.fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        // Continue even if fail to prevent email enumeration, but we'll show generic success
      }
      
      setIsSent(true);
      toast.success('Instrucciones enviadas si el correo existe en nuestro sistema.');
    } catch (error) {
      toast.error('Ocurrió un error. Inténtalo de nuevo más tarde.');
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
              <CardTitle className="text-2xl font-bold tracking-tight">{z.cardTitle}</CardTitle>
              <CardDescription className="text-base">
                {isSent ? z.cardDescSent : z.cardDescForm}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSent ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                    <Send className="w-8 h-8" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {z.sentBody}
                  </p>
                </div>
              ) : (
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
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/50 pt-6">
              <Link to="/login" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {z.backLogin}
              </Link>
            </CardFooter>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ForgotPasswordPage;
