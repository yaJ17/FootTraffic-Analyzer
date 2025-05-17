import React, { useState } from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import TaskForm from '@/components/calendar/TaskForm';
import { useQuery } from '@tanstack/react-query';
import { getCalendarData } from '@/data/calendarData';

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
  
  const [staticCalendarData] = useState(getCalendarData());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showPastDateDialog, setShowPastDateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTitleRequiredDialog, setShowTitleRequiredDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  
  // When calendar data is loaded, set tasks
  React.useEffect(() => {
    if (calendarData?.tasks) {
      setTasks(calendarData.tasks);
    } else if (staticCalendarData?.tasks) {
      // Map the tasks to ensure they match the Task interface
      const mappedTasks = staticCalendarData.tasks.map(task => ({
        ...task,
        type: task.type as 'event' | 'task' | 'reminder'
      }));
      setTasks(mappedTasks);
    }
  }, [calendarData, staticCalendarData]);

  const handleAddTask = (task: any) => {
    // Check if title is empty or only contains whitespace
    if (!task.title || task.title.trim() === '') {
      setShowTitleRequiredDialog(true);
      return;
    }

    const selectedDate = new Date(task.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setShowPastDateDialog(true);
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: task.title,
      start: task.date,
      color: task.color,
      type: task.type.toLowerCase() as 'event' | 'task' | 'reminder'
    };
    
    setTasks([...tasks, newTask]);
  };
  
  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(task => task.id !== taskToDelete));
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    }
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
      {/* Title Required Dialog */}
      {showTitleRequiredDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Title Required</h3>
            <p className="text-gray-600 mb-6">Please enter a title for your task. The title field cannot be empty.</p>
            <button
              onClick={() => setShowTitleRequiredDialog(false)}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Past Date Dialog */}
      {showPastDateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Cannot Add Task</h3>
            <p className="text-gray-600 mb-6">You cannot add tasks for past dates. Please select a current or future date.</p>
            <button
              onClick={() => setShowPastDateDialog(false)}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Delete Task</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <div key={task.id} className="border-l-4 pl-3 py-2 group relative" style={{ borderColor: task.color.includes('green') ? '#10b981' : task.color.includes('yellow') ? '#f59e0b' : '#3b82f6' }}>
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{task.title}</p>
                        <button 
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
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
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
