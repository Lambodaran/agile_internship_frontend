import { useState } from 'react';
import axios from 'axios';

const useSubmitMarks = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitMarks = async (marksData: any, marksId: number | null) => {
    setIsSubmitting(true);
    setSubmitMessage('');
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const url = marksId
        ? `${import.meta.env.VITE_API_URL}/api/marks/${marksId}/`
        : `${import.meta.env.VITE_API_URL}/api/marks/`;
      
      const method = marksId ? 'put' : 'post';

      const response = await axios[method](url, marksData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201 || response.status === 200) {
        setSubmitMessage(`Marks ${marksId ? 'updated' : 'submitted'} successfully!`);
      } else {
        throw new Error(response.data.message || `Failed to ${marksId ? 'update' : 'submit'} marks.`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      setSubmitMessage(`Error ${marksId ? 'updating' : 'submitting'} marks. Please try again.`);
      console.error(`Error ${marksId ? 'updating' : 'submitting'} marks:`, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitMessage, error, submitMarks };
};

export default useSubmitMarks;
