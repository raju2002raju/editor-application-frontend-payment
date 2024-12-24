import React from 'react';
import { X, Save, FileText } from 'lucide-react';

const SaveConfirmationModal = ({ 
  isOpen, 
  fileName, 
  onSave, 
  onDontSave, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md min-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Editor Court Application</h2>
          <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
          <div className='flex gap-4'>
          <img src='./Images/warning.png' className='w-14 h-14'/>
        <div>
        <p className="mb-4 text-gray-600">
          Do you want to save the changes you made to
          <span className="font-bold ml-1">{fileName || 'New Document'}</span>?
        </p>
        <p className="text-sm text-red-500 mb-4">
          Your changes will be lost if you don't save them.
        </p>
        </div>
          </div>
        
        
        <div className="flex justify-between space-x-2">
          <button 
            onClick={onSave}
            className="flex items-center justify-center w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Save size={18} className="mr-2" />
            Save
          </button>
          
          <button 
            onClick={onDontSave}
            className="flex items-center justify-center w-full  text-gray-500  py-2 rounded-md border border-gray-400"
          >
            <FileText size={18} className="mr-2" />
           Don't Save
          </button>
          
          <button 
            onClick={onCancel}
            className="flex items-center justify-center w-full text-gray-500 py-2 rounded-md border border-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveConfirmationModal;