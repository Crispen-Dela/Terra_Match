import React, { useState, useRef, useEffect } from 'react';
import {
  Leaf,
  Building2,
  MapPin,
  Send,
  User,
  Bot,
  Star,
  Search,
  MessageSquare,
  LandPlot,
  Hammer,
  CheckCircle2,
  TrendingUp,
  Map
} from 'lucide-react';
import './App.css';

const MOCK_CONTRACTOR = {
  name: "BuildRight Constructors",
  rating: 4.8,
  reviews: 124,
  tags: ["Residential", "Commercial", "Eco-friendly"],
  location: "Accra, Ghana"
};

const MOCK_BIDS = [
  { id: 1, developer: "Prime Estates", amount: "$150,000", status: "Active", time: "2 hours ago" },
  { id: 2, developer: "GreenLand Dev", amount: "$145,000", status: "Active", time: "5 hours ago" },
  { id: 3, developer: "Urban Builders", amount: "$130,000", status: "Rejected", time: "1 day ago" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      type: 'text',
      content: "Hello! I'm TerraMatch AI. I can help you analyze land data, find verified contractors, or manage land bids. What are you looking to do today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      type: 'text',
      content: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Mock AI Response
    setTimeout(() => {
      let aiResponse;
      const lowerInput = userMsg.content.toLowerCase();

      if (lowerInput.includes('contractor') || lowerInput.includes('build')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'contractor_recommendation',
          content: "Based on your location and project needs, here is a highly rated contractor I recommend:"
        };
      } else if (lowerInput.includes('land') || lowerInput.includes('bid')) {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          content: "I can help you with land bidding. You can list your land on our marketplace to receive competitive bids from verified developers. Would you like to view your current bids dashboard?"
        };
      } else {
        aiResponse = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          content: "I understand. Whether it's finding the right contractor or evaluating land, TerraMatch is here to ensure transparency and quality. Could you provide more details about your specific project?"
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Leaf size={20} />
          </div>
          TerraMatch AI
        </div>

        <div className="nav-menu">
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={18} />
            <span>Chat Assistant</span>
          </div>
          <div className={`nav-item ${activeTab === 'contractors' ? 'active' : ''}`} onClick={() => setActiveTab('contractors')}>
            <Hammer size={18} />
            <span>Contractors</span>
          </div>
          <div className={`nav-item ${activeTab === 'bidding' ? 'active' : ''}`} onClick={() => setActiveTab('bidding')}>
            <LandPlot size={18} />
            <span>Land Bidding</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>User Account</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <h2>
            {activeTab === 'chat' && 'Assistant'}
            {activeTab === 'contractors' && 'Verified Contractors'}
            {activeTab === 'bidding' && 'Land Bidding Dashboard'}
          </h2>
        </div>

        {activeTab === 'chat' && (
          <>
            <div className="chat-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper animate-slide-up ${msg.sender}`}>
                  <div className={`message-avatar ${msg.sender}`}>
                    {msg.sender === 'ai' ? <Bot size={24} /> : <User size={24} />}
                  </div>

                  <div className="message-content">
                    <p>{msg.content}</p>

                    {msg.type === 'contractor_recommendation' && (
                      <div className="contractor-card">
                        <div className="contractor-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                          <Building2 size={32} />
                        </div>
                        <div className="contractor-info">
                          <h4>{MOCK_CONTRACTOR.name}</h4>
                          <div className="rating">
                            <Star size={14} fill="currentColor" />
                            <span>{MOCK_CONTRACTOR.rating} ({MOCK_CONTRACTOR.reviews} reviews)</span>
                            <span style={{ color: 'var(--color-text-light)', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {MOCK_CONTRACTOR.location}
                            </span>
                          </div>
                          <div className="tags">
                            {MOCK_CONTRACTOR.tags.map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                          <button className="btn btn-primary" style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 12px' }}>
                            Contact Contractor
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-container">
                <textarea
                  placeholder="Ask about contractors, land analysis, or bids..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'contractors' && (
          <div style={{ padding: '32px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3>Recommended for you</h3>
              <div className="input-container" style={{ maxWidth: '300px', margin: 0 }}>
                <Search size={18} style={{ color: '#999', margin: '0 8px' }} />
                <input type="text" placeholder="Search skills or location..." style={{ border: 'none', outline: 'none', width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Duplicate cards to simulate directory */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="contractor-card animate-slide-up" style={{ flexDirection: 'column', animationDelay: `${i * 0.1}s` }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="contractor-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <Building2 size={32} />
                    </div>
                    <div className="contractor-info">
                      <h4>{i === 1 ? MOCK_CONTRACTOR.name : `Prime Builders ${i}`}</h4>
                      <div className="rating">
                        <Star size={14} fill="currentColor" />
                        <span>{MOCK_CONTRACTOR.rating - (i * 0.1).toFixed(1)} ({MOCK_CONTRACTOR.reviews - (i * 12)} reviews)</span>
                      </div>
                      <div className="rating" style={{ color: 'var(--color-text-light)' }}>
                        <MapPin size={12} /> {i % 2 === 0 ? 'Kumasi, Ghana' : 'Accra, Ghana'}
                      </div>
                    </div>
                  </div>
                  <div className="tags" style={{ marginTop: '8px' }}>
                    {MOCK_CONTRACTOR.tags.slice(0, 3 - (i % 2)).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <button className="btn btn-secondary" style={{ marginTop: '16px', width: '100%' }}>View Profile</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bidding' && (
          <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '8px' }}>Active Listing: Plot 42, East Legon</h3>
                <p style={{ color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={16} /> 0.5 Acres • Residential Zoning
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>{MOCK_BIDS.length}</div>
                <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Active Bids</div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '16px' }}>Current Offers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MOCK_BIDS.map((bid, i) => (
                  <div key={bid.id} className="glass-panel animate-slide-up" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animationDelay: `${i * 0.1}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: 'var(--color-accent)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{bid.developer}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{bid.time}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>{bid.amount}</div>
                        <span style={{ fontSize: '0.85rem', color: bid.status === 'Active' ? '#10B981' : '#EF4444', fontWeight: '500' }}>{bid.status}</span>
                      </div>
                      <button className="btn btn-primary" disabled={bid.status !== 'Active'}>
                        Accept Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
