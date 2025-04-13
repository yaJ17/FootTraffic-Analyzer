import React, { useState } from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import TaskForm from '@/components/calendar/TaskForm';
import { useQuery } from '@tanstack/react-query';

interface Task {
  id: number;
  title: string;
  start: string;
  end?: string;
  color: string;
  type: 'event' | 'task' | 'reminder';
}

const Calendar: React.FC = () => {
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['/api/calendar'],
    queryFn: () => fetch('/api/calendar').then(res => res.json()),
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // When calendar data is loaded, set tasks
  React.useEffect(() => {
    if (calendarData?.tasks) {
      setTasks(calendarData.tasks);
    }
  }, [calendarData]);

  const handleAddTask = (task: any) => {
    const newTask: Task = {
      id: Date.now(), // Simple unique ID for demo
      title: task.title,
      start: task.date,
      color: task.color,
      type: task.type.toLowerCase() as 'event' | 'task' | 'reminder'
    };
    
    setTasks([...tasks, newTask]);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 h-screen animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with task form and agenda - takes 1/4 of space */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <span className="material-icons mr-2 text-primary">add_task</span>
              Add New Task
            </h3>
            <TaskForm onAddTask={handleAddTask} />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <span className="material-icons mr-2 text-primary">event_note</span>
              Upcoming Tasks
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No upcoming tasks</p>
              ) : (
                tasks
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="border-l-4 pl-3 py-2" style={{ borderColor: task.color.includes('green') ? '#10b981' : task.color.includes('yellow') ? '#f59e0b' : '#3b82f6' }}>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="material-icons text-xs mr-1">event</span>
                        <span>{new Date(task.start).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
        
        {/* Main calendar - takes 3/4 of space */}
        <div className="md:col-span-3">
          <CalendarView 
            tasks={tasks}
            onAddTask={handleAddTask}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
