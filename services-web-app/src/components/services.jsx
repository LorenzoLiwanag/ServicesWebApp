import "../styles/services.css";

const Services = () => {
  const services = [
    {
      icon: "🛠️",
      title: "Handyman Services",
      description: "Repairs, installations, and odd jobs handled by trusted pros.",
    },
    {
      icon: "🧹",
      title: "General Cleaning",
      description: "Routine home cleaning to keep your space fresh and tidy.",
    },
    {
      icon: "🧼",
      title: "Deep Cleaning",
      description: "A detailed clean for kitchens, bathrooms, and hard-to-reach areas.",
    },
    {
      icon: "🚚",
      title: "Moving Help",
      description: "Packing support, loading/unloading, and light moving assistance.",
    },
    {
      icon: "🪴",
      title: "Yard & Outdoor",
      description: "Basic yard cleanup, trimming, and outdoor maintenance help.",
    },
    {
      icon: "🔧",
      title: "Minor Repairs",
      description: "Quick fixes around the house to keep everything working smoothly.",
    },
  ];

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
          {services.map((s) => (
            <div className="service-card" key={s.title}>
              <div className="service-icon" aria-hidden="true">
                {s.icon}
              </div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
