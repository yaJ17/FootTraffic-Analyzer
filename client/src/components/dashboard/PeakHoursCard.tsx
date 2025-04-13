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
    <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-100">
      <div className="p-4">
        <h3 className="font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">schedule</span>
          Peak Hours
        </h3>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <span className="material-icons text-blue-600">arrow_upward</span>
                </div>
                <div>
                  <div className="font-medium">Peak Start</div>
                  <div className="text-xs text-gray-500">Status: {peakStart.status}</div>
                </div>
              </div>
              <div className="text-lg font-bold">{peakStart.time}</div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <span className="material-icons text-red-600">priority_high</span>
                </div>
                <div>
                  <div className="font-medium">Peak Maximum</div>
                  <div className="text-xs text-gray-500">{peakMax.status}</div>
                </div>
              </div>
              <div className="text-lg font-bold">{peakMax.time}</div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="material-icons text-green-600">arrow_downward</span>
                </div>
                <div>
                  <div className="font-medium">Peak End</div>
                  <div className="text-xs text-gray-500">Ends in {getTimeRemainingText(peakEnd.time)}</div>
                </div>
              </div>
              <div className="text-lg font-bold">{peakEnd.time}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <span className="material-icons text-xs mr-1">info</span>
          Data updates every 15 minutes
        </div>
      </div>
    </div>
  );
};

export default PeakHoursCard;
