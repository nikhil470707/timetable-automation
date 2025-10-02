import React, { useState, useEffect } from 'react';

const API_SOLUTIONS = '/api/timetable/solutions';
const API_LOCK = '/api/timetable/lock';

const SolutionHistory = ({ onLoadSolution, onSwitchView }) => {
    const [solutions, setSolutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSolutions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_SOLUTIONS);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Server returned a non-success status.' }));
                throw new Error(errorData.message || `Failed to fetch solutions. Status: ${response.status}`);
            }

            const data = await response.json();
            setSolutions(data);
        } catch (err) {
            const msg = err.message.includes('Failed to fetch') ? 'Failed to connect to the server.' : err.message;
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSolutions();
    }, []); // Empty dependency array ensures it runs only once on mount

    const handleLoad = (solutionId) => {
        onLoadSolution(solutionId); 
        onSwitchView('generator'); 
    };

    const handleToggleLock = async (solution) => {
        const solutionId = solution._id;
        
        const isLocked = !solution.isLocked;
        setSolutions(prev => prev.map(s => 
            s._id === solutionId ? { ...s, isLocked: isLocked } : s
        ));
        
        try {
            const response = await fetch(`${API_LOCK}/${solutionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to toggle lock status.');

        } catch (err) {
            setSolutions(prev => prev.map(s => 
                s._id === solutionId ? { ...s, isLocked: !isLocked } : s
            ));
            alert(`Error: ${err.message}`);
        }
    };

    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading solution history...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-6 bg-white shadow-2xl rounded-xl border border-gray-100">
            <header className="flex justify-between items-center mb-6 border-b-2 pb-4 border-indigo-100">
                <h2 className="text-3xl font-extrabold text-gray-800">Solution History</h2>
                <button 
                    onClick={() => onSwitchView('generator')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md transition-colors duration-200 flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    <span>Back to Generator</span>
                </button>
            </header>

            {solutions.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0a2 2 0 012-2h6a2 2 0 012 2m-6 0v2"></path></svg>
                    <p className="font-semibold text-lg">No timetables have been saved yet.</p>
                 </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-wider">Saved On</th>
                                <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-center text-xs font-extrabold text-white uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-extrabold text-white uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {solutions.map((solution, index) => (
                                <tr key={solution._id} className={index % 2 === 0 ? 'bg-white hover:bg-indigo-50 transition-colors duration-100' : 'bg-gray-50 hover:bg-indigo-50 transition-colors duration-100'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                        {new Date(solution.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                                        {solution._id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                                            solution.isLocked ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                        }`}>
                                            {solution.isLocked ? 'LOCKED (Final)' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button 
                                            onClick={() => handleLoad(solution._id)}
                                            className="text-indigo-600 hover:text-indigo-800 mr-4 font-bold transition-colors p-1 rounded-md hover:bg-indigo-100"
                                        >
                                            View/Load
                                        </button>
                                        <button 
                                            onClick={() => handleToggleLock(solution)}
                                            className={`font-bold transition-colors p-1 rounded-md ${
                                                solution.isLocked ? 'text-red-600 hover:text-red-800 hover:bg-red-100' : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                            }`}
                                        >
                                            {solution.isLocked ? 'Unlock' : 'Lock'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SolutionHistory;