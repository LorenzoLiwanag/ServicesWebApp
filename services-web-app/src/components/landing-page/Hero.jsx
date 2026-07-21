import { Link } from "react-router-dom";
import "../../styles/landing-page/hero.css";
import heroImage from "../../assets/heroimg.jpg";

const Hero = () => {
  return (
    <section className="hero-area full-section" id="home">
      <div className="hero-container">
        <div className="hero-grid">
          <div className="hero-left">
            <h1>Reliable Home Services, Book in Minutes</h1>
            <p>
              Connect with trusted handymen and cleaning professionals through one
              simple, secure platform.
            </p>

            <div className="hero-actions">
              <Link className="btn btn-primary" to="/register">Get Started</Link>
              <a className="btn btn-secondary" href="#contact">Contact</a>
            </div>

            <span className="hero-dot hero-dot-4" />
            <span className="hero-dot hero-dot-5" />
            <span className="hero-dot hero-dot-6" />
            <span className="hero-ring hero-ring-3" />
            <span className="hero-ring hero-ring-4" />
          </div>

          <div className="hero-right">
            <div className="hero-visual">
              <div className="hero-blob">
                <img
                  src={heroImage}
                  alt="Home service professional cleaning a kitchen"
                  className="hero-img"
                />
              </div>

              <span className="hero-dot hero-dot-1" />
              <span className="hero-dot hero-dot-2" />
              <span className="hero-dot hero-dot-3" />
              <span className="hero-dot hero-dot-7" />
              <span className="hero-dot hero-dot-8" />
              <span className="hero-dot hero-dot-9" />
              <span className="hero-ring hero-ring-1" />
              <span className="hero-ring hero-ring-2" />
              <span className="hero-ring hero-ring-5" />
              <span className="hero-ring hero-ring-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
