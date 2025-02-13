import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AlertMessage from "./AlertMessage";

const VideoTestimonials = () => {
  const BASE_URL = "https://backend.marichiventures.com/admin/pages";

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialFormState = {
    id: "",
    name: "",
    description: "",
    videoUrl: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = "error") => {
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
    Object.keys(formData).forEach((key) => {
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
        showAlert(
          isEditing
            ? "Video testimonial updated successfully!"
            : "Video testimonial added successfully!",
          "success"
        );
        handleCancel();
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to save video testimonial.");
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      showAlert("Failed to save video testimonial. Please try again.");
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setIsEditing(false);
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
    if (
      !window.confirm(
        `Are you sure you want to delete the video testimonial from ${name}?`
      )
    ) {
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
        showAlert("Video testimonial deleted successfully!", "success");
        fetchTestimonials();
      } else {
        showAlert(data.error || "Failed to delete video testimonial.");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showAlert("Failed to delete video testimonial. Please try again.");
    }
  };

  const getEmbedUrl = (videoUrl) => {
    if (videoUrl.includes("/shorts/")) {
      return videoUrl.replace("/shorts/", "/embed/");
    }
    return videoUrl; // Return the original URL if no transformation is needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
        <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Video Testimonials</h2>
        <div className="flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
      <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Video Testimonials</h2>

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
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            required
          />
          <input
            type="url"
            placeholder="Video URL"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            required
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
              onClick={handleCancel}
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
            <p className="text-gray-600 mb-4">{testimonial.description}</p>
            <div className="relative pt-[56.25%]">
              <iframe
                src={getEmbedUrl(testimonial.videoUrl)}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg"
              ></iframe>
            </div>
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

export default VideoTestimonials;
