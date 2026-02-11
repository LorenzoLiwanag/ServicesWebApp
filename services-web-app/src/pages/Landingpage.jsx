import Navbar from '../components/shared/Navbar';
import Hero from '../components/landing-page/Hero';
import About from '../components/landing-page/About';
import Services from '../components/landing-page/Services';
import Contact from '../components/landing-page/Contact';

const LandingPage = () => {
  return (
    <div className="Landingpage">
        <Navbar />
        <Hero />
        <About />
        <Services />
        <Contact />

    </div>
    );
}

export default LandingPage;