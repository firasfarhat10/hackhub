import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card narrow">
      <h1>Page introuvable</h1>
      <p><Link to="/">Retour aux evenements</Link></p>
    </div>
  );
}