import React from 'react';

const ProductCard = ({ product, onClick, isPinned, onTogglePin }) => {
  const imageSrc = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : 'https://via.placeholder.com/150';

  return (
    <div 
      className="rounded-lg shadow-md overflow-hidden border border-brand-accent/20 bg-brand-bg hover:shadow-lg hover:shadow-brand-accent/20 transition-shadow relative group"
    >
      <div 
        className="cursor-pointer"
        onClick={() => onClick(product)}
      >
        <div className="aspect-video overflow-hidden bg-brand-bg/50">
          <img 
            src={imageSrc} 
            alt={product.name} 
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Immagine+non+disponibile';
            }}
          />
        </div>
        <div className="p-3">
          <h3 className="font-medium text-brand-accent truncate">{product.name}</h3>
          <p className="text-sm text-brand-text/70 truncate">{product.manufacturer}</p>
          <div className="flex flex-wrap mt-2">
            {product.tags && product.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded mr-1 mb-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        className={`absolute top-2 right-2 rounded-full p-1 ${
          isPinned 
            ? 'bg-red-500 text-white' 
            : 'bg-brand-accent text-brand-bg'
        } opacity-0 group-hover:opacity-100 transition-opacity`}
        onClick={() => onTogglePin(product)}
        aria-label={isPinned ? "Rimuovi dalla moodboard" : "Aggiungi alla moodboard"}
      >
        {isPinned ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ProductCard; 