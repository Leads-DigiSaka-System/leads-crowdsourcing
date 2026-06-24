"use client";
import { Mail, MapPin, Phone } from "lucide-react";

const partners = [
  {
    src: "/partners/world-vegetable-center.svg",
    alt: "World Vegetable Center",
    url: "https://avrdc.org/",
  },
  {
    src: "/partners/IFPRI-logo.svg",
    alt: "IFPRI",
    url: "https://www.ifpri.org/",
  },
  {
    src: "/partners/dost-fnri.jpg",
    alt: "DOST-FNRI",
    url: "https://www.fnri.dost.gov.ph/",
  },
  {
    src: "/digisakaweb.svg",
    alt: "Digisakaweb",
    url: "https://leadsagri.com/",
  },
  {
    src: "/partners/serca.jpg",
    alt: "SEARCA",
    url: "https://www.searca.org/",
  },
  {
    src: "/partners/varacco_logo.svg",
    alt: "VARRACO",
    url: "https://www.varacco.com/",
  },
  {
    src: "/partners/dost-logo.png",
    alt: "DOST",
    url: "https://www.dost.gov.ph/",
  },
  {
    src: "/partners/LGU-Bay-Laguna.png",
    alt: "LGU-LAGUNA",
    url: "https://bay.gov.ph/",
  },
  {
    src: "/partners/LGU-los-banos-laguna.png",
    alt: "LGU-LOS-BANOS",
    url: "https://losbanos.gov.ph/",
  },
  {
    src: "/partners/LGU-pila.png",
    alt: "LGU-PILA",
    url: "https://elgu-pila-laguna.e.gov.ph/",
  },
  {
    src: "/partners/LGU-sta.-maria-laguna.jpg",
    alt: "LGU-STA.MARIA",
    url: "https://www.facebook.com/LGUMarilag/",
  },
  {
    src: "/partners/DLSU-logo.png",
    alt: "DLSU",
    url: "https://www.dlsu.edu.ph/",
  },
];

const Footer = () => {
  return (
    <footer className="relative bg-muted/30 border-t border-primary/10">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Company Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Research<span className="text-primary">Bayanihan</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Empowering scientific breakthroughs through transparent
                  blockchain-powered crowdfunding. Supporting Filipino farmers
                  and researchers nationwide.
                </p>
              </div>

              {/* Social Links */}
              {/* <div className="flex space-x-4">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div> */}
            </div>

            {/* Contact & Support */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-foreground">
                Contact & Support
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    main@impactrd.org
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    (049) 547 7357
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    47 Razburg Bldg., Manese St., San Agustin, Bay, Laguna
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          {/* <div className="border-t border-primary/10 pt-12 mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="text-2xl font-bold text-foreground mb-4">Stay Updated on Research Breakthroughs</h4>
              <p className="text-muted-foreground mb-8">
                Get weekly updates on funded projects, new research opportunities, and platform developments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-primary/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                />
                <button className="group bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center">
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div> */}

          {/* Partners in Footer (mapped) */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">
                Our Partners
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-items-center">
              {partners.map((partner, idx) => (
                <a
                  key={idx}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-20 p-4 hover:scale-105 transition-transform"
                  aria-label={partner.alt}
                >
                  <img
                    src={partner.src}
                    alt={partner.alt}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-primary/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                © 2025 IMPACT R&D Philippines. All rights reserved.
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Cookie Policy
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
