import React, { useState, useEffect } from 'react';

const CourseFormModal = ({ entity, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        id: entity ? entity.id : undefined,
        course: entity ? entity.course : '',
        hours: entity ? entity.hours : '',
        group: entity ? entity.group : '', // Will be selected from dropdown
        size: entity ? entity.size : '',
    });
    // to store available groups for the dropdown
    const [availableGroups, setAvailableGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

    const isEditing = !!entity;

    useEffect(() => {
        // Fetch groups for dropdown
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/groups');
                if (!response.ok) throw new Error('Failed to fetch groups for dropdown.');
                const data = await response.json();
                setAvailableGroups(data);
            } catch (error) {
                console.error('Group fetch error:', error);
            } finally {
                setIsLoadingGroups(false);
            }
        };

        fetchGroups();

        // Lock background scrolling
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
        
        const finalData = {
            ...formData,
            hours: parseInt(formData.hours, 10),
            size: parseInt(formData.size, 10),
        };
        
        // Client-side validation: Check for new ID presence
        if (!isEditing && (!finalData.id || finalData.id.trim() === '')) {
             alert("New Courses must have a unique ID.");
             return;
        }

        onSave(finalData);
    };

    const renderGroupDropdown = () => {
        if (isLoadingGroups) {
            return <p className="text-gray-500 text-sm italic">Loading groups...</p>;
        }
        if (availableGroups.length === 0) {
            return <p className="text-red-500 text-sm italic">No groups available. Please create one in Group Management.</p>;
        }

        return (
            <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            >
                <option value="" disabled>Select a Group</option>
                {availableGroups.map(group => (
                    <option key={group.id} value={group.id}>
                        {group.id} ({group.name})
                    </option>
                ))}
            </select>
        );
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-3">
                    {isEditing ? `Edit Course: ${entity.id}` : 'Add New Course'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="id">Course ID (e.g., C16)</label>
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
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="course">Course Name</label>
                            <input
                                type="text"
                                name="course"
                                value={formData.course}
                                onChange={handleChange}
                                className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="hours">Hours/Week</label>
                            <input
                                type="number"
                                name="hours"
                                value={formData.hours}
                                onChange={handleChange}
                                className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                                min="1"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="group">Group</label>
                            {renderGroupDropdown()}
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="size">Student Size</label>
                            <input
                                type="number"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                                min="1"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4">
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
                            {isEditing ? 'Update Course' : 'Add Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseFormModal;