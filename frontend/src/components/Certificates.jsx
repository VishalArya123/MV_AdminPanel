import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [title, setTitle] = useState('');
    const [image, setImage] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        AOS.init();
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await fetch('http://localhost/Admin-panel/Backend/pages/certificates.php');
            const data = await response.json();
            setCertificates(data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
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
            if (editingId) {
                // Update existing certificate
                formData.append('id', editingId);
                formData.append('action', 'update');
                await fetch('http://localhost/Admin-panel/Backend/pages/certificates.php', {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Create new certificate
                formData.append('action', 'create');
                await fetch('http://localhost/Admin-panel/Backend/pages/certificates.php', {
                    method: 'POST',
                    body: formData
                });
            }
            
            // Reset form and fetch updated list
            setTitle('');
            setImage(null);
            setEditingId(null);
            fetchCertificates();
        } catch (error) {
            console.error('Error submitting certificate:', error);
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

            await fetch('http://localhost/Admin-panel/Backend/pages/certificates.php', {
                method: 'POST',
                body: formData
            });
            fetchCertificates();
        } catch (error) {
            console.error('Error deleting certificate:', error);
        }
    };

    return (
        <div className="container mx-auto p-6">
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
                {certificates.map((cert) => (
                    <div 
                        key={cert.id} 
                        data-aos="fade-up"
                        className="bg-white rounded-lg shadow-md p-4 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <img 
                            src={`http://localhost/Admin-panel/Backend/pages/${cert.certificate_image}`} 
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
                                onClick={() => handleDelete(cert.id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Certificates;