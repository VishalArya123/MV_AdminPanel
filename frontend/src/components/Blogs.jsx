import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  InfoIcon
} from "lucide-react";
import InstructionBox from './InstructionBox';


const BASE_URL = "https://backend.marichiventures.com/admin/pages";
const IMAGE_BASE_URL = "https://backend.marichiventures.com/admin/pages/uploads/blogs";

const Blogs = () => {

  const instructionData = {
    title: "How to use Blog Management Admin Panel",
    instructions: [
      "Use the search bar to quickly find specific blogs by title",
      "Filter blogs by category using the dropdown menu",
      "Add a new blog by clicking the 'Add Blog' button and filling all required fields",
      "Upload blog images in the recommended size of 1280x720px for best results",
      "Edit existing blogs by clicking the pencil icon in the Actions column",
      "Delete blogs by clicking the trash icon (confirmation will be required)",
      "Mark important content as 'Featured' to highlight it on the website",
      "Provide accurate read time estimates to help readers plan their time"
    ],
    icon: <InfoIcon />
  };

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    date: "",
    readTime: "",
    category: "",
    excerpt: "",
    featured: false,
    image: null,
  });
  const fileInputRef = useRef(null);

  // Fetch blogs from API
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/blogs.php?action=get`);
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await response.json();
      setBlogs(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter blogs based on search term and category
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === "" || blog.category === filterCategory)
  );

  // Get unique categories for filter dropdown
  const categories = [...new Set(blogs.map((blog) => blog.category))];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle image input change
  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      title: "",
      author: "",
      date: "",
      readTime: "",
      category: "",
      excerpt: "",
      featured: false,
      image: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission for adding a new blog
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }
      formDataToSend.append("action", "add");

      const response = await fetch(`${BASE_URL}/blogs.php`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to add blog");
      }

      const result = await response.json();
      if (result.success) {
        fetchBlogs();
        setShowModal(false);
        resetFormData();
      } else {
        throw new Error(result.message || "Failed to add blog");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle delete blog
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/blogs.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `action=delete&id=${id}`,
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog");
      }

      const result = await response.json();
      if (result.success) {
        fetchBlogs();
      } else {
        throw new Error(result.message || "Failed to delete blog");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit mode
  const handleEdit = (id) => {
    setEditingRow(id);
    const blogToEdit = blogs.find((blog) => blog.id === id);
    setFormData({
      ...blogToEdit,
      image: null,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRow(null);
    resetFormData();
  };

  // Handle update blog
  const handleUpdate = async (id) => {
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }
      formDataToSend.append("action", "update");
      formDataToSend.append("id", id);

      const response = await fetch(`${BASE_URL}/blogs.php`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to update blog");
      }

      const result = await response.json();
      if (result.success) {
        fetchBlogs();
        setEditingRow(null);
        resetFormData();
      } else {
        throw new Error(result.message || "Failed to update blog");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6"> 
        {/* this is the instruction box */}
        <InstructionBox data={instructionData}/>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Blog Management</h1>

        

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="mr-2" size={18} />
          Add Blog
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search blogs..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="pl-10 pr-4 py-2 border rounded-md appearance-none bg-white"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading blogs...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer">
                    ID
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer">
                    Title
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No blogs found
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {blog.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingRow === blog.id ? (
                        <input
                          type="text"
                          name="title"
                          className="w-full border rounded-md p-1"
                          value={formData.title}
                          onChange={handleInputChange}
                        />
                      ) : (
                        blog.title
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingRow === blog.id ? (
                        <input
                          type="text"
                          name="author"
                          className="w-full border rounded-md p-1"
                          value={formData.author}
                          onChange={handleInputChange}
                        />
                      ) : (
                        blog.author
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingRow === blog.id ? (
                        <input
                          type="date"
                          name="date"
                          className="w-full border rounded-md p-1"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                      ) : (
                        formatDate(blog.date)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingRow === blog.id ? (
                        <input
                          type="text"
                          name="category"
                          className="w-full border rounded-md p-1"
                          value={formData.category}
                          onChange={handleInputChange}
                        />
                      ) : (
                        blog.category
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingRow === blog.id ? (
                        <input
                          type="checkbox"
                          name="featured"
                          className="border rounded-md p-1"
                          checked={formData.featured}
                          onChange={handleInputChange}
                        />
                      ) : (
                        blog.featured ? "Yes" : "No"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingRow === blog.id ? (
                        <input
                          type="file"
                          name="image"
                          className="w-full text-sm"
                          onChange={handleImageChange}
                          ref={fileInputRef}
                        />
                      ) : (
                        <img
                          src={`${IMAGE_BASE_URL}/${blog.image}`}
                          alt={blog.title}
                          className="h-10 w-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingRow === blog.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdate(blog.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Save"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(blog.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding a new blog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Blog</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetFormData();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author*
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date*
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Read Time*
                    </label>
                    <input
                      type="text"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleInputChange}
                      placeholder="e.g. 8 min read"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category*
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Featured
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Mark as featured
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image*
                    </label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleImageChange}
                      required
                      className="w-full text-sm"
                      ref={fileInputRef}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 1280x720px
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt*
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A brief summary of the blog post..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetFormData();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Blog
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;