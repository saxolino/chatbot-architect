/**
 * Calcola la similarità del coseno tra due vettori di embedding
 * @param {Array<number>} embeddingA - Il primo vettore di embedding
 * @param {Array<number>} embeddingB - Il secondo vettore di embedding
 * @returns {number} - Valore di similarità tra 0 e 1
 */
function calculateSimilarity(embeddingA, embeddingB) {
  if (!embeddingA || !embeddingB || !embeddingA.length || !embeddingB.length) {
    throw new Error('Gli embedding devono essere array non vuoti');
  }
  
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Gli embedding devono avere la stessa dimensione');
  }
  
  // Calcola il prodotto scalare
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  // Calcola la similarità del coseno
  return dotProduct / (normA * normB);
}

/**
 * Genera embedding per il testo utilizzando l'API OpenAI
 * Nota: questa funzione è un placeholder, nell'implementazione reale 
 * dovresti usare openai.embeddings.create
 * @param {string} text - Il testo di cui generare l'embedding
 * @param {object} openai - L'istanza OpenAI configurata
 * @returns {Promise<Array<number>>} - Il vettore di embedding
 */
async function generateEmbedding(text, openai) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Errore nella generazione dell\'embedding:', error);
    throw error;
  }
}

/**
 * Pre-calcola gli embedding per tutti i prodotti
 * Utile per generare gli embedding una volta sola e salvarli
 * @param {Array<Object>} products - Array di prodotti
 * @param {object} openai - L'istanza OpenAI configurata
 * @returns {Promise<Array<Object>>} - Prodotti con embedding
 */
async function precomputeProductEmbeddings(products, openai) {
  const enrichedProducts = [];
  
  for (const product of products) {
    try {
      // Combina i campi rilevanti per generare un embedding migliore
      const textToEmbed = `${product.name}. ${product.short_description} ${product.description} 
                          Categoria: ${product.category}. Materiali: ${product.materials}. 
                          Produttore: ${product.manufacturer}. ${product.tags.join(', ')}`;
      
      const embedding = await generateEmbedding(textToEmbed, openai);
      
      enrichedProducts.push({
        ...product,
        embedding_vector: embedding
      });
      
      // Pausa per evitare di superare i rate limit dell'API
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Errore nel calcolo dell'embedding per il prodotto ${product.id}:`, error);
      // Aggiungi il prodotto senza embedding
      enrichedProducts.push({
        ...product,
        embedding_vector: []
      });
    }
  }
  
  return enrichedProducts;
}

module.exports = {
  calculateSimilarity,
  generateEmbedding,
  precomputeProductEmbeddings
}; 