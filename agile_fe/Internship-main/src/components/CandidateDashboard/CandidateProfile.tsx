// src/components/CandidateDashboard/CandidateProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Upload,
  Save,
  AlertCircle,
  Briefcase,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton';

const MOCK_INITIAL_DATA = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  headline: 'Aspiring Full-Stack Developer',
  university: 'University of Technology',
  location: 'New York, NY',
  profile_picture_preview: null as string | null,
};

const CandidateProfile: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: MOCK_INITIAL_DATA.fullName,
    email: MOCK_INITIAL_DATA.email,
    headline: MOCK_INITIAL_DATA.headline,
    university: MOCK_INITIAL_DATA.university,
    location: MOCK_INITIAL_DATA.location,
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    MOCK_INITIAL_DATA.profile_picture_preview
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('candidate_profile');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          email: data.email || prev.email,
          headline: data.headline || prev.headline,
          university: data.university || prev.university,
          location: data.location || prev.location,
        }));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }

    const savedPreview = localStorage.getItem('mock_profile_preview');
    if (savedPreview) setPreviewUrl(savedPreview);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      localStorage.setItem('mock_profile_preview', dataUrl);
      setSuccess('Photo updated successfully');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    setTimeout(() => {
      try {
        // Basic validation
        if (!formData.fullName.trim()) throw new Error('Full name is required');
        if (!formData.email.includes('@')) throw new Error('Invalid email format');

        if (formData.new_password) {
          if (formData.new_password !== formData.confirm_password) {
            throw new Error('Passwords do not match');
          }
          if (formData.new_password.length < 8) {
            throw new Error('New password must be at least 8 characters');
          }
          if (!formData.current_password) {
            throw new Error('Current password is required to change password');
          }
        }

        // Save all data to localStorage
        const profileData = {
          fullName: formData.fullName,
          email: formData.email,
          headline: formData.headline,
          university: formData.university,
          location: formData.location,
        };

        localStorage.setItem('candidate_profile', JSON.stringify(profileData));
        if (previewUrl) {
          localStorage.setItem('mock_profile_preview', previewUrl);
        }

        setSuccess('Profile updated successfully!');

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: '',
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  const initials = formData.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 shadow-[0_10px_30px_rgba(2,6,23,0.35)] text-white">
              <h1 className="text-2xl font-bold">Candidate Profile</h1>
              <p className="mt-1 text-blue-100">Manage your professional information</p>
            </div>

            {/* Messages */}
            {error && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            {success && (
              <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Profile Photo */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center text-white text-5xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 bg-slate-950 text-white p-2.5 rounded-full cursor-pointer shadow hover:bg-blue-950 transition">
                    <Upload size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG or GIF • Max 5 MB
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Briefcase size={16} />
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleInputChange}
                    placeholder="e.g., Aspiring Full-Stack Developer"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <GraduationCap size={16} />
                    University/Institution
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Lock size={18} />
                  Change Password
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`
                    flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-lg font-medium
                    hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2
                    disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                  `}
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* <p className="mt-6 text-center text-sm text-gray-500">
            This page is currently in mock mode — changes are saved in your browser only.
          </p> */}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateProfile;