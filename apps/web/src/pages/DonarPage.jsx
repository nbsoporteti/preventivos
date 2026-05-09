import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	getMercadoPagoDonationUrl,
	MercadoPagoCheckoutButton,
} from '@/components/MercadoPagoDonationButton.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { mergeDonarCms } from '@/lib/cms/donarCmsModel.js';
import { ChevronLeft, Heart, Lock, ShieldCheck, Sparkles } from 'lucide-react';

const DonarPage = () => {
	const mpUrl = getMercadoPagoDonationUrl();
	const [cms, setCms] = useState(() => mergeDonarCms({}));

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const r = await apiServerClient.fetch('/catalog/cms/pages/donar');
				if (!r.ok || cancelled) return;
				const data = await r.json();
				if (!cancelled) setCms(mergeDonarCms(data));
			} catch {
				/* red silenciosa: se mantiene merge inicial */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const b = cms.bloques;

	return (
		<>
			<Helmet>
				<title>{cms.meta_title}</title>
				<meta name="description" content={cms.meta_description} />
			</Helmet>
			<div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-sky-50/40 to-muted/30">
				<Header />

				<main className="flex-1" id="main-donar">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 max-w-2xl">
						<Button
							variant="ghost"
							asChild
							className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
						>
							<Link to="/">
								<ChevronLeft className="w-4 h-4 mr-1" />
								{b.backLinkLabel}
							</Link>
						</Button>

						<div className="text-center mb-10">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#009ee3]/20 to-primary/15 text-[#009ee3] mb-6 shadow-inner">
								<Heart className="w-8 h-8" fill="currentColor" fillOpacity={0.15} aria-hidden />
							</div>
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 text-balance">
								{b.heroTitle}
							</h1>
							<p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto">
								{b.heroLeadBefore}
								<span className="text-foreground font-medium">{b.heroLeadBold}</span>
								{b.heroLeadAfter}
							</p>
						</div>

						<Card className="border-primary/15 shadow-lg shadow-primary/5 overflow-hidden">
							<div className="h-1 w-full bg-gradient-to-r from-[#009ee3] via-primary to-sky-500" aria-hidden />
							<CardContent className="p-8 md:p-10 space-y-8">
								<div className="flex gap-3 text-left rounded-xl bg-muted/50 p-4 border border-border/60">
									<Lock className="w-5 h-5 text-[#009ee3] shrink-0 mt-0.5" aria-hidden />
									<p className="text-sm text-muted-foreground leading-relaxed">
										{b.securityLead}
										<strong className="text-foreground">{b.securityHighlight}</strong>
										{b.securityTrail}
									</p>
								</div>

								{mpUrl ? (
									<div className="space-y-6 text-center">
										<MercadoPagoCheckoutButton
											className="w-full max-w-md mx-auto"
											size="xl"
										/>
										<p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
											<Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden />
											{b.mpCtaHint}
										</p>
									</div>
								) : (
									<div className="rounded-xl border border-dashed border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-6 text-center space-y-3">
										<p className="text-sm text-foreground font-medium">{b.noMpTitle}</p>
										<p className="text-sm text-muted-foreground leading-relaxed">{b.noMpBody}</p>
										<Button asChild variant="outline" className="mt-2">
											<Link to="/contacto#donaciones">{b.noMpContactLabel}</Link>
										</Button>
									</div>
								)}

								<div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground border-t border-border/60">
									<span className="inline-flex items-center gap-1.5">
										<ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
										{b.trustLine1}
									</span>
									<span>{b.trustLine2}</span>
								</div>
							</CardContent>
						</Card>

						<p className="text-center text-sm text-muted-foreground mt-10 max-w-md mx-auto leading-relaxed">
							{b.signoffParagraph}
							<span className="block mt-2">{b.signoffAttribution}</span>
						</p>
					</div>
				</main>

				<Footer />
			</div>
		</>
	);
};

export default DonarPage;
