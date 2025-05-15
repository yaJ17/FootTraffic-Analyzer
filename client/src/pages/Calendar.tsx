import React from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import TaskForm from '@/components/calendar/TaskForm';
import { addCalendarTask, getCalendarTasks, deleteCalendarTask } from '@/lib/firebase';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color: string;
  type: 'event' | 'task' | 'reminder';
  description?: string;
}

const Calendar: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch calendar tasks
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: async () => {
      try {
        const tasks = await getCalendarTasks();
        return { tasks };
      } catch (error) {
        console.error('Error fetching tasks:', error);
        throw new Error('Failed to fetch calendar tasks');
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id'>) => {
      try {
        const newTask = await addCalendarTask(task);
        return newTask;
      } catch (error) {
        console.error('Error adding task:', error);
        throw new Error('Failed to add task');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast({
        title: "Task Added",
        description: "Your task has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      try {
        await deleteCalendarTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast({
        title: "Task Deleted",
        description: "Your task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    addTaskMutation.mutate(task);
  };

  const handleDeleteTask = async (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
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
            
            {(!calendarData?.tasks || calendarData.tasks.length === 0) ? (
              <p className="text-gray-500 text-sm italic">No upcoming tasks</p>
            ) : (
              calendarData.tasks
                .sort((a: Task, b: Task) => a.start.getTime() - b.start.getTime())
                .slice(0, 5)
                .map((task: Task) => (
                  <div
                    key={task.id}
                    className="border-l-4 pl-3 py-2 mb-2 group relative hover:bg-gray-50 transition-colors rounded"
                    style={{ borderColor: task.color }}
                  >
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
                      <span>{task.start.toLocaleDateString()} {task.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

        {/* Main calendar - takes 3/4 of space */}
        <CalendarView 
          tasks={calendarData?.tasks || []}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default Calendar;
