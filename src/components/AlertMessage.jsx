import React from "react";

const AlertMessage = ({ message, type, onClose }) => (
  <div
    className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white max-w-sm animate-fade-in z-50`}
  >
    <div className="flex justify-between items-center">
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  </div>
);

export default AlertMessage;