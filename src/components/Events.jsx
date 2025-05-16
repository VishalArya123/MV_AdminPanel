import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, Plus, Image as ImageIcon, X } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AlertMessage from './AlertMessage';

const API_BASE_URL = 'https://backend.marichiventures.com/admin/pages/';
const IMAGE_BASE_URL = 'https://backend.marichiventures.com/admin/pages/uploads/events/';

const Events = () => {
  const [eventGroups, setEventGroups] = useState([]);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPosition, setNewGroupPosition] = useState(1);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_group_id: '',
    image: null,
    imagePreview: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const groupFormRef = useRef(null);

  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 500,
      easing: 'ease-in-out'
    });
  }, []);

  // Fetch all event groups on component mount
  useEffect(() => {
    fetchEventGroups();
  }, []);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeEventModal();
      }
      if (groupFormRef.current && !groupFormRef.current.contains(event.target) && isAddingGroup) {
        setIsAddingGroup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddingGroup]);

  // Fetch all event groups and their events
  const fetchEventGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}events.php?action=getEventGroups`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setEventGroups(data.eventGroups);
      } else {
        setError(data.message || 'Failed to fetch event groups');
      }
    } catch (err) {
      setError('Error fetching event groups: ' + err.message);
      console.error('Error fetching event groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle event group expansion
  const toggleEventGroup = (groupId) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  // Handle group name change during inline editing
  const handleGroupNameChange = async (groupId, newName) => {
    try {
      const formData = new FormData();
      formData.append('action', 'updateEventGroup');
      formData.append('id', groupId);
      formData.append('name', newName);
      
      const response = await fetch(`${API_BASE_URL}events.php`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEventGroups(eventGroups.map(group => 
          group.id === groupId ? { ...group, name: newName } : group
        ));
        showSuccessMessage('Group name updated successfully');
      } else {
        setError(data.message || 'Failed to update group name');
      }
    } catch (err) {
      setError('Error updating group name: ' + err.message);
      console.error('Error updating group name:', err);
    }
  };

  // Handle group position change
  const handlePositionChange = async (groupId, newPosition) => {
    try {
      const formData = new FormData();
      formData.append('action', 'updateEventGroupPosition');
      formData.append('id', groupId);
      formData.append('position', newPosition);
      
      const response = await fetch(`${API_BASE_URL}events.php`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchEventGroups(); // Refresh to get the updated order
        showSuccessMessage('Group position updated successfully');
      } else {
        setError(data.message || 'Failed to update position');
      }
    } catch (err) {
      setError('Error updating position: ' + err.message);
      console.error('Error updating position:', err);
    }
  };

  // Delete event group
  const deleteEventGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this event group and all its events?')) {
      try {
        const formData = new FormData();
        formData.append('action', 'deleteEventGroup');
        formData.append('id', groupId);
        
        const response = await fetch(`${API_BASE_URL}events.php`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setEventGroups(eventGroups.filter(group => group.id !== groupId));
          showSuccessMessage('Event group deleted successfully');
        } else {
          setError(data.message || 'Failed to delete event group');
        }
      } catch (err) {
        setError('Error deleting event group: ' + err.message);
        console.error('Error deleting event group:', err);
      }
    }
  };

  // Add new event group
  const addEventGroup = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('action', 'addEventGroup');
      formData.append('name', newGroupName);
      formData.append('position', newGroupPosition);
      
      const response = await fetch(`${API_BASE_URL}events.php`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEventGroups([...eventGroups, data.eventGroup]);
        setNewGroupName('');
        setNewGroupPosition(eventGroups.length + 1);
        setIsAddingGroup(false);
        showSuccessMessage('Event group added successfully');
      } else {
        setError(data.message || 'Failed to add event group');
      }
    } catch (err) {
      setError('Error adding event group: ' + err.message);
      console.error('Error adding event group:', err);
    }
  };

  // Open event modal for adding new event
  const openAddEventModal = (groupId) => {
    setIsEditingEvent(false);
    setCurrentEvent(null);
    setEventForm({
      title: '',
      description: '',
      event_group_id: groupId,
      image: null,
      imagePreview: null
    });
  };

  // Open event modal for editing existing event
  const openEditEventModal = (event) => {
    setIsEditingEvent(true);
    setCurrentEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      event_group_id: event.event_group_id,
      image: null,
      imagePreview: event.image ? `${IMAGE_BASE_URL}${event.image}` : null
    });
  };

  // Close event modal
  const closeEventModal = () => {
    setCurrentEvent(null);
    setEventForm({
      title: '',
      description: '',
      event_group_id: '',
      image: null,
      imagePreview: null
    });
  };

  // Handle image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventForm({
          ...eventForm,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm({ ...eventForm, [name]: value });
  };

  // Submit event form (add or update)
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('description', eventForm.description);
      formData.append('event_group_id', eventForm.event_group_id);
      
      if (eventForm.image) {
        formData.append('image', eventForm.image);
      }
      
      if (isEditingEvent) {
        formData.append('action', 'updateEvent');
        formData.append('id', currentEvent.id);
      } else {
        formData.append('action', 'addEvent');
      }
      
      const response = await fetch(`${API_BASE_URL}events.php`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        fetchEventGroups();
        closeEventModal();
        showSuccessMessage(isEditingEvent ? 'Event updated successfully' : 'Event added successfully');
      } else {
        setError(data.message || 'Failed to process event');
      }
    } catch (err) {
      setError('Error processing event: ' + err.message);
      console.error('Error processing event:', err);
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const formData = new FormData();
        formData.append('action', 'deleteEvent');
        formData.append('id', eventId);
        
        const response = await fetch(`${API_BASE_URL}events.php`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Update the events list in the current group
          const updatedGroups = eventGroups.map(group => {
            if (group.id === expandedGroup) {
              return {
                ...group,
                events: group.events.filter(event => event.id !== eventId)
              };
            }
            return group;
          });
          setEventGroups(updatedGroups);
          showSuccessMessage('Event deleted successfully');
        } else {
          setError(data.message || 'Failed to delete event');
        }
      } catch (err) {
        setError('Error deleting event: ' + err.message);
        console.error('Error deleting event:', err);
      }
    }
  };

  // Toggle description expansion
  const toggleDescription = (eventId) => {
    setExpandedDescriptions({
      ...expandedDescriptions,
      [eventId]: !expandedDescriptions[eventId]
    });
  };
  
  // Show success message with timeout
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
          <button
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            data-aos="fade-left"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Event Group
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <AlertMessage 
            message={successMessage} 
            type="success" 
            onClose={() => setSuccessMessage('')} 
          />
        )}

        {/* Error Message */}
        {error && (
          <AlertMessage 
            message={error} 
            type="error" 
            onClose={clearError} 
          />
        )}

        {/* Add Event Group Form */}
        {isAddingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div 
              ref={groupFormRef} 
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" 
              data-aos="zoom-in"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Event Group</h2>
              <form onSubmit={addEventGroup}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="groupName">
                    Group Name
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="groupPosition">
                    Position
                  </label>
                  <input
                    id="groupPosition"
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newGroupPosition}
                    onChange={(e) => setNewGroupPosition(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Groups Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading event groups...</p>
            </div>
          ) : eventGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>No event groups found. Create your first event group to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expand
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventGroups
                  .sort((a, b) => a.position - b.position)
                  .map((group) => (
                    <React.Fragment key={group.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-blue-500 bg-transparent"
                            defaultValue={group.name}
                            onBlur={(e) => {
                              if (e.target.value !== group.name) {
                                handleGroupNameChange(group.id, e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            className="w-16 border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-blue-500 bg-transparent"
                            defaultValue={group.position}
                            onBlur={(e) => {
                              const newPosition = parseInt(e.target.value);
                              if (newPosition !== group.position) {
                                handlePositionChange(group.id, newPosition);
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => deleteEventGroup(group.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            aria-label="Delete event group"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleEventGroup(group.id)}
                            className="flex items-center text-blue-600 hover:text-blue-900 transition-colors duration-200"
                            aria-label={expandedGroup === group.id ? "Collapse event group" : "Expand event group"}
                          >
                            {expandedGroup === group.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Events Table (Expanded) */}
                      {expandedGroup === group.id && (
                        <tr>
                          <td colSpan="4" className="px-0 py-0">
                            <div 
                              className="bg-gray-50 p-4 border-t border-b border-gray-200" 
                              data-aos="fade-down" 
                              data-aos-duration="300"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-800">
                                  Events in {group.name}
                                </h3>
                                <button
                                  onClick={() => openAddEventModal(group.id)}
                                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                >
                                  <Plus className="mr-1 h-4 w-4" />
                                  Add Event
                                </button>
                              </div>
                              
                              {group.events && group.events.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Image
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Title
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Description
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {group.events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            {event.image ? (
                                              <img
                                                src={`${IMAGE_BASE_URL}${event.image}`}
                                                alt={event.title}
                                                className="h-16 w-24 object-cover rounded"
                                              />
                                            ) : (
                                              <div className="h-16 w-24 bg-gray-200 flex items-center justify-center rounded">
                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-sm text-gray-500 max-w-md">
                                              {expandedDescriptions[event.id] || event.description.length <= 100 ? (
                                                event.description
                                              ) : (
                                                `${event.description.slice(0, 100)}...`
                                              )}
                                              {event.description.length > 100 && (
                                                <button
                                                  onClick={() => toggleDescription(event.id)}
                                                  className="ml-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                >
                                                  {expandedDescriptions[event.id] ? 'Show less' : 'Show more'}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-3">
                                              <button
                                                onClick={() => openEditEventModal(event)}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                aria-label="Edit event"
                                              >
                                                <Edit className="h-5 w-5" />
                                              </button>
                                              <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                aria-label="Delete event"
                                              >
                                                <Trash2 className="h-5 w-5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-8 text-center text-gray-600 bg-white rounded-lg border border-gray-200">
                                  <p>No events found in this group. Add your first event to get started.</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Event Modal (Add/Edit) */}
      {(currentEvent !== null || eventForm.event_group_id) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div 
            ref={modalRef} 
            className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl"
            data-aos="zoom-in"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {isEditingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventTitle">
                    Title
                  </label>
                  <input
                    id="eventTitle"
                    name="title"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={eventForm.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventImage">
                    Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {eventForm.image || eventForm.imagePreview ? 'Change Image' : 'Select Image'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    
                    {eventForm.imagePreview && (
                      <div className="relative">
                        <img
                          src={eventForm.imagePreview}
                          alt="Preview"
                          className="h-12 w-12 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setEventForm({ ...eventForm, image: null, imagePreview: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventDescription">
                  Description
                </label>
                <textarea
                  id="eventDescription"
                  name="description"
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventForm.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEventModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {isEditingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events