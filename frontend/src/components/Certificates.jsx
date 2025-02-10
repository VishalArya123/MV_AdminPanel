import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import AlertMessage from './AlertMessage';

const BASE_URL = "https://backend.marichiventures.com/admin/pages";   
const IMAGE_BASE_URL = "https://backend.marichiventures.com/admin/pages/uploads/certificates";

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [title, setTitle] = useState('');
    const [image, setImage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
        AOS.init();
        fetchCertificates();
    }, []);

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 3000);
    };

    const fetchCertificates = async () => {
        try {
            const response = await fetch(`${BASE_URL}/certificates.php`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch certificates');
            }
            const data = await response.json();
            setCertificates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            showAlert(error.message || 'Failed to fetch certificates', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', title);
        if (image) {
            formData.append('image', image);
        }

        try {
            let response;
            if (editingId) {
                // Update existing certificate
                formData.append('id', editingId);
                formData.append('action', 'update');
                response = await fetch(`${BASE_URL}/certificates.php`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Create new certificate
                formData.append('action', 'create');
                response = await fetch(`${BASE_URL}/certificates.php`, {
                    method: 'POST',
                    body: formData
                });
            }

            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                // Reset form and fetch updated list
                setTitle('');
                setImage(null);
                setEditingId(null);
                fetchCertificates();
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error submitting certificate:', error);
            showAlert('Error submitting certificate', 'error');
        }
    };

    const handleEdit = (cert) => {
        setTitle(cert.certificate_title);
        setEditingId(cert.id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;

        try {
            const formData = new FormData();
            formData.append('id', deleteConfirmId);
            formData.append('action', 'delete');

            const response = await fetch(`${BASE_URL}/certificates.php`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
                fetchCertificates();
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
            showAlert('Error deleting certificate', 'error');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteRequest = (id) => {
        setDeleteConfirmId(id);
    };

    return (
        <div className="container mx-auto p-6 relative">
            {alert && (
                <AlertMessage 
                    message={alert.message} 
                    type={alert.type} 
                    onClose={() => setAlert(null)} 
                />
            )}

            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                        <p className="mb-4">Are you sure you want to delete this certificate?</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={handleDeleteConfirm}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Confirm
                            </button>
                            <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Certificate Title
                    </label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required 
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Certificate Image
                    </label>
                    <input 
                        type="file" 
                        onChange={(e) => setImage(e.target.files[0])}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        accept="image/*"
                        required={!editingId}
                    />
                </div>
                <div className="flex space-x-4">
                    <button 
                        type="submit" 
                        className={`${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                    >
                        {editingId ? 'Update' : 'Add'} Certificate
                    </button>
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={() => {
                                setTitle('');
                                setImage(null);
                                setEditingId(null);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {certificates.length > 0 ? (
                    certificates.map((cert) => (
                        <div 
                            key={cert.id} 
                            data-aos="fade-up"
                            className="bg-white rounded-lg shadow-md p-4 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <img 
                                src={`${IMAGE_BASE_URL}/${cert.certificate_image}`} 
                                alt={cert.certificate_title} 
                                className="w-full h-48 object-cover rounded-md mb-4"
                            />
                            <h3 className="text-lg font-semibold mb-2">{cert.certificate_title}</h3>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleEdit(cert)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteRequest(cert.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500">
                        No certificates found
                    </div>
                )}
            </div>
        </div>
    );
};

export default Certificates;