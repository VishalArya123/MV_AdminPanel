import React from 'react';

const Courses = ({ items, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Courses</h2>
      <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Add Course</button>
      <div className="space-y-4">
        {items.map((course) => (
          <div key={course.id} className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">{course.title}</h3>
            <p className="text-gray-600">Instructor: {course.instructor}</p>
            <p className="text-gray-500">Duration: {course.duration}</p>
            <div className="mt-2 space-x-2">
              <button onClick={() => onEdit(course)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => onDelete(course.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;