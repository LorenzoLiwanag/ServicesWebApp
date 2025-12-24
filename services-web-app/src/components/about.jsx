import "../styles/about.css";

const About = () => {
  return (
    <section className="about-area full-section" id="about">
      <div className="about-container">
        <div className="about-content">

          <div className="about-card">
            <h1>About Subic Bay Home Services</h1>

            <p>
              Whether you’re a service provider looking for new opportunities or a
              client searching for dependable home services, Subic Bay Home Services
              connects you in one secure platform. We focus on quality,
              transparency, and making every service experience simple and reliable.
            </p>

            <div className="about-features">
              <div className="about-feature">
                <h4>Trusted Professionals</h4>
                <p>Connect with verified service providers you can rely on.</p>
              </div>

              <div className="about-feature">
                <h4>Easy Booking</h4>
                <p>Find, communicate, and book services in minutes.</p>
              </div>
            </div>

            <a href="#services" className="about-btn">
              View Services →
            </a>
          </div>
          {/* LEFT: Images */}
          <div className="about-images">
            <img src={require("../assets/about-image1.jpg")} alt="Home service 1" />
            <img src={require("../assets/about-image2.jpg")} alt="Home service 2" />
            <img src={require("../assets/about-image3.jpg")} alt="Home service 3" />
          </div>

          {/* RIGHT: Main Card */}

        </div>
      </div>
    </section>
  );
};

export default About;
