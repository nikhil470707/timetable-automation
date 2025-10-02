import React from 'react';
import DataManager from './DataManager';
import RoomFormModal from './RoomFormModal';

const RoomManagement = () => {
    // Define columns as objects with key (data field name) and label (display name)
    const roomColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'capacity', label: 'Capacity' },
    ];

    return (
        <DataManager
            apiUrl="/api/rooms"
            entityName="Room" // Singular name for display
            columns={roomColumns}
            FormModal={RoomFormModal}
        />
    );
};

export default RoomManagement;