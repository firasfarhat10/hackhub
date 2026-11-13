// Petites fonctions d'affichage partagées par plusieurs composants (aucune dépendance React).

// Couleur stable dérivée d'un texte : le même nom donne toujours la même teinte (0-359)
export function hueFromString(text = '') {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

// Bandeau de couverture généré : un dégradé unique par événement, sans image à stocker
export function coverStyle(event) {
  const hue = hueFromString(event.title);
  return {
    background: `linear-gradient(135deg, hsl(${hue} 85% 55%), hsl(${(hue + 70) % 360} 80% 42%))`
  };
}

// Phase de l'événement, calculée à partir de ses dates (et non stockée en base)
export function getPhase(event, now = new Date()) {
  if (event.status === 'draft') return { key: 'draft', label: 'Brouillon' };
  if (new Date(event.endDate) < now) return { key: 'past', label: 'Termine' };
  if (new Date(event.startDate) <= now) return { key: 'live', label: 'En cours' };
  if (event.isFull) return { key: 'full', label: 'Complet' };
  return { key: 'upcoming', label: 'A venir' };
}

// { day: '25', month: 'DEC' } pour la pastille de date
export function dateParts(iso) {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('fr-FR', { day: '2-digit' }),
    month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()
  };
}
