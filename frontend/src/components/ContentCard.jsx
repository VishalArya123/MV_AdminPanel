import React from 'react';
import { Edit, Trash } from 'lucide-react';

const ContentCard = ({ item, index, onEdit, onDelete }) => {
  return (
    <div
      className="bg-white shadow-lg rounded-lg p-4 flex flex-col items-center"
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-32 object-cover rounded-md"
      />
      <h3 className="text-lg font-semibold mt-2">{item.title}</h3>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit(item)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
