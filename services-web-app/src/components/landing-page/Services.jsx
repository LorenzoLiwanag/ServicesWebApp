import "../../styles/landing-page/services.css";

const services = [
  {
    icon: "handyman",
    title: "Handyman Services",
    description: "Repairs, installations, and odd jobs handled by trusted pros.",
  },
  {
    icon: "cleaning",
    title: "General Cleaning",
    description: "Routine home cleaning to keep your space fresh and tidy.",
  },
  {
    icon: "deep-cleaning",
    title: "Deep Cleaning",
    description: "A detailed clean for kitchens, bathrooms, and hard-to-reach areas.",
  },
  {
    icon: "moving",
    title: "Moving Help",
    description: "Packing support, loading/unloading, and light moving assistance.",
  },
  {
    icon: "outdoor",
    title: "Yard & Outdoor",
    description: "Basic yard cleanup, trimming, and outdoor maintenance help.",
  },
  {
    icon: "repairs",
    title: "Minor Repairs",
    description: "Quick fixes around the house to keep everything working smoothly.",
  },
];

const ServiceIcon = ({ type }) => {
  const commonProps = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    handyman: (
      <>
        <path d="M13 36 34.5 14.5" />
        <path d="m30 11 7 7" />
        <path d="m9.5 39.5 7-1.5-5-5-2 6.5Z" />
        <path d="M27 12.5 34.5 5 43 13.5 35.5 21" />
      </>
    ),
    cleaning: (
      <>
        <path d="M17 9h14" />
        <path d="M24 9v8" />
        <path d="M18 17h12l4 25H14l4-25Z" />
        <path d="M16 31h16" />
        <path d="M20 36v6M28 36v6" />
      </>
    ),
    "deep-cleaning": (
      <>
        <path d="M18 16h12l3 26H15l3-26Z" />
        <path d="M21 16V9h6v7" />
        <path d="M17 31h14" />
        <path d="m35 9 1.5 3.5L40 14l-3.5 1.5L35 19l-1.5-3.5L30 14l3.5-1.5L35 9Z" />
        <path d="m10 20 1 2.5 2.5 1-2.5 1L10 27l-1-2.5-2.5-1 2.5-1L10 20Z" />
      </>
    ),
    moving: (
      <>
        <path d="M6 15h23v21H6z" />
        <path d="M29 22h7l6 7v7H29z" />
        <path d="M33 22v8h9" />
        <circle cx="14" cy="37" r="4" />
        <circle cx="35" cy="37" r="4" />
        <path d="M11 20h12M17 20v10" />
      </>
    ),
    outdoor: (
      <>
        <path d="M24 42V24" />
        <path d="M24 30c-8 0-13-5-13-13 8 0 13 5 13 13Z" />
        <path d="M24 24c0-8 5-13 13-13 0 8-5 13-13 13Z" />
        <path d="M12 42h24" />
        <path d="M17 42c1-6 3-9 7-12M31 42c-1-5-3-8-7-10" />
      </>
    ),
    repairs: (
      <>
        <path d="M30 7a10 10 0 0 0-11 13L7 32a5.5 5.5 0 0 0 8 8l12-12A10 10 0 0 0 40 17l-7 7-9-9 6-8Z" />
        <circle cx="12" cy="35" r="1.5" />
      </>
    ),
  };

  return <svg {...commonProps}>{icons[type]}</svg>;
};

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
                <ServiceIcon type={service.icon} />
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
