import React from 'react';

const Blogs = ({ items = [], onAdd = () => {}, onEdit = () => {}, onDelete = () => {} }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Blogs</h2>
      <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Add Blog</button>
      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map((blog) => (
            <div key={blog.id} className="p-4 border rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-medium">{blog.title}</h3>
              <p className="text-gray-600">{blog.content}</p>
              <div className="mt-2 space-x-2">
                <button onClick={() => onEdit(blog)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                <button onClick={() => onDelete(blog.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No blogs available.</p>
        )}
      </div>
    </div>
  );
};

export default Blogs;
