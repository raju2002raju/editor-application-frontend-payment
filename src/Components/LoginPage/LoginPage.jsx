import React, { useState } from 'react';
import { baseUrl } from '../Config';
import { CircleCheck, CircleX, Mail } from 'lucide-react';
import LoginPayment from './LoginPayment';
import { useNavigate } from 'react-router-dom';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState(false)
  const navigate = useNavigate();


  const emailValidation = (e) => {
    let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    let emailValue = e.target.value;
    setEmail(emailValue);
    if (email.match(pattern)) {
      setMessage(true)
    } else {
      setMessage(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email || !isChecked) {
      alert('Please enter email and accept terms');
      return;
    }
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(`${baseUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setShowOtpInput(true);
      } else {
        alert('Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send OTP');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert('Please enter OTP');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (response.status === 200) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Check if the user has a plan
        if (data.user.plan) {
          alert('Thank you for joining Court Craft Application');
          navigate('/home');
        } else {
          setShowPopup(true);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img src="/Images/login_logo.svg" alt="first image" className="rounded" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Court Craft Application</h1>
          <p className="text-gray-600 mt-2">Register or Login</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center border rounded-lg overflow-hidden">
            <div className="flex items-center px-3 bg-white border-r">
              <Mail />
            </div>
            <input
              type="email"
              value={email}
              onChange={emailValidation}
              className="flex-1 px-3 py-2 outline-none"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <div
              className={`flex items-center ${email.length === 0
                ? "text-gray-500"
                : message
                  ? "text-green-500"
                  : "text-red-500"
                }`}
            >
              {email.length === 0
                ? <CircleCheck className='w-5 h-5 flex items-center mr-3' />
                : message
                  ? <CircleCheck className='w-5 h-5 flex items-center mr-3' />
                  : <CircleX className='w-5 h-5 flex items-center mr-3' />}
            </div>
          </div>
          <div
            className={`${email.length === 0
              ? "text-gray-500"
              : message
                ? "text-green-500"
                : "text-red-500"
              }`}
          >
            {email.length === 0
              ? "Please fill in the email field"
              : message
                ? "The email you entered is Valid"
                : "The email you entered is Invalid"}
          </div>

          {showOtpInput && (
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500"
            />
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I have reviewed and accept the{' '}
              <a href="/terms" className="text-blue-600">Terms of Usage</a>{' '}
              <a href="/privacy" className="text-blue-600">Privacy Policy</a>
            </label>
          </div>

          <button
            className={`w-full py-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 text-gray-500' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
            onClick={showOtpInput ? handleVerifyOtp : handleSendOtp}
            disabled={isLoading}
          >
            {isLoading ? 'Please Wait.....' : showOtpInput ? 'Verify OTP' : 'Continue'}
          </button>
        </div>
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className='text-end font-bold' onClick={() => setShowPopup(false)}>X</p>
            <LoginPayment />
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage; 