import React, { useEffect, useState } from "react";

const AlertMessage = ({ message, type, onClose }) => (
  <div
    className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white max-w-sm animate-fade-in`}
  >
    <div className="flex justify-between items-center">
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  </div>
);

const TextTestimonials = () => {
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

  // Show alert message
  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000); // Hide after 3 seconds
  };

  // Fetch testimonials from the backend
  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://localhost/Admin-panel/Backend/pages/text_testimonials.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched testimonials:", data);
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
      const response = await fetch(
        "http://localhost/Admin-panel/Backend/pages/text_testimonials.php",
        {
          method: "POST",
          body: formDataToSend,
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        showAlert(isEditing ? "Testimonial updated successfully!" : "Testimonial added successfully!", 'success');
        setFormData({ id: "", name: "", content: "", image: null });
        setIsEditing(false);
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to save testimonial.");
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      showAlert("Failed to save testimonial. Please try again.");
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
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the testimonial from ${name}?`)) {
      return;
    }

    setError(null);
    const formDataToSend = new FormData();
    formDataToSend.append("_method", "DELETE");
    formDataToSend.append("id", id);

    try {
      const response = await fetch(
        "http://localhost/Admin-panel/Backend/pages/text_testimonials.php",
        {
          method: "POST",
          body: formDataToSend,
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        showAlert("Testimonial deleted successfully!", 'success');
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to delete testimonial.");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert("Failed to delete testimonial. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Text Testimonials</h2>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Text Testimonials</h2>

      {/* Alert Message */}
      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Form for adding/updating testimonials */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-2">
          <label className="block mb-1">Name:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Content:</label>
          <textarea
            className="w-full p-2 border rounded"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            required
          ></textarea>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Image:</label>
          <input
            type="file"
            className="w-full p-2 border rounded"
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.files[0] })
            }
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isEditing ? "Update" : "Add"} Testimonial
        </button>
      </form>

      {/* List of testimonials */}
      <div>
        {testimonials.length === 0 ? (
          <p className="text-gray-500">No testimonials found.</p>
        ) : (
          testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-4 mb-4 border rounded shadow flex items-start justify-between"
            >
              <div>
                <h3 className="font-bold">{testimonial.name}</h3>
                <p>{testimonial.content}</p>
                {testimonial.image && (
                  <img
                    src={`http://localhost/Admin-panel/Backend/pages/${testimonial.image}`}
                    alt={testimonial.name}
                    className="w-32 h-32 mt-2 object-cover"
                  />
                )}
              </div>
              <div>
                <button
                  className="px-2 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600"
                  onClick={() => handleEdit(testimonial)}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => handleDelete(testimonial.id, testimonial.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TextTestimonials;