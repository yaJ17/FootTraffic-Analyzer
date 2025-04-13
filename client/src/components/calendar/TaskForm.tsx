import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskFormProps {
  onAddTask: (task: {
    title: string;
    date: string;
    type: string;
    description: string;
    color: string;
  }) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Regular Task');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title || !date) return;
    
    // Determine color based on task type
    let color = 'bg-blue-100';
    if (type === 'Event') {
      color = 'bg-green-100';
    } else if (type === 'Reminder') {
      color = 'bg-yellow-100';
    }
    
    onAddTask({
      title,
      date,
      type,
      description,
      color
    });
    
    // Reset form
    setTitle('');
    setDate('');
    setType('Regular Task');
    setDescription('');
  };

  return (
    <div className="col-span-7 mt-6">
      <h3 className="font-bold mb-2">Add Task</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            type="text"
            placeholder="Task title"
            className="w-full p-2 border rounded mb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="date"
                className="w-full p-2 border rounded"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular Task">Regular Task</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div>
          <Textarea
            placeholder="Description (optional)"
            className="w-full p-2 border rounded h-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button
          className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition"
          onClick={handleSubmit}
        >
          Add to Calendar
        </Button>
      </div>
    </div>
  );
};

export default TaskForm;
