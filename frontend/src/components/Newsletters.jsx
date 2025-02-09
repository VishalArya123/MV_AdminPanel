import React from 'react';

const Newsletters = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Newsletters</h2>
      <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Add Newsletter</button>
      <ul>
        {items.map((newsletter) => (
          <li key={newsletter.id} className="border p-2 mb-2 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{newsletter.title}</h3>
              <p>Issue: {newsletter.issue}</p>
              <a href={newsletter.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Newsletter</a>
            </div>
            <div>
              <button onClick={() => onEdit(newsletter)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Edit</button>
              <button onClick={() => onDelete(newsletter.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Newsletters;