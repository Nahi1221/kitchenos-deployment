import { PencilIcon, TrashIcon, QrCodeIcon, PlusIcon } from '@heroicons/react/24/outline';

function BranchList({ branches, onAdd, onEdit, onDelete, onViewQR }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Branches</h2>
        <button onClick={onAdd} className="btn-primary w-full sm:w-auto">
          <PlusIcon className="w-5 h-5 inline-block mr-1" /> Add New Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No branches yet. Click "Add New Branch" to get started!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{branch.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{branch.location}</p>
                  {branch.phone && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>📞 {branch.phone}</p>}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${branch.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>QR: ✅</div>
                <div className="flex space-x-1">
                  <button onClick={() => onEdit(branch)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--accent)' }} title="Edit">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                   <button onClick={() => onViewQR && onViewQR(branch)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-muted)' }} title="View QR">
                     <QrCodeIcon className="w-4 h-4" />
                   </button>
                   <button onClick={() => { if (navigator.printer) { window.print(); } else { toast.success('Use browser print'); } }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-muted)' }} title="Print">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 5.03h12.56c.93 0 1.38 1.14.71 1.82L16.5 11.43a1.875 1.875 0 01-2.38 0L7.01 6.85c-.67-.68-.22-1.82.71-1.82zM6.72 5.03a3 3 0 00-3 3v3.75c0 .414.336.75.75.75h.75a2.25 2.25 0 012.25 2.25v3.75a2.25 2.25 0 01-2.25 2.25h-.75a.75.75 0 00-.75.75v3.75a3 3 0 003 3h12.56a3 3 0 003-3v-3.75a.75.75 0 00-.75-.75h-.75a2.25 2.25 0 01-2.25-2.25V12a2.25 2.25 0 012.25-2.25h.75a.75.75 0 00.75-.75V8.03a3 3 0 00-3-3H6.72z" /></svg>
                   </button>
                  <button onClick={() => onDelete(branch.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{ color: 'var(--error)' }} title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BranchList;