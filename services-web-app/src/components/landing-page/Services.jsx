import "../../styles/landing-page/services.css";

const services = [
  {
    icon: "\u{1F6E0}\uFE0F",
    title: "Handyman Services",
    description: "Repairs, installations, and odd jobs handled by trusted pros.",
  },
  {
    icon: "\u{1F9F9}",
    title: "General Cleaning",
    description: "Routine home cleaning to keep your space fresh and tidy.",
  },
  {
    icon: "\u{1F9FC}",
    title: "Deep Cleaning",
    description: "A detailed clean for kitchens, bathrooms, and hard-to-reach areas.",
  },
  {
    icon: "\u{1F69A}",
    title: "Moving Help",
    description: "Packing support, loading/unloading, and light moving assistance.",
  },
  {
    icon: "\u{1FAB4}",
    title: "Yard & Outdoor",
    description: "Basic yard cleanup, trimming, and outdoor maintenance help.",
  },
  {
    icon: "\u{1F527}",
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
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
              <div className="service-icon" aria-hidden="true">
                {service.icon}
              </div>
            </article>
          ))}
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
