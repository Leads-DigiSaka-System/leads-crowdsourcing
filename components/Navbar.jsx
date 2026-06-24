"use client";
import {
  Menu,
  User,
  Settings,
  MessageSquare,
  LogOut,
  Home,
  Compass,
  LayoutDashboard,
  HandCoins,
  Folder,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

import { useSession, signOut } from "next-auth/react";
import { nameTitleCase } from "@/lib/utils";

import AvatarWithSkeleton from "@/components/ui/AvatarWithSkeleton";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Benefits", href: "/benefits", icon: Gift },
    { name: "Funding", href: "/funding", icon: HandCoins },
  ];

  // Admin links for dropdown/helper
  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/admin/projects", icon: Folder },
    { name: "Donations", href: "/admin/donations", icon: HandCoins },
    { name: "Meetings", href: "/admin/meetings", icon: MessageSquare },
    {
      name: "Applications",
      href: "/admin/researcher-applications",
      icon: User,
    },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Check if any admin page is active
  const isAdminActive = [
    "/admin/dashboard",
    "/admin/projects",
    "/admin/donations",
    "/admin/meetings",
    "/admin/researcher-applications",
  ].some((adminPath) => pathname.startsWith(adminPath));

  return (
    <nav className="w-full py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-6  xl:px-12">
        {/* Logo and Company Name */}
        <Link
          href="/"
          className="flex items-center gap-x-1.5 transition-transform duration-200"
        >
          <div className="relative">
            <Image
              src={"/researchbayanihan_logo.svg"}
              width={64}
              height={64}
              alt="IMPACT R&D logo"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm xl:text-base text-foreground tracking-tight leading-tight">
              <span className="text-primary">IMPACT </span>R&D
            </span>
            <span className="font-bold  tracking-wider leading-tight">
              Research<span className="text-primary">Bayanihan</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center ">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative px-2 xl:px-4 py-2 font-medium transition-all duration-300 group text-center flex items-center gap-1 xl:gap-2 ${
                isActive(link.href)
                  ? "text-primary bg-primary/10 rounded-xl"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.icon && <link.icon className="h-4 w-4 " />}
              {link.name}
            </Link>
          ))}
          {/* Dashboard link for users (not admin) */}
          {(session?.user?.role === "user" ||
            session?.user?.role === "researcher") && (
            <>
              <Link
                href="/dashboard"
                className={`relative px-2 xl:px-4 py-2 font-medium transition-all duration-300 group text-center flex items-center gap-1 xl:gap-2 ${
                  isActive("/dashboard")
                    ? "text-primary bg-primary/10 rounded-xl"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/meetings"
                className={`relative px-2 xl:px-4 py-2 font-medium transition-all duration-300 group text-center flex items-center gap-1 xl:gap-2 ${
                  isActive("/meetings")
                    ? "text-primary bg-primary/10 rounded-xl"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                My Meetings
              </Link>
            </>
          )}
          {session?.user?.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`relative px-4 py-2 font-medium transition-all duration-300 group text-center flex items-center gap-2 rounded-xl cursor-pointer ${
                    isAdminActive
                      ? "text-primary bg-primary/10 rounded-xl"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ boxShadow: "none" }}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[210px] rounded-xl shadow-lg border border-primary/20 bg-background mt-2 py-2">
                <div className="px-4 py-3 text-sm uppercase text-primary/80 tracking-wider border-b mb-1">
                  Admin Panel
                </div>
                {adminLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.name}
                    asChild
                    className={`rounded-lg cursor-pointer font-medium text-base flex items-center gap-2 px-3 py-2 transition-all duration-200
                      ${isActive(link.href) ? "text-primary bg-primary/10" : "hover:bg-primary/10 focus:bg-primary/10"}`}
                  >
                    <Link
                      href={link.href}
                      className="w-full text-sm flex items-center gap-2"
                    >
                      {link.icon && <link.icon className="h-4 w-4 mr-1" />}
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Search and Profile */}
        <div className="flex items-center space-x-1 ml-2">
          {/* Desktop Search Input */}
          {/* <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10 w-44 bg-muted/50 border-input focus:bg-background"
            />
          </div> */}

          {/* Profile Dropdown or Login Link */}
          {status === "loading" ? null : !session ? (
            <Button variant="outline" asChild>
              <Link href="/login" className="text-xs sm:text-sm">
                <User className="h-4 w-4" />
                Login
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="flex items-center py-4 gap-2">
                  <AvatarWithSkeleton
                    src={session.user.image}
                    fallbackText={session.user?.name?.[0]?.toUpperCase() || "U"}
                  />
                  <div className="border-b">
                    <p className="text-sm font-semibold text-foreground">
                      {nameTitleCase(session.user?.name) || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.user?.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-primary" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 px-4">
              <div className="flex flex-col space-y-8 mt-8">
                <SheetTitle className="flex items-center pb-6 border-b">
                  <div className="relative p-1">
                    <Image
                      src={"/researchbayanihan_logo.svg"}
                      width={52}
                      height={52}
                      alt="IMPACT R&D logo"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-base tracking-tight">
                      IMPACT{" "}
                      <span className="text-primary font-extrabold">R&D</span>
                    </span>
                    <p className="text-xs text-primary font-semibold tracking-wider uppercase">
                      Research Fundsourcing
                    </p>
                  </div>
                </SheetTitle>

                {/* Mobile Search */}
                {/* <div className="flex items-center relative">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search projects, topics..."
                    className="pl-10 bg-muted/50 focus:bg-background"
                    tabIndex={-1}
                  />
                </div> */}

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center px-4 py-4 font-semibold rounded-lg transition-all duration-200 gap-2 ${
                        isActive(link.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {link.icon && <link.icon className="h-5 w-5 mr-2" />}
                      {link.name}
                    </Link>
                  ))}
                  {/* Dashboard link for users (not admin) */}
                  {(session?.user?.role === "user" ||
                    session?.user?.role === "researcher") && (
                    <>
                      <Link
                        href="/dashboard"
                        className={`flex items-center px-4 py-4 font-semibold rounded-lg transition-all duration-200 gap-2 ${
                          isActive("/dashboard")
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <LayoutDashboard className="h-5 w-5 mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        href="/meetings"
                        className={`flex items-center px-4 py-4 font-semibold rounded-lg transition-all duration-200 gap-2 ${
                          isActive("/meetings")
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <MessageSquare className="h-5 w-5 mr-2" />
                        My Meetings
                      </Link>
                    </>
                  )}
                  {session?.user?.role === "admin" && (
                    <div className="mt-4">
                      <div className="px-4 py-2 text-xs font-bold uppercase text-primary/80 tracking-wider">
                        Admin
                      </div>
                      <div className="flex flex-col space-y-2">
                        {adminLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center px-4 py-3 font-semibold rounded-lg transition-all duration-200 gap-2 ${
                              isActive(link.href)
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            {link.icon && (
                              <link.icon className="h-5 w-5 mr-2" />
                            )}
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
