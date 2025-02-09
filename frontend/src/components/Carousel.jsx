import React from 'react';
import { PlusCircle } from 'lucide-react';
import ContentCard from './ContentCard';

const Carousel = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="h-full p-4">
      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Carousel</h2>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusCircle size={20} />
          Add New
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div> */}
    </div>
  );
};

export default Carousel;
