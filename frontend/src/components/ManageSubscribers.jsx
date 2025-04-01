import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, InfoIcon } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AlertMessage from './AlertMessage';
import emailjs from '@emailjs/browser';
import InstructionBox from './InstructionBox';

// Only keeping the URL for fetching and deleting subscribers
const FETCH_URL = "https://backend.marichiventures.com/get_subscribers.php?action=list";
const DELETE_URL = "https://backend.marichiventures.com/delete_subscribers.php?action=delete";

// Replace these with your EmailJS credentials
const EMAILJS_SERVICE_ID = "service_rwgyu89";
const EMAILJS_TEMPLATE_ID = "template_ww3llko";
const EMAILJS_PUBLIC_KEY = "NrLCZQh-kj3e7WC63";

export default function ManageSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ sent: 0, total: 0 });
  const formRef = useRef();
  
  const instructionData = {
    title: "How to use Subscriber Management panel",
    instructions: [
      "View all subscribers in the table below",
      "Select multiple subscribers using checkboxes to message them in bulk",
      "Delete individual subscribers by clicking the trash icon",
      "Compose a message in the text area at the bottom",
      "Click 'Send Message' to deliver your message to all selected subscribers",
      "Messages are sent using EmailJS and delivered directly to subscriber inboxes"
    ],
    icon: <InfoIcon />
  };

  useEffect(() => {
    AOS.init({ duration: 1000 });
    fetchSubscribers();
    
    // Initialize EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }, []);

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchSubscribers = async () => {
    try {
      const response = await fetch(FETCH_URL);
      const data = await response.json();
      
      // Use the data directly as it already has IDs from the database
      setSubscribers(data);
    } catch (error) {
      showAlert('Error fetching subscribers', 'error');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSubscribers(subscribers.map(sub => sub.email));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSubscriberSelect = (email) => {
    setSelectedSubscribers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        const response = await fetch(`${DELETE_URL}&id=${id}`);
        const data = await response.json();
        
        if (!data.error) {
          fetchSubscribers();
          showAlert('Subscriber deleted successfully', 'success');
          
          // Remove from selected subscribers if present
          const subscriberToDelete = subscribers.find(sub => sub.id === id);
          if (subscriberToDelete && selectedSubscribers.includes(subscriberToDelete.email)) {
            setSelectedSubscribers(prev => prev.filter(e => e !== subscriberToDelete.email));
          }
        } else {
          showAlert(`Error: ${data.error}`, 'error');
        }
      } catch (error) {
        showAlert('Error deleting subscriber', 'error');
      }
    }
  };

  const sendEmailWithEmailJS = async (email) => {
    try {
      // Prepare template parameters
      const templateParams = {
        to_email: email,
        message: messageText,
        // Add any other template parameters you need
      };

      // Send email using EmailJS
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      return { success: true, result };
    } catch (error) {
      console.error("Error sending email to", email, error);
      return { success: false, error };
    }
  };

  const handleSendMessage = async () => {
    // Validate if message is empty
    if (!messageText.trim()) {
      showAlert('Please enter a message', 'error');
      return;
    }

    // Validate if any subscribers are selected
    if (selectedSubscribers.length === 0) {
      showAlert('Please select at least one subscriber', 'error');
      return;
    }

    // Confirm before sending
    if (window.confirm(`Are you sure you want to send this message to ${selectedSubscribers.length} subscriber(s)?`)) {
      setIsSending(true);
      setBatchProgress({ sent: 0, total: selectedSubscribers.length });
      
      let successCount = 0;
      let failCount = 0;
      
      // Send emails in batches to avoid rate limiting
      // EmailJS free tier has limits, so sending one by one is safer
      for (let i = 0; i < selectedSubscribers.length; i++) {
        const email = selectedSubscribers[i];
        const result = await sendEmailWithEmailJS(email);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Update progress
        setBatchProgress({ 
          sent: i + 1, 
          total: selectedSubscribers.length 
        });
      }
      
      // Show results
      if (successCount > 0) {
        showAlert(`Message sent successfully to ${successCount} subscriber(s)${failCount > 0 ? `. Failed: ${failCount}` : ''}`, 'success');
        setMessageText(''); // Clear the message box after sending
        setSelectedSubscribers([]); // Clear selected subscribers after sending
      } else {
        showAlert('Failed to send messages. Please check your EmailJS configuration.', 'error');
      }
      
      setIsSending(false);
      setBatchProgress({ sent: 0, total: 0 });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6" data-aos="fade-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Subscriber Management</h1>
        </div>
        
        <div className="mb-6">
          {/* Added instruction box */}
          <InstructionBox data={instructionData} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={subscribers.length > 0 && selectedSubscribers.length === subscribers.length}
                  />
                </th>
                <th className="p-4 text-left">S.No.</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Subscribed At</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber, index) => (
                <tr key={subscriber.id || index} className="border-b">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber.email)}
                      onChange={() => handleSubscriberSelect(subscriber.email)}
                    />
                  </td>
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{subscriber.email}</td>
                  <td className="p-4">{subscriber.subscribed_at}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Message Sending Section */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Send Message to Selected Subscribers</h2>
          <div className="flex flex-col space-y-4">
            <textarea
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            ></textarea>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedSubscribers.length} subscriber(s) selected
              </span>
              
              <button
                onClick={handleSendMessage}
                disabled={isSending || selectedSubscribers.length === 0 || !messageText.trim()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  selectedSubscribers.length === 0 || !messageText.trim() || isSending
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Send size={16} />
                <span>
                  {isSending 
                    ? `Sending (${batchProgress.sent}/${batchProgress.total})` 
                    : 'Send Message'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}