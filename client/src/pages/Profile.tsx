import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    title: '',
    phone: '',
    address: '',
    email: '',
    biography: '',
    photoUrl: ''
  });
  
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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

  const [updatedProfile, setUpdatedProfile] = useState<any>(null);
  
  // Use profile data from API or fallback to default
  const userProfile = updatedProfile || profileData || {
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
  
  const handleOpenEditDialog = () => {
    setEditFormData({
      fullName: userProfile.fullName,
      title: userProfile.title,
      phone: userProfile.phone,
      address: userProfile.address,
      email: userProfile.email,
      biography: userProfile.biography,
      photoUrl: userProfile.photoUrl
    });
    setPreviewUrl(userProfile.photoUrl);
    setIsEditDialogOpen(true);
  };
  
  // Handle profile photo changes
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      
      // Create a URL for the file to use as a preview
      const fileURL = URL.createObjectURL(file);
      setPreviewUrl(fileURL);
      
      // Update the form data with the new URL
      setEditFormData({
        ...editFormData,
        photoUrl: fileURL
      });
    }
  };
  
  const handleSaveProfile = () => {
    // In a real app, this would upload the photo and send data to the server
    // For demonstration, we'll just update the local state
    
    // If a new photo was selected, we'd upload it and get a URL back from the server
    // For now, we'll just use the preview URL directly
    
    // Create a new profile object with the updated data
    const newProfile = {
      ...userProfile,
      fullName: editFormData.fullName,
      title: editFormData.title,
      phone: editFormData.phone,
      address: editFormData.address,
      email: editFormData.email,
      biography: editFormData.biography
    };
    
    // If we have a new photo preview, update the photo URL
    if (previewUrl && previewUrl !== userProfile.photoUrl) {
      newProfile.photoUrl = previewUrl;
    }
    
    // Update the profile in our local state
    setUpdatedProfile(newProfile);
    
    setIsEditDialogOpen(false);
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    // Clean up any object URLs to avoid memory leaks
    if (selectedPhoto) {
      setSelectedPhoto(null);
    }
  };

  return (
    <div className="p-6 relative">
      {showSuccessMessage && (
        <div className="absolute top-0 left-0 right-0 bg-green-100 text-green-800 px-4 py-2 rounded shadow-md z-50 flex items-center justify-center">
          <span className="material-icons mr-2">check_circle</span>
          Profile updated successfully!
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="bg-neutral px-6 py-4 rounded-t-lg border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{userProfile.fullName}'s Profile</h2>
            <Button 
              onClick={handleOpenEditDialog}
              className="bg-primary text-white px-4 py-2 rounded-md flex items-center hover:bg-secondary transition"
            >
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
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
            <DialogDescription>
              Make changes to your profile information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Profile Photo */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profilePhoto" className="text-right">
                Profile Photo
              </Label>
              <div className="col-span-3 flex flex-col items-center space-y-4">
                <div className="relative">
                  <img 
                    src={previewUrl || userProfile.photoUrl} 
                    alt="Profile Preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" 
                  />
                  <label 
                    htmlFor="photoUpload" 
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer shadow-md hover:bg-secondary transition"
                  >
                    <span className="material-icons text-sm">photo_camera</span>
                    <input 
                      type="file" 
                      id="photoUpload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Click the camera icon to change your photo</p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="biography" className="text-right align-top mt-2">
                Biography
              </Label>
              <Textarea
                id="biography"
                value={editFormData.biography}
                onChange={(e) => setEditFormData({...editFormData, biography: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
