import { Link } from "react-router-dom";
import "../../styles/landing-page/services.css";
import handymanImg from "../../assets/service-handyman.jpg";
import cleaningImg from "../../assets/service-cleaning.jpg";
import deepCleaningImg from "../../assets/service-deep-cleaning.jpg";
import movingImg from "../../assets/service-moving.jpg";
import yardImg from "../../assets/service-yard.jpg";
import repairsImg from "../../assets/service-repairs.jpg";

const services = [
  {
    image: handymanImg,
    alt: "Handyman tool kit with screwdriver bits",
    title: "Handyman Services",
    description: "Repairs, installations, and odd jobs handled by trusted pros.",
  },
  {
    image: cleaningImg,
    alt: "Professional cleaning a home window",
    title: "General Cleaning",
    description: "Routine home cleaning to keep your space fresh and tidy.",
  },
  {
    image: deepCleaningImg,
    alt: "Gloved hand holding a cleaning spray bottle",
    title: "Deep Cleaning",
    description: "A detailed clean for kitchens, bathrooms, and hard-to-reach areas.",
  },
  {
    image: movingImg,
    alt: "Movers loading a moving truck",
    title: "Moving Help",
    description: "Packing support, loading/unloading, and light moving assistance.",
  },
  {
    image: yardImg,
    alt: "Freshly maintained green lawn",
    title: "Yard & Outdoor",
    description: "Basic yard cleanup, trimming, and outdoor maintenance help.",
  },
  {
    image: repairsImg,
    alt: "Cordless power drill for minor repairs",
    title: "Minor Repairs",
    description: "Quick fixes around the house to keep everything working smoothly.",
  },
];

const Services = () => {
  return (
    <section className="services-area full-section" id="services">
      <div className="services-container">
        <div className="services-header">
          <h2>Services</h2>
          <p>
            Browse common home services and connect with professionals in minutes.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <div className="service-image-wrap">
                <img
                  className="service-image"
                  src={service.image}
                  alt={service.alt}
                  loading="lazy"
                />
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
            </article>
          ))}
        </div>

        <div className="services-cta">
          <Link className="btn btn-primary" to="/register">
            Get Started now
          </Link>
          <a className="btn btn-secondary" href="#contact">
            Get in Touch with us
          </a>
        </div>

        <span className="services-dot services-dot-1" />
        <span className="services-dot services-dot-2" />
        <span className="services-dot services-dot-3" />
        <span className="services-dot services-dot-4" />
        <span className="services-dot services-dot-5" />
        <span className="services-ring services-ring-1" />
        <span className="services-ring services-ring-2" />
        <span className="services-ring services-ring-3" />
        <span className="services-ring services-ring-4" />
      </div>
    </section>
  );
};

export default Services;
