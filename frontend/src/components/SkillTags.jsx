import { useState } from 'react';

// Champ de saisie de compétences sous forme d'étiquettes (formulaire contrôlé)
export default function SkillTags({ skills, onChange, max = 15 }) {
  const [input, setInput] = useState('');

  const add = () => {
    const skill = input.trim().toLowerCase();
    if (skill && !skills.includes(skill) && skills.length < max) {
      onChange([...skills, skill]); // nouveau tableau (immutabilité)
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // pas de soumission du formulaire
      add();
    }
  };

  return (
    <div className="skill-tags">
      <div className="tags">
        {skills.map((s) => (
          <span key={s} className="tag">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} aria-label={`Retirer ${s}`}>
              x
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={skills.length < max ? 'Ajouter une competence puis Entree' : `${max} competences maximum`}
        disabled={skills.length >= max}
      />
    </div>
  );
}