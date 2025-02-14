// FRONTEND CODE (Webinars.js)
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, User } from 'lucide-react';
import AlertMessage from './AlertMessage';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API_BASE_URL = 'https://backend.marichiventures.com/admin/pages';
const IMAGE_BASE_URL = `${API_BASE_URL}/uploads/webinars`;

const Webinars = () => {
  const [webinarGroups, setWebinarGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [webinars, setWebinars] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    status: 'upcoming',
    speaker: '',
    registration_link: '',
    isConfirmed: 'false',
    image: null,
    image_path: ''
  });

  useEffect(() => {
    AOS.init({ duration: 1000 });
    fetchWebinarGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchWebinars(selectedGroup);
    } else {
      setWebinars([]);
    }
  }, [selectedGroup]);

  const fetchWebinarGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/webinars.php?endpoint=groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setWebinarGroups(data);
    } catch (error) {
      showAlert('Failed to fetch webinar groups: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebinars = async (groupId) => {
    if (!groupId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/webinars.php?endpoint=webinars&group_id=${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setWebinars(data);
    } catch (error) {
      showAlert('Failed to fetch webinars: ' + error.message, 'error');
      setWebinars([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      showAlert('Please select a webinar group first', 'error');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('group_id', selectedGroup);
    
    Object.keys(formData).forEach(key => {
      if (key === 'image' && formData[key] === null) return;
      formDataObj.append(key, formData[key]);
    });

    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/webinars.php?endpoint=webinars${editingWebinar ? '&id=' + editingWebinar.id : ''}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }
      
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      showAlert(`Webinar ${editingWebinar ? 'updated' : 'added'} successfully`, 'success');
      await fetchWebinars(selectedGroup);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      showAlert(error.message || 'Failed to save webinar', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this webinar?')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/webinars.php?endpoint=webinars&id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }
      
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      showAlert('Webinar deleted successfully', 'success');
      fetchWebinars(selectedGroup);
    } catch (error) {
      showAlert(error.message || 'Failed to delete webinar', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      status: 'upcoming',
      speaker: '',
      registration_link: '',
      isConfirmed: 'false',
      image: null,
      image_path: ''
    });
    setEditingWebinar(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB]">
      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="mb-6">
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full md:w-64 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Webinar Group</option>
          {webinarGroups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {selectedGroup && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Webinar
          </button>
        </div>
      )}

      {webinars.length > 0 && (
        <div className="overflow-x-auto" data-aos="fade-up">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Details</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Confirmed</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webinars.map(webinar => (
                <tr key={webinar.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{webinar.title}</div>
                    <div className="text-sm text-gray-600">{webinar.description}</div>
                    {webinar.image_path && (
                      <img 
                        src={`${IMAGE_BASE_URL}/${webinar.image_path}`}
                        alt={webinar.title}
                        className="mt-2 w-24 h-24 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span>{new Date(webinar.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span>{webinar.time} ({webinar.duration})</span>
                      </div>
                      {webinar.speaker && (
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          <span>{webinar.speaker}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      webinar.status === 'upcoming' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webinar.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      webinar.isConfirmed === 'true' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {webinar.isConfirmed === 'true' ? 'Confirmed' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditingWebinar(webinar);
                          setFormData({
                            ...webinar,
                            image: null
                          });
                          setIsDialogOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(webinar.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {editingWebinar ? 'Edit Webinar' : 'Add New Webinar'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 hour"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmation Status</label>
                  <select
                    value={formData.isConfirmed}
                    onChange={(e) =>
                      setFormData({ ...formData, isConfirmed: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">Pending</option>
                    <option value="true">Confirmed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Speaker</label>
                <input
                  type="text"
                  value={formData.speaker}
                  onChange={(e) =>
                    setFormData({ ...formData, speaker: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Registration Link</label>
                <input
                  type="url"
                  value={formData.registration_link}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_link: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                {editingWebinar && formData.image_path && (
                  <div className="mb-2">
                    <img
                      src={`${IMAGE_BASE_URL}/${formData.image_path}`}
                      alt="Current webinar image"
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  accept="image/*"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Webinars;