import React, { useState, useEffect } from "react";

const UserFormModal = ({ entity, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        id: entity ? entity.id : undefined,
        username: entity ? entity.username : '',
        password: '', 
        role: entity ? entity.role : 'Viewer',
    });

    const isEditing = !!entity;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let finalData = { 
            ...formData 
        };
        
        if (isEditing && finalData.password === '') {
            delete finalData.password;
        }

        // Require password only if adding
        if (!isEditing && !finalData.password) {
             alert("Password is required for a new user.");
             return;
        }

        // Ensure ID is present for new users
        if (!isEditing && (!finalData.id || finalData.id.trim() === '')) {
             alert("New Users must have a unique ID.");
             return;
        }

        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-3xl w-full max-w-lg transform transition-all scale-100 border-t-4 border-indigo-600">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-3">
                    {isEditing ? `Edit User: ${entity.id}` : 'Add New User'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="id">User ID (e.g., T1, admin, S5)</label>
                        <input
                            type="text"
                            name="id"
                            value={formData.id || ''}
                            onChange={handleChange}
                            readOnly={isEditing}
                            className={`shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${isEditing ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300'}`}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">Full Name/Description</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">{isEditing ? 'New Password (Leave blank to keep old)' : 'Password'}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={!isEditing} // Required only for new users
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="role">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            required
                        >
                            <option value="Admin">Admin</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Viewer">Student</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 rounded-full transition-colors shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full transition-colors shadow-lg"
                        >
                            {isEditing ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;