import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const userKey = userId.trim(); 
        
        try {
            // API call to the backend login endpoint
            const response = await fetch('/api/auth/login', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userKey, password: password }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            const { role, id } = data.user;
            onLogin(role, id);
            
        } catch (err) {
            setError(err.message || 'Failed to connect to server. Check if Node.js server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
            <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-indigo-600">
                <h3 className="text-3xl font-extrabold mb-8 text-indigo-700 text-center tracking-wide">
                    Timetable Scheduler Login <span className='text-gray-400'></span>
                </h3>
                <form onSubmit={handleSubmit}>
                    
                    {error && (
                         <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 text-sm font-medium">
                            {error}
                         </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userId">User ID</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="shadow-md border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                            placeholder="Enter User ID (e.g., admin)"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-md border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                            placeholder="Enter Password"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 w-full rounded-full transition-all shadow-xl disabled:bg-gray-400 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-4 text-center">Use your Teacher ID or Group ID as User ID for student/teacher views.</p>
                </form>
            </div>
        </div>
    );
};

export default Login;