export default function Loader({ text = 'Chargement...' }) {
  return (
    <p className="loader">
      <span className="spinner" aria-hidden="true" />
      {text}
    </p>
  );
}
