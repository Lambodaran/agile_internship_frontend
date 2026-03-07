import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useGetJuryMarks = (teamCode: string | null, juryId: number | null) => {
  const [marks, setMarks] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarks = useCallback(async () => {
    if (!teamCode || !juryId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/marks/`, {
        params: {
          team_id: teamCode,
          jury_id: juryId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.length > 0) {
        setMarks(response.data[0]); // Assuming one marks entry per team/jury pair
      } else {
        setMarks(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Error fetching marks:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [teamCode, juryId]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  return { marks, isLoading, error, refetch: fetchMarks };
};

export default useGetJuryMarks;
