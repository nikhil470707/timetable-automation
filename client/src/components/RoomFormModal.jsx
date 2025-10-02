import React, { useState, useEffect } from 'react';

const RoomFormModal = ({ entity, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        id: entity ? entity.id : undefined, 
        name: entity ? entity.name : '',
        capacity: entity ? entity.capacity : '',
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
        
        const finalData = {
            ...formData,
            capacity: parseInt(formData.capacity, 10),
        };

        if (!isEditing && (!finalData.id || finalData.id.trim() === '')) {
             alert("New Rooms must have a unique ID.");
             return;
        }

        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* --- */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-3">
                    {isEditing ? `Edit Room: ${entity.id}` : 'Add New Room'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="id">Room ID (e.g., R10)</label>
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
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="capacity">Capacity</label>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            min="1"
                        />
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
                            {isEditing ? 'Update Room' : 'Add Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomFormModal;
