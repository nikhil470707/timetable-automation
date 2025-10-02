import React from 'react';
import DataManager from './DataManager';
import GroupFormModal from './GroupFormModal';

const GroupManagement = () => {
    // Define columns for DataManager
    const groupColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
    ];

    return (
        <DataManager
            apiUrl="/api/groups"
            entityName="Group" // Singular name for display
            columns={groupColumns}
            FormModal={GroupFormModal}
        />
    );
};

export default GroupManagement;
