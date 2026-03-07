import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Memorial {
  id: number;
  team: number;
  file: string;
  created_at: string;
  updated_at: string;
  moot_problem: string;
  moot_problem_display: string;
}

interface ApiError {
  message: string;
}

const useJuryMemorials = (teamCode: string) => {
  const [juryMemorials, setJuryMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJuryMemorials = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jury-memorials/${teamCode}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJuryMemorials(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch jury memorials.' });
    } finally {
      setIsLoading(false);
    }
  }, [teamCode]);

  useEffect(() => {
    if (teamCode) {
      fetchJuryMemorials();
    }
  }, [teamCode, fetchJuryMemorials]);

  return { juryMemorials, isLoading, error };
};

export default useJuryMemorials;
