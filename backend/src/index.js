require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs').promises;
const { calculateSimilarity } = require('./utils/semanticSearch');

// Inizializzazione Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://architect-chatbot-frontend.onrender.com', 'http://localhost:3000']
}));
app.use(express.json());

// Configurazione OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Carica il database dei prodotti
let products = [];
// Cache per gli embedding dei prodotti
let productEmbeddings = {};

// Cache per gli embedding e le risposte
const embeddingCache = new Map();
const responseCache = new Map();
const CACHE_DURATION = 3600000; // 1 ora in millisecondi

// Route di test
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Server attivo',
    timestamp: new Date().toISOString()
  });
});

// Route di test per i prodotti
app.get('/api/test', async (req, res) => {
  try {
    res.json({ 
      status: 'ok',
      productsLoaded: products.length,
      firstProduct: products[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel test' });
  }
});

// Funzione per generare una chiave di cache
function generateCacheKey(messages) {
  return messages.map(m => `${m.role}:${m.content}`).join('|');
}

// Endpoint per la chat ottimizzato
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Formato messaggi non valido' });
    }

    const userMessage = messages[messages.length - 1].content.toLowerCase();
    const cacheKey = generateCacheKey(messages);

    // Controlla se abbiamo una risposta in cache
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Verifica se l'utente sta chiedendo di vedere tutti i prodotti
    if (userMessage.match(/mostrami (tutti )?i prodotti|che prodotti (hai|avete|ci sono)|catalogo|lista( dei)? prodotti/i)) {
      const response = {
        type: 'product_list',
        message: 'Ecco i prodotti disponibili nel nostro catalogo:',
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          manufacturer: product.manufacturer,
          category: product.category,
          description: product.short_description,
          image_url: product.image_url,
          materials: product.materials,
          tags: product.tags
        }))
      };

      const jsonResponse = {
        reply: JSON.stringify(response),
        products: response.products
      };

      // Cache la risposta
      responseCache.set(cacheKey, jsonResponse);
      setTimeout(() => responseCache.delete(cacheKey), CACHE_DURATION);

      return res.json(jsonResponse);
    }

    // Analisi dell'intento più veloce con prompt ottimizzato
    const intentAnalysis = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Rispondi solo 'true' se il messaggio riguarda prodotti, 'false' altrimenti."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.1,
      max_tokens: 5
    });

    const isProductRelated = intentAnalysis.choices[0].message.content.trim().toLowerCase() === 'true';
    
    if (isProductRelated) {
      // Ricerca prodotti ottimizzata
      const searchResults = await searchProducts(userMessage);
      
      if (searchResults.length > 0) {
        const response = {
          type: 'product_suggestion',
          message: `Ho trovato ${searchResults.length} prodotti che potrebbero interessarti:`,
          products: searchResults.map(product => ({
            id: product.id,
            name: product.name,
            manufacturer: product.manufacturer,
            category: product.category,
            description: product.short_description,
            image_url: product.image_url,
            materials: product.materials,
            tags: product.tags
          }))
        };

        const jsonResponse = {
          reply: JSON.stringify(response),
          products: response.products
        };

        // Cache la risposta
        responseCache.set(cacheKey, jsonResponse);
        setTimeout(() => responseCache.delete(cacheKey), CACHE_DURATION);

        return res.json(jsonResponse);
      }
    }
    
    // Risposta normale della chat ottimizzata
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Sei un assistente esperto in architettura e design. Rispondi in modo conciso e professionale.`
        },
        ...messages
      ],
      temperature: 0.7
    });
    
    const jsonResponse = { 
      reply: completion.choices[0].message.content,
      products: [] 
    };

    // Cache la risposta
    responseCache.set(cacheKey, jsonResponse);
    setTimeout(() => responseCache.delete(cacheKey), CACHE_DURATION);

    res.json(jsonResponse);
    
  } catch (error) {
    console.error('Errore nell\'API chat:', error);
    res.status(500).json({ error: 'Errore durante l\'elaborazione della richiesta' });
  }
});

// Endpoint per cercare prodotti
app.post('/api/products/search', async (req, res) => {
  try {
    const { query } = req.body;
    const results = await searchProducts(query);
    res.json(results);
  } catch (error) {
    console.error('Errore nella ricerca prodotti:', error);
    res.status(500).json({ error: 'Errore durante la ricerca dei prodotti' });
  }
});

// Endpoint per ottenere un prodotto per ID
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Prodotto non trovato' });
  }
  
  res.json(product);
});

// Endpoint per la moodboard
app.post('/api/moodboard/pin', (req, res) => {
  // In una vera applicazione, qui si salverebbe il pin in un database
  // Per questo esempio, restituiamo solo una conferma
  res.json({ success: true, message: 'Prodotto pinnato con successo' });
});

app.delete('/api/moodboard/unpin/:id', (req, res) => {
  // In una vera applicazione, qui si rimuoverebbe il pin dal database
  // Per questo esempio, restituiamo solo una conferma
  res.json({ success: true, message: 'Prodotto rimosso dalla moodboard' });
});

// Funzione di ricerca prodotti ottimizzata
async function searchProducts(query) {
  // Normalizza la query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Cerca nella cache degli embedding
  if (embeddingCache.has(normalizedQuery)) {
    return embeddingCache.get(normalizedQuery);
  }

  // Ricerca testuale veloce
  const textResults = products.filter(product => {
    const searchableText = `${product.name} ${product.category} ${product.tags.join(' ')}`.toLowerCase();
    return normalizedQuery.split(' ').some(word => searchableText.includes(word));
  });

  // Se abbiamo abbastanza risultati testuali, evitiamo la ricerca semantica
  if (textResults.length >= 5) {
    embeddingCache.set(normalizedQuery, textResults.slice(0, 10));
    setTimeout(() => embeddingCache.delete(normalizedQuery), CACHE_DURATION);
    return textResults.slice(0, 10);
  }

  // Ricerca semantica solo se necessario
  const semanticResults = await getSemanticResults(query, products);
  const combinedResults = [...new Set([...textResults, ...semanticResults])].slice(0, 10);
  
  // Cache i risultati
  embeddingCache.set(normalizedQuery, combinedResults);
  setTimeout(() => embeddingCache.delete(normalizedQuery), CACHE_DURATION);
  
  return combinedResults;
}

// Implementazione della ricerca semantica con OpenAI
async function getSemanticResults(query, productList) {
  try {
    // Genera embedding per la query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    
    // Array per memorizzare i prodotti con le loro similarità
    let productsWithSimilarity = [];
    
    // Processa ogni prodotto
    for (const product of productList) {
      // Ottieni o genera l'embedding del prodotto
      let productEmbedding;
      
      if (productEmbeddings[product.id]) {
        // Usa l'embedding cached
        productEmbedding = productEmbeddings[product.id];
      } else {
        // Combina i campi rilevanti per generare un embedding migliore
        const textToEmbed = `${product.name}. ${product.short_description} ${product.description}. 
                            Categoria: ${product.category}. Materiali: ${product.materials}. 
                            Produttore: ${product.manufacturer}. ${product.tags.join(', ')}`;
        
        // Genera l'embedding
        try {
          const productEmbeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textToEmbed,
          });
          
          productEmbedding = productEmbeddingResponse.data[0].embedding;
          
          // Cache l'embedding per usi futuri
          productEmbeddings[product.id] = productEmbedding;
          
          // Piccola pausa per evitare di superare i rate limit dell'API
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Errore nel generare l'embedding per il prodotto ${product.id}:`, error);
          continue; // Salta questo prodotto
        }
      }
      
      // Calcola la similarità con la query
      const similarity = calculateSimilarity(queryEmbedding, productEmbedding);
      
      // Aggiungi il prodotto con la sua similarità
      productsWithSimilarity.push({ product, similarity });
    }
    
    // Ordina per similarità e prendi i top 5
    return productsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.product);
      
  } catch (error) {
    console.error('Errore nella ricerca semantica:', error);
    return []; // Fallback alla ricerca testuale in caso di errore
  }
}

// Carica i dati dei prodotti all'avvio
async function loadProducts() {
  try {
    const dataPath = path.join(__dirname, '../../data/products.json');
    const data = await fs.readFile(dataPath, 'utf8');
    products = JSON.parse(data);
    console.log(`Caricati ${products.length} prodotti.`);
  } catch (error) {
    console.error('Errore nel caricamento dei prodotti:', error);
    // Fallback a un array vuoto
    products = [];
  }
}

// Avvia il server
async function startServer() {
  await loadProducts();
  
  app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
  });
}

// Funzione helper per assegnare emoji alle categorie
function getCategoryEmoji(category) {
  const emojiMap = {
    'Sedie': '🪑',
    'Tavoli': '🪑',
    'Illuminazione': '💡',
    'Divani': '🛋️',
    'Letti': '🛏️',
    'Armadi': '🗄️',
    'Decorazioni': '🎭',
    'Tappeti': '🏺',
    'Cucina': '🍳',
    'Bagno': '🚿',
    'Outdoor': '🌳',
    'Ufficio': '💼',
    'Storage': '📦'
  };
  return emojiMap[category] || '📌';
}

startServer(); 