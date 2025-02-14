import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AlertMessage from "./AlertMessage";

const TextTestimonials = () => {
  const BASE_URL = "https://backend.marichiventures.com/admin/pages";
  const IMAGE_BASE_URL = "https://backend.marichiventures.com/admin/pages/uploads/text_testimonials";
  
  const [testimonials, setTestimonials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    content: "",
    image: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/text_testimonials.php`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showAlert("Failed to load testimonials. Please try again later.");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("content", formData.content);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }
    if (isEditing) {
      formDataToSend.append("id", formData.id);
    }

    try {
      const response = await fetch(`${BASE_URL}/text_testimonials.php`, {
        method: "POST",
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        showAlert(isEditing ? "Testimonial updated successfully!" : "Testimonial added successfully!", 'success');
        setFormData({ id: "", name: "", content: "", image: null });
        setIsEditing(false);
        await fetchTestimonials();
      } else {
        throw new Error(data.error || "Failed to save testimonial.");
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      showAlert(error.message || "Failed to save testimonial. Please try again.");
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      id: testimonial.id,
      name: testimonial.name,
      content: testimonial.content,
      image: null,
    });
    setIsEditing(true);
    setError(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial from ${name}?`)) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("_method", "DELETE");
      formDataToSend.append("id", id);

      const response = await fetch(`${BASE_URL}/text_testimonials.php`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "Failed to delete testimonial");
      }

      showAlert("Testimonial deleted successfully!", 'success');
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert(error.message || "Failed to delete testimonial. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
        <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Text Testimonials</h2>
        <div className="flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
      <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Text Testimonials</h2>

      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-md">
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            required
          />
          <textarea
            placeholder="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            required
          />
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            accept="image/*"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              <Plus size={18} />
              {isEditing ? "Update Testimonial" : "Add Testimonial"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ id: "", name: "", content: "", image: null });
                setIsEditing(false);
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <h3 className="text-xl font-semibold mb-2">{testimonial.name}</h3>
            <p className="text-gray-600 mb-4">{testimonial.content}</p>
            {testimonial.image && (
              <div className="relative pt-[56.25%] mb-4">
                <img
                  src={`${IMAGE_BASE_URL}/${testimonial.image}`}
                  alt={testimonial.name}
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handleEdit(testimonial)}
                className="text-blue-500 hover:underline"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(testimonial.id, testimonial.name)}
                className="text-red-500 hover:underline"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextTestimonials;