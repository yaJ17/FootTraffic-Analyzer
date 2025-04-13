import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="bg-primary text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="text-3xl font-bold my-2">{value}</div>
      </div>
    </div>
  );
};

export default KpiCard;
