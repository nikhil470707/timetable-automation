import React from 'react';
import DataManager from './DataManager';
import SlotFormModal from './SlotFormModal';

const SlotManagement = () => {
    // Define columns as objects with key (data field name) and label (display name)
    const slotColumns = [
        { key: 'id', label: 'ID' },
        { key: 'day', label: 'Day' },
        { key: 'period', label: 'Period' },
    ];

    return (
        <DataManager
            apiUrl="/api/slots"
            entityName="Slot" // Singular name for display
            columns={slotColumns}
            FormModal={SlotFormModal}
        />
    );
};

export default SlotManagement;