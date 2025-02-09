// VideoTestimonials.js
import React, { useEffect, useState } from "react";
import AlertMessage from "./AlertMessage";

const VideoTestimonials = () => {
  const BASE_URL = "https://backend.marichiventures.com/admin/pages";
  
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    videoUrl: "",
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
      const response = await fetch(`${BASE_URL}/video_testimonials.php`);
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
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(`${BASE_URL}/video_testimonials.php`, {
        method: "POST",
        body: formDataToSend,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        showAlert(isEditing ? "Video testimonial updated successfully!" : "Video testimonial added successfully!", 'success');
        setFormData({ id: "", name: "", description: "", videoUrl: "" });
        setIsEditing(false);
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to save video testimonial.");
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      showAlert("Failed to save video testimonial. Please try again.");
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      id: testimonial.id,
      name: testimonial.name,
      description: testimonial.description,
      videoUrl: testimonial.videoUrl,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the video testimonial from ${name}?`)) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("_method", "DELETE");
    formDataToSend.append("id", id);

    try {
      const response = await fetch(`${BASE_URL}/video_testimonials.php`, {
        method: "POST",
        body: formDataToSend,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        showAlert("Video testimonial deleted successfully!", 'success');
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to delete video testimonial.");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert("Failed to delete video testimonial. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Video Testimonials</h2>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Video Testimonials</h2>

      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-2">
          <label className="block mb-1">Name:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Description:</label>
          <textarea
            className="w-full p-2 border rounded"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          ></textarea>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Video URL:</label>
          <input
            type="url"
            className="w-full p-2 border rounded"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            required
            placeholder="https://example.com/video"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? "Update" : "Add"} Testimonial
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormData({ id: "", name: "", description: "", videoUrl: "" });
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        {testimonials.length === 0 ? (
          <p className="text-gray-500">No testimonials found.</p>
        ) : (
          testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-4 mb-4 border rounded shadow flex items-start justify-between"
            >
              <div className="flex-1">
                <h3 className="font-bold">{testimonial.name}</h3>
                <p className="text-gray-600 mt-1">{testimonial.description}</p>
                {testimonial.videoUrl && (
                  <div className="mt-2">
                    <a
                      href={testimonial.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700"
                    >
                      <span>Watch Video</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              <div className="ml-4 flex gap-2">
                <button
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
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

export default VideoTestimonials;
