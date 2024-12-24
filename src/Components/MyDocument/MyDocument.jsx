import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../Navbar/Navbar';
import { baseUrl } from '../Config';
import { Navbar2 } from '../Navbar2/Navbar2';
import { Trash2 } from 'lucide-react';
import UserProfileSidebar from '../Pages/UserProfileSidebar';



const MyDocument = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userid, setuserid] = useState();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    // Retrieve the 'user' object from localStorage
    const userString = localStorage.getItem("user");

    if (userString) {
      // Parse the string into an object
      const userObject = JSON.parse(userString);
      const userId = userObject.id;
      setuserid(userId); 
      try {
        const response = await axios.get(`${baseUrl}/api/document/${userId}`);
        if (response.status === 200) {
          setDocuments(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    } else {
      console.log("No user data found");
    }
  };

  const handleDocumentClick = async (docId, docName) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/documents/${docId}`);
      navigate('/home', {
        state: {
          documentContent: response.data.content,
          documentName: docName,
          documentId: docId,
          documentDate: response.data.updatedAt
        }
      });
    } catch (error) {
      console.error('Error fetching document content:', error);
      alert('Error loading document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${baseUrl}/api/documents/${docId}`);
        setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== docId));
        alert('Document deleted successfully.');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document: ' + error.message);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex flex-col lg:flex lg:flex-row lg:gap-48">
        <div className="thumbnails-sidebar lg:min-h-[91vh]">
          <div className='mt-8 '>
            <Navbar2 />
          </div>
          <div className=' hidden lg:flex justify-center lg:w-full lg:mb-3 lg:mt-3 lg:bg-[#E2E8F0]'>
            <hr />
          </div>

          <div className='relative hidden lg:block '>
            <UserProfileSidebar />
          </div>
        </div>
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {documents.length === 0 ? (
              <div className="documents-list">
                <p className="document-item">No documents saved in your account.</p>
              </div>
            ) : (
              <ul className="documents-list">
                {documents.map(doc => (
                  <li key={doc._id} className="document-item">
                    <button
                      onClick={() => handleDocumentClick(doc._id, doc.fileName)}
                      className="document-button"
                    >
                      {doc.fileName || 'Untitled Document'}
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="document-button delete-button"
                    >
                      <Trash2 />
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default MyDocument;