import React from 'react';
import Navbar from '../components/navbar';
import Hero from '../components/hero';
import About from '../components/about';

const Landingpage = () => {
  return (
    <div className="Landingpage">
        <Navbar />
        <Hero />
        <About />
    </div>
    );
}

export default Landingpage;