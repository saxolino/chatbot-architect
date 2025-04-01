import React, { useState } from 'react';

const ProductDetails = ({ product, isPinned, onTogglePin }) => {
  const [activeTab, setActiveTab] = useState('info'); // 'info' o 'assets'
  const [activeImage, setActiveImage] = useState(0);

  // Placeholder per immagini mancanti
  const defaultImage = 'https://via.placeholder.com/600x400?text=Immagine+non+disponibile';

  // Ottieni l'immagine principale
  const mainImage = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[activeImage]
    : defaultImage;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-accent">{product.name}</h2>
          <p className="text-brand-text/90">
            {product.manufacturer} 
            {product.designer && product.designer !== 'N/A' && ` · Design di ${product.designer}`}
          </p>
        </div>
        <button
          onClick={onTogglePin}
          className={`flex items-center px-3 py-1.5 rounded-md text-brand-bg ${isPinned ? 'bg-red-500' : 'bg-brand-accent'}`}
        >
          {isPinned ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Rimuovi
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Aggiungi alla Moodboard
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-brand-accent/30 mb-6">
        <div className="flex -mb-px">
          <button
            className={`mr-4 py-2 px-1 ${
              activeTab === 'info'
                ? 'border-b-2 border-brand-accent text-brand-accent font-medium'
                : 'text-brand-text/70 hover:text-brand-accent/70'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Informazioni
          </button>
          <button
            className={`py-2 px-1 ${
              activeTab === 'assets'
                ? 'border-b-2 border-brand-accent text-brand-accent font-medium'
                : 'text-brand-text/70 hover:text-brand-accent/70'
            }`}
            onClick={() => setActiveTab('assets')}
          >
            Asset & Documenti
          </button>
        </div>
      </div>

      {/* Contenuto del tab */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Immagini (sempre visibili) */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden bg-brand-bg/50 border border-brand-accent/20 mb-4">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-64 lg:h-80 object-contain"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
          </div>

          {/* Thumbnails delle immagini, se ce ne sono più di una */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.image_urls.map((url, index) => (
                <button
                  key={index}
                  className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${
                    index === activeImage ? 'ring-2 ring-brand-accent' : 'opacity-70 border border-brand-accent/20'
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <img
                    src={url}
                    alt={`${product.name} - immagine ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=Errore';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dettagli (condizionali in base al tab) */}
        <div className="lg:col-span-3">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Descrizione */}
              <div>
                <h3 className="text-lg font-semibold text-brand-accent mb-2">Descrizione</h3>
                <p className="text-brand-text/90">{product.description}</p>
              </div>

              {/* Specifiche */}
              <div>
                <h3 className="text-lg font-semibold text-brand-accent mb-2">Specifiche</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-accent/80">Categoria</p>
                    <p className="text-brand-text">{product.category}</p>
                  </div>
                  {product.materials && (
                    <div>
                      <p className="text-sm text-brand-accent/80">Materiali</p>
                      <p className="text-brand-text">{product.materials}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <p className="text-sm text-brand-accent/80">Dimensioni</p>
                      <p className="text-brand-text">{product.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-brand-accent mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-brand-accent/10 text-brand-text border border-brand-accent/20 text-sm rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-brand-accent mb-4">Asset e Documenti Tecnici</h3>
              
              {product.asset_urls && product.asset_urls.length > 0 ? (
                <div className="space-y-3">
                  {product.asset_urls.map((url, index) => {
                    // Estrai il nome del file dall'URL
                    const fileName = url.split('/').pop();
                    // Determina il tipo di file
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                    const isPDF = /\.pdf$/i.test(fileName);
                    const isDWG = /\.(dwg|dxf)$/i.test(fileName);
                    const isDoc = /\.(doc|docx)$/i.test(fileName);
                    
                    let icon;
                    if (isPDF) {
                      icon = "📄"; // Icona PDF
                    } else if (isDWG) {
                      icon = "🏗️"; // Icona CAD
                    } else if (isImage) {
                      icon = "🖼️"; // Icona immagine
                    } else if (isDoc) {
                      icon = "📝"; // Icona documento
                    } else {
                      icon = "📁"; // Icona generica
                    }
                    
                    return (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-brand-accent/30 rounded-lg hover:bg-brand-accent/10 transition-colors"
                      >
                        <span className="text-2xl mr-3">{icon}</span>
                        <div>
                          <p className="font-medium text-brand-accent">{fileName}</p>
                          <p className="text-sm text-brand-text/70">
                            {isPDF ? 'PDF' : isDWG ? 'File CAD' : isImage ? 'Immagine' : isDoc ? 'Documento' : 'File'}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-brand-text/50 italic">Nessun asset disponibile per questo prodotto.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 