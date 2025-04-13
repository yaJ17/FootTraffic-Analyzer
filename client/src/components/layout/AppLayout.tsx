import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const toggleSidebarVisibility = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="min-h-screen bg-neutral">
      <Sidebar 
        expanded={sidebarExpanded} 
        visible={sidebarVisible}
        onToggleExpand={toggleSidebar}
      />
      
      <div className={sidebarExpanded ? 'main-content-expanded' : 'main-content-collapsed'}>
        <Header 
          onToggleSidebar={toggleSidebarVisibility} 
        />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
