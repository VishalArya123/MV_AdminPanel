import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, CheckCircle, Download, AlertCircle,InfoIcon } from 'lucide-react';
import InstructionBox from './InstructionBox';

const BASE_URL = "https://backend.marichiventures.com/admin/pages";
const IMAGE_BASE_URL = "https://backend.marichiventures.com/admin/pages/uploads/newsletters";

const Newsletters = () => {

  const instructionData = {
    title: "How to use Newsletter Management Admin Panel",
    instructions: [
      "Click 'Add Newsletter' to create a new newsletter entry",
      "Fill in the required fields: Title, Preview Text, Date, Category, and Cover Image",
      "Provide a PDF link to the full newsletter for download access",
      "For date format, use descriptive terms like 'Summer 2024' rather than specific dates",
      "Edit existing newsletters by clicking the pencil icon in the Actions column",
      "Download the full PDF by clicking the download icon if available",
      "Delete newsletters by clicking the trash icon (confirmation will be required)",
      "When editing, you can leave the Cover Image field empty to keep the current image"
    ],
    icon: <InfoIcon />
  };

  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    previewText: '',
    date: '',
    coverImage: null,
    fullPdfLink: '',
    category: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch newsletters on component mount
  useEffect(() => {
    fetchNewsletters();
  }, []);

  // Fetch all newsletters
  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BASE_URL}/newsletters.php?action=get`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      }
      
      setNewsletters(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching newsletters:", err);
      setError(err.message || "Failed to load newsletters. Please try again later.");
      setLoading(false);
      // Set empty array to prevent undefined errors
      setNewsletters([]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  // Handle form submission for creating/updating newsletter
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formDataToSend = new FormData();
      
      for (const key in formData) {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      }
      
      if (editingId !== null) {
        formDataToSend.append('id', editingId);
        formDataToSend.append('action', 'update');
      } else {
        formDataToSend.append('action', 'create');
      }
      
      const response = await fetch(`${BASE_URL}/newsletters.php`, {
        method: 'POST',
        body: formDataToSend,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! Status: ${response.status}`);
      }
      
      if (result.success) {
        setSuccessMessage(editingId ? 'Newsletter updated successfully!' : 'Newsletter added successfully!');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        resetForm();
        fetchNewsletters();
      } else {
        setError(result.message || 'An error occurred');
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "Failed to save newsletter. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a newsletter
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this newsletter?')) {
      try {
        setError(null);
        
        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        formDataToSend.append('action', 'delete');
        
        const response = await fetch(`${BASE_URL}/newsletters.php`, {
          method: 'POST',
          body: formDataToSend,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setSuccessMessage('Newsletter deleted successfully!');
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
          fetchNewsletters();
        } else {
          setError(result.message || 'An error occurred');
        }
      } catch (err) {
        console.error("Error deleting newsletter:", err);
        setError(err.message);
      }
    }
  };

  // Prepare form for editing
  const handleEdit = (newsletter) => {
    setEditingId(newsletter.id);
    setFormData({
      title: newsletter.title,
      previewText: newsletter.previewText,
      date: newsletter.date,
      coverImage: null, // We don't load the image for editing
      fullPdfLink: newsletter.fullPdfLink,
      category: newsletter.category
    });
    setIsModalOpen(true);
  };

  // Reset form and close modal
  const resetForm = () => {
    setFormData({
      title: '',
      previewText: '',
      date: '',
      coverImage: null,
      fullPdfLink: '',
      category: ''
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Render loading state
  if (loading && newsletters.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl font-semibold">Loading newsletters...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6"> 
        {/* this is the instruction box */}
        <InstructionBox data={instructionData}/>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Newsletter Management</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} className="mr-1" /> Add Newsletter
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <CheckCircle size={18} className="mr-2" />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Newsletters Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cover Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newsletters.length > 0 ? (
              newsletters.map((newsletter) => (
                <tr key={newsletter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {newsletter.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {newsletter.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {newsletter.previewText}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {newsletter.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {newsletter.coverImage && (
                      <img
                        src={`${IMAGE_BASE_URL}/${newsletter.coverImage}`}
                        alt={newsletter.title}
                        className="h-10 w-16 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {newsletter.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(newsletter)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(newsletter.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                      {newsletter.fullPdfLink && (
                        <a
                          href={newsletter.fullPdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          <Download size={18} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No newsletters found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Newsletter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Newsletter' : 'Add New Newsletter'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="previewText">
                  Preview Text
                </label>
                <textarea
                  id="previewText"
                  name="previewText"
                  value={formData.previewText}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                  Date
                </label>
                <input
                  type="text"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., Summer 2024"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coverImage">
                  Cover Image
                </label>
                <input
                  type="file"
                  id="coverImage"
                  name="coverImage"
                  onChange={handleFileChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  accept="image/*"
                  {...(editingId ? {} : { required: true })}
                />
                {editingId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to keep the current image
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullPdfLink">
                  PDF Link
                </label>
                <input
                  type="text"
                  id="fullPdfLink"
                  name="fullPdfLink"
                  value={formData.fullPdfLink}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Link to PDF file"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Newsletters;
