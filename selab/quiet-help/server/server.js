import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For development
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-Memory Database (Mock)
const activeSessions = [];
const chatRooms = {};
const reports = [];

// Distress detection keywords
const DISTRESS_KEYWORDS = ['suicide', 'kill myself', 'end it all', 'worthless', 'hopeless'];
const BANNED_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid', 'crap'];
let blockedStudents = [];

// Generate alias utility
const generateAlias = () => `User_${Math.floor(1000 + Math.random() * 9000)}`;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'QuietHelp server is running.' });
});

// Login Simulation
app.post('/api/auth/login', (req, res) => {
  // Previous mock login logic stays local in component as currently implemented 
  res.json({ status: 'Use frontend mock' });
});

// Mock Announcements Database
const announcements = [
  { id: '1', author: 'Dr. Jane Smith', role: 'mentor', domain: 'emotional', text: 'Exam season is tough. Take 10 minutes out to breathe!', timestamp: new Date() },
  { id: '2', author: 'Prof. Robert', role: 'mentor', domain: 'academic', text: 'Remember to check the syllabus for upcoming assignment due dates.', timestamp: new Date() },
  { id: '3', author: 'Alumni Sarah', role: 'mentor', domain: 'career', text: 'The internship fair is next week. Have your resumes ready!', timestamp: new Date() },
  { id: '4', author: 'Counselor Dan', role: 'mentor', domain: 'general', text: 'General drop-in hours have been extended to 6PM this Friday.', timestamp: new Date() }
];

app.get('/api/announcements', (req, res) => {
  res.json(announcements);
});

app.post('/api/announcements', (req, res) => {
  const { author, role, domain, text } = req.body;
  if(!text) return res.status(400).json({ error: 'Text required' });
  const newPost = {
    id: Date.now().toString(),
    author,
    role,
    domain,
    text,
    timestamp: new Date()
  };
  // Add to front of array
  announcements.unshift(newPost);
  res.json(newPost);
});

// Block Management API
app.get('/api/blocked-students/:staffAlias', (req, res) => {
  const list = blockedStudents.filter(b => b.blockedBy === req.params.staffAlias);
  res.json(list);
});

app.post('/api/unblock-student', (req, res) => {
  const { studentAlias, staffAlias } = req.body;
  blockedStudents = blockedStudents.filter(b => !(b.alias === studentAlias && b.blockedBy === staffAlias));
  res.json({ success: true });
});

// Get Active Student Tickets for Mentors
app.get('/api/tickets/:category', (req, res) => {
  const category = req.params.category;
  const targetRole = req.query.role === 'student_head' ? 'sh' : 'mentor';
  const staffAlias = req.query.alias;
  const prefix = `room_${targetRole}_${category}_`;
  
  const tickets = [];
  for (const [roomId, room] of Object.entries(chatRooms)) {
    if (roomId.startsWith(prefix)) {
      const studentExtracted = roomId.split('_').slice(3).join('_');
      
      if (staffAlias) {
        const isBlocked = blockedStudents.some(b => b.alias === studentExtracted && b.blockedBy === staffAlias);
        if (isBlocked) continue; // Completely hide ticket if this specific mentor blocked them
      }

       // Look for the student who initiated the room
       const student = room.users.find(u => u.role === 'student');

       if (student || room.messages.length > 0) {
         // Determine alias accurately
         const studentAlias = student ? student.alias : roomId.split('_').slice(2).join('_');
         tickets.push({ 
           roomId, 
           studentAlias, 
           messagesCount: room.messages.length,
           hasMentor: !!room.assignedMentor,
           mentorAlias: room.assignedMentor || null
         });
       }
    }
  }
  res.json(tickets);
});

// Check specific ticket status (for students)
app.get('/api/ticket-status/:roomId', (req, res) => {
  const room = chatRooms[req.params.roomId];
  if (!room) return res.json({ exists: false });
  const mentor = room.users.find(u => u.role === 'mentor');
  res.json({ 
    exists: true, 
    messagesCount: room.messages.length,
    hasMentor: !!mentor,
    mentorAlias: mentor ? mentor.alias : null
  });
});

// Get active sessions (for dashboard / admin)
app.get('/api/sessions', (req, res) => {
  // Strip out emails for privacy
  const sterileSessions = activeSessions.map(s => ({
    id: s.id,
    alias: s.alias,
    role: s.role
  }));
  res.json(sterileSessions);
});

// Resources Mock
app.get('/api/resources', (req, res) => {
  res.json([
    { id: 1, title: 'Student Counseling Center', type: 'Mental Health', link: '#' },
    { id: 2, title: 'National Suicide Prevention Lifeline: 988', type: 'Emergency', link: '#' },
    { id: 3, title: 'Effective Study Habits', type: 'Academic', link: '#' },
    { id: 4, title: 'Career Advising Appointments', type: 'Career', link: '#' }
  ]);
});

// WebSockets
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_chat', ({ roomId, role, alias }) => {
    socket.join(roomId);
    if (!chatRooms[roomId]) {
      chatRooms[roomId] = { users: [], messages: [], assignedMentor: null };
    }
    chatRooms[roomId].users.push({ id: socket.id, role, alias });
    
    // Assign permanent ticket ownership if staff joins
    if ((role === 'mentor' || role === 'student_head') && !chatRooms[roomId].assignedMentor) {
      chatRooms[roomId].assignedMentor = alias;
    }

    socket.to(roomId).emit('user_joined', { role, alias });
    
    // Sync chat history strictly to the joining user
    socket.emit('chat_history', chatRooms[roomId].messages);
  });

  socket.on('clear_chat', ({ roomId }) => {
    if (chatRooms[roomId]) {
      // Force all connected clients in this room to exit
      io.to(roomId).emit('chat_cleared');
      
      // Permanently destroy memory reference
      delete chatRooms[roomId]; 
    }
  });

  socket.on('send_message', ({ roomId, message, alias, role }) => {
    // If student is blocked mid-chat on this specific domain track, drop the payload entirely
    if (role === 'student') {
      const parts = roomId.split('_');
      const isBlocked = blockedStudents.find(b => b.alias === alias && b.domain === parts[2] && b.targetRole === parts[1]);
      if (isBlocked) {
        socket.emit('you_are_blocked', { mentorAlias: isBlocked.blockedBy });
        return;
      }
    }

    let finalMessage = message;
    let isAbusive = false;

    // Apply censorship and detect violations
    if (role === 'student') {
      BANNED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(finalMessage)) {
          isAbusive = true;
          finalMessage = finalMessage.replace(regex, '***');
        }
      });
    }

    const isDistress = DISTRESS_KEYWORDS.some(word => finalMessage.toLowerCase().includes(word));
    const messageData = {
      id: Date.now().toString(),
      alias,
      role,
      text: finalMessage,
      timestamp: new Date(),
      isDistress
    };

    if (chatRooms[roomId]) {
      chatRooms[roomId].messages.push(messageData);
    }
    
    // Broadcast message safely to room
    io.to(roomId).emit('receive_message', messageData);

    // If abusive, ping the room so the mentor's client can catch the alert
    if (isAbusive && role === 'student') {
      io.to(roomId).emit('abuse_alert', { studentAlias: alias, text: finalMessage });
    }

    if (isDistress) {
      // Simulate system intervention
      setTimeout(() => {
        io.to(roomId).emit('system_alert', {
          message: 'It sounds like you are going through a really difficult time right now. Please know that your mentor is here for you and you do not have to carry this alone. We are listening.',
          type: 'escalation'
        });
      }, 1000);
    }
  });

  socket.on('block_student', ({ roomId, studentAlias, mentorAlias, domain, targetRole }) => {
    // Add to specific domain ban list
    blockedStudents.push({ alias: studentAlias, blockedBy: mentorAlias, domain, targetRole });
    
    // Instead of deleting the room, tell the student they've been blocked inline
    if (chatRooms[roomId]) {
      io.to(roomId).emit('you_are_blocked', { mentorAlias });
      // We do NOT call chat_cleared. The chat stays open but the user is blocked.
    }
  });

  socket.on('typing', ({ roomId, alias }) => {
    socket.to(roomId).emit('user_typing', { alias });
  });

  socket.on('stop_typing', ({ roomId, alias }) => {
    socket.to(roomId).emit('user_stopped_typing', { alias });
  });

  socket.on('report_abuse', ({ roomId, reportedAlias, message }) => {
    reports.push({ roomId, reportedAlias, message, date: new Date() });
    socket.emit('system_alert', { message: 'Report submitted successfully. A moderator will review it.', type: 'info' });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Cleanup simple logic
    for (const [roomId, room] of Object.entries(chatRooms)) {
      room.users = room.users.filter(u => u.id !== socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`QuietHelp server running on port ${PORT}`);
});
