import React from 'react';
import DataManager from './DataManager';
import TeacherFormModal from './TeacherFormModal'; 

const TeacherManagement = () => {
    // Define columns for DataManager
    const teacherColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'qualified_courses', label: 'Qualified Courses' },
        { key: 'available_days', label: 'Available Days' },
        { key: 'preferred_periods', label: 'Preferred Periods' },
    ];

    return (
        <DataManager
            apiUrl="/api/teachers" 
            entityName="Teacher"
            columns={teacherColumns}
            FormModal={TeacherFormModal} 
        />
    );
};

export default TeacherManagement;