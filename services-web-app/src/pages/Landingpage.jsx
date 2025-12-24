import React from 'react';
import Navbar from '../components/navbar';
import Hero from '../components/hero';
import About from '../components/about';
import Services from '../components/services';

const Landingpage = () => {
  return (
    <div className="Landingpage">
        <Navbar />
        <Hero />
        <About />
        <Services />

    </div>
    );
}

export default Landingpage;