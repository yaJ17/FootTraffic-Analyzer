import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBgSU1plo0po4C6XnzweoIGHyhZo2ASK7k",
  authDomain: "foottech-af93a.firebaseapp.com",
  projectId: "foottech-af93a",
  storageBucket: "foottech-af93a.appspot.com",
  messagingSenderId: "942697824763",
  appId: "1:942697824763:web:3ee3eb1908bad319720b5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Firestore collection references
const footTrafficCollection = collection(db, 'footTraffic');
const calendarCollection = collection(db, 'calendar');

// Calendar Task Interface
interface CalendarTask {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  description?: string;
  color: string;
  type: 'event' | 'task' | 'reminder';
}

// Calendar Task Functions
export const addCalendarTask = async (taskData: Omit<CalendarTask, 'id'>): Promise<CalendarTask> => {
  try {
    const docRef = await addDoc(calendarCollection, {
      ...taskData,
      start: Timestamp.fromDate(taskData.start),
      end: taskData.end ? Timestamp.fromDate(taskData.end) : null,
      createdAt: Timestamp.now()
    });

    return {
      id: docRef.id,
      ...taskData
    };
  } catch (error) {
    console.error('Error adding calendar task:', error);
    throw error;
  }
};

export const getCalendarTasks = async (): Promise<CalendarTask[]> => {
  try {
    const q = query(calendarCollection, orderBy('start', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled Task',
        start: data.start.toDate(),
        end: data.end ? data.end.toDate() : undefined,
        description: data.description,
        color: data.color || '#3B82F6',
        type: data.type || 'task',
        status: data.status || 'pending'
      };
    });
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    throw error;
  }
};

export const deleteCalendarTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'calendar', taskId));
    return true;
  } catch (error) {
    console.error('Error deleting calendar task:', error);
    throw error;
  }
};

// Interface for foot traffic data
interface FootTrafficData {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: Date;
  date: string;
  day: string;
  time: string;
}

// Function to add foot traffic data
export const addFootTrafficData = async (data: Omit<FootTrafficData, 'timestamp' | 'date' | 'day' | 'time'>) => {
  try {
    const now = new Date();
    const footTrafficData: FootTrafficData = {
      ...data,
      timestamp: now,
      date: now.toLocaleDateString(),
      day: now.toLocaleDateString('en-US', { weekday: 'long' }),
      time: now.toLocaleTimeString()
    };

    await addDoc(footTrafficCollection, {
      ...footTrafficData,
      timestamp: Timestamp.fromDate(footTrafficData.timestamp)
    });
  } catch (error) {
    console.error('Error adding foot traffic data:', error);
    throw error;
  }
};

// Function to get foot traffic data for a specific location
export const getLocationFootTraffic = async (location: string) => {
  try {
    const q = query(
      footTrafficCollection,
      where('location', '==', location),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error getting location foot traffic:', error);
    throw error;
  }
};

// Function to get all foot traffic data
export const getAllFootTraffic = async () => {
  try {
    const q = query(footTrafficCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error getting all foot traffic:', error);
    throw error;
  }
};

// Function to get foot traffic data for a specific date range
export const getFootTrafficByDateRange = async (startDate: Date, endDate: Date) => {
  try {
    const q = query(
      footTrafficCollection,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error getting foot traffic by date range:', error);
    throw error;
  }
};

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Immediately sign out after registration to prevent auto-login
    await signOut(auth);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db }; 