export default function Loader({ ready }) {
  return (
    <div className={`loader ${ready ? 'loader--done' : ''}`} aria-hidden={ready}>
      <span className="loader__label">Phase 1 · Loading</span>
    </div>
  );
}
