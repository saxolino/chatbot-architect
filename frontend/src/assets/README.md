# Integrazione Logo

Per integrare il logo in questa applicazione:

1. Aggiungere il file del logo in questa cartella (`frontend/src/assets/`)
2. Rinominare il file in `logo.png` o `logo.svg` (preferibilmente in formato SVG per una migliore scalabilità)
3. Modificare il file `App.js` per importare e utilizzare il logo:

```jsx
// In App.js, sostituire:
// import logo from './assets/logo.png'; // Logo - da decommentare quando disponibile
// con:
import logo from './assets/logo.png'; // o logo.svg se in formato SVG

// E sostituire:
// {/* <img src={logo} alt="ArchBot Logo" className="h-8" /> */}
// <span className="text-brand-accent font-bold">A</span>
// con:
<img src={logo} alt="ArchBot Logo" className="h-8" />
```

Il codice è già predisposto per supportare facilmente l'integrazione del logo una volta disponibile. 