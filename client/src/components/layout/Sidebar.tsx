import React from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import Logo from '../Logo';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  expanded: boolean;
  visible?: boolean;
  onToggleExpand: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  expanded,
  visible = false,
  onToggleExpand,
}) => {
  const [location] = useLocation();
  const { logoutUser } = useAuth();

  const navItems = [
    { path: '/profile', icon: 'person', label: 'Profile' },
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/statistics', icon: 'insert_chart', label: 'Statistics' },
    { path: '/reports', icon: 'description', label: 'Reports' },
    { path: '/calendar', icon: 'calendar_today', label: 'Calendar' },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <nav 
      className={cn(
        'fixed top-0 left-0 h-full bg-primary z-30 overflow-hidden',
        expanded ? 'sidebar-expanded w-64' : 'sidebar-collapsed w-20',
        visible ? 'show' : ''
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 flex items-center">
          <Logo showText={expanded} />
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 py-6">
          <ul>
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path === '/dashboard' && location === '/');
              
              return (
                <li key={item.path} className="mb-2">
                  <button 
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-white hover:bg-secondary transition",
                      isActive && "bg-secondary"
                    )}
                  >
                    <span className="material-icons w-6">{item.icon}</span>
                    {expanded && <span className="ml-4">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Logout Button */}
        <div className="py-4 px-4">
          <button 
            onClick={logoutUser}
            className="flex items-center text-white hover:text-gray-300 transition"
          >
            <span className="material-icons w-6">logout</span>
            {expanded && <span className="ml-4">Logout</span>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
