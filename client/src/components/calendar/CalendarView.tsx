import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color: string;
  type: 'event' | 'task' | 'reminder';
  description?: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask?: (taskId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask, onDeleteTask }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  
  // Update tasksByDate whenever tasks prop changes
  useEffect(() => {
    const groupedTasks: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const dateKey = new Date(task.start).toISOString().split('T')[0];
      if (!groupedTasks[dateKey]) {
        groupedTasks[dateKey] = [];
      }
      groupedTasks[dateKey].push(task);
    });
    setTasksByDate(groupedTasks);
  }, [tasks]);

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

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const confirmDelete = () => {
    if (deleteTaskId && onDeleteTask) {
      onDeleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTaskId(null);
  };

  return (
    <div className="col-span-3">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-primary text-white font-semibold p-2 text-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {generateDays().map((day, idx) => {
            const dateStr = day.date.toISOString().split('T')[0];
            const tasksForDay = tasksByDate[dateStr] || [];
            
            return (
              <div 
                key={idx} 
                className={`min-h-40 border p-1 ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className={`text-right mb-1 ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-500'}`}>
                  {day.date.getDate()}
                </div>
                {tasksForDay.map((task) => (
                  <div 
                    key={task.id}
                    className={`${task.color} px-2 py-1 text-xs rounded mb-1 border-l-4 border-${task.color}-500 flex items-center group hover:bg-opacity-80 transition-all`}
                  >
                    <div className="flex-1 truncate">
                      <span className="font-bold">
                        {task.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="ml-1">{task.title}</span>
                    </div>
                    {onDeleteTask && (
                      <button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTaskId !== null} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarView;
