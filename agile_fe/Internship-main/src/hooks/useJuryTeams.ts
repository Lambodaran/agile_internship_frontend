import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Team {
  id: number;
  team_id: string;
  team_representative_name: string;
  team_representative_email: string;
  speaker_1_name: string;
  speaker_1_course_type: string;
  speaker_1_email: string;
  speaker_1_id_card: string;
  speaker_1_contact_number: string;
  speaker_2_name: string;
  speaker_2_course_type: string;
  researcher_name: string;
  institution_name: string;
  class_teacher_name: string;
  class_teacher_contact_number: string;
  proof_of_payment: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ApiError {
  message: string;
}

const useJuryTeams = () => {
  const [juryTeams, setJuryTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJuryTeams = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jury/teams/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJuryTeams(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch jury teams.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJuryTeams();
  }, [fetchJuryTeams]);

  return { juryTeams, isLoading, error };
};

export default useJuryTeams;
