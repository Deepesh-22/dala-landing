export default function Section({ id, label, title, body }) {
  return (
    <section id={id} className="section" data-section={id}>
      <p className="section__label">{label}</p>
      <h2 className="section__title">{title}</h2>
      <p className="section__body">{body}</p>
    </section>
  );
}
