import React from 'react';
import DataManager from './DataManager';
import CourseFormModal from './CourseFormModal';

const CourseManagement = () => {
    // Define columns as objects with key and label
    const courseColumns = [
        { key: 'id', label: 'ID' },
        { key: 'course', label: 'Course Name' },
        { key: 'hours', label: 'Hours' },
        { key: 'group', label: 'Group ID' },
        { key: 'size', label: 'Size' },
    ];

    return (
        <DataManager
            apiUrl="/api/courses"
            entityName="Course" // Singular name
            columns={courseColumns}
            FormModal={CourseFormModal}
        />
    );
};

export default CourseManagement;