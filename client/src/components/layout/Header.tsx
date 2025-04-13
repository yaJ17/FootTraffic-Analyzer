import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format date and time
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
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

  return (
    <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden mr-4 p-1 hover:bg-gray-100 rounded-lg focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <span className="material-icons">menu</span>
        </button>
        <h1 className="text-xl font-bold">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center">
        <div className="mr-6 text-sm text-gray-600 text-right">
          <div className="font-medium">{formatDate(currentTime)}</div>
          <div>{formatTime(currentTime)}</div>
        </div>
        <div className="relative">
          <button className="p-2 relative hover:bg-gray-100 rounded-full">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
        <div className="ml-4">
          <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
            <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white">
              <span className="text-sm font-medium">U</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
