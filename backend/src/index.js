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
app.use(cors());
app.use(express.json());

// Configurazione OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Carica il database dei prodotti
let products = [];

// Endpoint API

// Endpoint per la chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Formato messaggi non valido' });
    }

    // Controlla se l'utente sta chiedendo di prodotti
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    const productSearchKeywords = [
      'prodotto', 'prodotti', 'materiale', 'materiali', 
      'cerca', 'trovare', 'mostrami', 'consigli',
      'sedia', 'tavolo', 'lampada', 'divano', 'parquet',
      'mattone', 'finestra', 'porta', 'isolante', 'sanitario'
    ];
    
    const isProductSearch = productSearchKeywords.some(keyword => 
      userMessage.includes(keyword)
    );
    
    if (isProductSearch) {
      // Cerca prodotti (testuale e semantico)
      const foundProducts = await searchProducts(userMessage);
      
      if (foundProducts.length > 0) {
        // Risposta AI con suggerimento di prodotti
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            ...messages,
            {
              role: "system",
              content: `Ho trovato ${foundProducts.length} prodotti che potrebbero interessare l'utente. Descrivi brevemente questi prodotti nell'ambito dell'architettura, facendo riferimento alle loro caratteristiche. Non elencare tutti i dettagli tecnici, verranno mostrati all'utente in un'interfaccia separata.`
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
          content: "Sei un assistente AI specializzato in architettura e design. Rispondi come un esperto del settore, offrendo consigli pratici e suggerimenti per materiali, fornitori e soluzioni progettuali."
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
  // Ricerca testuale semplice
  const textResults = products.filter(product => {
    const searchableText = `${product.name} ${product.description} ${product.category} 
                          ${product.manufacturer} ${product.materials} ${product.tags.join(' ')}`.toLowerCase();
    return query.toLowerCase().split(' ').some(word => 
      word.length > 2 && searchableText.includes(word)
    );
  });
  
  // Ricerca semantica (simulata in questo esempio)
  // In un'implementazione reale, qui si utilizzerebbe OpenAI Embeddings 
  // e una ricerca di similarità vettoriale
  const semanticResults = await getSemanticResults(query, products);
  
  // Unisci i risultati, rimuovi duplicati e limita a 10
  const combinedResults = [...new Set([...textResults, ...semanticResults])];
  return combinedResults.slice(0, 10);
}

async function getSemanticResults(query, productList) {
  try {
    // Genera embedding per la query
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = embedding.data[0].embedding;
    
    // Per semplicità, calcoliamo la similarità qui
    // In un'app reale questo verrebbe fatto nel database
    const results = productList.map(product => {
      // Se il prodotto non ha un embedding, usiamo un valore di similarità casuale per esempio
      // In un'app reale, tutti i prodotti avrebbero embeddings pre-calcolati
      const similarity = Math.random(); // Simulato per questo esempio
      return { product, similarity };
    });
    
    // Ordina per similarità e prendi i top 5
    return results
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