import { useState, useEffect, useCallback } from 'react';

export const useTriageReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Network error: Failed to reach server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
};
