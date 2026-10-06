import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, ShieldAlert, XCircle, MoreVertical, Flag, Users, Lock, MessageSquare } from 'lucide-react';

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'general';
  
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  // For Mentors
  const [mentorTickets, setMentorTickets] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(queryParams.get('roomId'));
  const [abuseAlerts, setAbuseAlerts] = useState([]);
  const [blockingMentor, setBlockingMentor] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('quiethelp_user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (!activeRoomId && parsedUser.role === 'student') {
      setActiveRoomId(`room_${category}_${parsedUser.alias}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (user && (user.role === 'mentor' || user.role === 'student_head')) {
      const fetchT = () => {
        fetch(`http://localhost:5000/api/tickets/${category}?role=${user.role}&alias=${user.alias}`)
          .then(res => res.json())
          .then(data => setMentorTickets(data))
          .catch(e => console.error(e));
      };
      fetchT();
      const int = setInterval(fetchT, 3000);
      return () => clearInterval(int);
    }
  }, [user, category]);

  useEffect(() => {
    if (!user || !activeRoomId) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join_chat', { roomId: activeRoomId, role: user.role, alias: user.alias });
    });

    newSocket.on('you_are_blocked', (payload) => {
      if (user.role === 'student') {
        const alias = payload?.mentorAlias || 'a mentor';
        setBlockingMentor(alias);
      }
    });

    newSocket.on('chat_history', (history) => {
      console.log('Received history:', history);
      setMessages(history || []);
    });

    newSocket.on('chat_cleared', () => {
      window.alert("This chat session has been permanently ended and cleared.");
      if (user.role === 'student') {
         navigate(`/dashboard?category=${category}`);
      } else {
         setActiveRoomId(null);
         setMessages([]);
      }
    });

    newSocket.on('abuse_alert', (data) => {
      if (user.role === 'mentor') {
        setAbuseAlerts(prev => [...prev, { id: Date.now().toString(), ...data }]);
      }
    });

    newSocket.on('receive_message', (data) => {
      console.log('Received new message:', data);
      setMessages((prev) => [...(prev || []), data]);
    });

    newSocket.on('system_alert', (data) => {
      setMessages((prev) => [...(prev || []), {
        id: Date.now().toString(),
        isSystem: true,
        type: data.type,
        text: data.message,
        timestamp: new Date()
      }]);
    });

    newSocket.on('user_typing', ({ alias }) => {
      setTypingUsers(prev => new Set(prev).add(alias));
    });

    newSocket.on('user_stopped_typing', ({ alias }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(alias);
        return next;
      });
    });

    return () => {
       newSocket.disconnect();
       setIsConnected(false);
       setMessages([]);
    };
  }, [user, activeRoomId, category, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    
    if (socket && user && activeRoomId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { roomId: activeRoomId, alias: user.alias });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { roomId: activeRoomId, alias: user.alias });
      }, 2000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !user || !activeRoomId) return;

    socket.emit('send_message', { 
      roomId: activeRoomId, 
      message: inputMessage, 
      alias: user.alias,
      role: user.role 
    });

    socket.emit('stop_typing', { roomId: activeRoomId, alias: user.alias });
    setIsTyping(false);
    setInputMessage('');
  };

  const endChat = () => {
    if (window.confirm("Are you sure you want to permanently clear the entire history of this channel for everyone?")) {
      socket.emit('clear_chat', { roomId: activeRoomId });
      // Wait for server chat_cleared
    }
  };

  const blockStudent = (studentAlias, alertId) => {
    if (window.confirm(`Are you absolutely sure you want to PERMANENTLY BLOCK ${studentAlias}?`)) {
      socket.emit('block_student', { 
         roomId: activeRoomId, 
         studentAlias, 
         mentorAlias: user.alias,
         domain: category,
         targetRole: user.role === 'student_head' ? 'sh' : 'mentor'
      });
      if (alertId) dismissAlert(alertId);
    }
  };

  const handleManualBlock = () => {
    if(!activeRoomId) return;
    const targetAlias = activeRoomId.split('_').slice(3).join('_');
    if(!targetAlias) return window.alert("Cannot determine the target student's alias from this context.");
    blockStudent(targetAlias, null);
  };

  const dismissAlert = (alertId) => {
    setAbuseAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const reportAbuse = () => {
    if(!socket || !user || !activeRoomId) return;
    const reportedAlias = window.prompt("Enter the alias of the user you want to report:");
    if(reportedAlias) {
      socket.emit('report_abuse', { roomId: activeRoomId, reportedAlias, message: "User reported from UI" });
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  const chatContainer = (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative shadow-2xl">
      {/* Chat Nav */}
      <nav className="glass border-b border-slate-200 p-4 flex justify-between items-center z-10 w-full bg-white">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/dashboard?category=${category}`)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-800 flex items-center">
              Anonymous <span className="capitalize ml-1">{category}</span> Support
              <div className={`ml-3 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </h2>
            <p className="text-xs text-slate-500">Connected as {user.alias} ({user.role})</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {(user.role === 'mentor' || user.role === 'student_head') && activeRoomId && (
            <button 
              onClick={handleManualBlock}
              title="Block Student manually"
              className="px-3 py-1.5 flex items-center bg-orange-50 text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg text-sm font-bold shadow-sm transition"
            >
              <Lock className="w-4 h-4 mr-1.5" /> Block User
            </button>
          )}
          <button 
            onClick={reportAbuse}
            title="Flag specific message for review"
            className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition"
          >
            <Flag className="w-5 h-5" />
          </button>
          <button 
            onClick={endChat}
            className="flex items-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-bold transition"
          >
            <XCircle className="w-4 h-4 mr-2" /> End Chat
          </button>
        </div>
      </nav>

      {/* Massive Banishment Modal Popup */}
      {blockingMentor && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full mx-auto shadow-2xl text-center transform scale-100 border border-red-100 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
               <ShieldAlert className="w-10 h-10 text-red-600" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">ACCESS RESTRICTED</h3>
             <p className="text-base text-slate-600 mb-8 leading-relaxed">
               You have been permanently banned by <strong className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{blockingMentor}</strong> due to inappropriate behavior. You can no longer communicate on this channel.
             </p>
             <button 
               onClick={() => navigate(`/dashboard?category=${category}`)}
               className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition duration-200"
             >
               Return to Dashboard
             </button>
           </div>
        </div>
      )}

      {/* Dynamic Abuse Alerts */}
      {abuseAlerts.length > 0 && (
        <div className="absolute top-20 left-0 w-full z-20 px-4">
          {abuseAlerts.map(alert => (
            <div key={alert.id} className="bg-white border-l-4 border-red-500 shadow-xl rounded-lg p-5 mb-3 flex flex-col animate-fade-in-up">
               <div className="flex items-center text-red-600 font-bold mb-1">
                 <ShieldAlert className="w-5 h-5 mr-2" /> Policy Violation Detected
               </div>
               <p className="text-sm font-medium text-slate-700 mb-4 tracking-tight">Student <span className="font-bold underline">{alert.studentAlias}</span> has attempted to use offensive or prohibited language. The message was censored for safety.</p>
               <div className="flex space-x-3 w-full">
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm transition"
                  >
                    Dismiss Warning
                  </button>
                  <button 
                    onClick={() => blockStudent(alert.studentAlias, alert.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition"
                  >
                    Block Extruder
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50">
        <div className="text-center my-6">
          <div className="inline-block bg-white px-4 py-1 text-xs text-slate-400 font-medium rounded-full shadow-sm border border-slate-100">
            Chat session started. All messages are ephemeral.
          </div>
        </div>

        {messages.map((msg, idx) => {
          if (msg.isSystem) {
            return (
              <div key={idx} className="flex justify-center my-4">
                <div className={`px-4 py-3 rounded-xl max-w-md text-sm shadow-sm flex items-start ${
                  msg.type === 'escalation' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          const isMe = msg.alias === user.alias;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
              {!isMe && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-600">{msg.alias}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md">{msg.role}</span>
                </div>
              )}
              <div 
                className={`max-w-[75%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm relative group ${
                  isMe 
                    ? 'bg-brand-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                }`}
              >
                {msg.text}
                <span className={`text-[10px] mt-2 block ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                  {formatTime(msg.timestamp)}
                </span>
                
                {msg.isDistress && isMe && (
                  <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-red-500" title="Distress keyword detected">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {Array.from(typingUsers).length > 0 && (
          <div className="flex items-center text-xs text-slate-400 italic">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mr-2">
               <div className="flex space-x-1">
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
            {Array.from(typingUsers).join(', ')} {Array.from(typingUsers).length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-slate-200 w-full">
        {blockingMentor ? (
           <div className="w-full bg-red-50 text-red-800 font-bold text-sm p-4 text-center rounded-xl shadow-sm border border-red-200">
             You have been blocked by {blockingMentor}. You can no longer reply to this conversation.
           </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all p-2 flex overflow-hidden">
              <textarea 
                value={inputMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message securely..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm text-slate-800 p-2"
                rows={1}
              />
            </div>
            <button 
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 shadow-md flex-shrink-0 mb-1"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (user.role === 'student') {
    return (
      <div className="h-screen bg-slate-50 flex flex-col max-w-5xl mx-auto shadow-2xl">
        {chatContainer}
      </div>
    );
  }

  // STAFF ACTIVE INBOX LAYOUT
  return (
    <div className="flex h-screen bg-slate-100 w-full overflow-hidden">
       <div className="w-1/3 max-w-sm bg-white border-r border-slate-200 flex flex-col shadow-lg z-20">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center shadow-sm z-10">
             <button onClick={() => navigate(`/dashboard?category=${category}`)} className="p-2 -ml-2 mr-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm hover:shadow transition">
               <ArrowLeft className="w-4 h-4"/>
             </button>
             <div>
               <h2 className="font-extrabold text-slate-800 flex items-center tracking-tight text-lg">
                 Support Inbox <span className="ml-2 uppercase text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">{category}</span>
               </h2>
               <p className="text-xs text-slate-500 font-medium tracking-wide">Live Student Tracker</p>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
             {mentorTickets.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">No active students in queue.</p>
                </div>
             ) : (
                mentorTickets.map(t => {
                   const isActive = activeRoomId === t.roomId;
                   const canJoin = !t.hasMentor || t.mentorAlias === user.alias;
                   
                   return (
                     <div 
                       key={t.roomId}
                       onClick={() => {
                         if (canJoin && !isActive) {
                           setActiveRoomId(t.roomId);
                           setMessages([]); 
                         }
                       }}
                       className={`p-4 rounded-2xl transition-all relative overflow-hidden ${
                         isActive 
                           ? 'bg-brand-600 text-white shadow-md transform scale-[1.02]' 
                           : canJoin
                              ? 'bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 cursor-pointer shadow-sm hover:shadow' 
                              : 'bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed'
                       }`}
                     >
                        {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-white opacity-40"></div>}
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-bold flex items-center truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                             {isActive ? <MessageSquare className="w-4 h-4 mr-2 opacity-80" /> : <Lock className="w-4 h-4 mr-2 text-slate-400" />}
                             {t.studentAlias}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
                             {t.messagesCount} Msgs
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs">
                           {t.hasMentor ? (
                              t.mentorAlias === user.alias ? (
                                <span className={isActive ? 'text-brand-100' : 'text-slate-500 font-medium'}>Your assigned session</span>
                              ) : (
                                <span className="text-red-500 font-bold flex items-center">
                                  <Lock className="w-3 h-3 mr-1" /> Locked by {t.mentorAlias}
                                </span>
                              )
                           ) : (
                              <span className={isActive ? 'text-brand-100' : 'text-brand-600 font-bold'}>Available to claim</span>
                           )}
                        </div>
                     </div>
                   );
                })
             )}
          </div>
       </div>
       <div className={`flex-1 flex flex-col h-full bg-slate-100 relative shadow-inner ${!activeRoomId ? 'items-center justify-center bg-slate-50' : ''}`}>
          {!activeRoomId ? (
             <div className="text-center text-slate-400 px-8 max-w-sm">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="font-bold text-xl text-slate-700 mb-2">No Chat Selected</h3>
                <p className="text-sm leading-relaxed text-slate-500">Select an available student from the inbox sidebar on the left to securely claim their ticket and begin monitoring their distress session.</p>
             </div>
          ) : chatContainer}
       </div>
    </div>
  );
};

export default ChatPage;
