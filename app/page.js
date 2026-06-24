import { Suspense } from 'react';
import FeaturedExperiments from '@/components/FeaturedExperiments';
import FeaturedDonors from '@/components/FeaturedDonors';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import PartnersSection from '@/components/PartnersSection';
import ResearchPackagesSection from '@/components/research-packages-section';
import { FeaturedExperimentsSkeleton } from '@/components/featured-experiment-skeleton';
import { FeaturedDonorsSkeleton } from '@/components/featured-donors-skeleton';
import StepsSection from '@/components/steps-section';
import TransparencySection from '@/components/blockchain-section';
import PaymentGuideVideo from '@/components/payment-guide-video';
import WhoCanDonate from '@/components/who-can-donate';

const Home = async () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <PartnersSection />
      <PaymentGuideVideo />
      <WhoCanDonate />
      <StepsSection />
      <ResearchPackagesSection />
      <TransparencySection />

      {/* Let client components fetch their own data; keep Suspense as optional fallback */}
      <Suspense fallback={<FeaturedExperimentsSkeleton />}>
        <FeaturedExperiments />
      </Suspense>

      <Suspense fallback={<FeaturedDonorsSkeleton />}>
        <FeaturedDonors />
      </Suspense>

      <Footer />
    </div>
  )
}

export default Home
