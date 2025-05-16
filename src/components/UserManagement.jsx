import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Save, Check, InfoIcon } from 'lucide-react';
import AlertMessage from "./AlertMessage";
import InstructionBox from "./InstructionBox";

const BASE_URL = "https://backend.marichiventures.com/admin/pages";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);
  
  const instructionData = {
    title: "How to use User Management admin panel",
    instructions: [
      "Add new users by clicking the 'Add User' button and filling out the form",
      "Edit user details by clicking the edit icon",
      "Update user privileges directly from the dropdown menu",
      "Delete users by clicking the delete icon (this action cannot be undone)",
      "Admin users have full access to all system features",
      "Manager users can manage content but not system settings",
      "Employee users have limited editing capabilities",
      "Registered Users have view-only access to protected content"
    ],
    icon: <InfoIcon />
  };

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    privilege: 'Registered User'
  });
  
  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/users.php?action=get`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('action', 'add');
      formData.append('name', newUser.name);
      formData.append('email', newUser.email);
      formData.append('privilege', newUser.privilege);
      
      const response = await fetch(`${BASE_URL}/users.php?action=add`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user');
      }
      
      // Refresh the users list
      fetchUsers();
      setShowAddModal(false);
      // Reset the form
      setNewUser({
        name: '',
        email: '',
        privilege: 'Registered User'
      });
      showAlert('User added successfully!', 'success');
    } catch (error) {
      console.error('Error adding user:', error);
      showAlert('Failed to add user. Please try again.');
    }
  };
  
  const handleUpdateUser = async (id, updatedData) => {
    try {
      const formData = new FormData();
      formData.append('action', 'update');
      formData.append('id', id);
      Object.entries(updatedData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      const response = await fetch(`${BASE_URL}/users.php`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update local state
      setUsers(users.map(user => user.id === id ? {...user, ...updatedData} : user));
      setEditingId(null);
      showAlert('User updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Failed to update user. Please try again.');
    }
  };
  
  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);
        
        const response = await fetch(`${BASE_URL}/users.php`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete user');
        }
        
        // Update local state
        setUsers(users.filter(user => user.id !== id));
        showAlert('User deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user. Please try again.');
      }
    }
  };
  
  const startEditing = (id) => {
    setEditingId(id);
  };
  
  const cancelEditing = () => {
    setEditingId(null);
  };
  
  const renderTableRow = (user, index) => {
    const isEditing = editingId === user.id;
    
    if (isEditing) {
      // Editing mode row
      return (
        <tr key={user.id} className="border-b hover:bg-gray-50">
          <td className="px-6 py-4">{index + 1}</td>
          <td className="px-6 py-4">
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              defaultValue={user.name}
              id={`edit-name-${user.id}`}
            />
          </td>
          <td className="px-6 py-4">
            <input
              type="email"
              className="border rounded px-2 py-1 w-full"
              defaultValue={user.email}
              id={`edit-email-${user.id}`}
            />
          </td>
          <td className="px-6 py-4">
            <select
              className="border rounded px-2 py-1 w-full"
              defaultValue={user.privilege}
              id={`edit-privilege-${user.id}`}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
              <option value="Registered User">Registered User</option>
            </select>
          </td>
          <td className="px-6 py-4">
            <div className="flex space-x-2">
              <button 
                className="text-green-600 hover:text-green-800"
                onClick={() => {
                  const name = document.getElementById(`edit-name-${user.id}`).value;
                  const email = document.getElementById(`edit-email-${user.id}`).value;
                  const privilege = document.getElementById(`edit-privilege-${user.id}`).value;
                  handleUpdateUser(user.id, { name, email, privilege });
                }}
              >
                <Save size={18} />
              </button>
              <button 
                className="text-gray-600 hover:text-gray-800"
                onClick={cancelEditing}
              >
                <X size={18} />
              </button>
            </div>
          </td>
        </tr>
      );
    }
    
    // Normal row
    return (
      <tr key={user.id} className="border-b hover:bg-gray-50">
        <td className="px-6 py-4">{index + 1}</td>
        <td className="px-6 py-4">{user.name}</td>
        <td className="px-6 py-4">{user.email}</td>
        <td className="px-6 py-4">
          <select
            className="border rounded px-2 py-1"
            value={user.privilege}
            onChange={(e) => handleUpdateUser(user.id, { privilege: e.target.value })}
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
            <option value="Registered User">Registered User</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <div className="flex space-x-2">
            <button 
              className="text-blue-600 hover:text-blue-800"
              onClick={() => startEditing(user.id)}
            >
              <Edit2 size={18} />
            </button>
            <button 
              className="text-red-600 hover:text-red-800"
              onClick={() => handleDeleteUser(user.id)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  };
  
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#2A2A2A]">User Management</h1>
      
      {alert && (
        <AlertMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      
      <div className="mb-6">
        <InstructionBox data={instructionData} />
      </div>
      
      <div className="flex justify-end mb-6">
        <button 
          className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white px-4 py-2 rounded-lg flex items-center hover:shadow-lg transition-all"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} className="mr-1" /> Add User
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">S.No</th>
                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-gray-700">Privilege</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => renderTableRow(user, index))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found. Add a new user to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Privilege</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newUser.privilege}
                  onChange={(e) => setNewUser({...newUser, privilege: e.target.value})}
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Registered User">Registered User</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border rounded text-gray-700"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white rounded-lg flex items-center hover:shadow-lg transition-all"
                >
                  <Check size={18} className="mr-1" /> Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;