import React from 'react';

const Certificates = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Certificates</h2>
      <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Add Certificate</button>
      <div className="space-y-4">
        {items.map((certificate) => (
          <div key={certificate.id} className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">{certificate.name}</h3>
            <p className="text-gray-600">Course: {certificate.course}</p>
            <p className="text-gray-500">Date: {certificate.date}</p>
            <div className="mt-2 space-x-2">
              <button onClick={() => onEdit(certificate)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => onDelete(certificate.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Certificates;