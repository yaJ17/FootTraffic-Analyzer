import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('Medium');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    // Validate title
    if (!title || title.trim() === '') {
      onAddTask({
        title: '',
        date: '',
        type: '',
        description: '',
        color: ''
      });
      return;
    }

    // Validate date
    if (!selectedDate) {
      return;
    }
    
    // Determine color based on priority
    let color = 'bg-yellow-100';
    if (type === 'High') {
      color = 'bg-red-100';
    } else if (type === 'Low') {
      color = 'bg-blue-100';
    }
    
    // Format the date with time
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateTimeStr = `${dateStr}T${time}:00`;
    
    onAddTask({
      title,
      date: dateTimeStr,
      type,
      description,
      color
    });
    
    // Reset form
    setTitle('');
    setSelectedDate(undefined);
    setTime('09:00');
    setType('Medium');
    setDescription('');
  };

  return (
    <div className="w-full">
      <h3 className="font-bold mb-4">Add Task</h3>
      <div className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Task title"
            className="w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal truncate",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            {/* Time Picker */}
            <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border border-input bg-background">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              />
            </div>
          </div>
        </div>
        
        <div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
                  <span className="truncate">High Priority</span>
                </div>
              </SelectItem>
              <SelectItem value="Medium">
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2 flex-shrink-0"></span>
                  <span className="truncate">Medium Priority</span>
                </div>
              </SelectItem>
              <SelectItem value="Low">
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
                  <span className="truncate">Low Priority</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Textarea
            placeholder="Description (optional)"
            className="w-full resize-none min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition"
            onClick={handleSubmit}
          >
            Add to Calendar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
