import "../../styles/landing-page/about.css";
import aboutImageOne from "../../assets/about-image1.jpg";
import aboutImageTwo from "../../assets/about-image2.jpg";
import aboutImageThree from "../../assets/about-image3.jpg";
import aboutImageFour from "../../assets/about-image4.jpg";

const aboutFeatures = [
  {
    title: "Trusted Professionals",
    description: "Connect with verified service providers you can rely on.",
  },
  {
    title: "Easy Booking",
    description: "Find, communicate, and book services in minutes.",
  },
];

const aboutImages = [
  { src: aboutImageOne, alt: "Home service provider preparing cleaning supplies" },
  { src: aboutImageTwo, alt: "Clean living space after a home service visit" },
  { src: aboutImageThree, alt: "Service professional working inside a home" },
  { src: aboutImageFour, alt: "Organized home maintenance tools" },
];

const About = () => {
  return (
    <section className="about-area full-section" id="about">
      <div className="about-container">
        <div className="about-content">
          <div className="about-card">
            <h2>About Works For You</h2>

            <p>
              Whether you're a service provider looking for new opportunities or a
              client searching for dependable home services, Works For You
              connects you in one secure platform. We focus on quality,
              transparency, and making every service experience simple and reliable.
            </p>

            <div className="about-features">
              {aboutFeatures.map((feature) => (
                <div className="about-feature" key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>

            <a href="#services" className="about-btn">
              View Services &rarr;
            </a>
          </div>

          <div className="about-images" aria-label="Home service examples">
            {aboutImages.map((image) => (
              <img src={image.src} alt={image.alt} key={image.src} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
