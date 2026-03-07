import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface JuryAnnouncement {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface ApiError {
  message: string;
}

const useJuryAnnouncements = () => {
  const [juryAnnouncements, setJuryAnnouncements] = useState<JuryAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJuryAnnouncements = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jury-announcements/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJuryAnnouncements(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch jury announcements.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJuryAnnouncements();
  }, [fetchJuryAnnouncements]);

  return { juryAnnouncements, isLoading, error };
};

export default useJuryAnnouncements;
