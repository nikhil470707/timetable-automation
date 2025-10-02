import React, { useState, useEffect } from 'react';

const TeacherFormModal = ({ entity, onClose, onSave }) => {
    // to convert array to comma-separated string for input display
    const formatArray = (arr) => Array.isArray(arr) ? arr.join(', ') : '';

    const [formData, setFormData] = useState({
        id: entity ? entity.id : undefined,
        name: entity ? entity.name : '',
        qualified_courses: entity ? formatArray(entity.qualified_courses) : '',
        available_days: entity ? formatArray(entity.available_days) : '',
        preferred_periods: entity ? formatArray(entity.preferred_periods) : '',
        
        // User Credentials fields
        user_password: '', // Separate field for password
        user_role: 'Teacher', // FIXED ROLE
        user_name: entity ? entity.name : '', // Pre-fill username for User table
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
        
        const toArray = (str) => str.split(',').map(s => s.trim()).filter(s => s);
        const toNumberArray = (str) => toArray(str).map(Number).filter(n => !isNaN(n));

        const finalData = {
            ...formData,
            qualified_courses: toArray(formData.qualified_courses),
            available_days: toArray(formData.available_days),
            preferred_periods: toNumberArray(formData.preferred_periods),
        };
        
        // Validation check for new IDs
        if (!isEditing && (!finalData.id || finalData.id.trim() === '')) {
             alert("New Teachers must have a unique ID.");
             return;
        }
        
        // Validation check for new user credentials
        if (!isEditing && (!finalData.user_password || finalData.user_password.trim() === '')) {
             alert("Password is required for the new user account.");
             return;
        }

        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* --- */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all scale-100">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-3">
                    {isEditing ? `Edit Teacher: ${entity.id}` : 'Add New Teacher'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-x-8">
                        
                        {/* LEFT COLUMN: Teacher Details */}
                        <div>
                            <h4 className="text-xl font-extrabold mb-4 text-indigo-800 border-b pb-1">Scheduling Profile</h4>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="id">Teacher ID (e.g., T10)</label>
                                <input
                                    type="text"
                                    name="id"
                                    value={formData.id || ''}
                                    onChange={handleChange}
                                    readOnly={isEditing}
                                    className={`shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="qualified_courses">Qualified Courses (Comma-separated IDs)</label>
                                <input
                                    type="text"
                                    name="qualified_courses"
                                    value={formData.qualified_courses}
                                    onChange={handleChange}
                                    className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Math101, CS101"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="available_days">Available Days</label>
                                    <input
                                        type="text"
                                        name="available_days"
                                        value={formData.available_days}
                                        onChange={handleChange}
                                        className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., Mon, Tue, Fri"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="preferred_periods">Preferred Periods</label>
                                    <input
                                        type="text"
                                        name="preferred_periods"
                                        value={formData.preferred_periods}
                                        onChange={handleChange}
                                        className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., 1, 2"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* RIGHT COLUMN: User Credentials */}
                        <div>
                            <h4 className="text-xl font-extrabold mb-4 text-indigo-800 border-b pb-1">User Account Setup</h4>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="user_name">Account Name (for User Table)</label>
                                <input
                                    type="text"
                                    name="user_name"
                                    value={formData.user_name}
                                    onChange={handleChange}
                                    className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Used for user management table name"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="user_password">
                                    {isEditing ? 'New Password (Leave blank to keep old)' : 'Initial Password'}
                                </label>
                                <input
                                    type="password"
                                    name="user_password"
                                    value={formData.user_password}
                                    onChange={handleChange}
                                    className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required={!isEditing}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="user_role">Role (Fixed)</label>
                                <input
                                    type="text"
                                    name="user_role"
                                    value="Teacher"
                                    readOnly
                                    className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-600 bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* BUTTONS */}
                    <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
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
                            {isEditing ? 'Update Teacher & User' : 'Add Teacher & User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherFormModal;