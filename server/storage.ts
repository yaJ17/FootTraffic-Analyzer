import { 
  users, type User, type InsertUser,
  locations, type Location, type InsertLocation,
  footTraffic, type FootTraffic, type InsertFootTraffic,
  peakHours, type PeakHours, type InsertPeakHours,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  reportInterpretations, type ReportInterpretation, type InsertReportInterpretation,
  profiles, type Profile, type InsertProfile
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Location operations
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Foot Traffic operations
  getFootTrafficByLocationId(locationId: number): Promise<FootTraffic[]>;
  getFootTrafficByTimeRange(start: Date, end: Date): Promise<FootTraffic[]>;
  getFootTrafficSummary(): Promise<any>;
  createFootTraffic(data: InsertFootTraffic): Promise<FootTraffic>;
  
  // Peak Hours operations
  getCurrentPeakHours(): Promise<PeakHours | undefined>;
  updatePeakHours(data: InsertPeakHours): Promise<PeakHours>;
  
  // Calendar Event operations
  getCalendarEvents(): Promise<CalendarEvent[]>;
  addCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  
  // Report operations
  getReportInterpretations(): Promise<ReportInterpretation[]>;
  getBarangayReports(): Promise<any[]>;
  
  // Profile operations
  getProfile(userId: number): Promise<Profile | undefined>;
  updateProfile(userId: number, data: Partial<InsertProfile>): Promise<Profile>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private footTrafficData: Map<number, FootTraffic>;
  private peakHoursData: Map<number, PeakHours>;
  private calendarEventsData: Map<number, CalendarEvent>;
  private reportInterpretationsData: Map<number, ReportInterpretation>;
  private profilesData: Map<number, Profile>;
  
  private userIdCounter: number = 1;
  private locationIdCounter: number = 1;
  private footTrafficIdCounter: number = 1;
  private peakHoursIdCounter: number = 1;
  private calendarEventIdCounter: number = 1;
  private reportInterpretationIdCounter: number = 1;
  private profileIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.footTrafficData = new Map();
    this.peakHoursData = new Map();
    this.calendarEventsData = new Map();
    this.reportInterpretationsData = new Map();
    this.profilesData = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Add sample locations
    const locations = [
      { name: 'Manila Cathedral', zone: 'Zone 68', lat: 14.5915, lon: 120.9722, population: 1500, color: '#dc2626' },
      { name: 'Divisoria', zone: 'Zone 68', lat: 14.6019, lon: 120.9719, population: 2500, color: '#0039a6' },
      { name: 'Fort Santiago', zone: 'Zone 68', lat: 14.5958, lon: 120.9669, population: 1000, color: '#eab308' },
      { name: 'San Nicolas Church', zone: 'Zone 68', lat: 14.6010, lon: 120.9721, population: 800, color: '#4f46e5' },
      { name: 'Manila High School', zone: 'Zone 68', lat: 14.5932, lon: 120.9700, population: 1200, color: '#059669' },
    ];
    
    locations.forEach(loc => {
      this.createLocation(loc);
    });
    
    // Create peak hours data
    this.updatePeakHours({
      date: new Date(),
      startTime: '9 AM',
      maxTime: '12 PM',
      endTime: '8 PM',
      startStatus: 'Peak already started',
      maxStatus: 'Peak in 3 hours already started'
    });
    
    // Add sample calendar events
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const calendarEvents = [
      {
        title: 'PGG Conference Agenda',
        start: new Date(`${currentYear}-${currentMonth}-23T11:30:00`),
        color: 'bg-blue-100',
        type: 'event',
        description: 'Annual conference'
      },
      {
        title: 'Tasks and objectives',
        start: new Date(`${currentYear}-${currentMonth}-23T15:00:00`),
        color: 'bg-blue-100',
        type: 'task',
        description: 'Weekly planning'
      },
      {
        title: 'Prelim Exam',
        start: new Date(`${currentYear}-${currentMonth}-26T18:00:00`),
        color: 'bg-blue-100',
        type: 'event',
        description: 'Examination period'
      }
    ];
    
    calendarEvents.forEach(event => {
      this.addCalendarEvent(event);
    });
    
    // Add sample report interpretations
    const interpretations = [
      {
        locationId: 1,
        interpretation: 'The forecast model predicts a 15% increase in foot traffic around Manila Cathedral during weekends over the next month. This is consistent with historical patterns and seasonal tourism fluctuations.'
      },
      {
        locationId: 2,
        interpretation: 'Divisoria Market shows clear weekly patterns with peak hours between 10 AM to 2 PM during weekdays. Our prediction model suggests this pattern will remain consistent, with potential congestion points around noon.'
      },
      {
        locationId: 3,
        interpretation: 'Fort Santiago foot traffic is highly dependent on weather conditions and shows strong correlation with tourism events. The model forecasts a 20% increase during the upcoming festival period (March 15-20).'
      }
    ];
    
    interpretations.forEach(interp => {
      this.reportInterpretationsData.set(this.reportInterpretationIdCounter, {
        ...interp,
        id: this.reportInterpretationIdCounter++,
        date: new Date()
      });
    });

    // Add sample profiles
    this.profilesData.set(1, {
      id: 1,
      userId: 1,
      fullName: 'Juan Jackson',
      title: 'Admin',
      phone: '09123456798 / 0123-456-789',
      address: 'Intramuros, Manila',
      email: 'juan@foot.traffic.ph',
      biography: "Juan Jackson is a skilled system administrator managing the LGU's foot traffic monitoring system for the district. With expertise in network security and data analytics, Alex ensures efficient camera operations, real-time traffic insights, and system optimization for improved urban planning and public safety.",
      photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      supervisorId: 2,
      createdAt: new Date()
    });
    
    this.profilesData.set(2, {
      id: 2,
      userId: 2,
      fullName: 'Maria Clara',
      title: 'Supervisor',
      phone: '09887656789',
      address: 'Binondo, Manila',
      email: 'maria@foot.traffic.ph',
      biography: "Maria Clara is a senior administrator overseeing the foot traffic monitoring system. She coordinates between departments and ensures data accuracy.",
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      supervisorId: null,
      createdAt: new Date()
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Location methods
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async createLocation(location: InsertLocation): Promise<Location> {
    const id = this.locationIdCounter++;
    const now = new Date();
    const newLocation: Location = {
      ...location,
      id,
      createdAt: now
    };
    this.locations.set(id, newLocation);
    return newLocation;
  }
  
  // Foot Traffic methods
  async getFootTrafficByLocationId(locationId: number): Promise<FootTraffic[]> {
    return Array.from(this.footTrafficData.values()).filter(
      ft => ft.locationId === locationId
    );
  }
  
  async getFootTrafficByTimeRange(start: Date, end: Date): Promise<FootTraffic[]> {
    return Array.from(this.footTrafficData.values()).filter(
      ft => ft.timestamp >= start && ft.timestamp <= end
    );
  }
  
  async getFootTrafficSummary(): Promise<any> {
    const locations = await this.getLocations();
    
    // Generate sample data for the dashboard
    return {
      kpi: {
        title: 'Total Foot Traffic',
        value: '1,064',
        icon: 'groups'
      },
      peakHours: {
        peakStart: { time: '9 AM', status: 'Peak already started' },
        peakMax: { time: '12 PM', status: 'Peak in 3 hours already started' },
        peakEnd: { time: '8 PM', status: '9 hours and 5 minutes' }
      },
      weeklySummary: {
        monday: 300,
        weekend: 229,
        weekday: 400,
        total: 929
      },
      map: {
        center: { lat: 14.5995, lon: 120.9842 },
        zoom: 13,
        zoneInfo: '649 ZONE 68',
        markers: locations.map(loc => ({
          id: loc.id.toString(),
          name: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          color: loc.color,
          count: Math.floor(Math.random() * 1000)
        }))
      },
      footTraffic: {
        locations: [
          { 
            name: 'Divisoria', 
            color: '#0039a6',
            values: [2, 1, 2.5, 2, 3, 3.5, 3]
          },
          { 
            name: 'Manila Cathedral', 
            color: '#dc2626',
            values: [1, 3, 1.5, 2.5, 2, 2.5, 2]
          },
          { 
            name: 'Fort Santiago', 
            color: '#eab308',
            values: [0.5, 1, 0.7, 0.6, 0.8, 0.7, 0.6]
          }
        ],
        timeLabels: ['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM']
      },
      dwellTime: {
        locations: [
          { 
            name: 'Divisoria', 
            color: '#0039a6',
            values: [5, 3, 4, 2, 3, 5]
          },
          { 
            name: 'Manila Cathedral', 
            color: '#60a5fa',
            values: [3, 4, 3, 2, 3, 3]
          }
        ],
        timeLabels: ['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM']
      }
    };
  }
  
  async createFootTraffic(data: InsertFootTraffic): Promise<FootTraffic> {
    const id = this.footTrafficIdCounter++;
    const footTrafficEntry: FootTraffic = {
      ...data,
      id
    };
    this.footTrafficData.set(id, footTrafficEntry);
    return footTrafficEntry;
  }
  
  // Peak Hours methods
  async getCurrentPeakHours(): Promise<PeakHours | undefined> {
    // Get the most recent peak hours entry
    const peakHours = Array.from(this.peakHoursData.values());
    return peakHours.sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    )[0];
  }
  
  async updatePeakHours(data: InsertPeakHours): Promise<PeakHours> {
    const id = this.peakHoursIdCounter++;
    const peakHoursEntry: PeakHours = {
      ...data,
      id
    };
    this.peakHoursData.set(id, peakHoursEntry);
    return peakHoursEntry;
  }
  
  // Calendar Event methods
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEventsData.values());
  }
  
  async addCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventIdCounter++;
    const now = new Date();
    const calendarEvent: CalendarEvent = {
      ...event,
      id,
      createdAt: now
    };
    this.calendarEventsData.set(id, calendarEvent);
    return calendarEvent;
  }
  
  // Report methods
  async getReportInterpretations(): Promise<ReportInterpretation[]> {
    return Array.from(this.reportInterpretationsData.values());
  }
  
  async getBarangayReports(): Promise<any[]> {
    // Generate sample barangay reports
    return [
      { id: 1, name: 'Barangay 654', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
      { id: 2, name: 'Barangay 655', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
      { id: 3, name: 'Barangay 656', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' },
      { id: 4, name: 'Barangay 657', population: 619, avgFootTraffic: 27, totalFootTraffic: 415, avgDwellTime: '11 secs', totalDwellTime: '31 secs' },
      { id: 5, name: 'Barangay 658', population: 1496, avgFootTraffic: 152, totalFootTraffic: 1335, avgDwellTime: '16 secs', totalDwellTime: '54 secs' },
      { id: 6, name: 'Barangay 659', population: 1124, avgFootTraffic: 129, totalFootTraffic: 1048, avgDwellTime: '13 secs', totalDwellTime: '43 secs' },
      { id: 7, name: 'Barangay 660', population: 1333, avgFootTraffic: 135, totalFootTraffic: 1257, avgDwellTime: '15 secs', totalDwellTime: '51 secs' },
      { id: 8, name: 'Barangay 661', population: 1707, avgFootTraffic: 182, totalFootTraffic: 1540, avgDwellTime: '18 secs', totalDwellTime: '58 secs' }
    ];
  }
  
  // Profile methods
  async getProfile(userId: number): Promise<Profile | undefined> {
    return Array.from(this.profilesData.values()).find(
      profile => profile.userId === userId
    );
  }
  
  async updateProfile(userId: number, data: Partial<InsertProfile>): Promise<Profile> {
    const existingProfile = await this.getProfile(userId);
    
    if (!existingProfile) {
      // Create new profile if it doesn't exist
      const id = this.profileIdCounter++;
      const now = new Date();
      const newProfile: Profile = {
        id,
        userId,
        fullName: data.fullName || '',
        title: data.title || '',
        phone: data.phone || '',
        address: data.address || '',
        email: data.email || '',
        biography: data.biography || '',
        photoUrl: data.photoUrl || '',
        supervisorId: data.supervisorId || null,
        createdAt: now
      };
      this.profilesData.set(id, newProfile);
      return newProfile;
    } else {
      // Update existing profile
      const updatedProfile: Profile = {
        ...existingProfile,
        ...data
      };
      this.profilesData.set(existingProfile.id, updatedProfile);
      return updatedProfile;
    }
  }
}

export const storage = new MemStorage();
