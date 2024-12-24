import React, { useEffect, useState } from 'react';
import { baseUrl } from '../Config';

const PromptUpdate = ({ onClose }) => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedKey, setStoredKey] = useState(null);
  const [error, setError] = useState(null);

  const fetchStoredKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedPrompt = data.prompt || '';
        setStoredKey(fetchedPrompt);
        setValue(fetchedPrompt); // Populate textarea with stored key
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch stored prompt');
        setStoredKey(null);
        setValue('');
      }
    } catch (error) {
      console.error('Error fetching stored key:', error);
      setError('Network error. Please check your connection.');
      setStoredKey(null);
      setValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompts: value })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update prompt');
      }

      alert('Prompt Updated Successfully');
      await fetchStoredKey(); // Refresh stored key
      setError(null);
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePrompt = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/update-prompts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Prompt successfully removed!');
        setStoredKey(null);
        setValue(''); // Clear the textarea
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove Prompt');
      }
    } catch (error) {
      console.error('Error removing key:', error);
      setError(error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredKey();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-[90%] lg:max-w-[800px] relative">
      <img src='./Images/prompt_logo.svg' className='w-full'alt='prompt_logo'/>
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4   font-bold "
          >
            ✕
          </button>
        )}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Update Prompt</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <textarea 
        value={value} 
        onChange={(e) => setValue(e.target.value)} 
        className='border p-3 w-full outline-none h-60 overflow-auto' 
        placeholder='Enter your prompt'
      />
      </div>
      <div className="flex pb-5 justify-center gap-3 items-center">
        <button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className='bg-white text-[#414651] py-3 px-5 rounded border disabled:opacity-50'
        >
          {isLoading ? 'Updating...' : 'Update Prompt'}
        </button>
        <button 
          onClick={handleRemovePrompt} 
          disabled={isLoading}
          className='bg-red-600 text-white px-5 py-3 rounded hover:bg-red-600 disabled:opacity-50'
        >
          {isLoading ? 'Removing...' : 'Delete Prompt'}
        </button>
      </div>
    </div>
  );
};

export default PromptUpdate;
