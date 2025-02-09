import React from 'react';

const Webinars = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Webinars</h1>
      <button 
        onClick={onAdd} 
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mb-4"
      >
        + Add Webinar
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((webinar) => (
          <div key={webinar.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-green-800">{webinar.title}</h2>
            <p className="text-gray-700">{webinar.date}</p>
            <p className="text-gray-600 mt-2">{webinar.description}</p>
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => onEdit(webinar)}
                className="text-green-600 hover:underline"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(webinar.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Webinars;