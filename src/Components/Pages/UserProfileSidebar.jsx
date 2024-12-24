import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, PencilLine, User, Mail} from 'lucide-react';
import { baseUrl } from '../Config';

  // Function to truncate text if it's longer than 8 characters
  const truncateText = (text, maxLength = 8) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.slice(0, maxLength)}...`
      : text;
  };

    // Function to extract name from email if no name is provided
    const getDisplayName = (name, email) => {
        // If name is provided and not empty, use it
        if (name && name.trim() !== '') {
          return truncateText(name);
        }
        
        // If no name, extract name from email
        if (email) {
          // Split email and take the part before @
          const emailName = email.split('@')[0];
          return truncateText(emailName);
        }
        
        // Fallback
        return 'User';
      };

const UserProfileSidebar = () => {
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const displayName = getDisplayName(profileName, profileEmail);



    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user')); 
                const email = user?.email; 
                const response = await axios.get(`${baseUrl}/api/user`, {
                    headers: {
                        'user-email': email,
                    },
                });
                const userData = response.data[0];
                setProfileName(userData.name);
                setProfileEmail(userData.email);
                setProfileImage(userData.profileImage);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setProfileImage(file);
    };

    const handleProfileUpdate = async () => {
        const formData = new FormData();
        formData.append('name', profileName);
        formData.append('email', profileEmail);
      
        if (profileImage instanceof File) {
          formData.append('profileImage', profileImage);
        }
      
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const email = user?.email;
      
          const response = await axios.post(`${baseUrl}/api/update`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'user-email': email,
            },
          });
      
          if (response.status === 200) {
            const updatedImageUrl = response.data.profileImageUrl;
            if (updatedImageUrl) {
              setProfileImage(updatedImageUrl); // Update profile image in the UI only if provided
            }
            alert('Profile updated successfully!');
            setShowProfile(false);
          } else {
            alert('Failed to update profile. Please try again.');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Error updating profile. Please try again.');
        }
      };
      

    const getProfileImageSrc = () => {
        if (profileImage instanceof File) {
            return URL.createObjectURL(profileImage);
        }
        return profileImage || './Images/Avatar.svg';
    };

    return (
        <div className="fixed bottom-0 left-0 z-[9999] bg-[#F9FAFB] shadow-lg">
            {/* Sidebar Footer */}
            <div className="container mx-auto pl-[0.4rem] pr-[0.3rem] py-3 w-full max-w-[230px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img 
                            src={getProfileImageSrc()}
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-800">{displayName}</p>
                                <Pencil 
                                    onClick={() => setShowProfile(true)}
                                    className="text-gray-500 hover:text-blue-600 cursor-pointer"
                                    size={18}
                                />
                            </div>
                            <p className="text-sm text-gray-500">{truncateText(profileEmail, 20)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Edit Modal */}
            {showProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-96 p-6 space-y-6">
                        <header className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
                        </header>

                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <img
                                    src={getProfileImageSrc()}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover shadow-md"
                                />
                                <label 
                                    htmlFor="profile-pic-upload" 
                                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600"
                                >
                                    <PencilLine size={20} />
                                    <input 
                                        type="file" 
                                        id="profile-pic-upload" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="text-gray-400" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="text-gray-400" size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        disabled
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button 
                                onClick={() => setShowProfile(false)}
                                className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleProfileUpdate}
                                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Update Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileSidebar;

//  jo agar m user kuch update nhi kar raha hy to wo text update nn ho wo same rahe 