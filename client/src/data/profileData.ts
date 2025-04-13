export interface Supervisor {
  name: string;
  phone: string;
  photoUrl: string;
}

export interface ProfileData {
  fullName: string;
  title: string;
  phone: string;
  address: string;
  email: string;
  biography: string;
  supervisor: Supervisor;
  photoUrl: string;
}

export const getProfileData = (userPhotoUrl?: string): ProfileData => {
  return {
    fullName: 'Juan Jackson',
    title: 'Admin',
    phone: '09123456798 / 0123-456-789',
    address: 'Intramuros, Manila',
    email: 'juan@foot.traffic.ph',
    biography: "Juan Jackson is a skilled system administrator managing the LGU's foot traffic monitoring system for the district. With expertise in network security and data analytics, Alex ensures efficient camera operations, real-time traffic insights, and system optimization for improved urban planning and public safety.",
    supervisor: {
      name: 'Maria Clara',
      phone: '09887656789',
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    photoUrl: userPhotoUrl || 'https://randomuser.me/api/portraits/men/32.jpg'
  };
};
