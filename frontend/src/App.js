import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatMessage from './components/ChatMessage';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import Moodboard from './components/Moodboard';
import { sendMessage } from './services/api';
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
    <div className="min-h-screen bg-brand-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            {/* Spazio per il logo */}
            <div className="w-12 h-12 mr-3 flex items-center justify-center rounded bg-brand-accent/20">
              {/* Inseriremo il logo qui quando sarà disponibile */}
              {/* <img src={Logo} alt="Architetto AI Logo" className="w-10 h-10" /> */}
              <span className="text-brand-accent font-bold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-accent">Architetto AI</h1>
          </div>
          
          <div className="flex space-x-2">
            <button 
              className={`tab-button ${activeTab === 'chat' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('chat')}
            >
              <ChatBubbleLeftIcon className="h-5 w-5 inline mr-2" />
              Chat
            </button>
            <button 
              className={`tab-button ${activeTab === 'moodboard' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('moodboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Moodboard ({pinnedItems.length})
            </button>
          </div>
        </header>

        {/* Area principale dell'applicazione */}
        <main className="flex flex-col lg:flex-row gap-6">
          
          {/* Sezione Chat o Moodboard (a seconda del tab attivo) */}
          <div className="flex-1">
            {activeTab === 'chat' ? (
              <div className="chat-container">
                <div className="message-container">
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={index} 
                      message={message}
                      loading={false}
                    />
                  ))}
                  {isLoading && (
                    <ChatMessage 
                      message={{ role: 'assistant', content: '' }}
                      loading={true}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="input-container">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Scrivi un messaggio..."
                      className="chat-input pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || input.trim() === ''}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-brand-accent hover:text-brand-accent/80 disabled:text-brand-accent/40"
                    >
                      <PaperAirplaneIcon className="h-6 w-6" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <Moodboard 
                items={pinnedItems} 
                onItemClick={handleProductClick} 
                onRemoveItem={togglePin} 
              />
            )}
          </div>
          
          {/* Sezione per i prodotti trovati (solo visibile in modalità chat) */}
          {activeTab === 'chat' && foundProducts.length > 0 && (
            <div className="lg:w-1/3 space-y-4">
              <h2 className="text-xl font-semibold text-brand-accent">Prodotti correlati</h2>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {foundProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => handleProductClick(product)}
                    isPinned={isPinned(product.id)}
                    onTogglePin={() => togglePin(product)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

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