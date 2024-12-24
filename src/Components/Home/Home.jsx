import { Check, Eye, StopCircle, Edit, CaseUpper, CaseLower, CaseSensitive, ChevronLeft, ChevronRight, CircleDollarSign, CircleCheck } from 'lucide-react';
import React, { useRef, useState, forwardRef, useEffect } from 'react';
import SaveConfirmationModal from '../Pages/SaveConfirmationModal';
import UserProfileSidebar from '../Pages/UserProfileSidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import OpenAiKeyManager from '../Pages/OpenAiKeyManager';
import PromptUpdate from '../PromptUpdate/PromptUpdate';
import { Navbar2 } from '../Navbar2/Navbar2';
import { Navbar } from '../Navbar/Navbar';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import { baseUrl } from '../Config';
import './customQuill.css';
import Quill from 'quill';
import DOMPurify from 'dompurify';


const ProcessingStatus = {
  UPLOADING: '(1/3) Uploading...',
  TRANSCRIBING: '(2/3) Transcribing...',
  REWRITING: '(3/3) Rewriting...',
  IDLE: ''
};

const Home = forwardRef(() => {
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const location = useLocation();
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [allContent, setAllContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState();
  const [currentDate, setCurrentDate] = useState('');
  const [selectedPage, setSelectedPage] = useState(0);
  const [isShowPrompt, setIshShowPrompt] = useState();
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showIcon, setShowIcon] = React.useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [documentCount, setDocumentCount] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isFetchPending, setIsFetchPending] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [iconPosition, setIconPosition] = React.useState({ top: 0, left: 0 });
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const [isFileNameModalVisible, setIsFileNameModalVisible] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(ProcessingStatus.IDLE);

  // Utility: Convert Delta to HTML
  const convertDeltaToHtml = (delta) => {
    const tempDiv = document.createElement('div');
    const tempQuill = new Quill(tempDiv, { modules: { toolbar: false } });
    tempQuill.setContents(delta);
    return tempDiv.querySelector('.ql-editor').innerHTML;
  };

  // Initialize content from location state
  useEffect(() => {
    if (location.state?.documentContent) {
      setAllContent(location.state.documentContent);
      setCurrentDate(location.state.documentDate);
      setFileName(location.state.documentName || '');
      setCurrentDocId(location.state.documentId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
 // Fetch user status and token
 useEffect(() => {
  const user = localStorage.getItem('user');
  const parsedUser = user ? JSON.parse(user) : null;
  const email = parsedUser?.email;

  if (!email) {
    console.error("Email not found");
    return;
  }

  const fetchUserStatus = async () => {
    if (isFetchPending) return;
    setIsFetchPending(true);

    try {
      const response = await fetch(`${baseUrl}/api/status?email=${email}`);
      const data = await response.json();

      if (response.ok) {
        setIsPaidUser(data.isPaidUser);
        setDocumentCount(data.usageCount || 0);
        
        // Store token if user is paid
        if (data.token) {
          localStorage.setItem('userToken', data.token);
          setUserToken(data.token);
        }
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    } finally {
      setIsFetchPending(false);
    }
  };

  fetchUserStatus();
}, [baseUrl, isAiProcessing]);

// Function to verify token
const verifyToken = () => {
  const token = localStorage.getItem('userToken');
  if (!token) return false;

  try {
    // Verify token on client side (basic check)
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (decodedToken.exp < currentTime) {
      localStorage.removeItem('userToken');
      setUserToken(null);
      setIsPaidUser(false);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

// Function to split content into pages with token verification
const splitContentIntoPages = (htmlContent) => {
  if (!htmlContent) return [''];

  try {
    const sanitizedContent = DOMPurify.sanitize(htmlContent);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedContent;
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.width = '100%';  
    document.body.appendChild(tempDiv);

    const PAGE_HEIGHT = 400;
    const pages = [];
    let currentPage = '';
    let currentHeight = 0;

    Array.from(tempDiv.children).forEach((child) => {
      const elementHeight = child.offsetHeight;
      
      if (currentHeight + elementHeight > PAGE_HEIGHT && currentPage !== '') {
        pages.push(currentPage);
        currentPage = '';
        currentHeight = 0;
      }

      currentPage += child.outerHTML;
      currentHeight += elementHeight;
    });

    if (currentPage) {
      pages.push(currentPage);
    }

    document.body.removeChild(tempDiv);

    // Check token and limit pages for free users
    const isValidToken = verifyToken();
    if (!isValidToken && pages.length > 3) {
      return pages.slice(0, 3);
    }
    
    return pages.length > 0 ? pages : [''];

  } catch (error) {
    console.error('Error splitting content:', error);
    return [''];
  }
};

// Handle editor content changes with token verification
const handleEditorChange = (newContent) => {
  if (newContent === '<p><br></p>' || newContent === '') {
    return;
  }

  const updatedPages = [...pages];
  updatedPages[selectedPage] = newContent;
  const combinedContent = updatedPages.join('');
  
  // Verify token before allowing more than 3 pages
  const isValidToken = verifyToken();
  if (!isValidToken && updatedPages.length > 3) {
    alert('Please upgrade to Pro plan to create more than 3 pages');
    return;
  }

  setHasUnsavedChanges(true);
  setAllContent(combinedContent);
  
  const newPages = splitContentIntoPages(combinedContent);
  if (newPages.length > pages.length && selectedPage < newPages.length - 1) {
    setSelectedPage(selectedPage + 1);
  }
  setPages(newPages);
};

// Initialize pages when component mounts
useEffect(() => {
  const splitPages = splitContentIntoPages(allContent);
  setPages(splitPages);
}, [allContent]);

  // Handle page selection
  const handlePageSelect = (index) => {
    setSelectedPage(index);
  };

  // Handle text selection
  const handleTextSelection = () => {
    if (quillRef.current && !isAiProcessing) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range && range.length > 0) {
        // Save the current selection
        savedSelectionRef.current = range;

        const bounds = editor.getBounds(range.index, range.length);
        setIconPosition({
          top: bounds.top + window.scrollY - -50,
          left: bounds.left + bounds.width + window.scrollX - 50,
        });
        setShowIcon(true);
      } else {
        setShowIcon(false);
      }
    }
  };

  // Set up text selection listener
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.on('selection-change', handleTextSelection);
    }
    return () => {
      if (editor) {
        editor.off('selection-change', handleTextSelection);
      }
    };
  }, [isAiProcessing]);


  // Utility function to remove background highlights completely
  const removeBackgroundHighlights = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const elementsWithBackground = tempDiv.querySelectorAll(
      '[style*="background-color"],' +
      '[style*="background"],' +
      'mark,' +
      '.highlight'
    );

    elementsWithBackground.forEach(el => {
      el.removeAttribute('style');
      if (el.tagName.toLowerCase() === 'mark') {
        const textNode = document.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      }
      el.classList.remove('highlight');
    });
    return tempDiv.innerHTML;
  };

  // Export to Word document
  const handleExportToDoc = () => {
    const cleanedContent = removeBackgroundHighlights(allContent);
    const fileNameToExport = fileName || 'New Document';

    const styleContent = `
      <style>
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em 0; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        p { margin: 1em 0; }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
      </style>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exported Document</title>
          ${styleContent}
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${fileNameToExport}.doc`;
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  // Recording functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      // Check if documentCount is 0 and prevent recording
      if (documentCount === 0) {
        alert('You have 0 tokens. Please subscribe for more tokens.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(audioBlob);
        await sendAudioToBackend(wavBlob);
        stream.getTracks().forEach(track => track.stop());
        stopTimer();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

    }
  };

  const processAndUpdateContent = (aiResponse) => {
    try {
      setIsAiProcessing(true);
      const editor = quillRef.current.getEditor();

      // Use the saved selection if available
      const selection = savedSelectionRef.current || editor.getSelection();

      if (selection) {
        // Ensure we have a valid index and length
        const index = selection.index;
        const length = selection.length;

        // Delete the selected text first
        if (length > 0) {
          editor.deleteText(index, length);
        }

        // If an AI response is provided, insert it
        if (aiResponse) {
          editor.clipboard.dangerouslyPasteHTML(index, aiResponse);
        }
      } else {
        // If no selection, append to the end
        const length = editor.getLength();
        if (aiResponse) {
          editor.clipboard.dangerouslyPasteHTML(length - 1, '\n' + aiResponse);
        }
      }

      // Update the content of the current page
      const newContent = editor.root.innerHTML;
      handleEditorChange(newContent);

      // Clear the saved selection and reset processing state
      savedSelectionRef.current = null;
      setIsAiProcessing(false);
      setShowIcon(false);
    } catch (error) {
      console.error('Error processing content update:', error);
      setIsAiProcessing(false);
    }
  };

  // Audio processing functions
  const convertToWav = async (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const wavBuffer = audioContext.createBuffer(1, audioBuffer.length, 16000);
    wavBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);

    const wavBlob = await new Promise(resolve => {
      const offlineContext = new OfflineAudioContext(1, wavBuffer.length, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = wavBuffer;
      source.connect(offlineContext.destination);
      source.start();

      offlineContext.startRendering().then(renderedBuffer => {
        const wav = new Blob([createWaveFileData(renderedBuffer)], { type: 'audio/wav' });
        resolve(wav);
      });
    });

    return wavBlob;
  };

  const createWaveFileData = (audioBuffer) => {
    const frameLength = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
    const blockAlign = numberOfChannels * bitsPerSample / 8;
    const wavDataByteLength = frameLength * numberOfChannels * 2;
    const headerByteLength = 44;
    const totalLength = headerByteLength + wavDataByteLength;
    const waveFileData = new Uint8Array(totalLength);
    const view = new DataView(waveFileData.buffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + wavDataByteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, wavDataByteLength, true);

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < frameLength; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return waveFileData;
  };

  // Send audio to backend
  const sendAudioToBackend = async (audioBlob) => {
    try {
      setIsAiProcessing(true);
      setProcessingStatus(ProcessingStatus.UPLOADING);
      const formData = new FormData();
      formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));

      const editor = quillRef.current.getEditor();
      const selection = savedSelectionRef.current || editor.getSelection();
      const user = localStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      const email = parsedUser?.email;
      formData.append('email', email);

      setProcessingStatus(ProcessingStatus.TRANSCRIBING);
      if (selection) {
        const selectedContent = editor.getContents(selection.index, selection.length);
        const selectedHtml = convertDeltaToHtml(selectedContent);
        formData.append('selectedText', selectedHtml);
      }

       // Simulate upload time
       await new Promise(resolve => setTimeout(resolve, 1000));
       setProcessingStatus(ProcessingStatus.REWRITING);

      const response = await fetch(`${baseUrl}/api/asr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

        // Start rewriting phase

      const data = await response.json();
      if (data.chatResponse.mergedText) {
        processAndUpdateContent(data.chatResponse.mergedText);
      }

      // Trigger fetchUserStatus after successful response
      const userStatusResponse = await fetch(`${baseUrl}/api/status?email=${email}`);
      const userStatusData = await userStatusResponse.json();
      if (userStatusResponse.ok) {
        setIsPaidUser(userStatusData.isPaidUser);
        setDocumentCount(userStatusData.usageCount);
      }
    } catch (error) {
      console.error('Error sending audio to ASR:', error);
      alert('Please Enter Your Correct Open AI API Key');
    } finally {
      setIsAiProcessing(false);
      setProcessingStatus(ProcessingStatus.IDLE);
    }
  };

  // Handler for navigation with unsaved changes
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setIsSaveConfirmationOpen(true);
      setPendingNavigation(path);
    } else {
      window.location.href = path;
    }
  };

  // Modal actions
  const handleSaveConfirmation = () => {
    handleSave();
    setIsSaveConfirmationOpen(false);
  };

  const handleDontSave = () => {
    setHasUnsavedChanges(false);
    setIsSaveConfirmationOpen(false);

    if (pendingNavigation) {
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setIsSaveConfirmationOpen(false);
    setPendingNavigation(null);
  };

  // Save document
  const handleSave = async () => {
    if (!fileName) {
      setIsFileNameModalVisible(true);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;
      setIsLoading(true);
      const endpoint = currentDocId
        ? `${baseUrl}/api/documents/${currentDocId}`
        : `${baseUrl}/api/store-document`;

      const method = currentDocId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: allContent,
          fileName,
          documentId: currentDocId,
          userEmail: userEmail
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!currentDocId) {
          setCurrentDocId(data.documentId);
        }
        setHasUnsavedChanges(false);

        // Handle pending navigation if exists
        if (pendingNavigation) {
          window.location.href = pendingNavigation;
          setPendingNavigation(null);
        }
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const transformText = (transformType) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    if (range && range.length > 0) {
      let selectedText = editor.getText(range.index, range.length);
      let transformedText = "";

      switch (transformType) {
        case "uppercase":
          transformedText = selectedText.toUpperCase();
          break;
        case "lowercase":
          transformedText = selectedText.toLowerCase();
          break;
        case "capitalize":
          transformedText = selectedText
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
          break;
        default:
          return;
      }

      editor.deleteText(range.index, range.length);
      editor.insertText(range.index, transformedText);
    }
  };

  // Custom Toolbar Component
  const CustomToolbar = () => (
    <div className="relative w-full">
      <div className=" flex flex-wrap justify-end items-center absolute right-0 top-[85px] z-10 p-1 sm:p-1 lg:top-8 lg:left-[19rem] md:top-14 md:left-[19rem] ">
        {/* Lowercase Button */}
        <button
          onClick={() => transformText("lowercase")}
          className="p-1 sm:p-1 " aria-label="Convert to lowercase">
          <CaseLower className=" w-4 h-4 sm:w-5 sm:h-5 text-gray-600 " />
        </button>

        {/* Uppercase Button */}
        <button
          onClick={() => transformText("uppercase")}
          className="p-1 sm:p-1" aria-label="Convert to uppercase" >
          <CaseUpper className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 " />
        </button>

        {/* Capitalize Button */}
        <button
          onClick={() => transformText("capitalize")}
          className=" p-1 sm:p-1" aria-label="Capitalize text">
          <CaseSensitive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 " />
        </button>
      </div>
    </div>
  );

  function formatDate(currentDate) {
    let date;

    // Check if currentDate is valid, otherwise use today's date
    if (currentDate) {
      date = new Date(currentDate);
    } else {
      date = new Date();
    }
    if (isNaN(date.getTime())) {
      date = new Date(); 
    }

    // Month names array
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Extract day, month, and year
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Return formatted date
    return `${month} ${day}, ${year}`;
  }

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 200, // Adjust scrolling distance as needed
        behavior: 'smooth'
      });
    }
  };


  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -200, // Adjust scrolling distance as needed
        behavior: 'smooth'
      });
    }
  };


  return (
    <div className="form-field">
      <Navbar />
      {isLoading ? (
        <div className='flex justify-center items-center min-h-screen'>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="popup">
          {/* Sidebar - Responsive Width and Positioning */}
          <div className="thumbnails-sidebar  lg:min-h-[91vh] md:min-h-[91vh]">
            <div className='mt-8'>
              <Navbar2 onNavigate={handleNavigation} />
            </div>
            <div className='flex justify-center w-full mb-3 mt-3 bg-[#E2E8F0]'>
              <hr />
            </div>
            {/* Desktop thumbnail section  */}
            <div className=' hidden lg:flex lg:flex-col lg:items-center md:flex md:flex-col md:items-center'>
              {pages.map((pageContent, index) => (
                <div
                  key={index}
                  className={`thumbnail-page ${selectedPage === index ? 'selected' : ''}`}
                  onClick={() => handlePageSelect(index)}
                >
                  <div className="text-xs text-center">Document {index + 1}</div>
                  <div
                    className="thumbnail-preview"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                  />
                </div>
              ))}
            </div>
            {/* Mobile section section */}
            <div className="flex items-center justify-center w-full relative md:hidden lg:hidden">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 m-2"
              >
                <ChevronLeft size={24} />
              </button>
              {/* Thumbnail Container */}
              <div
                ref={containerRef}
                className="flex overflow-x-auto space-x-4 scrollbar-hide max-w-[calc(100%-100px)] no-scrollbar"
              >
                {pages.map((pageContent, index) => (
                  <div
                    key={index}
                    className={`thumbnail-page cursor-pointer flex-shrink-0 ${selectedPage === index ? 'selected' : ''}`}
                    onClick={() => handlePageSelect(index)}
                  >
                    <div className="text-xs text-center">Document {index + 1}</div>
                    <div
                      className="thumbnail-preview"
                      dangerouslySetInnerHTML={{ __html: pageContent }}
                    />
                  </div>
                ))}
              </div>
              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                className="absolute right-0 z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 m-2"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div className='relative hidden lg:block '>
              <UserProfileSidebar />
            </div>
          </div>
          {/* Editor Container - Responsive Width and Padding */}
          <div className="editor-container flex-grow pt-2 md:pt-2 bg-[#E2E8F0]">
            <div className='w-full max-w-3xl mx-auto bg-[#F8FAFC] min-h-[90vh] rounded-t-lg'>
              {!isPreviewVisible ? (
                <>
                  {/* Header with Responsive Layout */}
                  <div className='flex flex-col sm:flex-row justify-between lg:bg-white w-full lg:p-4 rounded-t-lg items-center'>
                    <div className='mb-2 sm:mb-0'>
                      <p className='text-sm hidden lg:block'>Last Update: {formatDate(currentDate)}</p>
                    </div>
                    <div className='fixed bottom-80 right-0 z-50 md:static md:flex md:max-w-60 md:w-full md:gap-3 md:flex-wrap md:justify-center lg:max-w-60 lg:w-full lg:p-4 lg:flex lg:gap-3 lg:flex-wrap lg:justify-center sm:justify-end '>
                      <button
                        onClick={() => setIsPreviewVisible(true)}
                        className="flex items-center gap-2 px-2 py-2 bg-[#FF9D00] lg:bg-white text-sm lg:border text-white lg:text-[#475569] rounded mb-3  sm:mb-0"
                      >
                        <Eye className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Preview</p>
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-2 py-2 lg:px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        <Check className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Save</p>
                      </button>
                    </div>
                  </div>
                  {/* Editor with Responsive Width */}
                  <div className='px-4 relative'>
                  {!isPaidUser && pages.length >= 3 && (
        <div className="upgrade-notice">
          <p>Upgrade to Pro to create unlimited pages!</p>
        </div>
      )}




                    <CustomToolbar />
                    <ReactQuill
                      ref={quillRef}
                      value={pages[selectedPage]}
                      onChange={handleEditorChange}
                      className="bg-white rounded-lg w-full h-[430px] md:h-[430px] mt-5"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          ['clean'],
                          ['link', 'image', 'video', 'formula'],
                          [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'script': 'sub' }, { 'script': 'super' }],
                          [{ 'font': [] }],
                          [{ 'indent': '-1' }, { 'indent': '+1' }],
                          [{ 'direction': 'rtl' }],
                        ],
                        history: {
                          delay: 1000,
                          maxStack: 500,
                          userOnly: true
                        }
                      }}
                    />
                    {showIcon && (
                      <div
                        className="hidden md:block"
                        style={{
                          position: 'absolute',
                          top: iconPosition.top,
                          left: iconPosition.left,
                          cursor: 'pointer',
                          width: '50px',
                        }}
                      >
                        {!isRecording ? (
                          <button
                            title="Start Recording"
                            className="recording-mic-btn justify-center bg-[#00B244]"
                          >
                            <img
                              src='./Images/mic_icon.svg'
                              onClick={startRecording}
                              className="recording-mic-icon"
                              alt='selected_mic_icon'
                            />
                          </button>
                        ) : (
                          <button
                            title="Stop Recording"
                            className="recording-mic-btn p-0 justify-center bg-[#D92D20]"
                          >
                            <StopCircle
                              onClick={stopRecording}
                              className="recording-mic-icon"
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Preview Header - Same Responsive Layout as Editor Header */}
                  <div className='flex flex-col sm:flex-row justify-between lg:bg-white w-full lg:p-4 rounded-t-lg'>
                    <div className='mb-2 sm:mb-0'>
                      <p className='text-sm hidden lg:block'>Last Update: {formatDate(currentDate)}</p>
                    </div>
                    <div className='fixed bottom-60 right-0 z-50 md:static md:flex md:max-w-60 md:w-full md:gap-3 md:flex-wrap md:justify-center lg:max-w-60 lg:w-full lg:p-4 lg:flex lg:gap-3 lg:flex-wrap lg:justify-center sm:justify-end'>
                      <button
                        onClick={() => setIsPreviewVisible(false)}
                        className="flex items-center gap-2 px-2 py-2 bg-[#FF9D00] lg:bg-white text-sm lg:border text-white lg:text-[#475569] rounded mb-3 sm:mb-0"
                      >
                        <Edit className="w-6 h-5" />
                        <p className='hidden md:inline text-sm'>Edit</p>
                      </button>

                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-2 py-2 lg:px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        <Check className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Save</p>
                      </button>
                    </div>
                  </div>

                  {/* Preview Content with Responsive Width and Scrolling */}
                  <div
                    className="bg-white rounded-lg w-full max-h-[70vh] overflow-y-auto p-4 md:p-6 text-sm ql-editor"
                    style={{
                      fontFamily: 'inherit',
                      lineHeight: '2.5',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: removeBackgroundHighlights(allContent) || pages[selectedPage]
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Icons Container - Responsive Positioning */}
          <div className="fixed bottom-4 right-0 z-50 md:static md:max-w-56 md:w-full lg:max-w-56 lg:w-full lg:p-4 lg:bg-[#F9FAFB]">
            <div className="flex flex-col gap-2 w-full items-end">
              {!isRecording ? (
                <button
                  title="Start Recording"
                  className="flex items-center gap-2 bg-[#00B244] text-white p-2 rounded hover:bg-green-600 w-full"
                  onClick={startRecording}
                >
                  <img src='./Images/mic_icon.svg' className="w-6 h-6" alt='mic_icon' />
                  <span className="hidden md:inline text-sm">Speak</span>
                </button>
              ) : (
                <button
                  title="Stop Recording"
                  className="lg:flex lg:items-center md:flex md:items-center gap-2 bg-[#D92D20] text-white p-2 rounded hover:bg-red-700 md:w-full lg:w-full"
                  onClick={stopRecording}
                >
                  <StopCircle className="w-6 h-6" />
                  <span className="hidden md:inline text-sm">Stop Recording</span>
                </button>
              )}

              {isRecording && (
                <div className="text-xs text-red-500 text-center">
                  Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Other Icons with Responsive Display */}
            <div className="flex flex-col gap-2  w-full items-end ">
              <button
                onClick={handleExportToDoc}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 mt-2 bg-white md:w-full lg:w-full"
                title="Export to Word File"
              >
                <img src='./Images/download_icon.svg' className="w-6 h-6" alt='download_icon' />
                <span className="hidden md:inline">Download</span>
              </button>

              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full"
                title="Enter Your Open AI Key"
              >
                <img src='./Images/openAI_icon.svg' className="w-6 h-6" alt='openAi_icon' />
                <span className="hidden md:inline text-sm">Open AI Key</span>
              </button>

              <button
                onClick={() => setIshShowPrompt(true)}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full"
              >
                <img src='./Images/prompt_icon.svg' className="w-6 h-6" alt='prompt_icon' />
                <span className="hidden md:inline text-sm">Update Prompt</span>
              </button>
              <div className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full">
                <CircleDollarSign className="w-6 h-6" />
                <p className="hidden md:inline text-sm">Tokens : {documentCount}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full cursor-pointer">
                <CircleCheck className="w-6 h-6" />
                <p className="hidden md:inline text-sm" onClick={() => navigate('/loginPayment')}>Subscribe to Pro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFileNameModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-center">Name of the Document</h2>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Name of the Document"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFileNameModalVisible(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (fileName) {
                    setIsFileNameModalVisible(false);
                    handleSave();
                  } else {
                    alert('Please enter a file name');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
          <div className="openAiTextarea bg-white p-4 rounded  ">
            <div className="flex justify-end mb-2">

              <p
                onClick={() => setShowKeyInput(false)}
                className="cursor-pointer text-white flex justify-center items-center w-8 h-8 bg-black rounded-full"
              >
                X
              </p>
            </div>
            <OpenAiKeyManager />
          </div>
        </div>
      )}

      {isShowPrompt && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIshShowPrompt(false);
            }
          }}>
          <PromptUpdate onClose={() => setIshShowPrompt(false)} />
        </div>
      )}

      <SaveConfirmationModal
        isOpen={isSaveConfirmationOpen}
        fileName={fileName}
        onSave={handleSaveConfirmation}
        onDontSave={handleDontSave}
        onCancel={handleCancelNavigation}
      />

{isAiProcessing && (
       <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        {/* Status text */}
        <div className="text-white text-lg font-medium">
        {processingStatus}
        </div>
        
        {/* Spinner animation */}
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin">
        </div>
      </div>
    </div>
      )}
    </div>
  );
});

export default Home; 