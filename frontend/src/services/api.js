import axios from 'axios';

// URL base dell'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API_URL configurato:', API_URL);

// Crea un'istanza di axios con configurazione di base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per loggare le richieste
api.interceptors.request.use(request => {
  console.log('Richiesta in uscita:', request);
  return request;
});

// Interceptor per loggare le risposte
api.interceptors.response.use(
  response => {
    console.log('Risposta ricevuta:', response);
    return response;
  },
  error => {
    console.error('Errore nella richiesta:', error.response || error);
    return Promise.reject(error);
  }
);

/**
 * Invia un messaggio alla chat e ottiene una risposta
 * @param {Array} messages - Array di messaggi con format {role: 'user'|'assistant', content: string}
 * @returns {Promise<Object>} Risposta con il testo e gli eventuali prodotti trovati
 */
export const sendMessage = async (messages) => {
  try {
    const response = await api.post('/chat', { messages });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'invio del messaggio:', error);
    throw error;
  }
};

/**
 * Cerca prodotti nel database
 * @param {string} query - Stringa di ricerca
 * @returns {Promise<Array>} Array di prodotti trovati
 */
export const searchProducts = async (query) => {
  try {
    const response = await api.post('/products/search', { query });
    return response.data;
  } catch (error) {
    console.error('Errore nella ricerca dei prodotti:', error);
    throw error;
  }
};

/**
 * Ottiene i dettagli di un prodotto specifico
 * @param {number} id - ID del prodotto
 * @returns {Promise<Object>} Dati del prodotto
 */
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Errore nel recupero del prodotto ${id}:`, error);
    throw error;
  }
};

/**
 * Aggiunge un prodotto alla moodboard
 * @param {number} productId - ID del prodotto da pinnare
 * @returns {Promise<Object>} Conferma dell'operazione
 */
export const pinToMoodboard = async (productId) => {
  try {
    const response = await api.post('/moodboard/pin', { productId });
    return response.data;
  } catch (error) {
    console.error('Errore nel pinnare il prodotto:', error);
    throw error;
  }
};

/**
 * Rimuove un prodotto dalla moodboard
 * @param {number} productId - ID del prodotto da rimuovere
 * @returns {Promise<Object>} Conferma dell'operazione
 */
export const removeFromMoodboard = async (productId) => {
  try {
    const response = await api.delete(`/moodboard/unpin/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nella rimozione del prodotto dalla moodboard:', error);
    throw error;
  }
};

export default {
  sendMessage,
  searchProducts,
  getProductById,
  pinToMoodboard,
  removeFromMoodboard
}; 