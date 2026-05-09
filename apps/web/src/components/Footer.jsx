
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { MercadoPagoDonationButton } from '@/components/MercadoPagoDonationButton.jsx';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1E3A8A] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Links útiles */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Links útiles</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-secondary transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-secondary transition-colors duration-200">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-secondary transition-colors duration-200">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-secondary transition-colors duration-200">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Categorías</h3>
            <ul className="space-y-2">
              <li className="hover:text-secondary transition-colors duration-200 cursor-pointer">Seguridad</li>
              <li className="hover:text-secondary transition-colors duration-200 cursor-pointer">Normativas</li>
              <li className="hover:text-secondary transition-colors duration-200 cursor-pointer">Charlas de 5 Minutos</li>
              <li className="hover:text-secondary transition-colors duration-200 cursor-pointer">Matrices IPER</li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Av. Providencia 1234, Santiago, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">+56 2 2345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">contacto@preventivoscl.com</span>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Redes sociales</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col items-center gap-3 text-center mb-8">
            <p className="text-sm text-white/85 max-w-md">
              Si este proyecto te resulta útil, podés apoyarnos con una donación; si ya configuraste Mercado
              Pago, el botón abre el pago seguro.
            </p>
            <MercadoPagoDonationButton size="lg" />
          </div>
          <div className="text-center">
            <p className="text-sm">
              © {currentYear} Preventivos CL. Todos los derechos reservados.
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <span className="text-sm hover:text-secondary transition-colors duration-200 cursor-pointer">
                Política de Privacidad
              </span>
              <span className="text-sm">•</span>
              <span className="text-sm hover:text-secondary transition-colors duration-200 cursor-pointer">
                Términos de Servicio
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
