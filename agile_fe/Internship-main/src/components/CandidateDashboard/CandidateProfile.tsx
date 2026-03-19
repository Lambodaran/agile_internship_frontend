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
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

interface ProfileData {
  username: string;
  full_name: string;
  email: string;
  professional_headline: string;
  university: string;
  location: string;
  profile_photo: string | null;
  profile_photo_url: string | null;
}

const CandidateProfile: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    headline: '',
    university: '',
    location: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${baseApi}/profiles/candidate/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const data = response.data;
      setInitialData(data);

      setFormData({
        username: data.username || '',
        fullName: data.full_name || '',
        email: data.email || '',
        headline: data.professional_headline || '',
        university: data.university || '',
        location: data.location || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      if (data.profile_photo_url) {
        setPreviewUrl(data.profile_photo_url);
      } else {
        setPreviewUrl(null);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load profile data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const updateProfile = async (profileData: FormData) => {
    const token = localStorage.getItem('access_token');

    const response = await axios.put(`${baseApi}/profiles/candidate/`, profileData, {
      headers: {
        Authorization: token ? `Token ${token}` : '',
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  };

  const changePassword = async () => {
    const token = localStorage.getItem('access_token');

    const response = await axios.post(
      `${baseApi}/profiles/change-password/`,
      {
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_new_password: formData.confirm_password,
      },
      {
        headers: {
          Authorization: token ? `Token ${token}` : '',
        },
      }
    );

    return response.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      if (!formData.username.trim()) throw new Error('Username is required');
      if (!formData.fullName.trim()) throw new Error('Full name is required');
      if (!formData.email.includes('@')) throw new Error('Invalid email format');

      const profileChanged =
        formData.username !== initialData?.username ||
        formData.fullName !== initialData?.full_name ||
        formData.email !== initialData?.email ||
        formData.headline !== initialData?.professional_headline ||
        formData.university !== initialData?.university ||
        formData.location !== initialData?.location ||
        profilePhoto !== null;

      if (profileChanged) {
        const profileFormData = new FormData();
        profileFormData.append('username', formData.username);
        profileFormData.append('full_name', formData.fullName);
        profileFormData.append('email', formData.email);
        profileFormData.append('professional_headline', formData.headline);
        profileFormData.append('university', formData.university);
        profileFormData.append('location', formData.location);

        if (profilePhoto) {
          profileFormData.append('profile_photo', profilePhoto);
        }

        const updatedProfile = await updateProfile(profileFormData);

        const updatedUsername = updatedProfile?.username || formData.username;
        localStorage.setItem('username', updatedUsername);
      }

      if (
        formData.new_password ||
        formData.confirm_password ||
        formData.current_password
      ) {
        if (!formData.current_password) {
          throw new Error('Current password is required to change password');
        }
        if (formData.new_password !== formData.confirm_password) {
          throw new Error('Passwords do not match');
        }
        if (formData.new_password.length < 8) {
          throw new Error('New password must be at least 8 characters');
        }

        await changePassword();
      }

      await fetchProfileData();

      setSuccess('Profile updated successfully!');
      setProfilePhoto(null);

      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
    } catch (err: any) {
      console.error('Error saving changes:', err);

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === 'string') {
          setError(data);
        } else if (data.username?.[0]) {
          setError(data.username[0]);
        } else if (data.email?.[0]) {
          setError(data.email[0]);
        } else if (data.full_name?.[0]) {
          setError(data.full_name[0]);
        } else if (data.error) {
          setError(data.error);
        } else if (data.message) {
          setError(data.message);
        } else {
          setError('Failed to save changes');
        }
      } else {
        setError(err.message || 'Failed to save changes');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-slate-950 animate-spin" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  const initials =
    formData.fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 shadow-[0_10px_30px_rgba(2,6,23,0.35)] text-white">
              <h1 className="text-2xl font-bold">Candidate Profile</h1>
              <p className="mt-1 text-blue-100">Manage your professional information</p>
            </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User size={16} />
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-950 focus:border-slate-950 outline-none"
                    required
                  />
                </div>

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

                <p className="text-xs text-gray-500 mt-2">
                  Leave password fields empty if you don't want to change your password.
                </p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="
                    flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-lg font-medium
                    hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2
                    disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                  "
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateProfile;