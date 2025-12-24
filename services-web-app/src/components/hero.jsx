import "../styles/hero.css";

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

          </div>

          {/* Right */}
          <div className="hero-right">
            <div className="hero-visual">
              <div className="hero-blob">
                <img
                  src={require("../assets/heroimg.jpg")}
                  alt="Hero"
                  className="hero-img"
                />
              </div>

              {/* Decorative shapes (no text) */}
              <span className="hero-dot hero-dot-1" />
              <span className="hero-dot hero-dot-2" />
              <span className="hero-dot hero-dot-3" />
              <span className="hero-ring hero-ring-1" />
              <span className="hero-ring hero-ring-2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
