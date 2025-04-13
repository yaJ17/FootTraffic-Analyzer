import React from 'react';
import { useLocation } from 'wouter';
import { formatDateTime } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [location] = useLocation();
  
  // Set the page title based on current route
  const getPageTitle = () => {
    switch (true) {
      case location === '/' || location === '/dashboard':
        return 'Dashboard';
      case location === '/statistics':
        return 'Statistics';
      case location === '/reports':
        return 'Reports';
      case location === '/profile':
        return 'Profile';
      case location === '/calendar':
        return 'Calendar';
      default:
        return 'Dashboard';
    }
  };
  
  // Split the formatted date time by newline for display
  const [date, time] = formatDateTime().split('\n');

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="mr-4 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <span className="material-icons">menu</span>
        </button>
        <h1 className="text-xl font-bold">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center">
        <div className="mr-6 text-sm text-gray-600 text-right">
          <div>{date}</div>
          <div>{time}</div>
        </div>
        <div className="relative mr-4">
          <span className="material-icons cursor-pointer">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
