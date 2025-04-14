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
    { path: '/calendar', icon: 'calendar_today', label: 'Calendar' },
    { path: '/reports', icon: 'description', label: 'Reports' },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/signin';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside 
      className={cn(
        'fixed top-0 left-0 h-full bg-primary z-30 overflow-hidden transition-all duration-300 shadow-lg',
        expanded ? 'sidebar-expanded w-64' : 'sidebar-collapsed w-20',
        visible ? 'show' : 'hidden md:block'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo and toggle button */}
        <div className="p-4 flex items-center justify-between border-b border-blue-900">
          <div className={expanded ? '' : 'mx-auto'}>
            <Logo showText={expanded} size={expanded ? 40 : 35} />
          </div>
          {expanded && (
            <button 
              onClick={handleToggleExpand}
              className="text-white p-1 hover:bg-blue-800 rounded-full transition-colors"
            >
              <span className="material-icons">chevron_left</span>
            </button>
          )}
        </div>
        
        {/* Toggle button (when collapsed) */}
        {!expanded && (
          <div className="py-3 flex justify-center border-b border-blue-900 mb-2">
            <button 
              onClick={handleToggleExpand}
              className="text-white p-2 rounded-full hover:bg-blue-800 transition-colors"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        )}
        
        {/* Menu Items */}
        <div className="flex-1 py-2">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path === '/dashboard' && location === '/');
              
              return (
                <li key={item.path}>
                  <button 
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "flex items-center w-full px-3 py-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-white text-primary" 
                        : "text-white hover:bg-white hover:text-primary",
                      expanded ? "" : "justify-center"
                    )}
                  >
                    <span className="material-icons">{item.icon}</span>
                    {expanded && <span className="ml-3 font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Profile section */}
        <div className="py-4 px-2">
          
          {/* Logout Button */}
          <div className="border-t border-blue-900 pt-4">
            <button 
              onClick={handleLogout}
              className={cn(
                "flex items-center text-white hover:bg-red-700 rounded-lg p-3 w-full transition-colors",
                expanded ? "" : "justify-center"
              )}
            >
              <span className="material-icons">logout</span>
              {expanded && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
