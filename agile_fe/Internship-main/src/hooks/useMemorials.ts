
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Memorial {
  id: number;
  file: string;
  created_at: string;
  moot_problem: string;
  moot_problem_display: string;
}

interface ApiError {
  message: string;
}

const useMemorials = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchMemorials = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/memorials/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMemorials(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch memorials.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemorials();
  }, [fetchMemorials]);

  const uploadMemorial = async (file: File, mootProblem: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('moot_problem', mootProblem);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/memorials/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // Add the new memorial to the list
      setMemorials((prevMemorials) => [response.data, ...prevMemorials]);
      fetchMemorials(); // Refresh the list
    } catch (err: any) {
      console.error('Upload failed', err);
      const errorMessage = err.response?.data?.error || 'Upload failed';
      throw new Error(errorMessage);
    }
  };

  return { memorials, isLoading, error, uploadMemorial };
};

export default useMemorials;

