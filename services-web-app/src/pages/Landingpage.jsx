import Navbar from '../components/navbar';
import Hero from '../components/hero';
import About from '../components/about';
import Services from '../components/services';
import Contact from '../components/contact';

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