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
    
    // Prima analizziamo il messaggio con GPT per capire l'intento dell'utente
    const intentAnalysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Analizza il messaggio dell'utente e determina se sta cercando informazioni sui prodotti.
                   Rispondi solo con "true" o "false".
                   Esempi di richieste prodotti:
                   - Domande dirette sui prodotti ("che sedie avete?")
                   - Domande indirette ("vorrei arredare il soggiorno")
                   - Richieste di consigli ("cosa mi consigli per l'illuminazione?")
                   - Domande su materiali o stili ("hai qualcosa in legno?")
                   - Richieste di confronto ("qual è meglio tra...")
                   - Domande su caratteristiche ("hai prodotti per esterni?")`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const isProductRelated = intentAnalysis.choices[0].message.content.trim().toLowerCase() === 'true';
    
    // Verifica se l'utente sta chiedendo di vedere tutti i prodotti
    if (userMessage.match(/mostrami (tutti )?i prodotti|che prodotti (hai|avete|ci sono)|catalogo|lista( dei)? prodotti/i)) {
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
        products: products.slice(0, 10)
      });
    }

    if (isProductRelated) {
      // Usa GPT per generare una query di ricerca ottimizzata
      const searchQueryAnalysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analizza il messaggio dell'utente ed estrai le parole chiave più rilevanti per la ricerca di prodotti.
                     Considera: categorie, materiali, stili, utilizzi, caratteristiche.
                     Rispondi solo con le parole chiave separate da spazio.`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      });

      const searchQuery = searchQueryAnalysis.choices[0].message.content.trim();
      const foundProducts = await searchProducts(searchQuery);
      
      if (foundProducts.length > 0) {
        // Miglioriamo il prompt per la risposta
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Sei un esperto di design e architettura che conosce perfettamente il catalogo prodotti.
                       
                       Linee guida per la risposta:
                       1. Analizza attentamente la domanda dell'utente
                       2. Fai riferimento SOLO ai prodotti trovati nel catalogo
                       3. Spiega perché i prodotti suggeriti sono adatti
                       4. Se pertinente, suggerisci combinazioni di prodotti
                       5. Menziona caratteristiche specifiche e materiali
                       6. Se la domanda è vaga, fai domande per capire meglio le esigenze
                       7. Se mancano prodotti rilevanti, suggerisci di vedere il catalogo completo
                       
                       NON suggerire mai prodotti che non sono nel nostro catalogo.`
            },
            ...messages,
            {
              role: "system",
              content: `Ho trovato ${foundProducts.length} prodotti pertinenti nel nostro catalogo. 
                       
                       Dettagli prodotti:
                       ${foundProducts.map(p => 
                         `- ${p.name} (${p.category})
                          Produttore: ${p.manufacturer}
                          Descrizione: ${p.short_description}
                          Materiali: ${p.materials}
                          Tags: ${p.tags.join(', ')}`
                       ).join('\n\n')}`
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
          content: `Sei un assistente AI specializzato in architettura e design che conosce il catalogo prodotti.
                   
                   Linee guida:
                   1. Rispondi come un esperto del settore
                   2. Se la domanda potrebbe essere correlata a prodotti, suggerisci di esplorare il catalogo
                   3. Puoi suggerire di vedere il catalogo completo scrivendo "mostrami i prodotti"
                   4. Puoi suggerire di fare domande specifiche sui prodotti per ricevere consigli mirati
                   5. Mantieni sempre un tono professionale ma amichevole`
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
    
    // Dividi la query in parole e cerca corrispondenze parziali
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    return queryWords.some(word => {
      // Cerca corrispondenze esatte o parziali
      return searchableText.includes(word) || 
             product.tags.some(tag => tag.toLowerCase().includes(word)) ||
             product.category.toLowerCase().includes(word);
    });
  });

  // Ricerca semantica con OpenAI Embeddings
  const semanticResults = await getSemanticResults(query, products);
  
  // Unisci i risultati dando priorità ai risultati testuali esatti
  const combinedResults = [...new Set([...textResults, ...semanticResults])];
  
  // Ordina i risultati per rilevanza
  return combinedResults
    .sort((a, b) => {
      // Calcola un punteggio di rilevanza per ogni prodotto
      const getRelevanceScore = (product) => {
        let score = 0;
        const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        
        // Punti per corrispondenza nella categoria
        if (product.category.toLowerCase().includes(query.toLowerCase())) score += 3;
        
        // Punti per corrispondenza nei tag
        product.tags.forEach(tag => {
          if (queryWords.some(word => tag.toLowerCase().includes(word))) score += 2;
        });
        
        // Punti per corrispondenza nel nome o descrizione
        if (product.name.toLowerCase().includes(query.toLowerCase())) score += 2;
        if (product.description.toLowerCase().includes(query.toLowerCase())) score += 1;
        
        return score;
      };
      
      return getRelevanceScore(b) - getRelevanceScore(a);
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