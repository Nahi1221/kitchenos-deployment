import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';

function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const { selectedBranchId } = useBranch();

  useEffect(() => {
    async function fetchActivities() {
      try {
        const params = {};
        if (selectedBranchId) params.branch_id = selectedBranchId;
        const res = await api.get('/branches/stats/', { params });
        // API no longer returns activities (orders removed)
        setActivities([]);
      } catch (e) {
        console.error('Failed to load activities', e);
      }
    }
    fetchActivities();
  }, [selectedBranchId]);

  return (
    <div className="card">
      <div className="p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
        <div className="mt-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Activity tracking is not available.</p>
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;