import { CheckCircle2Icon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '../Config';
import axios from 'axios';

const LoginPayment = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('');
  const [responseId, setResponseId] = useState('');
  const [hasUsedFreePlan, setHasUsedFreePlan] = useState(false);

  // Check if user has already used free plan
  useEffect(() => {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    if (parsedUser?.plan === 'free') {
      setHasUsedFreePlan(true);
    }
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  // Function to create Razorpay order
  const createRazorpay = (amount) => {
    const data = JSON.stringify({
      amount: amount * 850,
      currency: 'INR',
    });

    const config = {
      method: 'POST',
      url: 'http://localhost:8080/api/orders',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    axios.request(config)
      .then((response) => {
        console.log('Order Response:', response.data);
        handleRazorpayScreen(response.data);
      })
      .catch((error) => {
        console.error('Error creating order:', error);
      });
  };

  // Function to handle successful payment and update tokens
  const handlePaymentSuccess = async (paymentId) => {
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const email = parsedUser?.email;

    if (!email) {
      console.error('User email is missing.');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/send-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          plan: 'pro',
          usageCount: 100000,
          paymentId
        }),
      });

      if (response.ok) {
        const updatedUser = { ...parsedUser, plan: 'pro' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        navigate('/home');
      } else {
        throw new Error('Failed to update tokens after payment');
      }
    } catch (error) {
      console.error('Error updating tokens:', error.message);
      alert('Payment successful but failed to update tokens. Please contact support.');
    }
  };

  // Function to handle Razorpay screen
  const handleRazorpayScreen = async (orderData) => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      alert('Failed to load Razorpay SDK. Check your internet connection.');
      return;
    }

    const options = {
      key: 'rzp_test_XrrY7pCx9ED0Bc',
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.id,
      name: 'Court Craft Application',
      description: 'Payment to Court Craft Application',
      image: '../Images/logo.svg',
      handler: function (response) {
        console.log('Payment Successful:', response);
        setResponseId(response.razorpay_payment_id);
        handlePaymentSuccess(response.razorpay_payment_id);
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: 'Court Craft Application',
        email: 'courtCraft@gmail.com',
        contact: '+91-99999-99999',
      },
      theme: {
        color: '#f9fafb',
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // Handles button clicks for Free and Pro
  const handlePlanSelect = async (selectedPlan) => {
    setPlan(selectedPlan);
    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;
    const email = parsedUser?.email;

    if (!email) {
      console.error('User email is missing.');
      return;
    }

    try {
      if (selectedPlan === 'free') {
        const response = await fetch(`${baseUrl}/api/send-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            plan: selectedPlan,
            usageCount: 10000
          }),
        });

        if (response.ok) {
          const updatedUser = { ...parsedUser, plan: selectedPlan };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setHasUsedFreePlan(true);
          navigate('/home');
        } else {
          throw new Error('Failed to send access');
        }
      } else if (selectedPlan === 'pro') {
        createRazorpay(100);
      }
    } catch (error) {
      console.error('Error sending access:', error.message);
      alert('Failed to process plan selection. Please try again.');
    }
  };

  return (
  <div>
      <button onClick={() => navigate('/home')} className='bg-blue-500 text-white px-5 py-2 ml-5'>Back</button>
      <div className="flex justify-center items-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div>
          <div className="mb-2">
            <h2 className="font-bold text-3xl text-gray-500">
              Court Craft Application
            </h2>
            <p>Upgrade to pro to unlock all functionalities.</p>
          </div>
          <hr />
        </div>

        {/* Plan Options */}
        <div className="grid grid-cols-2 gap-5 p-6">
          {/* Free Plan */}
          <div className="border p-3 rounded-lg flex flex-col gap-5">
            <div>
              <h3 className="font-medium text-2xl text-gray-500">Standard</h3>
              <p>Start for free, no payment needed.</p>
            </div>
            <div>
              <h2 className="font-bold text-gray-500">FREE</h2>
              <p>10,000 Tokens</p>
            </div>
            <button
              className={`w-full p-3 rounded-md ${
                hasUsedFreePlan 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => !hasUsedFreePlan && handlePlanSelect('free')}
              disabled={hasUsedFreePlan}
            >
              {hasUsedFreePlan ? 'Free Plan Already Used' : 'Continue with Free'}
            </button>
            <div className="flex flex-col gap-4">
              <div className="icon-text">
                <CheckCircle2Icon className='w-4 h-4' />
                <p>You can use only 10,000 tokens in the free version.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className='w-4 h-4' />
                <p>In one document, you cannot create more than 3 pages.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className='w-4 h-4' />
                <p>Access the AI editor for basic transcription and text formatting.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className='w-4 h-4' />
                <p>Download your documents in Word format (limited features).</p>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border p-3 rounded-lg flex flex-col gap-5">
            <div>
              <h3 className="font-medium text-2xl text-gray-500">Professional</h3>
              <p>Unlock the full capabilities of Court Craft Application.</p>
            </div>
            <div>
              <h2 className="font-bold text-gray-500">$10</h2>
              <p>100,000 Tokens</p>
            </div>
            <button
              className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => handlePlanSelect('pro')}
            >
              Continue with Pro
            </button>
            <div className="flex flex-col gap-4">
              <div className="icon-text">
                <CheckCircle2Icon className="text-blue-500 w-4 h-4"/>
                <p>Access up to 100,000 tokens for AI-assisted conversations and transcription.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className="text-blue-500 w-4 h-4 " />
                <p>Create and edit unlimited pages in a document.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className="text-blue-500 w-4 h-4 " />
                <p>Utilize advanced AI features for detailed transcription and editing.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className="text-blue-500 w-4 h-4 " />
                <p>Export documents in Word format with full functionality.</p>
              </div>
              <div className="icon-text">
                <CheckCircle2Icon className="text-blue-500 w-4 h-4 " />
                <p>Priority customer support for any issues.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default LoginPayment;

