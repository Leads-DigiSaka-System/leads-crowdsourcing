"use client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { ArrowRight, Search, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";

const Hero = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({});

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/projects/featured?limit=5", {
          cache: "no-store",
        });
        const data = res.ok ? await res.json() : [];
        if (!active) return;
        setProjects(Array.isArray(data) && data.length > 0 ? data : []);
      } catch {
        if (!active) return;
        setProjects([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  // Helper to handle image load
  const handleImageLoad = (id) => {
    setImageLoaded((prev) => ({ ...prev, [id]: true }));
  };

  const handleRoleAction = () => {
    const role = session?.user?.role;
    if (!role || role === "user") {
      router.push("/apply-researcher");
    } else if (role === "researcher") {
      router.push("/dashboard");
    } else if (role === "admin") {
      router.push("/admin/researcher-applications");
    }
  };

  return (
    <>
      <section className="relative overflow-hidden xl:pb-8">
        <div className="relative container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto ">
            {/* Badge - centered above both columns */}
            <div className="text-center mb-8">
              <a
                href="https://www.impactofresearch.org/highlights"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={0}
                aria-label="Visit IMPACT R&D website"
                className="inline-block mb-8"
              >
                <Badge className="inline-flex items-center px-6 py-3 rounded-full bg-secondary/30 text-foreground text-sm font-semibold shadow-sm">
                  <Star className="w-6 h-6 sm:w-4 sm:h-4 text-primary mr-3 fill-current" />
                  <span className="break-words whitespace-pre-line">
                    IMPACT R&D is an all-Filipino research NGO recognized as a
                    DOST S&T Foundation
                  </span>
                </Badge>
              </a>
            </div>

            {/* Two-column layout */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Text content */}
              <div className="text-center lg:text-left">
                <motion.h1
                  className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  Help <span className="text-primary">FUND </span> the next wave
                  of scientific research
                </motion.h1>
                <motion.p
                  className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                >
                  Connect with research projects with high societal relevance,
                  support innovative scientists, and be part of discoveries that
                  shape our future.
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row lg:justify-start justify-center gap-4 mb-8"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                >
                  <Button
                    size="xl"
                    className="group bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center"
                    onClick={handleRoleAction}
                  >
                    {session?.user?.role === "admin"
                      ? "Go to Admin Applications"
                      : session?.user?.role === "researcher"
                        ? "Go to Dashboard"
                        : "Apply to be a Researcher"}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Link href={"/discover"}>
                    <Button
                      size="xl"
                      variant="outline"
                      className="group bg-background w-full hover:bg-muted text-foreground border-2 border-primary hover:border-primary/80 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center cursor-pointer"
                    >
                      Browse Projects
                      <Search className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Right column - Research image */}
              <div className="relative">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 3000,
                      stopOnInteraction: false,
                      stopOnMouseEnter: false,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent>
                    {loading ? (
                      <CarouselItem key="skeleton">
                        <div className="relative rounded-2xl overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 bg-primary px-6 py-4" />
                        </div>
                      </CarouselItem>
                    ) : (
                      (projects.length > 0
                        ? projects
                        : [
                            {
                              id: "placeholder-1",
                              title: "NCAS APP",
                              authors: "IMPACT R&D",
                              image: "/demo images/NCAS-App.png",
                            },
                          ]
                      ).map((project, idx) => {
                        const id = project.id || idx;
                        const showPlaceholder = !imageLoaded[id];
                        return (
                          <CarouselItem key={id}>
                            <Link
                              href={`/discover/${project.slug || id}`}
                              className="relative rounded-2xl overflow-hidden cursor-pointer"
                            >
                              {showPlaceholder && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse z-10"></div>
                              )}
                              <Image
                                src={
                                  project.image || "/demo images/NCAS-App.png"
                                }
                                alt={project.title}
                                width={400}
                                height={400}
                                className="w-full h-[400px] lg:h-[500px] object-cover"
                                loading="lazy"
                                onLoad={() => handleImageLoad(id)}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-primary px-6 py-4">
                                <div className="text-white">
                                  <h3 className="font-semibold text-lg mb-1">
                                    {project.title}
                                  </h3>
                                  <p className="text-sm opacity-90">
                                    {project.authors}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </CarouselItem>
                        );
                      })
                    )}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
