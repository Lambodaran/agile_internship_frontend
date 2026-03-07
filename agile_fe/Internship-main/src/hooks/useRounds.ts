"use client"

import { useState, useEffect } from "react";
import axios from "axios";

const useRounds = () => {
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          throw new Error("Access token not found.");
        }

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rounds/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setRounds(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRounds();
  }, []);

  return { rounds, isLoading, error };
};

export default useRounds;
