
"use client"

import { useState, useEffect } from "react";
import axios from "axios";

interface Download {
  id: number;
  name: string;
  file: string;
  created_at: string;
  important: boolean;
  format: string;
  size: string;
  deadline?: string;
}

const useDownloads = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          throw new Error("Access token not found.");
        }

        const response = await axios.get<Download[]>(`${import.meta.env.VITE_API_URL}/api/downloads/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setDownloads(response.data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err);
        } else {
            setError(new Error('An unknown error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  return { downloads, isLoading, error };
};

export default useDownloads;
