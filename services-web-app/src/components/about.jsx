import "../styles/about.css";

const About = () => {
  return (
    <section className="about-area full-section">
      <div className="about-container">
        <div className="about-content">
          {/* Text */}
          <div className="about-text">
            <h2>About Subic Bay Home Services</h2>
            <p>
              We are dedicated to providing top-notch home services to residents
              in the Subic Bay area. Our team of professionals is committed to
              ensuring customer satisfaction through quality workmanship and
              reliable service.
            </p>
          </div>

          {/* Images */}
          <div className="about-images">
            <img
              src={require("../assets/about-image1.jpg")}
              alt="Home service 1"
            />
            <img
              src={require("../assets/about-image2.jpg")}
              alt="Home service 2"
            />
            <img
              src={require("../assets/about-image3.jpg")}
              alt="Home service 3"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
