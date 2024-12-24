import React, { useState } from 'react';
import axios from 'axios';

const PaymentTest = () => {
    const [responseId, setResponseId] = useState('');
    const [responseState, setResponseState] = React.useState([]);

    // Function to dynamically load Razorpay script
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
            amount: amount * 100, 
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

    // Function to handle Razorpay screen
    const handleRazorpayScreen = async (orderData) => {
        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        if (!res) {
            alert('Failed to load Razorpay SDK. Check your internet connection.');
            return;
        }

        const options = {
            key: 'apiKey',
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.id,
            name: 'Court Craft Application',
            description: 'Payment to Court Craft Application',
            image: '../Images/logo.svg',
            handler: function (response) {
                console.log('Payment Successful:', response);
                setResponseId(response.razorpay_payment_id);
                alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
            },
            prefill: {
                name: 'Court Craft Application',
                email: 'example@example.com',
                contact: '9999999999',
            },
            theme: {
                color: '#f9fafb',
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
    };

    // Function to fetch payment details
    const paymentFetch = (e) => {
        e.preventDefault();

        const paymentId = e.target.paymentId.value;

        axios.get(`http://localhost:8080/api/payment/${paymentId}`)
            .then((response) => {
                console.log('Payment Details:', response.data);
                setResponseState(response.data);
            })
            .catch((error) => {
                console.error('Error fetching payment details:', error);
            });
    };

    return (
        <div>
            <button onClick={() => createRazorpay(100)}>Pay 100 Rs</button>
            {responseId && <p>Payment ID: {responseId}</p>}
        </div>
    );
};

export default PaymentTest;
