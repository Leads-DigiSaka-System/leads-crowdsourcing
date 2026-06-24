"use client";
import Image from "next/image";

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

const PartnersSection = () => {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Our Partners</h2>
          </div>

          {/* Infinite Scrolling Partners */}
          <div className="relative">
            <div className="flex animate-scroll">
              {/* First set of partners */}
              {partners.map((partner, idx) => (
                <a
                  key={`first-${idx}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-80 h-40 bg-white p-6 flex-shrink-0 mx-4 hover:scale-105 transition-transform"
                  aria-label={partner.alt}
                >
                  <Image
                    src={partner.src}
                    alt={partner.alt}
                    width={280}
                    height={140}
                    className="max-w-full max-h-full object-contain"
                  />
                </a>
              ))}
              {/* Duplicate set for seamless loop */}
              {partners.map((partner, idx) => (
                <a
                  key={`second-${idx}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-80 h-40 bg-white p-6 flex-shrink-0 mx-4 hover:scale-105 transition-transform"
                  aria-label={partner.alt}
                >
                  <Image
                    src={partner.src}
                    alt={partner.alt}
                    width={280}
                    height={140}
                    className="max-w-full max-h-full object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
          width: fit-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default PartnersSection;
