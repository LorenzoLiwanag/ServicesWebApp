import "../styles/hero.css";

const Hero = () => {
  return (
    <section className="hero-area">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-intro">
            <h2>Reliable Home Services, Book in Minutes</h2>
            <p>
              Connect with trusted handymen and cleaning professionals through one
              simple, secure platform.
            </p>
          </div>

          <div className="hero-image">
            <img
              src={require("../assets/hero-image.jpg")}
              alt="Hero"
              className="hero-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
