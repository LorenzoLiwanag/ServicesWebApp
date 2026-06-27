import { useEffect } from 'react';
import Navbar from '../components/shared/Navbar';
import Hero from '../components/landing-page/Hero';
import About from '../components/landing-page/About';
import Services from '../components/landing-page/Services';
import Contact from '../components/landing-page/Contact';

const LandingPage = () => {
  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return;
    const id = hash.slice(1);

    // Images above the target section load lazily and shift the layout, so
    // re-align a few times until the position settles, then finish smoothly.
    let tries = 0;
    let timer;
    const align = () => {
      const target = document.getElementById(id);
      if (target) {
        const smooth = tries >= 6;
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
      if (++tries <= 6) {
        timer = setTimeout(align, 150);
      }
    };
    timer = setTimeout(align, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Contact />
      </main>
    </div>
  );
};

export default LandingPage;
