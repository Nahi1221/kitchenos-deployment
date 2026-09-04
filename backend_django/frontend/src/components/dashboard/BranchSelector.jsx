import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useBranch } from '../../contexts/BranchContext';

function BranchSelector() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedBranchId, selectBranch } = useBranch();
  const hasFetched = useRef(false);
  const initialSelectDone = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    async function fetchBranches() {
      try {
        setLoading(true);
        const res = await api.get('/branches/');
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setBranches(data);
        if (data.length > 0 && !initialSelectDone.current) {
          const savedId = localStorage.getItem('selectedBranch');
          if (savedId && data.find(b => b.id === Number(savedId))) {
            selectBranch(Number(savedId));
          } else {
            selectBranch(data[0].id);
          }
          initialSelectDone.current = true;
        } else if (data.length === 0) {
          toast.error('No branches found. Create a branch first.');
        }
      } catch (e) {
        console.error('Failed to load branches', e);
        toast.error('Failed to load branches');
        hasFetched.current = false;
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, [selectBranch]);

  const handleChange = (e) => {
    const id = Number(e.target.value);
    if (id) selectBranch(id);
  };

  if (loading) {
    return (
      <div className="block w-48 px-3 py-2 text-sm border rounded-md" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
        Loading branches...
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="block w-48 px-3 py-2 text-sm border rounded-md" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--error)', borderColor: 'var(--border-color)' }}>
        No branches — create one first
      </div>
    );
  }

  const currentBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Branch:</span>
      <select
        value={selectedBranchId || ''}
        onChange={handleChange}
        className="block w-44 px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          cursor: 'pointer'
        }}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
      {currentBranch && (
        <span className="text-xs hidden md:inline" style={{ color: 'var(--text-muted)' }}>
          (id: {currentBranch.id})
        </span>
      )}
    </div>
  );
}

export default BranchSelector;
