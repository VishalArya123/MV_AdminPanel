import React, { useState, useEffect } from 'react';
import { Trash2, Send, Plus, X } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AlertMessage from './AlertMessage';

const BASE_URL = "https://backend.marichiventures.com/admin/pages";

export default function ManageSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [message, setMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: '', privilege: 'Registered User' });
  const [error, setError] = useState('');
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
      const response = await fetch(`${BASE_URL}/subscribers.php?action=list`);
      const data = await response.json();
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

  const handlePrivilegeChange = async (id, newPrivilege) => {
    try {
      const response = await fetch(`${BASE_URL}/subscribers.php?action=update_privilege`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${id}&privilege=${newPrivilege}`
      });
      
      if (response.ok) {
        fetchSubscribers();
        showAlert('Privilege updated successfully', 'success');
      }
    } catch (error) {
      showAlert('Error updating privilege', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        const response = await fetch(`${BASE_URL}/subscribers.php?action=delete&id=${id}`);
        if (response.ok) {
          fetchSubscribers();
          showAlert('Subscriber deleted successfully', 'success');
        }
      } catch (error) {
        showAlert('Error deleting subscriber', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSubscriber.email) {
      setError('Email is required');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/subscribers.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(newSubscriber.email)}&privilege=${encodeURIComponent(newSubscriber.privilege)}`
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setNewSubscriber({ email: '', privilege: 'Registered User' });
        fetchSubscribers();
        showAlert('Subscriber added successfully', 'success');
      } else {
        const data = await response.text();
        setError(data);
      }
    } catch (error) {
      setError('Error adding subscriber');
      showAlert('Error adding subscriber', 'error');
    }
  };


  const handleSendMessage = async () => {
    if (!message || selectedSubscribers.length === 0) {
        showAlert('Please select subscribers and enter a message', 'error');
        return;
    }

    try {
        showAlert('Sending messages...', 'info');
        
        console.log('Sending data:', {
            selected_subscribers: selectedSubscribers,
            message: message
        });

        const response = await fetch(`${BASE_URL}/subscribers.php?action=send_message`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                selected_subscribers: selectedSubscribers,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send messages');
        }
        
        // Handle partial success/failure
        if (data.success_count > 0) {
            const totalAttempted = data.total_attempted;
            if (data.error_count > 0) {
                showAlert(`Sent ${data.success_count}/${totalAttempted} messages successfully. ${data.error_count} failed.`, 'warning');
            } else {
                showAlert(`Successfully sent ${data.success_count} messages!`, 'success');
            }
            setMessage('');
            setSelectedSubscribers([]);
        } else {
            showAlert('Failed to send any messages. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error sending messages:', error);
        showAlert(`Error: ${error.message}`, 'error');
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Subscriber Management</h1>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> Add Subscriber
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} /></th>
                <th className="p-4 text-left">S.No.</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Subscribed At</th>
                <th className="p-4 text-left">Privilege</th>
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
                    <select
                      value={subscriber.privilege}
                      onChange={(e) => handlePrivilegeChange(subscriber.id, e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Employee">Employee</option>
                      <option value="Registered User">Registered User</option>
                    </select>
                  </td>
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

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded-lg mb-4"
            placeholder="Enter message to send to selected subscribers"
            rows="4"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Send size={20} /> Send Message
          </button>
        </div>

        {/* Add Subscriber Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Subscriber</h2>
                <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newSubscriber.email}
                    onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Privilege Level</label>
                  <select
                    value={newSubscriber.privilege}
                    onChange={(e) => setNewSubscriber({...newSubscriber, privilege: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                    <option value="Registered User">Registered User</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
                  >
                    Add Subscriber
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}