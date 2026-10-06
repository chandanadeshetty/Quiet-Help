import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, BookOpen, Briefcase, Heart, Bell, LogOut, ShieldAlert, Send, Lock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category');

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [blockedStudents, setBlockedStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [postText, setPostText] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory || null);
  const [mentorStatus, setMentorStatus] = useState(null);
  const [shStatus, setShStatus] = useState(null);

  const fetchAnnouncements = () => {
    fetch('http://localhost:5000/api/announcements')
      .then(res => res.json())
      .then(data => setAnnouncements(data));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('quiethelp_user');
    if (!storedUser) {
      navigate('/auth');
    } else {
      setUser(JSON.parse(storedUser));
      fetchAnnouncements();
      
      // Keep feed perfectly in-sync with mentor broadcasts
      const pollLiveAnnouncements = setInterval(fetchAnnouncements, 4000);
      return () => clearInterval(pollLiveAnnouncements);
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    if ((user.role === 'mentor' || user.role === 'student_head') && user.domain) {
      const fetchT = () => {
        fetch(`http://localhost:5000/api/tickets/${user.domain}?role=${user.role}&alias=${user.alias}`)
          .then(res => res.json())
          .then(data => setTickets(data))
          .catch(err => console.error(err));
        
        fetch(`http://localhost:5000/api/blocked-students/${user.alias}`)
          .then(res => res.json())
          .then(data => setBlockedStudents(data))
          .catch(err => console.error(err));
      };
      fetchT();
      const interval = setInterval(fetchT, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'student' && activeCategory) {
      const checkStatus = () => {
        fetch(`http://localhost:5000/api/ticket-status/room_mentor_${activeCategory}_${user.alias}`)
          .then(res => res.json())
          .then(data => setMentorStatus(data))
          .catch(err => console.error("Status fetch error:", err));
        
        fetch(`http://localhost:5000/api/ticket-status/room_sh_${activeCategory}_${user.alias}`)
          .then(res => res.json())
          .then(data => setShStatus(data))
          .catch(err => console.error("Status fetch error:", err));
      };
      checkStatus();
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    } else {
      setMentorStatus(null);
      setShStatus(null);
    }
  }, [user, activeCategory]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('quiethelp_user');
    navigate('/auth');
  };

  const startChat = (category, target) => {
    const rolePrefix = target === 'student_head' ? 'sh' : 'mentor';
    const roomId = `room_${rolePrefix}_${category}_${user.alias}`;
    navigate(`/chat?category=${category}&roomId=${roomId}`);
  };

  const handleUnblock = (studentAlias) => {
    if(window.confirm(`Unblock ${studentAlias}?`)) {
      fetch('http://localhost:5000/api/unblock-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentAlias, staffAlias: user.alias })
      })
      .then(res => res.json())
      .then(() => setBlockedStudents(prev => prev.filter(b => b.alias !== studentAlias)));
    }
  };

  const joinStudentTicket = (roomId, category) => {
    navigate(`/chat?category=${category}&roomId=${roomId}`);
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if(!postText.trim()) return;

    fetch('http://localhost:5000/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        author: user.alias,
        role: user.role,
        domain: user.domain,
        text: postText 
      })
    })
    .then(res => res.json())
    .then(() => {
      setPostText('');
      fetchAnnouncements();
    });
  };

  const isStudent = user.role === 'student';

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="glass border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                Q
              </div>
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-900 hidden sm:block">
                QuietHelp
              </span>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-4">
              <button 
                onClick={handleLogout}
                className="flex items-center text-slate-500 hover:text-red-500 font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Log Out"
              >
                 <LogOut className="w-5 h-5" />
                 <span className="ml-2 hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative">
        <div className="absolute top-0 right-10 w-64 h-64 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mt-2 capitalize flex items-center">
              {isStudent && activeCategory ? `${activeCategory} Support` : `Welcome, ${isStudent ? user.alias : `Mentor ${user.alias}`}`}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-slate-500 max-w-2xl font-medium">
              {isStudent 
                ? (activeCategory ? `Take a moment to read the published advice, or join a private chat below.` : "What's bothering you today?") 
                : 'Thank you for supporting your peers. Please monitor the queues below.'}
            </p>
          </div>
        </div>

        {isStudent ? (
          /* ================================= STUDENT VIEW ================================= */
          !activeCategory ? (
            /* Home Hub */
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div onClick={() => setActiveCategory('emotional')} className="glass p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-pink-200 group">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-4"><Heart className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Emotional Support</h3>
                <p className="text-sm text-slate-500">Read advice & start a 1-on-1 private chat regarding anxiety or stress.</p>
              </div>

              <div onClick={() => setActiveCategory('academic')} className="glass p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-blue-200 group">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><BookOpen className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Academic Help</h3>
                <p className="text-sm text-slate-500">Read advice & get guidance on study habits and courses.</p>
              </div>

              <div onClick={() => setActiveCategory('career')} className="glass p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-purple-200 group">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Briefcase className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Career Guidance</h3>
                <p className="text-sm text-slate-500">Read advice & discuss internships and interviews.</p>
              </div>

              <div onClick={() => setActiveCategory('general')} className="glass p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-brand-200 group">
                <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4"><MessageSquare className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">General Chat</h3>
                <p className="text-sm text-slate-500">Read advice & monitor unassigned requests. Not sure? Start here.</p>
              </div>
            </div>
          ) : (
            /* Sub-Category View */
            <div className="animate-fade-in-up">
              <button 
                onClick={() => setActiveCategory(null)} 
                className="mb-6 flex flex-row items-center font-bold text-slate-500 hover:text-brand-600 transition-colors"
              >
                 &larr; Back to all categories
              </button>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Published Info feed for this category */}
                <div className="lg:col-span-2">
                  <h3 className="font-bold text-xl text-slate-800 mb-4 capitalize flex items-center">
                    Published Advice: {activeCategory}
                  </h3>
                  <div className="space-y-4">
                    {announcements.filter(a => a.domain === activeCategory).length === 0 ? (
                      <p className="text-slate-500">No published advice available yet.</p>
                    ) : (
                      announcements.filter(a => a.domain === activeCategory).map((announcement) => (
                        <div key={announcement.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                          <p className="text-slate-800 leading-relaxed font-medium mb-3">{announcement.text}</p>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-bold flex items-center text-slate-600"><div className="w-2 h-2 rounded-full bg-brand-500 mr-2"></div>{announcement.author}</span>
                            <span>{formatTime(announcement.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Direct Action Column */}
                <div className="space-y-6">
                  <div className="bg-brand-50 p-6 rounded-3xl border border-brand-100 shadow-sm text-center">
                    <h3 className="font-bold text-xl text-brand-900 mb-2">Talk to a Mentor</h3>
                    <p className="text-xs text-brand-700/80 mb-4 font-medium">Get guidance from a certified peer mentor.</p>
                    {mentorStatus && mentorStatus.exists ? (
                      <button 
                        onClick={() => startChat(activeCategory, 'mentor')}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow transition flex flex-col items-center"
                      >
                        <span>Resume Chat</span>
                        <span className="text-[10px] text-slate-300 font-normal mt-0.5">{mentorStatus.hasMentor ? 'Mentor joined' : 'Waiting...'}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => startChat(activeCategory, 'mentor')}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow transition"
                      >
                        Connect Mentor
                      </button>
                    )}
                  </div>

                  <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm text-center">
                    <h3 className="font-bold text-xl text-purple-900 mb-2">Talk to Student Head</h3>
                    <p className="text-xs text-purple-700/80 mb-4 font-medium">Discuss higher-level academic & peer disputes.</p>
                    {shStatus && shStatus.exists ? (
                      <button 
                        onClick={() => startChat(activeCategory, 'student_head')}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow transition flex flex-col items-center"
                      >
                        <span>Resume Session</span>
                        <span className="text-[10px] text-slate-300 font-normal mt-0.5">{shStatus.hasMentor ? 'Head joined' : 'Waiting...'}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => startChat(activeCategory, 'student_head')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow transition"
                      >
                        Connect Student Head
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          /* ================================= STAFF/MENTOR VIEW ================================= */
          <div>
            <div className="grid lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2">
                 <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 mb-8">
                  <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center">
                    {user.role === 'student_head' ? 'Student Head Requests' : 'Active Private Requests'} <span className="ml-2 uppercase text-xs bg-brand-100 text-brand-600 px-2 py-1 rounded-full">{user.domain} Queue</span>
                  </h3>
                  
                  {tickets.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium">No students currently waiting in your queue. Take a break!</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {tickets.map(t => {
                        const canJoin = !t.hasMentor || t.mentorAlias === user.alias;
                        return (
                          <li 
                            key={t.roomId} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border transition ${canJoin ? 'border-slate-100 hover:border-brand-300 hover:shadow-md cursor-pointer' : 'border-slate-200 opacity-80 cursor-not-allowed'}`} 
                            onClick={() => canJoin && joinStudentTicket(t.roomId, user.domain)}
                          >
                            <div className="mb-3 sm:mb-0">
                              <span className="font-bold text-slate-800 flex items-center drop-shadow-sm">
                                <Lock className="w-4 h-4 mr-2 text-slate-400" /> Private Session with {t.studentAlias}
                              </span>
                              <p className="text-sm text-slate-500 mt-1 ml-6">{t.messagesCount} message(s) sent so far</p>
                            </div>
                            
                            {t.hasMentor ? (
                              t.mentorAlias === user.alias ? (
                                <button className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition">
                                  Continue Chat
                                </button>
                              ) : (
                                <button className="bg-slate-200 text-slate-500 px-5 py-2.5 rounded-lg text-sm font-bold cursor-not-allowed" disabled>
                                  In Progress ({t.mentorAlias})
                                </button>
                              )
                            ) : (
                              <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition">
                                Accept & Join Chat
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                 </div>

                 {/* Blocked Students Panel */}
                 <div className="mt-8 bg-red-50 rounded-2xl shadow-sm p-6 border border-red-100">
                    <h3 className="font-bold text-lg text-red-900 mb-4 flex items-center">
                      Blocked Extruders <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{blockedStudents.length}</span>
                    </h3>
                    <div className="space-y-2">
                       {blockedStudents.length === 0 ? (
                          <p className="text-sm text-red-400">No blocked students mapped to your account.</p>
                       ) : (
                          blockedStudents.map(b => (
                             <div key={b.alias} className="bg-white px-4 py-3 rounded-xl shadow-sm text-sm border border-red-100 flex justify-between items-center">
                                <span className="font-bold text-slate-800 line-through decoration-red-400">{b.alias}</span>
                                <button onClick={() => handleUnblock(b.alias)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-lg">Unblock</button>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
               </div>

               <div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                      <Bell className="w-5 h-5 text-brand-500 mr-2" /> Publish Advice
                    </h3>
                    <form onSubmit={handlePostAnnouncement}>
                      <textarea 
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        placeholder={`Publish tips or updates for the ${user.domain} queue...`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none mb-3"
                        rows={3}
                        required
                      />
                      <button 
                        type="submit"
                        disabled={!postText.trim()}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center justify-center"
                      >
                        Publish to {user.domain} <Send className="w-4 h-4 ml-2" />
                      </button>
                    </form>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <h4 className="font-bold text-sm text-slate-500 mb-4 uppercase">Recently Published</h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {announcements.filter(a => a.domain === user.domain).map((announcement) => (
                          <div key={announcement.id} className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-700 font-medium mb-2">{announcement.text}</p>
                            <span className="text-xs text-slate-400 font-bold">{formatTime(announcement.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
