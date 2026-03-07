import { useState, useEffect } from 'react';
import axios from 'axios';

const useJuryOverview = () => {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJuryOverview = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('Access token not found');
        }

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/overview/jury/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setOverview(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJuryOverview();
  }, []);

  return { overview, isLoading, error };
};

export default useJuryOverview;
