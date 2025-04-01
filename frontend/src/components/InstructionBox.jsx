import React from 'react';

const InstructionBox = ({ data }) => {
  const { title, instructions, icon } = data;
  
  return (
    <div className="rounded-lg border border-green-200 bg-white p-6 shadow-sm">
      <div className="flex items-center mb-4">
        {icon && (
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-green-800">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {Array.isArray(instructions) ? (
          <ol className="list-decimal pl-5 space-y-2">
            {instructions.map((instruction, index) => (
              <li key={index} className="text-gray-700">{instruction}</li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-700">{instructions}</p>
        )}
      </div>
      
      <div className="mt-6 bg-green-50 p-4 rounded-md border-l-4 border-green-400">
        <p className="text-sm text-green-700">
          Follow these instructions carefully to ensure the best results.
        </p>
      </div>
    </div>
  );
};

export default InstructionBox;