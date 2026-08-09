import { useEffect } from 'react';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import About from '../components/About';
import Timeline from '../components/Timeline';
import EventsPreview from '../components/EventsPreview';
import CubeSection from '../components/CubeSection';
import DepartmentsGrid from '../components/DepartmentsGrid';
import Gallery from '../components/Gallery';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import RegistrationModal from '../components/RegistrationModal';

/**
 * Home — simple composition. No shared scroll timeline; every section
 * animates independently via ScrollReveal/ScrollFloat and its own
 * intersection observer.
 */
export default function Home() {
  useEffect(() => {
    document.title = "HexaVerse CloudFest '26 — AWS Student Builder Group, DBIT";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'A 6-week interdepartmental technical engagement series featuring workshops, department events, and mega events. Organized by AWS Student Builder Group, DBIT.',
      );
    }
  }, []);

  return (
    <>
      <Nav />
      <Hero />
      <About />
      <Timeline />
      <EventsPreview />
      <CubeSection />
      <DepartmentsGrid />
      <Gallery />
      <ContactSection />
      <Footer />
      <BackToTop />
      <RegistrationModal />
    </>
  );
}
