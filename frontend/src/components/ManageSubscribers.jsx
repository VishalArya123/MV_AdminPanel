import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AlertMessage from './AlertMessage';

// Updated endpoint URLs
const FETCH_URL = "https://backend.marichiventures.com/get_subscribers.php";
const DELETE_URL = "https://backend.marichiventures.com/delete_subscriber.php";

export default function ManageSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000 });
    fetchSubscribers();
  }, []);

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchSubscribers = async () => {
    try {
      const response = await fetch(FETCH_URL);
      const data = await response.json();
      
      // Add id property for each subscriber using email as unique identifier
      const subscribersWithIds = data.map((sub, index) => ({
        ...sub,
        id: index + 1
      }));
      
      setSubscribers(subscribersWithIds);
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

  const handleDelete = async (email) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        const response = await fetch(DELETE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          fetchSubscribers();
          showAlert('Subscriber deleted successfully', 'success');
          // Remove from selected subscribers if present
          if (selectedSubscribers.includes(email)) {
            setSelectedSubscribers(prev => prev.filter(e => e !== email));
          }
        } else {
          showAlert('Error deleting subscriber', 'error');
        }
      } catch (error) {
        showAlert('Error deleting subscriber', 'error');
      }
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} /></th>
                <th className="p-4 text-left">S.No.</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Subscribed At</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber, index) => (
                <tr key={subscriber.id} className="border-b">
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
                      onClick={() => handleDelete(subscriber.email)}
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
      </div>
    </div>
  );
}