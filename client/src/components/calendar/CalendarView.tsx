import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";

interface Task {
  id: number;
  title: string;
  start: string;
  end?: string;
  color: string;
  type: 'event' | 'task' | 'reminder';
}

interface CalendarViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask?: (taskId: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  
  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  
  tasks.forEach(task => {
    const dateKey = new Date(task.start).toISOString().split('T')[0];
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  // Generate days for the calendar grid
  const generateDays = () => {
    if (!date) return [];
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to display
    const prevMonthDays = [];
    if (startDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonth.getDate();
      
      for (let i = prevMonthDaysCount - startDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
        prevMonthDays.push({
          date: new Date(year, month - 1, i),
          isCurrentMonth: false
        });
      }
    }
    
    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Calculate days from next month to display
    const nextMonthDays = [];
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const daysNeeded = 42 - totalDaysSoFar; // 6 rows of 7 days
    
    for (let i = 1; i <= daysNeeded; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const days = generateDays();
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button className="px-3 py-1 bg-neutral rounded border mr-2">Today</button>
          <div className="flex mr-2">
            <button 
              className="px-1 py-1 border border-r-0 rounded-l"
              onClick={() => {
                if (date) {
                  const newDate = new Date(date);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setDate(newDate);
                }
              }}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <button 
              className="px-1 py-1 border rounded-r"
              onClick={() => {
                if (date) {
                  const newDate = new Date(date);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setDate(newDate);
                }
              }}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
          <h2 className="text-lg font-bold">
            {date ? date.toLocaleString('default', { month: 'long', year: 'numeric' }) : ''}
          </h2>
        </div>
        
        <div className="flex">
          <button 
            className={`px-3 py-1 rounded border mr-1 ${view === 'month' ? 'bg-primary text-white' : 'bg-white'}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={`px-3 py-1 rounded border mr-1 ${view === 'agenda' ? 'bg-primary text-white' : 'bg-white'}`}
            onClick={() => setView('agenda')}
          >
            Agenda
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((day) => (
          <div key={day} className="text-center py-2 font-medium">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 border">
        {days.map((day, idx) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const tasksForDay = tasksByDate[dateStr] || [];
          
          return (
            <div 
              key={idx} 
              className={`min-h-40 border p-1 ${day.isCurrentMonth ? '' : 'bg-gray-50'}`}
            >
              <div className={`text-right mb-1 ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-500'}`}>
                {day.date.getDate()}
              </div>
              {tasksForDay.map((task) => (
                <div 
                  key={task.id}
                  className={`${task.color} px-2 py-1 text-xs rounded mb-1 border-l-4 border-${task.color}-500`}
                >
                  <span className="font-bold">
                    {new Date(task.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span> {task.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
