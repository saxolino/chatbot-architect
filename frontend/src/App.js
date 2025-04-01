import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatMessage from './components/ChatMessage';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import Moodboard from './components/Moodboard';
import { sendMessage } from './services/api';
import { FiHome, FiMessageSquare, FiGrid, FiBarChart2, FiSettings } from 'react-icons/fi';
import { IoSendSharp } from 'react-icons/io5';
// Successivamente, importeremo il logo qui: import Logo from './assets/logo.png';

function App() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Ciao! Sono il tuo assistente virtuale per l\'architettura. Come posso aiutarti oggi?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [foundProducts, setFoundProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pinnedItems, setPinnedItems] = useState([]);
  const messagesEndRef = useRef(null);
  const [showMoodboard, setShowMoodboard] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage([...messages, userMessage]);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.reply 
      }]);
      
      if (response.products && response.products.length > 0) {
        setFoundProducts(response.products);
      }
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const togglePin = (product) => {
    // Verifica se il prodotto è già pinnato
    const isPinned = pinnedItems.some(item => item.id === product.id);
    
    if (isPinned) {
      // Rimuovi il prodotto dalla moodboard
      setPinnedItems(pinnedItems.filter(item => item.id !== product.id));
    } else {
      // Aggiungi il prodotto alla moodboard
      setPinnedItems([...pinnedItems, product]);
    }
  };

  const isPinned = (productId) => {
    return pinnedItems.some(item => item.id === productId);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-icon active">
          <FiHome size={24} />
        </div>
        <div className="sidebar-icon">
          <FiMessageSquare size={24} />
        </div>
        <div className="sidebar-icon">
          <FiGrid size={24} />
        </div>
        <div className="sidebar-icon">
          <FiBarChart2 size={24} />
        </div>
        <div className="sidebar-icon">
          <FiSettings size={24} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            <span className="text-xl font-semibold">AI Assistant</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowMoodboard(!showMoodboard)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                showMoodboard ? 'bg-[#DEFF00]' : 'bg-gray-100'
              }`}
            >
              {showMoodboard ? 'Chat' : 'Moodboard'}
            </button>
            <div className="user-avatar" />
          </div>
        </header>

        {/* Chat Interface */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user' : 'assistant'} fade-in`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant fade-in">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="chat-input"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || input.trim() === ''} className="send-button">
                <IoSendSharp size={20} />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Products Sidebar */}
      {foundProducts.length > 0 && !showMoodboard && (
        <aside className="products-sidebar">
          <h2 className="text-lg font-semibold mb-4">Prodotti Correlati</h2>
          <div className="space-y-4">
            {foundProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image" />
                <h3 className="font-medium mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.short_description}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Moodboard */}
      {showMoodboard && (
        <div className="products-sidebar">
          <Moodboard 
            items={pinnedItems} 
            onItemClick={handleProductClick} 
            onRemoveItem={togglePin} 
          />
        </div>
      )}

      {/* Modale per visualizzare i dettagli del prodotto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-bg rounded-lg shadow-xl shadow-brand-accent/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-brand-accent/30">
            <div className="flex justify-end p-2">
              <button 
                onClick={closeProductDetails}
                className="p-1 rounded-full hover:bg-brand-accent/20 text-brand-accent"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <ProductDetails 
              product={selectedProduct} 
              isPinned={isPinned(selectedProduct.id)}
              onTogglePin={() => togglePin(selectedProduct)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 