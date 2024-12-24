import { useState, useEffect } from 'react';
import './OpenAiKeyManager.css';
import { baseUrl } from '../Config';

const OpenAiKeyManager = () => {
  const [apiKey, setApiKey] = useState(''); // Holds the input OpenAI key
  const [storedKey, setStoredKey] = useState(null); // Tracks the saved key
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Fetch stored key from the backend
  const fetchStoredKey = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setStoredKey(data.key || null);
        setApiKey(data.key || ''); // Sync input field
      } else {
        setStoredKey(null);
      }
    } catch (error) {
      console.error('Error fetching stored key:', error);
      setStoredKey(null);
    }
  };

  // Save key to backend
  const handleSaveKey = async () => {
    try {
      if (!apiKey.trim()) {
        alert('Please provide a valid OpenAI key.');
        return;
      }

      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: apiKey }),
      });

      if (response.ok) {
        alert('OpenAI key successfully saved!');
        await fetchStoredKey();
      } else {
        const errorData = await response.json();
        console.error('Error saving key:', errorData);
        alert('Failed to save OpenAI key. Please try again.');
      }
    } catch (error) {
      console.error('Error occurred:', error);
      alert('An unexpected error occurred. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove key from backend
  const handleRemoveKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/open-ai`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('OpenAI key successfully removed!');
        setStoredKey(null);
        setApiKey(''); // Clear input field
      } else {
        const errorData = await response.json();
        console.error('Error removing key:', errorData);
        alert('Failed to remove OpenAI key. Please try again.');
      }
    } catch (error) {
      console.error('Error occurred:', error);
      alert('An unexpected error occurred. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy event to replace copied content with ***
  const handleCopy = (event) => {
    event.preventDefault(); // Prevent default copy behavior
    navigator.clipboard.writeText('***'); // Write masked key to clipboard
    alert('Key copied as ***');
  };

  useEffect(() => {
    fetchStoredKey();
  }, []);

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-center flex-col items-center gap-3'>
        <img src='./Images/openAi_logo.svg' alt='openAi_logo' />
        <p className='font-bold'>Manage your OpenAI Key</p>
      </div>
      <div className='p-2'>
        <label>AI Key </label>
        <input
          type="password"
          className="input-field outline-none"
          placeholder="Enter OpenAI key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onCopy={handleCopy} // Handle copy event
        />
      </div>

      <div className="flex justify-center gap-2">
        <button
          className="btn save-btn"
          onClick={handleSaveKey}
          disabled={!apiKey.trim() || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          className="btn remove-btn"
          onClick={handleRemoveKey}
          disabled={!storedKey || isLoading}
        >
          {isLoading ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
};

export default OpenAiKeyManager;