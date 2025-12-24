import "../styles/contact.css";

const Contact = () => {
  return (
    <section className="contact-area full-section" id="contact">
      <div className="contact-container">
        <h2>Contact Us</h2>
        <p>If you have any questions or need assistance, feel free to reach out!</p>

        <form className="contact-form">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" required />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />

          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" rows="4" required />

          <button type="submit">Send Message</button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
