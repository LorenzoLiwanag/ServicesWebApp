import "../../styles/landing-page/hero.css";

const Hero = () => {
  return (
    <section className="hero-area full-section" id="home">
      <div className="hero-container">
        <div className="hero-grid">
          {/* Left */}
          <div className="hero-left">
            <h2>Reliable Home Services, Book in Minutes</h2>
            <p>
              Connect with trusted handymen and cleaning professionals through one
              simple, secure platform.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#services">Get Started</a>
              <a className="btn btn-secondary" href="#contact">Contact</a>
            </div>

            {/* Extra bubbles around title/text */}
            <span className="hero-dot hero-dot-4" />
            <span className="hero-dot hero-dot-5" />
            <span className="hero-dot hero-dot-6" />
            <span className="hero-ring hero-ring-3" />
            <span className="hero-ring hero-ring-4" />
          </div>

          {/* Right */}
          <div className="hero-right">
            <div className="hero-visual">
              <div className="hero-blob">
                <img
                  src={require("../../assets/heroimg.jpg")}
                  alt="Hero"
                  className="hero-img"
                />
              </div>

              {/* Bubbles around picture */}
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
