import React, { useState, useEffect, useCallback } from 'react';
import TeacherManagement from './components/TeacherManagement';
import RoomManagement from './components/RoomManagement';
import CourseManagement from './components/CourseManagement';
import SlotManagement from './components/SlotManagement'; 
import GroupManagement from './components/GroupManagement'; 
import SolutionHistory from './components/SolutionHistory'; 
import Login from './components/Login'; 
import UserManagement from './components/UserManagement';
import html2pdf from 'html2pdf.js'; 

// Days and Periods for display structure
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const periods = Array.from({ length: 6 }, (_, i) => i + 1);

const API_BASE_URL = '/api/timetable'; 
const API_GENERATE = `${API_BASE_URL}/generate`;
const API_SAVE = `${API_BASE_URL}/save`;
const API_LOAD_LAST = `${API_BASE_URL}/load-last`; 
const API_LOAD_LOCKED = `${API_BASE_URL}/load-locked`; 
const API_LOAD_SPECIFIC = `${API_BASE_URL}/load`; 

const API_TEACHERS = '/api/teachers';
const API_ROOMS = '/api/rooms';
const API_COURSES = '/api/courses';
const API_GROUPS = '/api/groups'; 
const API_USERS = '/api/users'; 


const getDayAndPeriodFromSlot = (slotId) => {
    const slotIdNumber = parseInt(slotId.replace('S', ''), 10);
    const dayIndex = Math.floor((slotIdNumber - 1) / 6);
    const period = ((slotIdNumber - 1) % 6) + 1;
    const day = days[dayIndex];
    return { day, period };
};

const formatTimetable = (rawTimetable) => {
    if (!Array.isArray(rawTimetable)) {
        console.error("Invalid timetable data received:", rawTimetable);
        return { groups: [], schedule: {}, rawData: [] };
    }

    const schedule = {};
    const groupSet = new Set();

    rawTimetable.forEach(item => {
        const { group, slot, course_name, teacher, room } = item;
        
        const { day, period } = getDayAndPeriodFromSlot(slot);
        const key = `${day}-P${period}`;

        if (!schedule[group]) {
            schedule[group] = {};
        }
        
        schedule[group][key] = {
            course: course_name,
            teacher: teacher,
            room: room,
        };
        groupSet.add(group);
    });

    const sortedGroups = Array.from(groupSet).sort();

    return { groups: sortedGroups, schedule, rawData: rawTimetable };
};

const downloadTimetableAsCSV = (groups, schedule) => {
    if (!Array.isArray(groups) || groups.length === 0) {
        console.error("Cannot download CSV: Timetable data is empty.");
        return;
    }
    
    let csvContent = "Group,Day,Period,Course,Teacher,Room\n";

    groups.forEach(group => {
        days.forEach(day => {
            periods.forEach(period => {
                const key = `${day}-P${period}`;
                const session = schedule[group] ? schedule[group][key] : null; 
                
                if (session) {
                    csvContent += [
                        group,
                        day,
                        `P${period}`,
                        session.course,
                        session.teacher,
                        session.room
                    ].map(val => `"${val}"`).join(',') + "\n";
                }
            });
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timetable_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const downloadTimetableAsPDF = (filename) => {
    const element = document.getElementById('timetable-output');
    if (!element) return alert("Timetable content not found for PDF export.");

    const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
};


//  Timetable Display Components 

const TimetableCell = ({ session, courseMap, roomMap, teacherMap, isTeacherView }) => {
    const course = courseMap.get(session.course);
    const teacher = teacherMap.get(session.teacher);
    const room = roomMap.get(session.room);
    
    const teacherName = teacher ? teacher.name : session.teacher;
    const roomName = room ? room.name : session.room;
    const studentSize = course ? course.size : 'N/A';

    return (
        <div className="p-2 text-xs h-full flex flex-col justify-center items-center bg-white border-2 border-indigo-100 shadow-sm rounded-md transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50">
            <p className="font-bold text-indigo-800 leading-snug">{session.course}</p> 
            
            {/* Teacher View: Show Room Name, Student Size, and Group */}
            {isTeacherView && (
                <>
                    <p className="text-gray-700 text-[10px] mt-1 font-medium truncate max-w-full">Group: <span className="font-bold">{session.group}</span></p>
                    <p className="text-gray-700 text-[10px] font-medium truncate max-w-full">Room: <span className="font-bold">{roomName} ({session.room})</span></p>
                    <p className="text-gray-500 text-[9px] mt-0.5">Size: {studentSize}</p>
                </>
            )}

            {/* Student/Viewer/Admin Mode: Show Teacher Name and Room Name */}
            {!isTeacherView && (
                <p className="text-gray-700 text-[10px] mt-1 font-medium text-center">
                    <span className="font-semibold">{teacherName}</span> / <span className="font-semibold">{roomName}</span>
                </p>
            )}
        </div>
    );
};

const TimetableGrid = ({ group, schedule, courseMap, roomMap, teacherMap, isTeacherView, groupMap }) => {
    const periodsLength = periods.length; 
    
    if (!schedule || !schedule[group]) return null;

    return (
        <div className="mt-12 mb-12 p-6 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-800 border-l-4 border-indigo-600 pl-4 pb-1">
                {/* --- */}
                {teacherMap.get(group)?.name ? `Timetable for ${teacherMap.get(group).name}` : `Timetable for Group ${groupMap?.get(group)?.name || group}`}
            </h2>
            
            {/* --- */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 border-collapse">
                    <thead className="bg-indigo-700">
                        <tr>
                            {/* HEADER ROW (Periods) */}
                            <th className="p-3 text-left text-sm font-bold text-white border-r border-indigo-600 sticky left-0 z-10 bg-indigo-700 rounded-tl-xl w-[100px]">Day / Period</th>
                            
                            {periods.map(period => (
                                <th key={period} className="p-3 text-center text-sm font-bold text-white border-l border-indigo-600">
                                    P{period}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {/* DAY ROWS (Days + Cells) */}
                        {days.map(day => (
                            <tr key={day} className="border-t border-gray-200">
                                {/* Day Column */}
                                <td className="p-3 bg-gray-100 font-bold text-gray-800 text-center border-r border-gray-300 sticky left-0 z-0 rounded-bl-xl w-[100px]">
                                    {day}
                                </td>
                                
                                {periods.map(period => {
                                    const key = `${day}-P${period}`;
                                    const session = schedule[group][key];
                                    
                                    return (
                                        <td key={key} className="p-1.5 h-28 border border-gray-100 align-top">
                                            {session ? (
                                                <TimetableCell 
                                                    session={{...session, group: session.group}} 
                                                    courseMap={courseMap} 
                                                    roomMap={roomMap} 
                                                    teacherMap={teacherMap}
                                                    isTeacherView={isTeacherView}
                                                />
                                            ) : (
                                                <div className="p-2 text-xs h-full bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-dashed border-gray-200">
                                                    
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


//  Main Application Component 

const App = () => {
    const [timetable, setTimetable] = useState({ groups: [], schedule: {}, rawData: [] });
    const [status, setStatus] = useState('ready');
    const [errorMessage, setErrorMessage] = useState('');
    const [currentView, setCurrentView] = useState('generator'); 
    const [saveStatus, setSaveStatus] = useState({ state: 'ready', message: '' });
    const [isTimetableLocked, setIsTimetableLocked] = useState(false); 
    
    // AUTHENTICATION STATE
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null); 
    const [userId, setUserId] = useState(null); 
    
    const [masterDataError, setMasterDataError] = useState(null); 

    
    const [masterData, setMasterData] = useState({
        teachers: [], rooms: [], courses: [], groups: [], users: [] 
    });
    const [viewFilter, setViewFilter] = useState({ 
        type: 'group', 
        id: '' 
    });
    

    const teacherMap = new Map(masterData.teachers.map(t => [t.id, t]));
    const roomMap = new Map(masterData.rooms.map(r => [r.id, r]));
    const courseMap = new Map(masterData.courses.map(c => [c.course, c])); // Map by course name
    const groupMap = new Map(masterData.groups.map(g => [g.id, g])); // Map by group ID

    const [isMasterDataLoading, setIsMasterDataLoading] = useState(true); 

    //  Data Pre-fetching 
    useEffect(() => {
        const fetchMasterData = async () => {
            setMasterDataError(null);
            setIsMasterDataLoading(true);
            try {
                const endpoints = [API_TEACHERS, API_ROOMS, API_COURSES, API_GROUPS, API_USERS]; 
                const responses = await Promise.all(endpoints.map(url => fetch(url)));
                
                const failedResponse = responses.find(res => !res.ok);
                if (failedResponse) {
                    const errorDetail = await failedResponse.json().catch(() => ({ message: 'Server did not return JSON.' }));
                    throw new Error(`Failed to load ${failedResponse.url.split('/').pop()} data. Status: ${failedResponse.status}. Details: ${errorDetail.message || 'Check server console.'}`);
                }
                
                const [teachersData, roomsData, coursesData, groupsData, usersData] = await Promise.all(responses.map(res => res.json()));

                setMasterData({
                    teachers: teachersData,
                    rooms: roomsData,
                    courses: coursesData,
                    groups: groupsData,
                    users: usersData, 
                });
                
                // Initialize view filter to the first group ID found
                const initialGroup = groupsData.length > 0 ? groupsData[0].id : '';
                if (initialGroup) {
                     setViewFilter({ type: 'group', id: initialGroup });
                }

            } catch (error) {
                console.error("Master data load error:", error);
                setMasterDataError(error.message);
            } finally {
                setIsMasterDataLoading(false);
            }
        };

        fetchMasterData();
        
    }, []);

    //  EFFECT: Load timetable AFTER successful login 
    useEffect(() => {
        if (isLoggedIn && !isMasterDataLoading && !masterDataError) {
             // 1. Set Initial Filter based on master data
            if (userRole === 'Teacher' && teacherMap.has(userId)) {
                setViewFilter({ type: 'teacher', id: userId });
            } else {
                const defaultGroupId = masterData.groups.length > 0 ? masterData.groups[0].id : '';
                setViewFilter({ type: 'group', id: defaultGroupId });
            }
             // 2. Load the data
            // Use correct load function based on role
            if (userRole === 'Viewer' || userRole === 'Teacher') {
                loadLastLockedTimetable();
            } else {
                loadLastAdminTimetable();
            }
            setCurrentView('generator');
        }
    }, [isLoggedIn, isMasterDataLoading, masterData.groups.length, userRole]);


    //  AUTHENTICATION HANDLERS 
    const handleLogin = (role, id) => {
        setIsLoggedIn(true);
        setUserRole(role);
        setUserId(id);
        
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserId(null);
        setCurrentView('generator');
        setTimetable({ groups: [], schedule: {}, rawData: [] });
    };

    //  FETCH/LOAD LOGIC 

    const loadLastAdminTimetable = useCallback(async () => {
        const url = API_LOAD_LAST;
        
        if (status !== 'solved') setStatus('loading');
        setErrorMessage('');
        setIsTimetableLocked(false);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Server error during load.');
            }
            
            const data = await response.json();

            if (!data.timetable) {
                 setErrorMessage("Timetable data is missing from server response.");
                 setStatus('error');
                 return;
            }

            setTimetable(formatTimetable(data.timetable));
            setStatus('solved');
            setIsTimetableLocked(!!data.isLocked); 
            
            // Re-apply filter after loading data
            if (userRole === 'Teacher' && teacherMap.has(userId)) {
                 setViewFilter({ type: 'teacher', id: userId });
            }

        } catch (error) {
            console.error('API Load Error:', error);
            setErrorMessage(error.message);
            setStatus('error');
        }
    }, [userId, userRole, teacherMap, status]);

    const loadLastLockedTimetable = useCallback(async () => {
        const url = API_LOAD_LOCKED;
        
        if (status !== 'solved') setStatus('loading');
        setErrorMessage('');
        setIsTimetableLocked(false);

        try {
            const response = await fetch(url);
            
            if (response.status === 404) {
                setErrorMessage("Final timetable not yet published.");
                setStatus('error'); 
                return;
            }
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Server error during load.');
            }
            
            const data = await response.json();

            setTimetable(formatTimetable(data.timetable));
            setStatus('solved');
            setIsTimetableLocked(!!data.isLocked); 
            
            // Re-apply filter after loading data
            if (userRole === 'Teacher' && teacherMap.has(userId)) {
                 setViewFilter({ type: 'teacher', id: userId });
            }

        } catch (error) {
            console.error('API Load Error:', error);
            setErrorMessage(error.message);
            setStatus('error');
        }
    }, [userId, userRole, teacherMap, status]); 


    const executeFetch = useCallback(async (url, method = 'POST', body = null, isLoad = false) => {
        setStatus(isLoad ? 'loading' : 'generating');
        setErrorMessage('');
        setIsTimetableLocked(false); 

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : null,
            });
            
            const data = await response.json();

            if (!response.ok) {
                const details = data.details || 'Unknown server error.';
                throw new Error(`${isLoad ? 'Loading' : 'Generation'} failed: ${data.message || 'Server error'}. Details: ${details}`);
            }
            
            if (!data.timetable) {
                 throw new Error("Timetable data is missing from server response.");
            }

            setTimetable(formatTimetable(data.timetable));
            setStatus('solved');
            setIsTimetableLocked(!!data.isLocked); 
            
            if (userRole === 'Teacher' && teacherMap.has(userId)) {
                 setViewFilter({ type: 'teacher', id: userId });
            }
            return true; 

        } catch (error) {
            console.error('API Error:', error);
            let msg = error.message.includes('Failed to fetch') 
                ? "Failed to connect to the backend server (Node.js). Ensure it's running on port 5000."
                : error.message;
            
            setErrorMessage(msg);
            setStatus('error');
            return false; 
        }
    }, [userId, userRole, teacherMap]); 

    const fetchTimetable = () => executeFetch(API_GENERATE, 'POST', null, false);
    
    const loadSpecificTimetable = (solutionId) => {
        executeFetch(`${API_LOAD_SPECIFIC}/${solutionId}`, 'GET', null, true);
    };
 

    const handleSave = async () => { 
        if (timetable.rawData.length === 0) {
            setSaveStatus({ state: 'error', message: 'No valid timetable to save.' });
            return;
        }

        setSaveStatus({ state: 'saving', message: 'Saving...' });

        try {
            const response = await fetch(API_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    timetable: timetable.rawData, 
                    isLocked: isTimetableLocked 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                 throw new Error(data.message || 'Failed to save timetable.');
            }

            const time = new Date(data.timestamp).toLocaleTimeString();
            setSaveStatus({ 
                state: 'success', 
                message: `Saved successfully at ${time}.` 
            });

        } catch (error) {
            setSaveStatus({ state: 'error', message: `Save Error: ${error.message}` });
            console.error('Save Error:', error);
        }
    };

    const handleDownload = () => {
        if (timetable.groups.length > 0) {
            downloadTimetableAsCSV(timetable.groups, timetable.schedule);
        }
    };
    
    //  Timetable Filtering and Mapping 

    const getFilteredTimetable = () => {
        if (status !== 'solved') return { groups: [], schedule: {} };

        // Determine filter ID based on current role/view
        const currentFilterId = userRole === 'Teacher' ? userId : viewFilter.id;
        const currentFilterType = userRole === 'Teacher' ? 'teacher' : viewFilter.type;
        
        // check: if the current filter ID is empty, return empty structure.
        if (!currentFilterId) return { groups: [], schedule: {} };


        if (currentFilterType === 'group') {
            const filteredSessions = timetable.rawData.filter(session => session.group === currentFilterId);
            return formatTimetable(filteredSessions);

        } else if (currentFilterType === 'teacher') {
            const filteredSessions = timetable.rawData.filter(session => 
                session.teacher === currentFilterId
            );
            
            const teacherSchedule = {};
            filteredSessions.forEach(item => {
                const { group, slot, course_name, teacher, room } = item;
                const { day, period } = getDayAndPeriodFromSlot(slot);
                const key = `${day}-P${period}`;
                
                if (!teacherSchedule[currentFilterId]) {
                    teacherSchedule[currentFilterId] = {};
                }
                
                teacherSchedule[currentFilterId][key] = {
                    course: course_name,
                    teacher: teacher,
                    room: room,
                    group: group 
                };
            });

            return {
                groups: [currentFilterId],
                schedule: teacherSchedule,
                rawData: filteredSessions,
            };
        }
        
        return timetable; 
    };
    
    const displayedTimetable = getFilteredTimetable();
    const availableGroupIds = masterData.groups.map(g => g.id);
    const availableTeachers = masterData.teachers;


    // Renders the main content based on the selected view
    const renderContent = () => {
        // PRIORITY CHECK: Are we ready to proceed past initialization?
        if (isMasterDataLoading) {
             return <div className="text-center py-40 text-indigo-600 font-semibold">Loading initial configuration...</div>;
        }
        
        // SECONDARY PRIORITY CHECK: Did master data fail?
        if (masterDataError) {
             return (
                <div className="p-10 text-center text-red-600 bg-white rounded-lg max-w-xl mx-auto shadow-xl mt-10">
                    <h2 className="text-2xl font-bold mb-3">Critical Data Error</h2>
                    <p className="text-gray-700">Cannot initialize application. Please ensure the Node.js server is running and the database connection is healthy.</p>
                    <p className="mt-4 font-mono text-xs p-2 bg-red-50 border border-red-300 rounded">{masterDataError}</p>
                </div>
            );
        }

        // THIRD PRIORITY CHECK: Is the user logged in?
        if (!isLoggedIn) {
            return <Login onLogin={handleLogin} />;
        }
        
        //  LOGGED IN RENDERING 
        const isAdmin = userRole === 'Admin';
        const isTeacher = userRole === 'Teacher';
        const isViewer = userRole === 'Viewer';
        
        //  Access Control Handler for Admin Pages 
        const renderAdminView = (Component) => {
            if (!isAdmin) {
                return (
                    <div className="p-10 text-center text-red-600 bg-red-50 rounded-lg max-w-lg mx-auto shadow-lg">
                        Access Denied: You must be an administrator to view this page.
                    </div>
                );
            }
            return <Component masterData={masterData} />;
        };

        //  Main Content Switch 
        switch (currentView) {
            case 'generator':
                // Determine if Timetable area should show a generic error (for Viewer/Teacher when no locked solution exists)
                const showNoPublishedTimetable = (isViewer || isTeacher) && status === 'error' && errorMessage.includes('Final timetable not yet published');

                return (
                    <div className="p-4 md:p-10 max-w-7xl mx-auto">
                        <header className="text-center mb-12 bg-white p-8 rounded-xl shadow-lg border-t-4 border-indigo-500">
                            <h1 className="text-5xl font-extrabold text-gray-900 mb-3">
                                Timetable Scheduler
                            </h1>
                            <p className="text-xl text-gray-600">
                                Logged in as: <span className='font-bold text-indigo-700'>{userRole}</span> (<span className='font-mono text-sm text-gray-500'>{userId}</span>) 
                            </p>
                            
                            {/* Logout button */}
                            <div className="mt-4">
                                <button 
                                    onClick={handleLogout}
                                    className="text-sm px-6 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-md"
                                >
                                    <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-10a3 3 0 013-3h5a3 3 0 013 3v1"></path></svg>
                                    Logout
                                </button>
                            </div>
                            
                        </header>

                        <div className="flex flex-wrap justify-center mb-10 gap-4 p-4 bg-gray-100 rounded-xl shadow-inner">
                            {/* GENERATE Button (Admin only) */}
                            {isAdmin && (
                                <button
                                    onClick={fetchTimetable}
                                    disabled={status === 'generating' || isTimetableLocked} 
                                    className={`px-6 py-3 rounded-xl text-white font-bold transition duration-300 shadow-lg flex items-center space-x-2 ${
                                        status === 'generating'
                                            ? 'bg-green-500/70 animate-pulse cursor-not-allowed'
                                            : isTimetableLocked
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 11-4 0 2 2 0 014 0zM17 4a2 2 0 11-4 0 2 2 0 014 0zM12 14c1.84 0 3.32-.4 4.02-1.01s1.37-1.46 1.94-2.82c.57-1.36.93-3.13.93-5.26M12 14c-1.84 0-3.32-.4-4.02-1.01S6.61 11.54 6.04 10.18c-.57-1.36-.93-3.13-.93-5.26M12 14v8m-4-4h8"></path></svg>
                                    <span>{status === 'generating' ? 'Solving Optimization...' : (isTimetableLocked ? 'Timetable Locked' : 'Generate Timetable')}</span>
                                </button>
                            )}
                            
                            {/* LOAD LAST Button (Admin only) */}
                            {isAdmin && (
                                <button
                                    onClick={loadLastAdminTimetable} 
                                    disabled={status === 'loading' || status === 'generating'}
                                    className={`px-6 py-3 rounded-xl font-bold transition duration-300 shadow-lg flex items-center space-x-2 ${
                                        status === 'loading' || status === 'generating'
                                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                            : 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.836 2l1.59-1.59M14 10l-2 2m0 0l-2-2m2 2v10m-2-2h4M9 11l-2-2m0 0l-2 2m2-2V4m-2 5h4m-2 5h4m-2 5h4m-2-5v-4"></path></svg>
                                    <span>Load Last Draft</span>
                                </button>
                            )}


                            {/* 3. SAVE Button (Admin only) */}
                             {isAdmin && status === 'solved' && timetable.groups.length > 0 && (
                                <button
                                    onClick={handleSave}
                                    disabled={saveStatus.state === 'saving'}
                                    className={`px-6 py-3 rounded-xl font-bold transition duration-300 shadow-lg flex items-center space-x-2 ${
                                        saveStatus.state === 'saving'
                                            ? 'bg-indigo-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h3m0-2h8m-4-4v4m4-8h3a2 2 0 012 2v6a2 2 0 01-2 2h-3"></path></svg>
                                    <span>{saveStatus.state === 'saving' ? 'Saving...' : 'Save Solution'}</span>
                                </button>
                            )}

                            {/* DOWNLOAD Button (All users) */}
                             {status === 'solved' && timetable.groups.length > 0 && (
                                <button
                                    onClick={() => downloadTimetableAsPDF(`timetable_export_${new Date().toISOString().slice(0, 10)}.pdf`)}
                                    className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold transition duration-300 shadow-lg hover:bg-red-700 flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span>Export PDF</span>
                                </button>
                            )}
                            
                            {status === 'solved' && timetable.groups.length > 0 && (
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold transition duration-300 shadow-lg hover:bg-blue-700 flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span>Export CSV</span>
                                </button>
                            )}
                        </div>

                        {/* Lock Status Indicator */}
                        {isTimetableLocked && (
                            <div className="text-center py-3 mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg max-w-xl mx-auto font-semibold shadow-md">
                                <span className='text-lg mr-2'></span> This is a LOCKED (Final) Timetable Solution.
                            </div>
                        )}

                        {/* Status/Error Messages */}
                        {saveStatus.message && isAdmin && (
                            <div className={`text-center mb-4 p-2 text-sm font-medium rounded-lg max-w-md mx-auto ${saveStatus.state === 'error' ? 'text-red-700 bg-red-100 border border-red-300' : 'text-green-700 bg-green-100 border border-green-300'}`}>
                                {saveStatus.message}
                            </div>
                        )}


                        {(status === 'generating' || status === 'loading' || status === 'error') ? (
                             <div className="text-center py-16 bg-white border border-indigo-200 rounded-xl shadow-2xl">
                                {/* Check for No Published Timetable error */}
                                {showNoPublishedTimetable ? (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 px-8 py-6 rounded-xl relative mx-auto max-w-4xl shadow-md">
                                        <strong className="font-bold block mb-1 text-xl">Notice: No Published Timetable</strong>
                                        <span className="block">{errorMessage}</span>
                                    </div>
                                ) : status === 'error' ? (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-8 py-6 rounded-xl relative mx-auto max-w-4xl shadow-md">
                                        <strong className="font-bold block mb-1 text-xl">Error Encountered</strong>
                                        <span className="block">{errorMessage}</span>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-indigo-600 font-bold text-xl">{status === 'loading' ? 'Loading last solution...' : 'Solving Optimization Problem...'}</p>
                                        <p className="text-gray-500 mt-2">Please wait...</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            // SOLVED STATE - Timetable View
                            status === 'solved' && displayedTimetable.groups.length > 0 ? (
                                <div className="py-6">
                                    <h2 className="text-3xl font-bold text-green-700 text-center mb-10 border-b-2 border-green-200 pb-2"> Timetable Solution Found!</h2>
                                    
                                    {/* Filtering Controls: Visible only if Admin/Viewer and not in Teacher's fixed view */}
                                    {(isAdmin || isViewer) && !isTeacher && ( 
                                        <div className="flex justify-center space-x-6 mb-8 p-5 bg-white rounded-xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
                                            <label className="text-gray-700 font-semibold flex items-center space-x-3">
                                                <span className="text-indigo-600 font-bold">VIEW:</span>
                                                <select
                                                    value={viewFilter.id}
                                                    onChange={(e) => setViewFilter({ type: 'group', id: e.target.value })}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 w-64 bg-white font-medium"
                                                >
                                                    {availableGroupIds.map(groupId => (
                                                        <option key={groupId} value={groupId}>Group {groupId} - {groupMap.get(groupId)?.name || 'Unnamed'}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}

                                    {/* Render the filtered timetable grid */}
                                    <div id="timetable-output">
                                        {displayedTimetable.groups.map(groupKey => (
                                            <TimetableGrid 
                                                key={groupKey} 
                                                group={groupKey} 
                                                schedule={displayedTimetable.schedule} 
                                                courseMap={courseMap}
                                                roomMap={roomMap}
                                                teacherMap={teacherMap}
                                                isTeacherView={isTeacher} 
                                                groupMap={groupMap}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // NO SOLUTION STATE
                                <div className="text-center py-16 bg-white rounded-xl shadow-xl border border-gray-200">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                    <p className="text-xl text-gray-500 font-medium">No solution currently loaded for this view.</p>
                                    {isAdmin && <p className="text-gray-400 mt-2">Click 'Generate Timetable' or 'Load Last Draft' above.</p>}
                                </div>
                            )
                        )}
                    </div>
                );
            case 'history': 
                return <div className="p-4 md:p-10 max-w-7xl mx-auto">{renderAdminView(() => <SolutionHistory onLoadSolution={loadSpecificTimetable} onSwitchView={setCurrentView} />)}</div>;
            case 'teachers':
            case 'rooms':
            case 'courses':
            case 'slots': 
            case 'groups': 
            case 'users':
                return <div className="p-4 md:p-10 max-w-7xl mx-auto">{renderAdminView(
                    currentView === 'teachers' ? TeacherManagement :
                    currentView === 'rooms' ? RoomManagement :
                    currentView === 'courses' ? CourseManagement :
                    currentView === 'slots' ? SlotManagement :
                    currentView === 'groups' ? GroupManagement :
                    UserManagement
                )}</div>;
            default:
                return null;
        }
    };

    const adminNavItems = [
        { key: 'history', label: 'History' },
        { key: 'users', label: 'Users' },
        { key: 'teachers', label: 'Teachers' },
        { key: 'rooms', label: 'Rooms' },
        { key: 'courses', label: 'Courses' },
        { key: 'groups', label: 'Groups' }, 
        { key: 'slots', label: 'Slots' }, 
    ];

    const navItems = [
        { key: 'generator', label: 'Timetable' },
        ...(userRole === 'Admin' ? adminNavItems : []),
    ];

    return (
        <div className="font-sans min-h-screen bg-gray-50">
            {/*  Navigation Bar  */}
            <nav className="bg-white shadow-lg sticky top-0 z-50 border-b-4 border-indigo-600"> 
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-extrabold text-indigo-700 tracking-wider">SCHEDULER DASHBOARD</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            {navItems.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setCurrentView(item.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                        currentView === item.key ? 'bg-indigo-600 text-white shadow-xl transform scale-105' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
            {/*  Content Renderer  */}
            {renderContent()}
        </div>
    );
};

export default App;