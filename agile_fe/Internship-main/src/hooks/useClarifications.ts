import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

interface Clarification {
  id: number;
  subject: string;
  question: string;
  response: string;
  status: string;
  submittedAt: string;
  respondedAt: string | null;
}

interface ApiError {
  message: string;
}

const useClarifications = () => {
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchClarifications = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${baseApi}/api/clarifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClarifications(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch clarifications.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClarifications();
  }, [fetchClarifications]);

  const submitClarification = async (subject: string, question: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    try {
      const response = await axios.post(`${baseApi}/api/clarifications/`, { subject, question }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClarifications((prev) => [response.data, ...prev]);
    } catch (err) {
      console.error('Submission failed', err);
      throw new Error('Submission failed');
    }
  };

  return { clarifications, isLoading, error, submitClarification };
};

export default useClarifications;
