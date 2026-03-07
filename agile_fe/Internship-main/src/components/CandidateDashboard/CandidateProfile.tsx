// src/components/CandidateDashboard/CandidateProfile.tsx

import React, { useState, useEffect } from 'react';
import {
  User,
  Github,
  Linkedin,
  Globe,
  FileText,
  Upload,
  Trash2,
  Eye,
  Save,
  AlertCircle,
  X,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton'; // ← adjust this path if needed

const CandidateProfile = () => {
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profile, setProfile] = useState({
    fullName: 'Lengend',
    headline: 'Aspiring Full-Stack Developer',
    university: 'University of Jaffna',
    avatarPreview: null,
    about: "I'm a final-year student passionate about web development, especially React and Node.js. Looking for a 6-month internship where I can contribute and learn.",
    skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Git', 'Figma'],
    links: {
      github: 'https://github.com/yourusername',
      linkedin: 'https://linkedin.com/in/yourname',
      portfolio: 'https://yourportfolio.com',
    },
    resume: {
      name: null,
      size: null,
      date: null,
      url: null,
    },
  });

  const [newSkill, setNewSkill] = useState('');

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('candidate_profile');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProfile(prev => ({ ...prev, ...data }));
      } catch {}
    }

    // Also check avatar key used by header
    const savedAvatar = localStorage.getItem('mock_profile_preview');
    if (savedAvatar) {
      setProfile(prev => ({ ...prev, avatarPreview: savedAvatar }));
    }
  }, []);

  const saveProfile = (updated) => {
    localStorage.setItem('candidate_profile', JSON.stringify(updated));

    // Save avatar to the key that Header.tsx already looks for
    if (updated.avatarPreview) {
      localStorage.setItem('mock_profile_preview', updated.avatarPreview);
    } else {
      localStorage.removeItem('mock_profile_preview');
    }
  };

  // ─── Profile Photo Upload ────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 5MB' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const updated = { ...profile, avatarPreview: dataUrl };
      setProfile(updated);
      saveProfile(updated);
      setMessage({ type: 'success', text: 'Photo updated (visible in header after refresh)' });
    };
    reader.readAsDataURL(file);
  };

  // ─── Resume Upload ───────────────────────────────────────────────
  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files allowed' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be smaller than 10MB' });
      return;
    }

    const url = URL.createObjectURL(file);
    const updated = {
      ...profile,
      resume: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleDateString(),
        url,
      },
    };
    setProfile(updated);
    saveProfile(updated);
    setMessage({ type: 'success', text: 'Resume uploaded' });
  };

  const removeResume = () => {
    const updated = {
      ...profile,
      resume: { name: null, size: null, date: null, url: null },
    };
    setProfile(updated);
    saveProfile(updated);
    setMessage({ type: 'success', text: 'Resume removed' });
  };

  // ─── Skills ──────────────────────────────────────────────────────
  const addSkill = () => {
    if (!newSkill.trim() || profile.skills.includes(newSkill.trim())) return;
    const updated = {
      ...profile,
      skills: [...profile.skills, newSkill.trim()],
    };
    setProfile(updated);
    saveProfile(updated);
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    const updated = {
      ...profile,
      skills: profile.skills.filter(s => s !== skill),
    };
    setProfile(updated);
    saveProfile(updated);
  };

  // ─── Save All ────────────────────────────────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    setTimeout(() => {
      saveProfile(profile);
      setMessage({ type: 'success', text: 'Profile saved successfully' });
      setSaving(false);
    }, 800);
  };

  const initials = profile.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Top controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage how recruiters see you</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  editMode
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editMode ? <><Eye size={18} /> Preview</> : <><User size={18} /> Edit</>}
              </button>

              {editMode && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : null}
              {message.text}
            </div>
          )}

          {/* Main card */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">

            {/* Hero / Header section */}
            <div className="px-6 pt-10 pb-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                    {profile.avatarPreview ? (
                      <img src={profile.avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center text-5xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>

                  {editMode && (
                    <label className="absolute -bottom-1 -right-1 bg-white text-blue-700 p-3 rounded-full cursor-pointer shadow-lg hover:bg-gray-100">
                      <Upload size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  {editMode ? (
                    <input
                      value={profile.fullName}
                      onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                      className="text-3xl font-bold bg-transparent border-b border-white/40 focus:border-white outline-none w-full max-w-md"
                      placeholder="Full Name"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold">{profile.fullName}</h2>
                  )}

                  <p className="mt-2 text-xl opacity-90">{profile.headline}</p>
                  <p className="mt-3 opacity-90">{profile.university}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8 space-y-10">

              {/* About */}
              <div>
                <h3 className="text-xl font-semibold mb-4">About Me</h3>
                {editMode ? (
                  <textarea
                    value={profile.about}
                    onChange={e => setProfile({ ...profile, about: e.target.value })}
                    rows={4}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    placeholder="Tell companies about yourself..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {profile.about || <span className="text-gray-400 italic">No description yet.</span>}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills.map(skill => (
                    <div
                      key={skill}
                      className="px-4 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {skill}
                      {editMode && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {editMode && (
                  <div className="flex gap-3">
                    <input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Add skill..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <button
                      onClick={addSkill}
                      className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Links */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Links</h3>
                <div className="space-y-4">
                  {['github', 'linkedin', 'portfolio'].map(key => (
                    <div key={key} className="flex items-center gap-4">
                      {key === 'github' && <Github size={24} />}
                      {key === 'linkedin' && <Linkedin size={24} />}
                      {key === 'portfolio' && <Globe size={24} />}
                      {editMode ? (
                        <input
                          value={profile.links[key]}
                          onChange={e => setProfile({
                            ...profile,
                            links: { ...profile.links, [key]: e.target.value }
                          })}
                          placeholder={`Your ${key} URL`}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                      ) : (
                        profile.links[key] ? (
                          <a href={profile.links[key]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.links[key]}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not added</span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Resume</h3>

                {profile.resume.name ? (
                  <div className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <FileText size={32} className="text-blue-600" />
                      <div>
                        <div className="font-medium">{profile.resume.name}</div>
                        <div className="text-sm text-gray-500">
                          {profile.resume.size} • {profile.resume.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <a href={profile.resume.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                      </a>
                      {editMode && (
                        <button onClick={removeResume} className="text-red-600 hover:text-red-800">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No resume uploaded yet.</p>
                )}

                {editMode && (
                  <label className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    <Upload size={18} />
                    {profile.resume.name ? 'Replace Resume' : 'Upload Resume'}
                    <input type="file" accept=".pdf" className="hidden" onChange={handleResumeChange} />
                  </label>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateProfile;