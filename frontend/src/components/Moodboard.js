import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Moodboard = ({ items, onItemClick, onRemoveItem }) => {
  // Se non ci sono elementi pinnati, mostro un messaggio
  if (items.length === 0) {
    return (
      <div className="bg-brand-bg rounded-lg shadow-md p-8 text-center border border-brand-accent/30">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-brand-accent/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-brand-accent mb-2">La tua moodboard è vuota</h3>
        <p className="text-brand-text/70 mb-6">Aggiungi prodotti alla tua moodboard cliccando sull'icona + quando visualizzi un prodotto.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded hover:bg-brand-accent/20 transition-colors"
        >
          Torna alla chat
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg rounded-lg shadow-md border border-brand-accent/30 overflow-hidden">
      <div className="p-4 border-b border-brand-accent/30">
        <h2 className="text-xl font-semibold text-brand-accent">La tua Moodboard</h2>
        <p className="text-brand-text/70">Raccolta di {items.length} prodotti salvati</p>
      </div>
      
      <div className="moodboard-container">
        {items.map(item => {
          // Ottieni l'immagine principale
          const imageSrc = item.image_urls && item.image_urls.length > 0
            ? item.image_urls[0]
            : 'https://via.placeholder.com/300x200?text=Immagine+non+disponibile';
            
          return (
            <div key={item.id} className="relative group">
              {/* Prodotto */}
              <div 
                className="rounded-lg overflow-hidden shadow-md border border-brand-accent/20 bg-brand-bg/80 cursor-pointer transform transition hover:shadow-lg hover:shadow-brand-accent/20"
                onClick={() => onItemClick(item)}
              >
                <div className="aspect-square overflow-hidden bg-brand-bg/50">
                  <img 
                    src={imageSrc}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=Errore+immagine';
                    }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-brand-accent truncate">{item.name}</h3>
                  <p className="text-sm text-brand-text/70 truncate">{item.manufacturer}</p>
                </div>
              </div>
              
              {/* Pulsante rimuovi */}
              <button
                className="absolute top-2 right-2 bg-brand-accent rounded-full p-1 text-brand-bg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveItem(item)}
                aria-label="Rimuovi dalla moodboard"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Moodboard; 