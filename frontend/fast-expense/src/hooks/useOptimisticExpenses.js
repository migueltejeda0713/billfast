import { useState, useEffect } from 'react';

export function useOptimisticExpenses(key) {
  const [list, setList] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(list));
  }, [key, list]);

  return [list, setList];
}
