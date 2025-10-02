import React from 'react';
import DataManager from './DataManager';
import UserFormModal from './UserFormModal';

const UserManagement = () => {
    const userColumns = [
        { key: 'id', label: 'ID' },
        { key: 'username', label: 'Name' },
        { key: 'role', label: 'Role' },

    ];

    return (
        <DataManager
            apiUrl="/api/users"
            entityName="User" 
            columns={userColumns}
            FormModal={UserFormModal}
        />
    );
};

export default UserManagement;