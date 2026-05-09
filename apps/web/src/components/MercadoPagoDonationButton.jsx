import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * URL del link de pago / checkout de Mercado Pago (creado en tu cuenta: Link de pago).
 * Definí `VITE_MERCADOPAGO_DONATION_URL` en `apps/web/.env` y reiniciá Vite.
 */
export function getMercadoPagoDonationUrl() {
	return String(import.meta.env.VITE_MERCADOPAGO_DONATION_URL || '').trim();
}

/** Estilo visual común (identidad MP + CTA destacado). */
const MP_DONATE_STYLE = cn(
	'relative overflow-hidden border-0 font-semibold tracking-tight text-white',
	'bg-gradient-to-b from-[#2bc4ff] from-0% via-[#00a8eb] via-35% to-[#0088d4] to-100%',
	'shadow-[0_6px_20px_-4px_rgba(0,158,227,0.55),0_2px_8px_-2px_rgba(0,0,0,0.12)]',
	'ring-2 ring-white/30 ring-inset',
	'before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none',
	'hover:from-[#1fb8f5] hover:via-[#009ee3] hover:to-[#0075bd]',
	'hover:shadow-[0_10px_28px_-6px_rgba(0,158,227,0.55),0_4px_12px_-4px_rgba(0,0,0,0.14)]',
	'hover:brightness-[1.03]',
	'focus-visible:ring-2 focus-visible:ring-[#009ee3] focus-visible:ring-offset-2',
	'transition-[transform,box-shadow,filter] duration-200 ease-out',
	'active:scale-[0.98] active:brightness-[0.98]',
);

const SIZE_CLASSES = {
	sm: 'h-10 min-h-10 rounded-xl px-5 text-sm gap-2.5 [&_svg]:!size-[1.125rem]',
	default:
		'h-12 min-h-12 rounded-xl px-7 md:px-9 text-[0.9375rem] md:text-base gap-3 [&_svg]:!size-5',
	lg: 'h-14 min-h-14 rounded-2xl px-8 md:px-10 text-base md:text-lg gap-3.5 [&_svg]:!size-[1.375rem]',
	/** CTA principal en /donar */
	xl: 'h-16 min-h-16 rounded-2xl px-10 md:px-12 text-lg md:text-xl gap-3.5 !font-bold [&_svg]:!size-7',
};

const linkInnerClass =
	'no-underline inline-flex items-center justify-center gap-[inherit] w-full';

function CtaHeart() {
	return (
		<Heart
			className="shrink-0 drop-shadow-sm"
			strokeWidth={2.25}
			fill="currentColor"
			fillOpacity={0.18}
			aria-hidden
		/>
	);
}

/**
 * Botón principal de checkout en Mercado Pago (abre nueva pestaña).
 * Usar en `/donar`; requiere `VITE_MERCADOPAGO_DONATION_URL` definida.
 *
 * @param {'sm'|'default'|'lg'|'xl'} [props.size]
 */
export function MercadoPagoCheckoutButton({
	className,
	size = 'default',
	label = 'Donar con Mercado Pago',
}) {
	const url = getMercadoPagoDonationUrl();
	if (!url) return null;

	const sizeKey = size === 'default' ? 'default' : size;

	return (
		<Button
			asChild
			variant="default"
			size="lg"
			className={cn(
				'!font-semibold !shadow-none',
				MP_DONATE_STYLE,
				SIZE_CLASSES[sizeKey] || SIZE_CLASSES.default,
				className,
			)}
		>
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className={linkInnerClass}
				aria-label={`${label} — Mercado Pago en una pestaña nueva`}
			>
				<CtaHeart />
				{label}
			</a>
		</Button>
	);
}

/**
 * Enlace a la página interna `/donar` (donde está el copy y el checkout de MP).
 *
 * @param {'sm'|'default'|'lg'|'xl'} [props.size]
 */
export function MercadoPagoDonationButton({ className, size = 'default', label = 'Donar' }) {
	const sizeKey = size === 'default' ? 'default' : size;

	return (
		<Button
			asChild
			variant="default"
			size="lg"
			className={cn(
				'!font-semibold !shadow-none',
				MP_DONATE_STYLE,
				SIZE_CLASSES[sizeKey] || SIZE_CLASSES.default,
				className,
			)}
		>
			<Link to="/donar" className={linkInnerClass} aria-label={`${label} — página de donaciones`}>
				<CtaHeart />
				{label}
			</Link>
		</Button>
	);
}
