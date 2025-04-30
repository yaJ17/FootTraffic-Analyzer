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
    if (!title || !selectedDate) {
      // Show error or validation message
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
    <div className="col-span-7 mt-6">
      <h3 className="font-bold mb-4">Add Task</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input
            type="text"
            placeholder="Task title"
            className="w-full mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
            
            <div className="w-full sm:w-1/2">
              {/* Time Picker */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Low Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Textarea
            placeholder="Description (optional)"
            className="w-full h-full resize-none min-h-[100px]"
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
