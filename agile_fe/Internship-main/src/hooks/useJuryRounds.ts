import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Team {
  id: string;
  team_id: string;
  institution_name: string;
  team_representative_name: string;
  speaker_1_name: string;
  speaker_1_course_type: string;
  speaker_2_name: string;
  speaker_2_course_type: string;
  researcher_name: string;
}

interface Round {
  id: string;
  round_name: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  date: string;
  time: string;
  round_type: "online" | "offline";
  venue?: string;
  meet_url?: string;
  judge: string;
  team1: Team;
  team2: Team;
}

interface ApiError {
  message: string;
}

const useJuryRounds = (teamCode: string) => {
  const [juryRounds, setJuryRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJuryRounds = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError({ message: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jury-rounds/${teamCode}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJuryRounds(response.data);
    } catch (err) {
      setError({ message: 'Failed to fetch jury rounds.' });
    } finally {
      setIsLoading(false);
    }
  }, [teamCode]);

  useEffect(() => {
    if (teamCode) {
      fetchJuryRounds();
    }
  }, [teamCode, fetchJuryRounds]);

  return { juryRounds, isLoading, error };
};

export default useJuryRounds;
