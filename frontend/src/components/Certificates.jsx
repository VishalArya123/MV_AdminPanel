import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from "lucide-react";
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AOS.init();
        fetchCertificates();
    }, []);

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 3000);
    };

    const fetchCertificates = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
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
                formData.append('id', editingId);
                formData.append('action', 'update');
                response = await fetch(`${BASE_URL}/certificates.php`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                formData.append('action', 'create');
                response = await fetch(`${BASE_URL}/certificates.php`, {
                    method: 'POST',
                    body: formData
                });
            }

            const result = await response.json();
            
            if (result.success) {
                showAlert(result.message, 'success');
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

    const handleDelete = async (id) => {
        try {
            const formData = new FormData();
            formData.append('id', id);
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
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
                <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Certificates</h2>
                <div className="flex justify-center items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-t-[#2563eb] rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] to-[#B8C6DB] p-6">
            <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Certificates</h2>

            {alert && (
                <AlertMessage 
                    message={alert.message} 
                    type={alert.type} 
                    onClose={() => setAlert(null)} 
                />
            )}

            <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-md">
                <div className="grid gap-4">
                    <input 
                        type="text" 
                        placeholder="Certificate Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        required 
                    />
                    <input 
                        type="file" 
                        onChange={(e) => setImage(e.target.files[0])}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        accept="image/*"
                        required={!editingId}
                    />
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all"
                        >
                            <Plus size={18} />
                            {editingId ? "Update Certificate" : "Add Certificate"}
                        </button>
                        
                            <button
                                type="button"
                                onClick={() => {
                                    setTitle('');
                                    setImage(null);
                                    setEditingId(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                        
                    </div>
                </div>
            </form>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.length > 0 ? (
                    certificates.map((cert) => (
                        <div 
                            key={cert.id} 
                            data-aos="fade-up"
                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <h3 className="text-xl font-semibold mb-2">{cert.certificate_title}</h3>
                            <div className="relative pt-[75%] mb-4">
                                <img 
                                    src={`${IMAGE_BASE_URL}/${cert.certificate_image}`} 
                                    alt={cert.certificate_title} 
                                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                                />
                            </div>
                            <div className="mt-4 flex justify-between">
                                <button
                                    onClick={() => handleEdit(cert)}
                                    className="text-blue-500 hover:underline"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (!window.confirm(`Are you sure you want to delete the certificate ${cert.certificate_title}?`)) {
                                            return;
                                        }
                                        handleDelete(cert.id);
                                    }}
                                    className="text-red-500 hover:underline"
                                >
                                    <Trash2 size={18} />
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