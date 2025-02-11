import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, User } from 'lucide-react';
import AlertMessage from './AlertMessage';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API_BASE_URL = 'https://backend.marichiventures.com/admin/pages';
// const API_BASE_URL = 'https://localhost/Admin-Panel/Backend/pages';
const IMAGE_BASE_URL = `${API_BASE_URL}/uploads/webinars`;

const Webinars = () => {
  const [webinarGroups, setWebinarGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [webinars, setWebinars] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    status: 'upcoming',
    speaker: '',
    registration_link: '',
    image: null
  });

  useEffect(() => {
    AOS.init({ duration: 1000 });
    fetchWebinarGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchWebinars(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchWebinarGroups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`);
      const data = await response.json();
      setWebinarGroups(data);
    } catch (error) {
      showAlert('Failed to fetch webinar groups', 'error');
    }
  };

  const fetchWebinars = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/webinars.php?group_id=${groupId}`);
      const data = await response.json();
      setWebinars(data);
    } catch (error) {
      showAlert('Failed to fetch webinars', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataObj = new FormData();
    Object.keys(formData).forEach(key => {
      formDataObj.append(key, formData[key]);
    });
    formDataObj.append('group_id', selectedGroup);

    try {
      const url = `${API_BASE_URL}/webinars.php`;
      const method = editingWebinar ? 'PUT' : 'POST';
      if (editingWebinar) {
        formDataObj.append('id', editingWebinar.id);
      }

      const response = await fetch(url, {
        method,
        body: formDataObj
      });

      if (response.ok) {
        showAlert(`Webinar ${editingWebinar ? 'updated' : 'added'} successfully`, 'success');
        fetchWebinars(selectedGroup);
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      showAlert('Failed to save webinar', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this webinar?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/webinars.php?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          showAlert('Webinar deleted successfully', 'success');
          fetchWebinars(selectedGroup);
        }
      } catch (error) {
        showAlert('Failed to delete webinar', 'error');
      }
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
      image: null
    });
    setEditingWebinar(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webinars.map(webinar => (
                <tr key={webinar.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{webinar.title}</div>
                    <div className="text-sm text-gray-600">{webinar.description}</div>
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
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditingWebinar(webinar);
                          setFormData(webinar);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6" data-aos="zoom-in">
            <h2 className="text-2xl font-semibold mb-4">
              {editingWebinar ? 'Edit Webinar' : 'Add New Webinar'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 hour"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Speaker</label>
                <input
                  type="text"
                  value={formData.speaker}
                  onChange={(e) => setFormData({...formData, speaker: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Registration Link</label>
                <input
                  type="url"
                  value={formData.registration_link}
                  onChange={(e) => setFormData({...formData, registration_link: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingWebinar ? 'Update' : 'Add'} Webinar
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