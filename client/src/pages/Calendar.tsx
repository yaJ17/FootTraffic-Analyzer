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
      <CalendarView 
        tasks={tasks}
        onAddTask={handleAddTask}
      />
      <TaskForm onAddTask={handleAddTask} />
    </div>
  );
};

export default Calendar;
