import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom'; 
import axios from 'axios';
import { baseUrl } from '../Config';
import { LogOut } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const [error, setError] = useState();

  const handleLogout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post(`${baseUrl}/api/logout`);

      if (response.data.status === 'success') {
        localStorage.clear();
        navigate('/');
      } else {
        setError('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('An error occurred during logout');
    }
  };

  return (
    <nav className="bg-red border-b">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
            <div>
              <img src='/Images/logo.svg' alt="Logo" />
            </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="bg-[#172D41] text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex gap-2">
              <LogOut />
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};


