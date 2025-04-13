import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Traffic Alert',
      message: 'Unusual foot traffic detected in Binondo area',
      time: '10 min ago',
      read: false
    },
    {
      id: 2,
      title: 'System Update',
      message: 'System maintenance scheduled for tonight',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      title: 'New Report Available',
      message: 'Weekly foot traffic summary is now available',
      time: '3 hours ago',
      read: true
    }
  ]);
  
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
        <div className="relative mr-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <span className="material-icons">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setNotifications(notifications.map(n => 
                          n.id === notification.id ? {...n, read: true} : n
                        ));
                      }}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-center text-sm"
                  onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                >
                  Mark all as read
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="text-sm text-gray-600 text-right mr-4">
          <div className="font-medium">{formatDate(currentTime)}</div>
          <div>{formatTime(currentTime)}</div>
        </div>
        
        <div>
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
