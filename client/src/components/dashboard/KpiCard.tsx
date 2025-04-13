import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-2xl mr-2">{icon}</span>
            <span className="font-medium">{title}</span>
          </div>
          <div className="bg-white/20 rounded-full p-1.5">
            <span className="material-icons text-white">trending_up</span>
          </div>
        </div>
        <div className="text-4xl font-bold mt-4 mb-1">{value}</div>
        <div className="text-xs flex items-center text-white/80">
          <span className="material-icons text-xs mr-1">access_time</span>
          Updated just now
        </div>
      </div>
      <div className="px-4 py-3 text-sm text-gray-600 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons text-green-500 text-sm mr-1">trending_up</span>
          <span className="text-green-500 font-medium">+12%</span>
          <span className="ml-1">from yesterday</span>
        </div>
        <button className="text-primary hover:text-secondary transition">
          <span className="material-icons">info</span>
        </button>
      </div>
    </div>
  );
};

export default KpiCard;
