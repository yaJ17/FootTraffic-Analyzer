import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

const Profile: React.FC = () => {
  const { user } = useAuth();
  
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: () => fetch('/api/profile').then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="bg-neutral px-6 py-4 rounded-t-lg border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Profile</h2>
              <div className="w-24 h-10 bg-primary animate-pulse rounded-md"></div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/4 flex justify-center md:justify-start">
                <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
              <div className="w-full md:w-3/4 mt-6 md:mt-0">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-6"></div>
                
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-12 bg-gray-200 animate-pulse rounded md:col-span-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userProfile = profileData || {
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
    photoUrl: user?.photoURL || 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-neutral px-6 py-4 rounded-t-lg border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{userProfile.fullName}'s Profile</h2>
            <Button className="bg-primary text-white px-4 py-2 rounded-md flex items-center hover:bg-secondary transition">
              <span className="material-icons mr-1 text-sm">edit</span>
              Edit Profile
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 flex justify-center md:justify-start">
              <div className="relative">
                <img 
                  src={userProfile.photoUrl} 
                  alt="Profile Image" 
                  className="w-32 h-32 rounded-full object-cover" 
                />
              </div>
            </div>
            
            <div className="w-full md:w-3/4 mt-6 md:mt-0">
              <h3 className="text-2xl font-bold">{userProfile.fullName}</h3>
              <p className="text-gray-600 mb-6">{userProfile.title}</p>
              
              <h4 className="text-lg font-bold border-b pb-2 mb-4">Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <span className="material-icons text-primary mr-2">phone</span>
                  <div>
                    <p>{userProfile.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-icons text-primary mr-2">place</span>
                  <div>
                    <p>{userProfile.address}</p>
                  </div>
                </div>
                <div className="flex items-start md:col-span-2">
                  <span className="material-icons text-primary mr-2">email</span>
                  <div>
                    <p>{userProfile.email}</p>
                  </div>
                </div>
              </div>
              
              <h4 className="text-lg font-bold border-b pb-2 mb-4">Biography</h4>
              <p className="mb-6">
                {userProfile.biography}
              </p>
              
              <h4 className="text-lg font-bold border-b pb-2 mb-4">Additional Information</h4>
              <div className="flex items-center">
                <p className="font-medium mr-6">Supervisor</p>
                <div className="flex items-center">
                  <img 
                    src={userProfile.supervisor.photoUrl} 
                    alt="Supervisor" 
                    className="w-10 h-10 rounded-full mr-2" 
                  />
                  <div>
                    <p className="font-medium">{userProfile.supervisor.name}</p>
                    <p className="text-sm text-gray-600">{userProfile.supervisor.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
