import { SEOHead } from '@/components/SEOHead';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CustomCursor } from '@/components/CustomCursor';
import { ScrollProgress } from '@/components/ScrollProgress';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Services } from '@/components/Services';
import { Gallery } from '@/components/Gallery';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Enquiry } from '@/components/Enquiry';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { FloatingButtons } from '@/components/FloatingButtons';

export default function Home() {
  return (
    <>
      <SEOHead />
      <LoadingScreen />
      <CustomCursor />
      <ScrollProgress />
      <FloatingButtons />
      
      <main className="min-h-[100dvh] flex flex-col overflow-hidden selection:bg-secondary selection:text-primary">
        <Navbar />
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Testimonials />
        <FAQ />
        <Enquiry />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
