import { hueFromString } from '../utils/display';

// Avatar à initiales : pas d'image à téléverser, couleur stable calculée à partir du nom
export default function Avatar({ name = '?', size = 32 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <span
      className="avatar"
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hueFromString(name)} 60% 45%)` }}
    >
      {initials}
    </span>
  );
}
