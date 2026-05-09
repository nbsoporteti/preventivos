
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import TeamCard from '@/components/TeamCard.jsx';
import StatCard from '@/components/StatCard.jsx';
import { mockTeam } from '@/data/mockTeam.js';
import { mockStats } from '@/data/mockStats.js';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lightbulb, Heart, Zap } from 'lucide-react';
import {
  MercadoPagoDonationButton,
} from '@/components/MercadoPagoDonationButton.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { mergeNosotrosCms } from '@/lib/cms/nosotrosCmsModel.js';

const VALOR_ICONS = [Shield, Lightbulb, Heart, Zap];

const AboutPage = () => {
  const [cms, setCms] = useState(() => mergeNosotrosCms({}));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiServerClient.fetch('/catalog/cms/pages/nosotros');
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCms(mergeNosotrosCms(data));
      } catch {
        /* defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const b = cms.bloques;
  const valores = [
    { id: 1, title: b.valor1Title, description: b.valor1Desc, icon: VALOR_ICONS[0] },
    { id: 2, title: b.valor2Title, description: b.valor2Desc, icon: VALOR_ICONS[1] },
    { id: 3, title: b.valor3Title, description: b.valor3Desc, icon: VALOR_ICONS[2] },
    { id: 4, title: b.valor4Title, description: b.valor4Desc, icon: VALOR_ICONS[3] },
  ];

  return (
    <>
      <Helmet>
        <title>{cms.meta_title}</title>
        <meta name="description" content={cms.meta_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}>
              {b.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {b.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Quiénes Somos */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-6 leading-snug">
                  {b.quienesTitle}
                </h2>
                <div className="space-y-4 text-base leading-relaxed max-w-prose">
                  <p>{b.quienesP1}</p>
                  <p>{b.quienesP2}</p>
                  <p>{b.quienesP3}</p>
                </div>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2"
                  alt={b.quienesImageAlt}
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Nuestra Misión */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-6 leading-snug">
                {b.misionTitle}
              </h2>
              <p className="text-lg leading-relaxed">
                {b.misionBody}
              </p>
            </div>
          </div>
        </section>

        {/* Nuestros Valores */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12 leading-snug">
              {b.valoresTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {valores.map((valor) => {
                const Icon = valor.icon;
                return (
                  <Card key={valor.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{valor.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{valor.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-br from-primary/8 via-background to-sky-50/40 border-y border-primary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#009ee3]/15 mb-2">
                <Heart className="w-7 h-7 text-[#009ee3]" aria-hidden />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{b.donateTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {b.donateBody}
              </p>
              <div className="pt-2 flex justify-center">
                <MercadoPagoDonationButton size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Equipo */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12 leading-snug">
              {b.equipoTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {mockTeam.map(member => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>

        {/* Estadísticas */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12 leading-snug">
              {b.impactoTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockStats.map(stat => (
                <StatCard key={stat.id} stat={stat} />
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
