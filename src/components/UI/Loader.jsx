export default function Loader({ ready }) {
  return (
    <div
      className={`loader${ready ? ' loader--done' : ''}`}
      aria-hidden={ready}
      aria-busy={!ready}
    >
      <span className="loader__label">Loading</span>
    </div>
  );
}
