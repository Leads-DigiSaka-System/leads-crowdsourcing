import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/login/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { EdgeStoreProvider } from "@/lib/edgestore";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Research Funding Crowdsourcing Platform for Filipino Researchers | Support Science Projects in the Philippines",
  description:
    "Connect with Filipino researchers and help fund innovative science projects through our crowdsourcing platform. Empower research and support innovation in the Philippines by donating to groundbreaking studies and collaborating with top scientists. Join a community dedicated to advancing scientific discovery and making a real impact.",
  keywords: [
    "research funding",
    "crowdsourcing",
    "Philippines",
    "Filipino researchers",
    "science projects",
    "donate to research",
    "support innovation",
    "scientific collaboration",
    "fund research",
    "Philippine science",
    "research grants",
    "academic funding",
    "scientific projects",
    "innovation support"
  ],
  openGraph: {
    images: [
      {
        url: "https://impactofresearch.fund/researchbayanihan_logo.svg",
        alt: "IMPACT Research Crowdsourcing Logo",
        type: "image/svg+xml",
        width: 1280,
        height: 930
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://impactofresearch.fund/researchbayanihan_logo.svg"
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EdgeStoreProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors />
        </EdgeStoreProvider>
      </body>
    </html>
  );
}
