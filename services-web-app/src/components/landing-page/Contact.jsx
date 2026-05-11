import { useState } from "react";
import "../../styles/landing-page/contact.css";
import { submitContact } from "../../api/contact.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = ({ name, email, message }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!message.trim()) {
    errors.message = "Message is required.";
  } else if (message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }
  return errors;
};

const Contact = () => {
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await submitContact(fields);
      setSuccessMsg("Message sent! We'll be in touch soon.");
      setFields({ name: "", email: "", message: "" });
      setErrors({});
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-area full-section" id="contact">
      <div className="contact-modal">
        <div className="contact-left">
          <h2 className="contact-title">Get in touch with us now!</h2>
          <p className="contact-subtitle">
            Whether you're a client looking for services or a provider ready to
            offer them, send us a message and we'll help you get started.
          </p>
        </div>

        <div className="contact-right">
          <div className="contact-right-header">
            <h3>Contact form</h3>
          </div>

          {successMsg && (
            <p className="contact-banner contact-banner--success">{successMsg}</p>
          )}
          {errorMsg && (
            <p className="contact-banner contact-banner--error">{errorMsg}</p>
          )}

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-row">
              <div className={`contact-field${errors.name ? " contact-field--error" : ""}`}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  value={fields.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <span className="contact-error-text">{errors.name}</span>
                )}
              </div>

              <div className={`contact-field${errors.email ? " contact-field--error" : ""}`}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={fields.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="contact-error-text">{errors.email}</span>
                )}
              </div>
            </div>

            <div className={`contact-field${errors.message ? " contact-field--error" : ""}`}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                placeholder="Drop us a message..."
                value={fields.message}
                onChange={handleChange}
              />
              {errors.message && (
                <span className="contact-error-text">{errors.message}</span>
              )}
            </div>

            <button
              type="submit"
              className="contact-submit"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>

          <p className="contact-footnote">
            By clicking "Send message", you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
