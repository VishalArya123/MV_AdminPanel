import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  InfoIcon,
  Eye,
  DollarSign,
  Book,
  Users,
  Clock,
  X,
} from "lucide-react";
import AlertMessage from "./AlertMessage";
import InstructionBox from "./InstructionBox";

const Courses = () => {
  const BASE_URL = "https://backend.marichiventures.com/admin/pages/courses.php";
  const UPLOADS_BASE_URL = "https://backend.marichiventures.com/admin/pages/";

  const instructionData = {
    title: "How to use Courses admin panel",
    instructions: [
      "Add new courses by filling out all required fields",
      "Upload a thumbnail image for better course visibility",
      "Provide a video URL (YouTube embed link) or upload a video file",
      "Edit existing courses by clicking the edit icon",
      "Delete courses by clicking the delete icon (this action cannot be undone)",
      "Toggle publication status to control course visibility",
      "All published courses are displayed on the public-facing website",
      "Preview thumbnail images and videos before publishing",
    ],
    icon: <InfoIcon />,
  };

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    slug: "",
    description: "",
    short_description: "",
    category: "",
    instructor_id: "",
    language: "English",
    price: "",
    discount_price: "",
    level: "Beginner",
    duration: "",
    video_url: "",
    video_file: null,
    is_published: 1,
    thumbnail: null,
    remove_thumbnail: 0,
    remove_video: 0,
    thumbnailPreview: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [previewMedia, setPreviewMedia] = useState(null);
  const [instructors, setInstructors] = useState([]);

  const categories = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Design",
    "Marketing",
    "Business",
    "IT & Software",
    "Personal Development",
  ];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchCourses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        action: 'list'
      });
  
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (levelFilter) params.append('level', levelFilter);
  
      const response = await fetch(`${BASE_URL}?${params.toString()}`); // Fixed: Added backticks
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`); // Fixed: Added backticks
      }
  
      const data = await response.json();
      setCourses(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showAlert("Failed to load courses. Please try again later.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };  

  const fetchInstructors = async () => {
    try {
      const response = await fetch(`${BASE_URL}?action=list_instructors`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInstructors(data.data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      showAlert("Failed to load instructors. Please try again later.");
      setInstructors([]);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, [searchTerm, categoryFilter, levelFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCourses(newPage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    const requiredFields = [
      'title', 'description', 'short_description', 'category', 'instructor_id'
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        showAlert(`Please fill out the ${field.replace('_', ' ')} field.`);
        setIsSubmitting(false);
        return;
      }
    }
    
    const formDataToSend = new FormData();
    
    // Add all fields to FormData
    Object.keys(formData).forEach(key => {
      if (key !== "thumbnailPreview" && formData[key] !== null && formData[key] !== undefined) {
        if (key === "thumbnail" || key === "video_file") {
          if (formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
    });
    
    // Explicitly add a _method field to help PHP recognize it
    if (isEditing) {
      formDataToSend.append('_method', 'PUT');
    }
    
    try {
      const action = isEditing ? 'update' : 'create';
      const url = `${BASE_URL}?action=${action}`;
      
      const response = await fetch(url, {
        method: "POST",
        // Don't set Content-Type header when using FormData, let the browser set it with boundary
        headers: {
          // Add this to make sure PHP recognizes it as a POST request
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formDataToSend,
        // Include credentials if your server requires cookies
        credentials: 'include'
      });
      
      // Log the actual response for debugging
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Server returned invalid JSON");
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        showAlert(
          isEditing ? "Course updated successfully!" : "Course added successfully!",
          "success"
        );
        
        if (data.thumbnail_url) {
          setFormData(prev => ({ ...prev, thumbnail: data.thumbnail_url }));
        }
        if (data.video_file_url) {
          setFormData(prev => ({ ...prev, video_file: data.video_file_url }));
        }
        
        resetForm();
        await fetchCourses(isEditing ? pagination.page : 1);
      } else {
        throw new Error(data.message || "Failed to save course.");
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      showAlert(error.message || "Failed to save course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      slug: "",
      description: "",
      short_description: "",
      category: "",
      instructor_id: "",
      language: "English",
      price: "",
      discount_price: "",
      level: "Beginner",
      duration: "",
      video_url: "",
      video_file: null,
      is_published: 1,
      thumbnail: null,
      remove_thumbnail: 0,
      remove_video: 0,
      thumbnailPreview: null,
    });
    setIsEditing(false);
  };

  const handleEdit = (course) => {
    setFormData({
      id: course.id.toString(),
      title: course.title,
      slug: course.slug,
      description: course.description,
      short_description: course.short_description,
      category: course.category,
      instructor_id: course.instructor_id.toString(),
      language: course.language || "English",
      price: course.price,
      discount_price: course.discount_price || "",
      level: course.level || "Beginner",
      duration: course.duration || "",
      video_url: course.video_url || "",
      video_file: course.video_file || null,
      is_published: course.is_published,
      thumbnail: course.thumbnail || null,
      remove_thumbnail: 0,
      remove_video: 0,
      thumbnailPreview: course.thumbnail ? `${UPLOADS_BASE_URL}/${course.thumbnail}` : null, // Fixed: Added backticks
    });
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the course "${title}"?`)) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id", id);

      const response = await fetch(`${BASE_URL}?action=delete`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to delete course");
      }

      showAlert("Course deleted successfully!", "success");
      fetchCourses(pagination.page);
    } catch (error) {
      console.error("Error deleting course:", error);
      showAlert(error.message || "Failed to delete course. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const openPreviewModal = (type, source) => {
    setPreviewMedia({ type, source });
  };

  const closePreviewModal = () => {
    setPreviewMedia(null);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        [field]: file,
        [`remove_${field}`]: 0, // Fixed: Added backticks
      });
  
      // Create a preview URL for the file
      if (field === "thumbnail" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({
            ...prev,
            thumbnailPreview: e.target.result,
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveFile = (field) => {
    setFormData({
      ...formData,
      [field]: null,
      [`remove_${field}`]: 1, // Fixed: Added backticks
      ...(field === "thumbnail" ? { thumbnailPreview: null } : {}),
    });
  };

  const generateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData({ ...formData, slug });
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
        <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">
          Courses Management
        </h2>
        <div className="flex justify-center items-center mt-10">
          <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
      <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">
        Courses Management
      </h2>

      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="mb-6">
        <InstructionBox data={instructionData} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 bg-white p-6 rounded-2xl shadow-md"
      >
        <h3 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Course" : "Add New Course"}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Course title"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Slug</label>
            <div className="flex">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full p-3 rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="course-slug"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="bg-gray-200 text-gray-700 px-4 rounded-r-lg hover:bg-gray-300"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate from title
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) =>
                setFormData({ ...formData, short_description: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description (100-150 characters)"
              rows="2"
              required
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed course description"
              rows="5"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Instructor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.instructor_id}
              onChange={(e) =>
                setFormData({ ...formData, instructor_id: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Language</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Course language"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Level</label>
            <select
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {levels.map((level, index) => (
                <option key={index} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Price (INR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Regular price"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Discount Price (INR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.discount_price}
              onChange={(e) =>
                setFormData({ ...formData, discount_price: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Sale price (optional)"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="E.g., 10 hours, 6 weeks"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Publication Status
            </label>
            <select
              value={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Published</option>
              <option value="0">Draft</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Thumbnail Image</label>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "thumbnail")}
                className="w-full p-2 border border-gray-300 rounded-lg"
                accept="image/*"
              />

              {formData.thumbnailPreview && (
                <div className="relative inline-block mt-2">
                  <img
                    src={formData.thumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-32 w-auto object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile("thumbnail")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {isEditing &&
                formData.thumbnail &&
                !formData.thumbnailPreview && (
                  <div className="relative inline-block mt-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">
                        Current thumbnail: {formData.thumbnail.split("/").pop()}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("thumbnail")}
                        className="text-red-500 hover:text-red-700"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openPreviewModal(
                            "image",
                            `${BASE_URL}/${formData.thumbnail}`
                          )
                        }
                        className="text-blue-500 hover:text-blue-700"
                        title="Preview image"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">
              Video URL (YouTube/Vimeo)
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) =>
                setFormData({ ...formData, video_url: e.target.value })
              }
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.youtube.com/embed/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste embed URL for the course preview video
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">
              Or Upload Video File
            </label>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "video_file")}
                className="w-full p-2 border border-gray-300 rounded-lg"
                accept="video/*"
              />

              {isEditing && formData.video_file && !formData.video_url && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      Current video: {formData.video_file.split("/").pop()}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile("video_file")}
                      className="text-red-500 hover:text-red-700"
                      title="Remove video"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openPreviewModal(
                          "video",
                          `${BASE_URL}/${formData.video_file}`
                        )
                      }
                      className="text-blue-500 hover:text-blue-700"
                      title="Preview video"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 ${
              isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center`}
          >
            {isSubmitting && (
              <span className="mr-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </span>
            )}
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Course"
                : "Add Course"}
          </button>
          {(formData.thumbnail instanceof File || formData.video_file instanceof File) && isSubmitting && (
            <div className="mt-3 text-sm text-blue-600">
              Uploading files... This may take a moment for large files.
            </div>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Course List Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Course List</h3>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                {levels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <Book size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-xl font-medium text-gray-700 mb-2">
              No courses found
            </h4>
            <p className="text-gray-500">
              {searchTerm || categoryFilter || levelFilter
                ? "Try adjusting your search or filters"
                : "Get started by adding your first course"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg"
              >
                <div className="relative h-48 bg-gray-100">
                  {course.thumbnail ? (
                    <img
                      src={`${UPLOADS_BASE_URL}/${course.thumbnail}`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/400x225?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200">
                      <Book size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-medium px-2 py-1 rounded">
                    {course.is_published == 1 ? "Published" : "Draft"}
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {course.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.short_description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      <Book size={12} className="mr-1" />
                      {course.category}
                    </span>
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      <Users size={12} className="mr-1" />
                      {course.level}
                    </span>
                    {course.duration && (
                      <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        <Clock size={12} className="mr-1" />
                        {course.duration}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      {course.discount_price &&
                      parseFloat(course.discount_price) > 0 ? (
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-800 mr-2">
                            {formatCurrency(course.discount_price)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(course.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-800">
                          {parseFloat(course.price) > 0
                            ? formatCurrency(course.price)
                            : "Free"}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                        title="Edit course"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        title="Delete course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded ${
                  pagination.page === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded ${
                  pagination.page === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Prev
              </button>

              {[...Array(pagination.pages)].map((_, i) => {
                if (
                  i + 1 === 1 ||
                  i + 1 === pagination.pages ||
                  (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded ${
                        pagination.page === i + 1
                          ? "bg-blue-800 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                }
                if (
                  (i + 1 === pagination.page - 2 && pagination.page > 3) ||
                  (i + 1 === pagination.page + 2 &&
                    pagination.page < pagination.pages - 2)
                ) {
                  return (
                    <span key={i} className="px-3 py-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`px-3 py-1 rounded ${
                  pagination.page === pagination.pages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className={`px-3 py-1 rounded ${
                  pagination.page === pagination.pages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 bg-white">
              <h4 className="text-lg font-semibold">Media Preview</h4>
              <button
                onClick={closePreviewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              {previewMedia.type === "image" ? (
                <img
                  src={previewMedia.source}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : previewMedia.type === "video" ? (
                <video
                  src={previewMedia.source}
                  controls
                  className="max-w-full max-h-[70vh] mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-10">
                  <p>Unable to preview this media type.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;