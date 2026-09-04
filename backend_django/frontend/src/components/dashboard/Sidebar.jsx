import { Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon,
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Branches', icon: BuildingStorefrontIcon, path: '/dashboard/branches' },
    { name: 'Menu', icon: ClipboardDocumentListIcon, path: '/dashboard/menu' },
    { name: 'QR Codes', icon: QrCodeIcon, path: '/dashboard/qr' },
    { name: 'Payments', icon: CreditCardIcon, path: '/dashboard/payments' },
    { name: 'Subscriptions', icon: TicketIcon, path: '/dashboard/subscriptions' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
            <span className="text-white font-bold">K</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>KitchenOS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="sidebar-link"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          style={{
            color: 'var(--error)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;