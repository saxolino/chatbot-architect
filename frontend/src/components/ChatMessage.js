import React from 'react';

const ChatMessage = ({ message, loading }) => {
  const isUser = message.role === 'user';
  const messageClasses = isUser 
    ? "bg-brand-accent/20 text-brand-text rounded-tr-lg rounded-tl-lg rounded-bl-lg"
    : "bg-brand-bg border border-brand-accent/20 shadow-sm text-brand-text rounded-tr-lg rounded-tl-lg rounded-br-lg";
  
  return (
    <div className={`p-4 mb-4 max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
      <div className={`${messageClasses}`}>
        {loading ? (
          <div className="p-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-accent/40 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-brand-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-brand-accent/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <div className="p-4">
            {message.content}
          </div>
        )}
      </div>
      <div className={`text-xs mt-1 ${isUser ? 'text-right text-brand-text/50' : 'text-left text-brand-text/50'}`}>
        {isUser ? 'Tu' : 'ArchBot'}
      </div>
    </div>
  );
};

export default ChatMessage; 