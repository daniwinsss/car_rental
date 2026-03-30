import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Parse AI reply text and extract [CAR_ID:xxx] tokens
const parseReply = (text, cars) => {
  const carIdRegex = /\[CAR_ID:([a-f0-9]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = carIdRegex.exec(text)) !== null) {
    // Push text before the tag
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Find the car from context
    const car = cars.find(c => c._id === match[1]);
    if (car) {
      parts.push({ type: 'car', car });
    }
    lastIndex = carIdRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts;
};

const CarChip = ({ car, onClick }) => {
  const currency = import.meta.env.VITE_CURRENCY || '$';
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 bg-white border border-blue-100 hover:border-blue-400 rounded-xl p-3 mt-2 cursor-pointer shadow-sm hover:shadow-md transition-all group"
    >
      <img
        src={car.image}
        alt={car.brand}
        className="w-16 h-12 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{car.brand} {car.model}</p>
        <p className="text-xs text-gray-500">{car.category} · {car.year} · {car.transmission}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-blue-600">{currency}{car.pricePerDay}/day</span>
          <span className="text-xs text-yellow-500">{'★'.repeat(Math.round(car.rating || 5))}</span>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, cars, navigate }) => {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm shadow-sm">
          {msg.parts[0].text}
        </div>
      </div>
    );
  }

  const parts = parseReply(msg.parts[0].text, cars);
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%]">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs">✦</div>
          <span className="text-xs text-gray-400 font-medium">Car Assistant</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-gray-700 leading-relaxed">
          {parts.map((p, i) =>
            p.type === 'text'
              ? <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.content}</span>
              : <CarChip key={i} car={p.car} onClick={() => { navigate(`/car-details/${p.car._id}`); scrollTo(0, 0); }} />
          )}
        </div>
      </div>
    </div>
  );
};

const GREETING = {
  role: 'model',
  parts: [{ text: "Hi! 👋 I'm your car rental assistant. Tell me about your trip and I'll find the perfect car for you!\n\nFor example: \"I need a 5-seater SUV for a family trip, budget $120/day\"" }]
};

const ChatWidget = () => {
  const { cars, axios } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', parts: [{ text }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/chat/message', {
        messages: newMessages.filter(m => m !== GREETING) // don't send greeting to API
      });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.reply }] }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${data.message || "I couldn't process that"}` }] }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Connection error: ${err.message}` }] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-2xl"
        title="Chat with AI assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">✦</div>
          <div>
            <p className="font-semibold text-sm">Car Rental Assistant</p>
            <p className="text-xs text-blue-100">Powered by Gemini AI</p>
          </div>
          <button
            onClick={() => { setMessages([GREETING]); }}
            className="ml-auto text-xs text-blue-200 hover:text-white transition-colors"
            title="Clear chat"
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} cars={cars} navigate={navigate} />
          ))}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
            {['Budget under $80/day', 'SUV for family', 'Automatic, 4 seats', 'Electric car'].map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); if (inputRef.current) inputRef.current.focus(); }}
                className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your ideal car..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400 py-2 max-h-24 leading-relaxed"
              style={{ minHeight: '36px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
