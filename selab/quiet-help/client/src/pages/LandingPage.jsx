import React, { useState } from 'react';
import { Shield, Sparkles, MessageCircle, Heart, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
      {/* FAQ Modal */}
      {showFaq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in-up">
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

      {/* Navbar */}
      <nav className="w-full py-4 px-8 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-brand-600 font-bold text-2xl">
          <Shield className="w-8 h-8" />
          <span>QuietHelp</span>
        </div>
        <div className="space-x-4">
          <button 
            onClick={() => navigate('/auth')}
            className="px-4 py-2 text-slate-600 hover:text-brand-600 font-medium transition"
          >
            Login
          </button>
          <button 
            onClick={() => setShowFaq(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 shadow-md transition transform hover:scale-105 font-bold"
          >
            FAQ's
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center mt-16 px-4">
        <div className="max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center px-4 py-2 bg-pastel-blue text-brand-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            100% Anonymous & Secure
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Talk Freely. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-500">
              Stay Anonymous.
            </span>
            <br/> Get Support.
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A safe, anonymous space for college students to seek emotional, academic, and career support without revealing their identity.
          </p>
          <div className="pt-8 flex justify-center space-x-6">
            <button 
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-brand-600 text-white text-lg rounded-full hover:bg-brand-700 shadow-lg hover:shadow-brand-500/30 transition-all transform hover:-translate-y-1 font-semibold flex items-center"
            >
              Start Anonymous Chat <MessageCircle className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 max-w-6xl w-full grid md:grid-cols-3 gap-8 px-4 pb-20">
          <div className="glass p-8 rounded-2xl hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <Shield className="w-12 h-12 text-brand-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-800">Complete Anonymity</h3>
            <p className="text-slate-600 leading-relaxed">System-generated aliases ensure your true identity is never revealed to peers or counselors.</p>
          </div>
          <div className="glass p-8 rounded-2xl hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <MessageCircle className="w-12 h-12 text-blue-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-800">Real-Time Support</h3>
            <p className="text-slate-600 leading-relaxed">Connect instantly through a secure, encrypted chat interface with trained peers and counselors.</p>
          </div>
          <div className="glass p-8 rounded-2xl hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-pastel-purple transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            <Heart className="w-12 h-12 text-purple-500 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-800">Smart Care</h3>
            <p className="text-slate-600 leading-relaxed">System automatically detects signs of distress and instantly recommends emergency resources.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
