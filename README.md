# Bot di test autonomo

Simula intere carriere di "Carriera CSI" fuori dal browser (Node.js, nessuna dipendenza esterna:
solo i moduli `fs`/`path`/`vm` già inclusi in Node) per trovare crash e stati incoerenti senza
dover verificare a mano ogni modifica.

## Uso

```bash
node tools/test-bot.js --careers 20 --weeks 34
```

- `--careers N` — quante carriere simulare (default 10).
- `--weeks N` — quante settimane al massimo per carriera (default 20; una stagione di Serie C dura
  circa 34 giornate — il bot si ferma comunque da solo a fine stagione, vedi limiti sotto).

Il risultato va in `tools/test-logs/<timestamp>.log` e in `tools/test-logs/latest.log` (stesso
contenuto, nome fisso per rileggerlo senza cercare il file più recente). Le ultime righe (il
riepilogo) vengono anche stampate a schermo.

## Come funziona

Carica `data-squadre.js` (il database squadre, vedi RIEPILOGO.md) e lo `<script>` di
`index REV2.html` dentro un contesto Node isolato (`vm.createContext`), con un DOM finto minimo
(`tools/test-bot.js`) che non fa altro che non generare eccezioni — non renderizza nulla. Dentro
quel contesto gira `tools/bot-helpers.js`, che guida il gioco chiamando le sue funzioni vere
(`startCareer`, `beginMatch`, `resolveChoice`, `pickEvent`/`showEvent`, `risolviTelefonoPendente`,
ecc.), cliccando sempre la prima scelta disponibile fra quelle proposte. Dopo ogni settimana
verifica un set di invarianti sullo stato (barre 0-100, numeri non NaN, array sempre array,
affinità delle persone in range, ecc.).

Il gioco vero carica due file (`data-squadre.js` + `index REV2.html`, il primo `<script src>` in
testa al secondo — nessun bundler, si apre ancora `index REV2.html` e basta): questi script sono
solo strumenti di sviluppo, replicano lo stesso caricamento dentro Node invece che nel browser.

## Limiti noti (dichiarati, non nascosti)

- Copre anche il fuori-stagione (mercato estivo, eventuale Coppa Leonessa in corso, nuova
  stagione): a fine campionato il bot resta sempre alla squadra attuale (`restaAllaSquadra()`)
  invece di seguire trattative di mercato — cambiare squadra a metà simulazione (nuova rosa, nuovo
  calendario, nuovi compagni) è una superficie di test più ampia, lasciata per un'estensione
  futura. Il resto del fuori-stagione (allenamento supplementare, avanzamento settimanale, Coppa)
  è simulato per intero, più stagioni di fila se `--weeks` è abbastanza alto.
- Le scelte sono casuali fra quelle disponibili, non "intelligenti": misura se il gioco resta
  coerente e senza eccezioni, non se è divertente o bilanciato.
- `Math.random()` non è seedabile in Node senza dipendenze esterne: `--seed` viene solo annotato
  nel log per riferimento, non produce corse riproducibili bit-per-bit.

## Storico dei bug trovati

- **Corretto**: `showEvent()` andava in crash (`TypeError`) cliccando una risposta all'evento
  "vai in panchina", perché quell'evento è un oggetto inline senza `id` e il controllo
  `ev.id.startsWith('gruppo_')` non lo prevedeva. Guardia aggiunta (`ev.id && ...`).
- **Corretto**: i 4 allenamenti settimanali (`TRAININGS`) non erano filtrati per ruolo — un
  Portiere che sceglieva "Allenamento tecnico"/"Preparazione atletica"/"Lavoro tattico di
  squadra" scriveva `NaN` in attributi generici (tecnica/fisico/ecc.) che lui non ha mai avuto.
  Ora `apply`/`desc` scelgono le skill giuste in base al ruolo (equivalenti da portiere: Presa/
  Distribuzione, Riflessi/Uno contro uno, Posizionamento/Comunicazione).
