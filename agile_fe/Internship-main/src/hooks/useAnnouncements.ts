import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

interface Announcement {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface ApiError {
  message: string;
}

const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${baseApi}/api/announcements/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnnouncements(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch announcements.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, isLoading, error };
};

export default useAnnouncements;
