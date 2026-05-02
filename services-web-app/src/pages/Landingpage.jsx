import Navbar from '../components/shared/Navbar';
import Hero from '../components/landing-page/Hero';
import About from '../components/landing-page/About';
import Services from '../components/landing-page/Services';
import Contact from '../components/landing-page/Contact';

const LandingPage = () => {
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
