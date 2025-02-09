import React from 'react';

const Events = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Events</h1>
      <button 
        onClick={onAdd} 
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Add Event
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(event => (
          <div key={event.id} className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-800">{event.title}</h2>
            <p className="text-green-600">Date: {event.date}</p>
            <p className="text-green-500">Location: {event.location}</p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => onEdit(event)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(event.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
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

export default Events;