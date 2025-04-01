import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

// Componente ottimizzato per le card dei prodotti
const ProductCard = React.memo(({ product, onAddToMoodboard }) => {
  const handleClick = useCallback(() => {
    onAddToMoodboard(product);
  }, [product, onAddToMoodboard]);

  return (
    <div className="product-card" onClick={handleClick}>
      <img 
        src={product.image_url} 
        alt={product.name} 
        className="product-image"
        loading="lazy"
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-manufacturer">{product.manufacturer}</p>
        <p className="product-description">{product.description}</p>
        <div className="product-tags">
          {product.tags?.map((tag, index) => (
            <span key={index} className="product-tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
});

// Componente ottimizzato per i messaggi
const Message = React.memo(({ message, onAddToMoodboard }) => {
  const renderContent = useCallback(() => {
    try {
      const content = JSON.parse(message.content);
      if (content.type === 'product_list' || content.type === 'product_suggestion') {
        return (
          <div className="message-content">
            <p className="message-text">{content.message}</p>
            <div className="products-grid">
              {content.products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToMoodboard={onAddToMoodboard}
                />
              ))}
            </div>
          </div>
        );
      }
    } catch (e) {
      return <p className="message-text">{message.content}</p>;
    }
    return <p className="message-text">{message.content}</p>;
  }, [message, onAddToMoodboard]);

  return (
    <div className={`message ${message.role}-message`}>
      {renderContent()}
    </div>
  );
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [moodboard, setMoodboard] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const chatContainer = chatContainerRef.current;
      const { scrollHeight, clientHeight, scrollTop } = chatContainer;
      const isScrolledToBottom = scrollHeight - clientHeight <= scrollTop + 100;

      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, si è verificato un errore. Riprova tra qualche istante.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addToMoodboard = useCallback((product) => {
    setMoodboard(prev => {
      if (!prev.find(item => item.id === product.id)) {
        return [...prev, product];
      }
      return prev;
    });
  }, []);

  const removeFromMoodboard = useCallback((productId) => {
    setMoodboard(prev => prev.filter(item => item.id !== productId));
  }, []);

  const moodboardItems = useMemo(() => (
    moodboard.map(product => (
      <div key={product.id} className="moodboard-item">
        <img src={product.image_url} alt={product.name} loading="lazy" />
        <button 
          className="remove-pin"
          onClick={() => removeFromMoodboard(product.id)}
        >
          <FiX size={16} />
        </button>
      </div>
    ))
  ), [moodboard, removeFromMoodboard]);

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="chat-title">Chat</h2>
        </div>
        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((message, index) => (
            <Message 
              key={index} 
              message={message} 
              onAddToMoodboard={addToMoodboard}
            />
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

      <div className="moodboard-sidebar">
        <div className="moodboard-header">
          <h2 className="moodboard-title">Moodboard</h2>
        </div>
        <div className="moodboard-grid">
          {moodboardItems}
        </div>
      </div>
    </div>
  );
}

export default App; 