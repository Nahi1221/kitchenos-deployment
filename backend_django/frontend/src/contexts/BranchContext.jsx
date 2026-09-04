import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const saved = localStorage.getItem('selectedBranch');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('selectedBranch', String(selectedBranchId));
    }
  }, [selectedBranchId]);

  const selectBranch = useCallback((id) => {
    setSelectedBranchId(Number(id));
  }, []);

  const clearBranch = useCallback(() => {
    setSelectedBranchId(null);
    localStorage.removeItem('selectedBranch');
  }, []);

  return (
    <BranchContext.Provider value={{ selectedBranchId, selectBranch, clearBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
