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

// Endpoint per la chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Formato messaggi non valido' });
    }

    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Verifica se l'utente sta chiedendo di vedere tutti i prodotti
    if (userMessage.match(/mostrami (tutti )?i prodotti|che prodotti (hai|avete|ci sono)/i)) {
      // Raggruppa i prodotti per categoria
      const productsByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {});

      // Crea una risposta strutturata
      const response = "Ecco i prodotti disponibili nel nostro catalogo, organizzati per categoria:\n\n" +
        Object.entries(productsByCategory)
          .map(([category, prods]) => 
            `${category}:\n${prods.map(p => `- ${p.name} (${p.manufacturer})`).join('\n')}`)
          .join('\n\n');

      return res.json({
        reply: response,
        products: products.slice(0, 10) // Mostra i primi 10 prodotti nella sidebar
      });
    }

    const productSearchKeywords = [
      'prodotto', 'prodotti', 'materiale', 'materiali', 
      'cerca', 'trovare', 'mostrami', 'consigli',
      'sedia', 'tavolo', 'lampada', 'divano', 'parquet',
      'mattone', 'finestra', 'porta', 'isolante', 'sanitario',
      'poltrona', 'poltrone'
    ];
    
    const isProductSearch = productSearchKeywords.some(keyword => 
      userMessage.includes(keyword)
    );
    
    if (isProductSearch) {
      const foundProducts = await searchProducts(userMessage);
      
      if (foundProducts.length > 0) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Sei un esperto di design e architettura che lavora con un catalogo specifico di prodotti. 
                       Analizza i prodotti trovati e rispondi alla domanda dell'utente in modo specifico e dettagliato, 
                       facendo riferimento SOLO ai prodotti disponibili nel nostro catalogo. 
                       NON suggerire prodotti che non sono nel nostro catalogo.
                       Se l'utente chiede di vedere tutti i prodotti, suggerigli di scrivere "mostrami i prodotti".`
            },
            ...messages,
            {
              role: "system",
              content: `Ho trovato ${foundProducts.length} prodotti pertinenti nel nostro catalogo. Ecco i dettagli: ${
                foundProducts.map(p => `${p.name} (${p.category}) di ${p.manufacturer}: ${p.short_description}`).join('. ')
              }`
            }
          ]
        });
        
        return res.json({
          reply: completion.choices[0].message.content,
          products: foundProducts
        });
      }
    }
    
    // Risposta normale della chat
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Sei un assistente AI specializzato in architettura e design. 
                   Rispondi come un esperto del settore, offrendo consigli pratici e suggerimenti.
                   Se l'utente chiede informazioni sui prodotti, ricordagli che può vedere il catalogo 
                   completo scrivendo "mostrami i prodotti".`
        },
        ...messages
      ]
    });
    
    res.json({ 
      reply: completion.choices[0].message.content,
      products: [] 
    });
    
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

// Funzione per cercare prodotti
async function searchProducts(query) {
  // Ricerca testuale più precisa
  const textResults = products.filter(product => {
    const searchableText = `${product.name} ${product.description} ${product.category} 
                          ${product.manufacturer} ${product.materials} ${product.tags.join(' ')}`.toLowerCase();
    
    // Dividi la query in parole e cerca corrispondenze esatte
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    return queryWords.every(word => searchableText.includes(word));
  });

  // Ricerca semantica con OpenAI Embeddings
  const semanticResults = await getSemanticResults(query, products);
  
  // Unisci i risultati dando priorità ai risultati testuali esatti
  const combinedResults = [...new Set([...textResults, ...semanticResults])];
  
  // Ordina i risultati mettendo prima quelli che corrispondono esattamente alla categoria cercata
  return combinedResults
    .sort((a, b) => {
      const aMatchesCategory = a.category.toLowerCase().includes(query.toLowerCase());
      const bMatchesCategory = b.category.toLowerCase().includes(query.toLowerCase());
      if (aMatchesCategory && !bMatchesCategory) return -1;
      if (!aMatchesCategory && bMatchesCategory) return 1;
      return 0;
    })
    .slice(0, 10);
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

startServer(); 