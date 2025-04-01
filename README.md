# Chatbot AI per Architetti

Un'assistente virtuale per architetti basato su intelligenza artificiale con capacità di ricerca prodotti e creazione di moodboard.

## Funzionalità

* **Conversazione AI**: Risposte naturali alle domande degli architetti utilizzando le API di OpenAI.
* **Ricerca Prodotti**: Interrogazione di un database di prodotti per architettura e design tramite:
  * Ricerca testuale (per parole chiave)
  * Ricerca semantica (comprensione del significato della richiesta)
* **Schede Prodotto**: Visualizzazione dettagliata dei prodotti con:
  * Immagini
  * Descrizioni
  * Specifiche tecniche (materiali, dimensioni)
  * Link a documenti tecnici e asset (PDF, DWG, ecc.)
* **Moodboard**: Funzionalità in stile Pinterest per salvare e organizzare visivamente prodotti e materiali preferiti.
* **Interfaccia**: Design simile a ChatGPT/Gemini per un'esperienza intuitiva.

## Tecnologie

### Frontend
* **Framework**: React.js con Tailwind CSS
* **Componenti**: 
  * Chat UI in stile GPT
  * Schede prodotto dettagliate
  * Sistema moodboard interattivo

### Backend
* **API Server**: Node.js con Express
* **Database**: PostgreSQL con pgvector per ricerca semantica
* **AI**: 
  * OpenAI API per dialogo
  * Embedding di OpenAI per ricerca semantica

## Struttura del Progetto

```
chatbot/
├── frontend/           # App React per l'interfaccia utente
├── backend/            # Server Express e logica API
├── data/               # Dati di esempio incluso products.json
└── docs/               # Documentazione
```

## Configurazione

Il progetto richiede una chiave API OpenAI per funzionare. Le istruzioni per ottenere e configurare la chiave API saranno fornite nei file di documentazione.

## Database di Esempio

Un database di esempio con 20 prodotti per architetti è disponibile in `data/products.json`. Questo include mobili iconici, materiali da costruzione, finiture, illuminazione, sanitari e altri prodotti pertinenti per la progettazione architettonica. 