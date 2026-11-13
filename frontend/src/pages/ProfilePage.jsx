import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/axios';
import useFetch from '../hooks/useFetch';
import SkillTags from '../components/SkillTags';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const LEVELS = { beginner: 'Debutant', intermediate: 'Intermediaire', advanced: 'Avance' };

export default function ProfilePage() {
  const { data: profile, loading, error } = useFetch('/profile/me');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Quand le profil arrive de l'API, on remplit le formulaire
  useEffect(() => {
    if (profile) {
      setForm({ bio: profile.bio, skills: profile.skills, level: profile.level, githubUrl: profile.githubUrl });
    }
  }, [profile]);

  if (loading || (!form && !error)) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setSaveError(null);
    try {
      await api.put('/profile/me', form);
      setMessage('Profil enregistre. Vos suggestions de coequipiers sont mises a jour.');
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card narrow">
      <h1>Mon profil</h1>
      <p className="muted">Vos competences servent au matching : plus elles sont precises, meilleures sont les suggestions.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Bio
          <textarea value={form.bio} maxLength={300} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <span className="small muted">{form.bio.length} / 300</span>
        </label>
        <div className="label">
          Competences
          <SkillTags skills={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
        </div>
        <label>
          Niveau
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            {Object.entries(LEVELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          GitHub
          <input value={form.githubUrl} placeholder="https://github.com/pseudo" onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
        </label>
        <ErrorMessage message={saveError} />
        {message && <p className="success">{message}</p>}
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
    </div>
  );
}