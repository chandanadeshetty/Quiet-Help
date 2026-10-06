import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, AlertTriangle, ArrowLeft } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('quiethelp_user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      navigate('/dashboard'); // Restrict access
      return;
    }
    setUser(parsedUser);

    // Fetch active sessions from mock server
    fetch('http://localhost:5000/api/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch sessions", err);
        setLoading(false);
      });
  }, [navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 mr-4 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center">
              System Administration <ShieldCheck className="ml-3 w-8 h-8 text-brand-600" />
            </h1>
            <p className="text-slate-500 mt-1">Monitor platform health and manage flagged activity</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass p-6 rounded-2xl flex items-center">
            <div className="p-4 bg-brand-100 text-brand-600 rounded-xl mr-4 flex-shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Sessions</p>
              <p className="text-3xl font-bold text-slate-800">{sessions.length}</p>
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl flex items-center">
            <div className="p-4 bg-red-100 text-red-600 rounded-xl mr-4 flex-shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Reports</p>
              <p className="text-3xl font-bold text-slate-800">0</p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Real-Time User Sessions</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No active sessions at the moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-6 py-3">Alias</th>
                    <th className="px-6 py-3">Assigned Role</th>
                    <th className="px-6 py-3">Session ID</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sessions.map((session, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{session.alias}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                          session.role === 'mentor' ? 'bg-blue-100 text-blue-700' :
                          session.role === 'counselor' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {session.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{session.id}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-red-500 hover:text-red-700 font-medium">Terminate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
