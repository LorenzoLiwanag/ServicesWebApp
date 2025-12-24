import "../styles/contact.css";

const Contact = () => {
  return (
    <section className="contact-area full-section" id="contact">
      <div className="contact-modal">
        {/* Left panel */}
        <div className="contact-left">
          <div className="contact-brand">
            <span className="contact-mark">SB</span>
            <span className="contact-brand-text">Subic Bay Home Services</span>
          </div>

          <h2 className="contact-title">Get in touch</h2>

          <p className="contact-subtitle">
            Whether you’re a client looking for services or a provider ready to
            offer them, send us a message and we’ll help you get started.
          </p>
        </div>

        {/* Right panel */}
        <div className="contact-right">
          <div className="contact-right-header">
            <h3>Contact form</h3>
          </div>

          <form className="contact-form">
            <div className="contact-row">
              <div className="contact-field">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your name" required />
              </div>

              <div className="contact-field">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="you@example.com" required />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="message">How can we help?</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                placeholder="Tell us what you need…"
                required
              />
            </div>

            <button type="submit" className="contact-submit">
              Send message
            </button>
          </form>

          <p className="contact-footnote">
            By clicking “Send message”, you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
