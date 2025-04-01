import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatMessage from './components/ChatMessage';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import Moodboard from './components/Moodboard';
import { sendMessage } from './services/api';
import { FiHome, FiMessageSquare, FiGrid, FiBarChart2, FiSettings } from 'react-icons/fi';
import { IoSendSharp } from 'react-icons/io5';
import { FiSend, FiX } from 'react-icons/fi';
import { BsGrid, BsChatSquareText, BsHouse, BsBarChart, BsGear } from 'react-icons/bs';
import { MdMoodboard } from 'react-icons/md';
// Successivamente, importeremo il logo qui: import Logo from './assets/logo.png';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [moodboard, setMoodboard] = useState([]);
  const [showMoodboard, setShowMoodboard] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await sendMessage([...messages, { role: 'user', content: userMessage }]);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMoodboard = () => {
    setShowMoodboard(!showMoodboard);
  };

  const addToMoodboard = (product) => {
    if (!moodboard.find(item => item.id === product.id)) {
      setMoodboard(prev => [...prev, product]);
    }
  };

  const removeFromMoodboard = (productId) => {
    setMoodboard(prev => prev.filter(item => item.id !== productId));
  };

  return (
    <div className="app-container">
      {/* Sidebar sinistra - Prodotti */}
      <div className="products-sidebar">
        <div className="products-header">
          <h2 className="products-title">Prodotti</h2>
        </div>
        <div className="products-list">
          {products.map(product => (
            <div key={product.id} className="product-card" onClick={() => addToMoodboard(product)}>
              <img src={product.image_url} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Area centrale - Chat */}
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="chat-title">Chat</h2>
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}-message`}>
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="chat-input"
              disabled={loading}
            />
            <button type="submit" className="send-button" disabled={loading}>
              <FiSend size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar destra - Moodboard */}
      <div className="moodboard-sidebar">
        <div className="moodboard-header">
          <h2 className="moodboard-title">Moodboard</h2>
        </div>
        <div className="moodboard-grid">
          {moodboard.map(product => (
            <div key={product.id} className="moodboard-item">
              <img src={product.image_url} alt={product.name} />
              <button 
                className="remove-pin"
                onClick={() => removeFromMoodboard(product.id)}
              >
                <FiX size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App; 