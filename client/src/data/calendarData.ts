export interface CalendarTask {
  id: number;
  title: string;
  start: string;
  end?: string;
  color: string;
  type: 'event' | 'task' | 'reminder';
}

export const getCalendarData = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Format month with leading zero if needed
  const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  
  return {
    tasks: [
      {
        id: 1,
        title: 'PGG Conference Agenda',
        start: `${currentYear}-${formattedMonth}-23T11:30:00.000Z`,
        color: 'bg-blue-100',
        type: 'event'
      },
      {
        id: 2,
        title: 'Tasks and objectives',
        start: `${currentYear}-${formattedMonth}-23T15:00:00.000Z`,
        color: 'bg-blue-100',
        type: 'task'
      },
      {
        id: 3,
        title: 'Limewire and Logistics',
        start: `${currentYear}-${formattedMonth}-25T12:30:00.000Z`,
        color: 'bg-gray-100',
        type: 'event'
      },
      {
        id: 4,
        title: 'Link Layer',
        start: `${currentYear}-${formattedMonth}-25T14:00:00.000Z`,
        color: 'bg-gray-100',
        type: 'task'
      },
      {
        id: 5,
        title: 'Prelim Exam',
        start: `${currentYear}-${formattedMonth}-26T18:00:00.000Z`,
        color: 'bg-blue-100',
        type: 'event'
      },
      {
        id: 6,
        title: 'Prelim Review',
        start: `${currentYear}-${formattedMonth}-26T16:00:00.000Z`,
        color: 'bg-green-100',
        type: 'task'
      },
      {
        id: 7,
        title: 'Preliminary Exams',
        start: `${currentYear}-${formattedMonth}-27T13:30:00.000Z`,
        color: 'bg-blue-100',
        type: 'event'
      },
      {
        id: 8,
        title: 'Quiz Application Layer',
        start: `${currentYear}-${formattedMonth}-27T14:00:00.000Z`,
        color: 'bg-green-100',
        type: 'task'
      },
      {
        id: 9,
        title: 'CS 409-IT3257 - Module',
        // For next month, ensure proper formatting
        start: `${currentYear}-${(currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`}-04T16:30:00.000Z`,
        color: 'bg-blue-100',
        type: 'event'
      }
    ]
  };
};
