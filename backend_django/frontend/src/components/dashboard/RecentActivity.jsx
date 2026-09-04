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
        setActivities(res.data.activities || []);
      } catch (e) {
        console.error('Failed to load activities', e);
      }
    }
    fetchActivities();
  }, [selectedBranchId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="mt-4 space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.action + activity.time} className="flex items-center justify-between py-3 border-b last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.details} · {new Date(activity.time).toLocaleString()}</p>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">Active</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;