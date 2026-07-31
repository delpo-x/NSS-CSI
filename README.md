# Carriera CSI

## Checklist manuale di verifica

### 1. Creazione e validazione player
- [ ] Aprire la pagina e verificare che la schermata di creazione si carichi senza errori.
- [ ] Verificare che nella scelta del girone vengano mostrati i gironi di Serie C senza duplicati.
- [ ] Selezionare una squadra del girone e controllare che il picker lo evidenzi correttamente.
- [ ] Inserire un nome valido (minimo 2, massimo 20 caratteri): deve passare.
- [ ] Inserire un nome troppo corto o troppo lungo: deve apparire un messaggio di errore.
- [ ] Inserire una data di nascita futura: deve bloccare il salvataggio con feedback UI.
- [ ] Verificare che `Inizia carriera` non venga abilitato con dati mancanti.

### 2. Allocatore attributi
- [ ] Verificare che i punti iniziali siano 10.
- [ ] Incrementare e decrementare un attributo e controllare che il totale punti si aggiorni.
- [ ] Prova `Undo` e `Redo` dell’allocazione.
- [ ] Cambiare ruolo: i set di attributi devono cambiare correttamente.

### 3. JSON import/export
- [ ] Usare `Export JSON`: deve scaricare un file JSON con lo stato corrente.
- [ ] Cancellare il salvataggio locale e verificare il fallback.
- [ ] Importare un file JSON valido: la schermata hub deve mostrare i dati corretti.
- [ ] Importare un file JSON invalido: deve comparire un messaggio di errore.

### 4. Conferma azioni distruttive
- [ ] Premere `Ricomincia carriera` e verificare che appaia la modale di conferma.
- [ ] Premere `Esc` per chiudere la modale.
- [ ] Verificare il focus sul pulsante di annullamento / conferma.

### 5. Accessibilità
- [ ] Usare Tab per navigare fra i controlli principali.
- [ ] Verificare che i pulsanti e i campi abbiano focus visibile.
- [ ] Conoscere che il picker delle squadre supporta Enter/Space per selezione.
- [ ] Verificare il contrasto dei testi su sfondo scuro.

### 6. Caricamento dati e fallback
- [ ] Verificare il messaggio “Caricamento squadre…” durante il fetch iniziale.
- [ ] Se il file `data/squads.json` non risponde, verificare il fallback locale.
- [ ] Controllare che il numero di squadre caricate sia coerente.

### 7. Stato UI
- [ ] Verificare la topbar nascosta in creazione e visibile nelle schermate successive.
- [ ] Verificare l’animazione di fade-in iniziale.
- [ ] Controllare che nessun pulsante inline `onclick` sia presente nel markup.

## Note di sviluppo
- La struttura finale è divisa in:
  - [index.html](index.html)
  - [src/css/styles.css](src/css/styles.css)
  - [src/js/app.js](src/js/app.js)
  - [data/squads.json](data/squads.json)
- Il progetto è statico e non richiede build step.
- Per anteprima locale: `python -m http.server 8080`.
