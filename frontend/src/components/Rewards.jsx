import React from 'react';

const Rewards = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Rewards</h2>
      <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Add Reward</button>
      <div className="space-y-4">
        {items.map((reward) => (
          <div key={reward.id} className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{reward.title}</h3>
              <p className="text-gray-600">Points: {reward.points}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => onEdit(reward)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => onDelete(reward.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rewards;