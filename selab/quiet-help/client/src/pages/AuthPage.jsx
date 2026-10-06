import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, UserCircle, AlertCircle, XCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PREDEFINED_STUDENTS = [
  { email: 'kh24csb0a32@student.nitw.ac.in', password: 'qh21', alias: 'User_4122' },
  { email: 'kn24csb0a36@student.nitw.ac.in', password: 'qh21', alias: 'User_8921' },
  { email: 'dm24csb0a22@student.nitw.ac.in', password: 'qh21', alias: 'User_1034' },
  { email: 'vl24csb0a83@student.nitw.ac.in', password: 'qh21', alias: 'User_5592' },
  { email: 'dc24csb0a18@student.nitw.ac.in', password: 'qh21', alias: 'User_3748' },
  { email: 'pm24csb0a54@student.nitw.ac.in', password: 'qh21', alias: 'User_7263' }
];

const PREDEFINED_MENTORS = [
  { email: 'emo@nitw.ac.in', alias: 'Dr. Jane Smith', domain: 'emotional' },
  { email: 'acad@nitw.ac.in', alias: 'Prof. Robert', domain: 'academic' },
  { email: 'career@nitw.ac.in', alias: 'Alumni Sarah', domain: 'career' },
  { email: 'gen@nitw.ac.in', alias: 'Counselor Dan', domain: 'general' }
];

const PREDEFINED_STUDENT_HEADS = [
  { email: 'sh.emo@nitw.ac.in', alias: 'Emotional Head', domain: 'emotional' },
  { email: 'sh.acad@nitw.ac.in', alias: 'Academic Head', domain: 'academic' },
  { email: 'sh.career@nitw.ac.in', alias: 'Career Head', domain: 'career' },
  { email: 'sh.gen@nitw.ac.in', alias: 'General Head', domain: 'general' }
];

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFaq, setShowFaq] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    let domain = null;
    let finalAlias = `User_${Math.floor(1000 + Math.random() * 9000)}`;
    let role = loginType;

    if (loginType === 'student') {
      const studentRec = PREDEFINED_STUDENTS.find(s => s.email === email.toLowerCase());
      if (!studentRec && !email.includes('admin')) {
        setError('This student email is not whitelisted in the system.');
        return;
      }
      if (studentRec && password !== studentRec.password) {
        setError('Invalid Credentials');
        return;
      }
      if (studentRec) finalAlias = studentRec.alias;
    } else if (loginType === 'mentor') {
      const mentor = PREDEFINED_MENTORS.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (!mentor) {
        setError('Invalid Credentials');
        setLoading(false);
        return;
      }
      role = 'mentor';
      finalAlias = mentor.alias;
      domain = mentor.domain;
    } else if (loginType === 'student_head') {
      const head = PREDEFINED_STUDENT_HEADS.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (!head) {
        setError('Invalid Credentials');
        setLoading(false);
        return;
      }
      role = 'student_head';
      finalAlias = head.alias;
      domain = head.domain;
    }

    setLoading(true);

    // Simulate network request to mock backend
    setTimeout(() => {
      if (email.includes('admin')) role = 'admin';

      const userData = { email, alias: finalAlias, role, domain };
      localStorage.setItem('quiethelp_user', JSON.stringify(userData));

      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {showFaq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl">
            <button onClick={() => setShowFaq(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-bold text-slate-800">Is this completely anonymous?</h4>
                <p className="text-sm text-slate-500 mt-1 flex-1 leading-relaxed">Yes. While you log in with your institutional email to verify you are a student, your identity is actively scrubbed and replaced with a random numerical alias before you access the platform.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Can other students read my messages?</h4>
                <p className="text-sm text-slate-500 mt-1 flex-1 leading-relaxed">Never. All support sessions are securely isolated in strict 1-on-1 private channels natively between you and a heavily vetted peer mentor.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Are the chats permanently saved?</h4>
                <p className="text-sm text-slate-500 mt-1 flex-1 leading-relaxed">QuietHelp runs entirely dynamically on RAM. Conversations are highly ephemeral. Once a session is manually ended by either you or the mentor, the entire history is permanently destroyed.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Who are the mentors?</h4>
                <p className="text-sm text-slate-500 mt-1 flex-1 leading-relaxed">Mentors are trained senior peers or counselors operating under strict confidentiality codes. They dedicate their time specifically to provide private guidance across Emotional, Academic, and Career queues.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="glass p-10 rounded-3xl shadow-xl relative z-10 border border-white/50">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center -rotate-6 transform hover:rotate-0 transition-transform duration-300">
              <Shield className="w-10 h-10" />
            </div>
            <button onClick={() => setShowFaq(true)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition">
              <BookOpen className="w-4 h-4" /> FAQ
            </button>
          </div>

          <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-2">Login to QuietHelp</h2>
          <p className="text-center text-slate-500 mb-6 font-medium">
            {loginType === 'student' ? (
              <span>Your real identity stays <span className="text-brand-600">completely hidden.</span></span>
            ) : (
              <span>Welcome back to the <span className="text-brand-600">Support Team.</span></span>
            )}
          </p>

          <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setLoginType('student'); setError(''); setPassword(''); setEmail(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student
            </button>
            <button
              onClick={() => { setLoginType('student_head'); setError(''); setPassword(''); setEmail(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'student_head' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Head
            </button>
            <button
              onClick={() => { setLoginType('mentor'); setError(''); setPassword(''); setEmail(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'mentor' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mentor
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center">
                <UserCircle className="w-4 h-4 mr-2" /> Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder={loginType === 'student' ? "id@student.nitw.ac.in" : "mentor@nitw.ac.in"}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center">
                <Lock className="w-4 h-4 mr-2" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
              />

              {error && (
                <p className="text-xs text-red-500 mt-2 flex items-center font-medium">
                  <AlertCircle className="w-3 h-3 mr-1" /> {error}
                </p>
              )}
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {loginType === 'student' ? 'Join Using Alias' : loginType === 'student_head' ? 'Access Student Head' : 'Access Mentor Dashboard'} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
