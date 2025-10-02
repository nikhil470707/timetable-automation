import React, { useState, useEffect, useCallback, useMemo } from 'react';

// to convert array fields to strings for display (used for Teachers)
const formatDisplay = (value) => {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value;
};

const DataManager = ({ apiUrl, entityName, columns, FormModal }) => {
    const [entities, setEntities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentEntity, setCurrentEntity] = useState(null); 

    const fetchEntities = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Server responded with an error status.' }));
                throw new Error(errorData.message || `Failed to fetch ${entityName} data.`);
            }
            const data = await response.json();
            setEntities(data);
        } catch (err) {
            console.error(`Error fetching ${entityName} data:`, err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, entityName]);

    useEffect(() => {
        fetchEntities();
    }, [fetchEntities]);

    //  CRUD Handlers 
    
    const handleDelete = async (entityId) => {
        if (!window.confirm(`Are you sure you want to delete ${entityName} ID: ${entityId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${entityId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete ${entityName}.`);
            }

            setEntities(prev => prev.filter(e => e.id !== entityId));
            console.log(`${entityName} ${entityId} deleted successfully.`); 

        } catch (err) {
            setError(err.message);
            alert(`Delete Error: ${err.message}`);
        }
    };
    
    const handleSave = async (entityData) => {
        const isEditing = !!currentEntity; 
        let method = isEditing ? 'PUT' : 'POST';
        let url = isEditing ? `${apiUrl}/${entityData.id}` : apiUrl;

        try {
            if (entityData._id) delete entityData._id;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entityData),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} ${entityName}.`);
            }

            await fetchEntities();
            setShowModal(false);

        } catch (err) {
            setError(err.message);
            alert(`Save Error: ${err.message}`);
        }
    };

    //  Modal Control 
    
    const openAddModal = () => {
        setCurrentEntity(null); 
        setShowModal(true);
    };

    const openEditModal = (entity) => {
        setCurrentEntity(entity);
        setShowModal(true);
    };

    //  Render Logic 
    const allColumns = useMemo(() => {
        if (columns) return [...columns, { key: 'actions', label: 'Actions' }];
        return [{ key: 'id', label: 'ID' }, { key: 'actions', label: 'Actions' }]; 
    }, [columns]);


    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading {entityName} data...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-600 font-semibold">Error loading data: {error}</div>;
    }
    
    // Empty data state 
    if (entities.length === 0) {
        return (
             <div className="p-6 bg-white shadow-2xl rounded-xl">
                <header className="flex justify-between items-center mb-6 border-b-2 pb-4 border-indigo-100">
                    <h2 className="text-3xl font-extrabold text-gray-800">{entityName} Management</h2>
                    <button 
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span>{`Add New ${entityName}`}</span>
                    </button>
                </header>
                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                   <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0a2 2 0 012-2h6a2 2 0 012 2m-6 0v2"></path></svg>
                   <p className="font-semibold text-lg">No {entityName} data found.</p>
                   <p>Click "Add New {entityName}" to create the first record.</p>
                </div>
                {showModal && (
                    <FormModal 
                        entity={currentEntity} 
                        onClose={() => setShowModal(false)}
                        onSave={handleSave} 
                    />
                )}
            </div>
        );
    }


    return (
        <div className="p-6 bg-white shadow-2xl rounded-xl border border-gray-100">
            <header className="flex justify-between items-center mb-6 border-b-2 pb-4 border-indigo-100">
                <h2 className="text-3xl font-extrabold text-gray-800">{entityName} Management</h2>
                <button 
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>{`Add New ${entityName}`}</span>
                </button>
            </header>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-600"> 
                        <tr>
                            {allColumns.map(col => (
                                <th 
                                    key={col.key}
                                    className={`px-6 py-4 text-xs font-extrabold text-white uppercase tracking-wider ${col.key === 'actions' ? 'text-center' : 'text-left'}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {entities.map((entity, index) => (
                            <tr key={entity.id || entity._id} className={index % 2 === 0 ? 'bg-white hover:bg-indigo-50 transition-colors duration-100' : 'bg-gray-50 hover:bg-indigo-50 transition-colors duration-100'}>
                                {columns.map(col => (
                                    <td 
                                        key={col.key}
                                        className="px-6 py-4 whitespace-normal text-sm text-gray-800"
                                    >
                                        <span className='font-medium'>{formatDisplay(entity[col.key])}</span>
                                    </td>
                                ))}
                                {/*  */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"> 
                                    <button 
                                        onClick={() => openEditModal(entity)}
                                        className="text-indigo-600 hover:text-indigo-800 mr-4 font-bold transition-colors p-1 rounded-md hover:bg-indigo-100"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(entity.id)}
                                        className="text-red-600 hover:text-red-800 font-bold transition-colors p-1 rounded-md hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <FormModal 
                    entity={currentEntity} 
                    onClose={() => setShowModal(false)}
                    onSave={handleSave} 
                />
            )}
        </div>
    );
};

export default DataManager;