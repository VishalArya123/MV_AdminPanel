import React from 'react';

const Blogs = ({ items = [], onAdd = () => {}, onEdit = () => {}, onDelete = () => {} }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Blogs</h2>
      <p>The details are not yet given</p>
    </div>
  );
};

export default Blogs;
