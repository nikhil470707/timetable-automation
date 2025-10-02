import React, { useState, useEffect } from 'react';

const SlotFormModal = ({ entity, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        id: entity ? entity.id : undefined,
        day: entity ? entity.day : '',
        period: entity ? entity.period : '',
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
            period: parseInt(formData.period, 10),
        };
        
        if (!isEditing && (!finalData.id || finalData.id.trim() === '')) {
             alert("New Slots must have a unique ID.");
             return;
        }

        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* --- */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                <h3 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-3">
                    {isEditing ? `Edit Slot: ${entity.id}` : 'Add New Slot'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="id">Slot ID (e.g., S1)</label>
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
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="day">Day (e.g., Mon)</label>
                            <input
                                type="text"
                                name="day"
                                value={formData.day}
                                onChange={handleChange}
                                className="shadow-sm border rounded-lg w-full py-2 px-3 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="period">Period (e.g., 1-6)</label>
                            <input
                                type="number"
                                name="period"
                                value={formData.period}
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
                            {isEditing ? 'Update Slot' : 'Add Slot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SlotFormModal;
