import React from 'react';
import { getTimeRemainingText } from '@/lib/utils';

interface PeakInfo {
  time: string;
  status: string;
}

interface PeakHoursCardProps {
  peakStart: PeakInfo;
  peakMax: PeakInfo;
  peakEnd: PeakInfo;
}

const PeakHoursCard: React.FC<PeakHoursCardProps> = ({ peakStart, peakMax, peakEnd }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h3 className="font-bold mb-3">Peak Hours</h3>
        
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Peak Start</span>
            <span className="font-medium">{peakStart.time}</span>
          </div>
          <div className="text-xs text-gray-500">Stats in: {peakStart.status}</div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Peak Max</span>
            <span className="font-medium">{peakMax.time}</span>
          </div>
          <div className="text-xs text-gray-500">{peakMax.status}</div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Peak End</span>
            <span className="font-medium">{peakEnd.time}</span>
          </div>
          <div className="text-xs text-gray-500">Ends in {getTimeRemainingText(peakEnd.time)}</div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursCard;
