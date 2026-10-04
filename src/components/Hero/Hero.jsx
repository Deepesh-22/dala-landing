export default function Hero({ label, title, body }) {
  return (
    <section id="hero" className="section" data-section="hero">
      <p className="section__label">{label}</p>
      <h1 className="section__title">{title}</h1>
      <p className="section__body">{body}</p>
    </section>
  );
}
