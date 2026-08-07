# Match Viewer 2D — contratto motore/grafica (design, nessun canvas ancora)

Documento di riferimento per il layer grafico che verrà costruito sopra il match engine esistente.
Definisce SOLO il modello dati e l'architettura: nessuna implementazione Canvas in questa fase.
Deve restare valido anche dopo un'eventuale migrazione a Godot — per questo ogni struttura è
espressa in dati puri (JSON), indipendente da pixel, DOM o API di rendering specifiche.

## 0. Premessa: cosa produce davvero il motore attuale

Prima di disegnare lo schema è stato verificato cosa esiste già nel codice (`index REV2.html`),
per evitare di modellare eventi che il motore non genera:

- **4 esiti di scelta possibili**: `out` ∈ {`goal`, `assist`, `recupero`, `possesso`} (vedi
  `MATCH_EVENTS[].scelte[].out` e `skillScelta()`), ciascuno con `risk` ∈ {`high`, `mid`, `safe`}.
- **Non è un tracking 22 vs 22**: il gioco è **calcio a 7** (righe ~4083, "2x25', fine al 50'"),
  non 11 vs 11 — ma per il modello dati non cambia nulla, perché ogni momento di partita ha già
  **un solo protagonista esplicito** (il giocatore controllato), al massimo **un compagno o un
  avversario nominato** (`pescaCompagno()`, `m.opp.nome`), e la palla. Il resto delle due squadre
  non ha posizione: è narrativo, non simulato. Lo schema evento (sez.1) non presuppone mai un
  numero di giocatori per squadra — resta valido a 7, a 11, o a qualunque formato futuro.
- **Cartellino**: solo rosso diretto esiste oggi (`m.cartellinoRosso`), niente giallo — lo schema
  lo prevede comunque come valore possibile per non dover essere riaperto quando verrà aggiunto.
- **Vocabolario di zona già in uso nei testi**: "area", "fuori area", "centrocampo", "fascia",
  "primo palo"/"secondo palo", "corner". Il sistema di coordinate riusa questo vocabolario invece
  di inventarne uno nuovo scollegato dalla narrazione esistente.

## 1. Schema JSON standard degli eventi partita

Un evento è l'unità minima che il motore emette e che il viewer traduce in animazione. Viene
emesso **in aggiunta** al testo di `addLog()` già esistente, non al suo posto (il testo resta il
fallback se il viewer non è disponibile/non ha ancora caricato).

```jsonc
{
  "id": "evt_00042",              // progressivo univoco nella partita, per debug/replay
  "minute": 63,                    // minuto di gioco (state.matchTemp.minute)
  "type": "shot",                  // vedi tassonomia sotto
  "actor": {
    "role": "self",                // "self" | "teammate" | "opponent" — chi compie l'azione
    "name": "Marco Bianchi",       // nome visualizzato (state.name o nome compagno/avversario)
    "team": "home"                 // "home" | "away"
  },
  "target": {                      // opzionale: destinatario dell'azione (passaggio, contrasto subito)
    "role": "teammate",
    "name": "Luca Verdi",
    "team": "home"
  },
  "origin": "midfield_center",     // zona di partenza, vocabolario condiviso (vedi sez. 2)
  "destination": "box",            // zona di arrivo (assente per azioni senza spostamento, es. tackle)
  "risk": "high",                  // "safe" | "mid" | "high" — da choice.risk, guida intensità animazione
  "success": true,                 // esito della scelta (resolveChoice)
  "outcome": "goal",               // risultato narrativo specifico, vedi tassonomia
  "involvesCard": null,            // null | "yellow" | "red"
  "involvesInjury": false,
  "scoreAfter": { "home": 1, "away": 0 },
  "text": "Bordata imprendibile: gol!"   // stesso testo già generato da addLog(), per fallback/log
}
```

### Tassonomia `type` (categoria di alto livello, decide quale animazione base usare)

| `type`      | Quando viene emesso                                            | Campi rilevanti aggiuntivi |
|-------------|------------------------------------------------------------------|------------------------------|
| `pass`      | `out:'assist'` riuscito, o `out:'possesso'`/`recupero` con passaggio implicito | `destination`, `target` |
| `shot`      | `out:'goal'` (riuscito o fallito)                                 | `outcome:'goal'\|'saved'\|'off_target'` |
| `save`      | Riflesso di uno `shot` subito dall'`opponent` (portiere = self se ruolo Portiere) | `target` = tiratore avversario |
| `tackle`    | `out:'recupero'`, azione di contrasto/anticipo                   | `success` |
| `turnover`  | `out:'recupero'` fallito con conseguente gol avversario (ramo 40% in `applyChoiceOutcome`) | `outcome:'goal_conceded'` |
| `foul`      | Evento `errore_arbitrale` (`after_foul_risk`)                    | `involvesCard` |
| `card`      | `m.cartellinoRosso` diventa `true`                                | `involvesCard:'red'` |
| `injury`    | `state.infortunio` assegnato                                     | — |
| `whistle`   | Kickoff, fine primo tempo, fine partita                           | usato per reset camera/UI, non anima giocatori |

Il campo `outcome` è la stringa specifica già presente concettualmente nel testo (`"goal"`,
`"saved"`, `"off_target"`, `"blocked"`, `"goal_conceded"`, `"possession_kept"`) — serve al viewer
per scegliere la clip esatta dentro la categoria `type`.

### Compatibilità con il motore esistente

`resolveChoice()`/`applyChoiceOutcome()` restano gli UNICI punti che decidono l'esito (nessuna
duplicazione di logica nel viewer, come richiesto). Ogni chiamata ad `addLog(testo, evidenziato)`
guadagna una emissione gemella `emitMatchEvent({...})` con gli stessi dati già disponibili in quel
punto del codice (non serve calcolare nulla di nuovo, solo strutturare quello che già esiste).

## 2. Sistema di coordinate campo

Requisiti: indipendente dai pixel (per riuso diretto in Godot, dove le unità sono world-space, non
schermo) e coerente col vocabolario narrativo già usato nei testi (`"area"`, `"fascia"`, ecc.).

### 2.1 Coordinate normalizzate (livello 1 — dati grezzi)

Campo rappresentato come rettangolo normalizzato **indipendente dalle proporzioni reali di un
campo** (105×68 m) per restare agnostico rispetto al motore di rendering:

- `x`: `0.0` (propria porta) → `1.0` (porta avversaria). Sempre nel verso di attacco della squadra
  del giocatore, mai invertito a centrocampo — il viewer gestisce lo specchiamento se serve.
- `y`: `0.0` (fascia sinistra) → `1.0` (fascia destra), `0.5` = centro.

Ogni evento PUÒ includere `originXY`/`destinationXY` come `{x, y}` opzionali per animazioni fini
(es. traiettoria curva di un cross); se assenti, il viewer usa il centro-zona di `origin`/`destination`.

### 2.2 Zone nominali (livello 2 — vocabolario condiviso col testo)

Le zone sono nomi simbolici mappati a un rettangolo di coordinate normalizzate. Il motore emette
SEMPRE la zona nominale (mai solo coordinate grezze), perché è quello che già "sa" dal contesto
della scelta — le coordinate esatte sono un dettaglio del viewer, non del motore:

```jsonc
ZONES = {
  "own_box":          { "xRange":[0.00,0.16], "yRange":[0.20,0.80] },
  "own_half":         { "xRange":[0.00,0.50], "yRange":[0.00,1.00] },
  "midfield_center":  { "xRange":[0.35,0.65], "yRange":[0.30,0.70] },
  "midfield_left":    { "xRange":[0.35,0.65], "yRange":[0.00,0.30] },
  "midfield_right":   { "xRange":[0.35,0.65], "yRange":[0.70,1.00] },
  "flank_left":        { "xRange":[0.50,0.90], "yRange":[0.00,0.22] },
  "flank_right":       { "xRange":[0.50,0.90], "yRange":[0.78,1.00] },
  "box":               { "xRange":[0.84,1.00], "yRange":[0.20,0.80] },
  "box_near_post":     { "xRange":[0.88,1.00], "yRange":[0.20,0.42] },
  "box_far_post":      { "xRange":[0.88,1.00], "yRange":[0.58,0.80] },
  "corner":            { "xRange":[0.98,1.00], "yRange":[0.00,0.06] }  // + varianti angolo
}
```

Questa tabella è l'unico punto da estendere se in futuro servono zone più fini — non tocca né lo
schema evento né il motore.

### 2.3 Perché questo livello a due strati regge la migrazione a Godot

In Godot il campo sarà una `Node2D`/scena con le sue coordinate world-space reali; la `CameraManager`
(sez. 3) sarà l'UNICO punto che traduce `{x,y}` normalizzato → coordinate del motore di rendering
attivo (pixel canvas oggi, world units Godot domani). Motore ed `EventInterpreter` non conoscono mai
pixel: lavorano solo con zone nominali e coordinate 0–1.

## 3. Architettura del renderer

```
 MATCH ENGINE (index REV2.html, invariato)
        │  emitMatchEvent(evento JSON, sez.1)
        ▼
 ┌────────────────────┐
 │  EventInterpreter   │  riceve l'evento, lo traduce in una "intenzione di animazione":
 │                      │  sceglie la clip da Animation Library (sez.4) in base a type+outcome+risk,
 │                      │  risolve zone nominali → coordinate (usando la tabella ZONES),
 │                      │  produce un AnimationRequest e lo accoda.
 └─────────┬────────────┘
           ▼
 ┌────────────────────┐
 │  AnimationManager    │  possiede la coda di AnimationRequest; gestisce SOLO tempo/sequenza:
 │                      │  play/pause/velocità, un evento alla volta (coerente col motore che
 │                      │  risolve un momento alla volta), callback di fine-clip verso il motore
 │                      │  (per riabilitare l'input scelte solo a animazione conclusa).
 │                      │  Non disegna nulla, non conosce pixel: aggiorna solo lo stato interpolato
 │                      │  (posizioni normalizzate 0-1 dei soggetti coinvolti, frame per frame).
 └───┬─────────────┬────┘
     ▼             ▼
┌───────────┐ ┌───────────┐        entrambi leggono lo stato interpolato di AnimationManager,
│ PlayerRen-│ │ BallRen-  │        NON lo stato del match engine direttamente — disaccoppiamento
│ derer     │ │ derer     │        netto fra "cosa succede" (motore) e "cosa si vede" (renderer)
└─────┬─────┘ └─────┬─────┘
      └──────┬───────┘
             ▼
     ┌────────────────┐
     │  CameraManager   │  UNICO punto che converte coordinate normalizzate → coordinate del
     │                  │  motore di rendering attivo (pixel canvas oggi / world Godot domani).
     │                  │  Oggi: mapping fisso campo→canvas (nessun pan/zoom in MVP, coerente con
     │                  │  la scelta di non aggiungere complessità non richiesta).
     └────────────────┘
```

Responsabilità isolate (nessuna classe conosce il livello sopra o sotto oltre al vicino diretto):

- **EventInterpreter**: unico punto che "capisce" gli eventi di gioco. Se domani cambia lo schema
  evento, si tocca solo qui.
- **AnimationManager**: unico punto che gestisce il tempo. Se domani cambia motore di rendering
  (canvas → Godot), non si tocca.
- **PlayerRenderer / BallRenderer**: disegnano SOLO in base a coordinate normalizzate che ricevono,
  zero logica di gioco. Sono gli unici due moduli che in Godot diventano scene/nodi nativi invece di
  disegno su canvas — tutto il resto sopra resta identico.
- **CameraManager**: unico punto che conosce pixel. Isola tutta la dipendenza da canvas qui, per
  poterla sostituire senza toccare interpreter/animation manager.

## 4. Animation Library MVP

Ogni clip è dati (keyframe in coordinate normalizzate + durata + easing), non codice — sia il
canvas di oggi sia Godot domani leggono la stessa struttura.

```jsonc
ANIMATION_LIBRARY = {

  "pass_short": {              // out:'possesso'/'recupero' riuscito con passaggio breve
    "durationMs": 600,
    "track_ball": [
      { "t": 0.0, "pos": "origin" },
      { "t": 1.0, "pos": "destination", "easing": "easeOutQuad" }
    ],
    "track_actor":  [ { "t": 0.0, "pos": "origin" } ],           // resta fermo, tocca e passa
    "track_target": [ { "t": 1.0, "pos": "destination" } ]       // compagno riceve
  },

  "pass_long": {                // cross / lancio lungo (assist da fascia, corner)
    "durationMs": 1100,
    "track_ball": [
      { "t": 0.0,  "pos": "origin" },
      { "t": 0.5,  "posOffset": { "yArc": 0.15 } },              // arco visibile, non linea retta
      { "t": 1.0,  "pos": "destination", "easing": "easeInOutQuad" }
    ],
    "track_actor":  [ { "t": 0.0, "pos": "origin" } ],
    "track_target": [ { "t": 0.85, "pos": "destination" }, { "t": 1.0, "action": "header_or_shot" } ]
  },

  "shot": {                     // out:'goal', qualunque esito
    "durationMs": 800,
    "track_ball": [
      { "t": 0.0, "pos": "origin" },
      { "t": 0.7, "pos": "box_near_post_or_far_post" },          // scelto da EventInterpreter
      { "t": 1.0, "pos": "outcome_dependent" }                    // rete / parata / fuori, vedi sotto
    ],
    "track_actor": [ { "t": 0.0, "pos": "origin" }, { "t": 0.3, "action": "shoot_windup" } ],
    "variants": {
      "goal":        { "ballEnd": "goal_net",      "followup": "goal_celebration" },
      "saved":       { "ballEnd": "keeper_hands",  "followup": "save_clip" },
      "off_target":  { "ballEnd": "beyond_goal_line_wide" }
    }
  },

  "save": {                     // clip agganciata da "shot" variant "saved", o standalone se self=portiere
    "durationMs": 500,
    "track_keeper": [
      { "t": 0.0, "pos": "goal_line_center" },
      { "t": 1.0, "pos": "ball_end_position", "action": "dive" }
    ]
  },

  "goal_celebration": {         // followup non bloccante dopo "shot" variant goal
    "durationMs": 1200,
    "track_actor": [ { "t": 0.0, "action": "celebrate_idle_loop" } ],
    "interruptible": true       // il motore può già proseguire al momento successivo, è solo estetica
  }
}
```

Nota su `tackle`/`foul`/`card`/`injury`: nel MVP non hanno una clip di movimento propria — restano
segnalati da un semplice indicatore/icona vicino al soggetto (nessuna coreografia), per tenere il
primo rilascio piccolo. Lo schema evento (sez.1) li prevede già, quindi aggiungere le clip in futuro
non richiede toccare il motore né l'`EventInterpreter`, solo estendere `ANIMATION_LIBRARY`.

## 5. Cosa NON è ancora deciso (apposta)

- Nessuna implementazione Canvas/Pixi/rendering reale — questo documento fissa solo il contratto.
- Nessuna integrazione nello `screen-match` esistente.
- Nessun dettaglio di `emitMatchEvent()` (dove viene chiamata esattamente riga per riga) — verrà
  fatto quando si passa all'implementazione, punto per punto come sempre in questo progetto.

## 6. Stato implementazione

**`emitMatchEvent()` implementata (2026-08-06)** in `index REV2.html`, agganciata in aggiunta
(mai al posto) di `addLog()` nei punti che già decidono l'esito:
`applyChoiceOutcome()` (shot/pass_short/pass_long/tackle/turnover/possession/card),
`resolveChoice()` (foul, solo quando l'evento `errore_arbitrale` viene effettivamente mostrato),
`beginMatch()`/`beginMatchAsSub()` (whistle kickoff/substitution_in), `finishMatch()`
(whistle full_time, injury). Gli eventi si accumulano in `state.matchTemp.events` (si azzerano
a ogni partita, non persistono nel salvataggio — coerente col fatto che il viewer, quando esisterà,
opera solo sulla partita in corso).

Le zone `origin`/`destination` sono ancora quelle di default per tipo di scelta
(`ZONE_DEFAULT_PER_OUT`, sez.1) — non la zona precisa della situazione narrata in ogni singolo
`MOMENTS`/`MATCH_EVENTS`. Verificato che restano comunque coerenti col testo (es. un tiro fallito
in area che si trasforma in ripartenza subita riporta correttamente `origin:'box'`, non
`'midfield_center'`, perché la zona segue `choice.out` reale, non il tipo di evento risultante).

Verificato: `node --check`, bot (25 carriere × 40 settimane, zero errori/violazioni), partita
dal vivo in browser con ispezione diretta di `state.matchTemp.events` — sequenza plausibile
(kickoff → turnover con gol subito in area → contrasto perso a centrocampo → assist corto e
lungo entrambi gol → fischio finale), nessun errore in console.

## 7. EventInterpreter — implementato (2026-08-06)

Aggiunte in `index REV2.html`, subito dopo `emitMatchEvent()`, tre parti previste dal design ma
ancora come DATI, non rendering:

- **`ZONES`** + `zonaCoordinate()`: tabella zona nominale → coordinate normalizzate 0-1 (sez.2.2),
  identica a quella di questo documento.
- **`ANIMATION_LIBRARY`**: le clip MVP (sez.4) come dati puri (keyframe/durata/easing), non ancora
  eseguite da nessun modulo.
- **`interpretMatchEvent(evt)`**: l'`EventInterpreter` vero e proprio. Sceglie la clip da
  `CLIP_PER_TYPE` (`shot`, `pass_short`, `pass_long` — gli unici tre con coreografia nell'MVP),
  risolve `origin`/`destination` in coordinate via `zonaCoordinate()`, aggancia il `followup`
  (`goal_celebration` dopo un tiro vincente). Chiamato automaticamente da `emitMatchEvent()`, il
  risultato è salvato in `evt.animation` — nessuna coda, nessun timer: pura trasformazione dati→dati.

Verificato dal vivo: un tiro a segno produce `{clip:'shot', variant:'goal',
originXY:{x:0.92,y:0.5}, followup:'goal_celebration'}` (coordinate corrette, centro della zona
`box`); eventi senza coreografia nell'MVP (`whistle`, `possession`, `tackle`...) restano
correttamente `clip:null`. `node --check` + bot (25 carriere, zero errori) + nessun errore console.

## 8. AnimationManager — implementato (2026-08-06)

Aggiunto `creaAnimationManager()` in `index REV2.html`, subito dopo `interpretMatchEvent()`: primo
modulo che introduce il tempo. Coda (`enqueue(evt, onDone)`), `tick(deltaMs)` da chiamare da un
ticker esterno (in futuro `requestAnimationFrame`, non ancora presente — testato a passi fissi),
`pause()`/`resume()`, interpolazione della posizione palla (`ballPos`, coordinate 0-1) leggendo i
keyframe/easing da `ANIMATION_LIBRARY`, callback `onDone(evt)` quando la clip finisce. Il
`followup` (es. `goal_celebration`) resta per ora solo dato informativo in `evt.animation` — non
eseguito, perché essendo `interruptible` per design non deve mai bloccare `onDone`, e diventerebbe
osservabile solo quando esisterà un `PlayerRenderer` in grado di mostrarlo in parallelo.

**NON ancora agganciato al flusso reale della partita** (`nextMoment()`/`screen-match`): resta un
modulo autonomo, verificabile da solo — stessa scelta incrementale degli step precedenti, per non
introdurre rischio sul flusso esistente prima di aver validato la temporizzazione.

Verificato dal vivo con un evento `pass_long` reale (origin `midfield_center` x=0.5 → destination
`box` x=0.92): la palla avanza con curva `easeInOutQuad` plausibile (accelera poi decelera) fino ad
arrivare esattamente a destinazione a fine durata (1100ms), `onDone` chiamato con l'id evento
corretto, coda tornata idle. Testate anche `pause()` (posizione bloccata, verificato byte-per-byte
che non cambia durante la pausa) e una coda con più eventi in sequenza (ordine di completamento
rispettato). `node --check` + bot (25 carriere, zero errori) + nessun errore console.

## 9. Primo canvas reale — implementato (2026-08-06)

Aggiunto `<canvas id="matchCanvas">` in `screen-match` (fra l'header partita e il commentary-log
testuale, che resta invariato — nessuna sostituzione, solo aggiunta sopra). Implementati in
`index REV2.html`:

- **`campoToPixel()`**: il `CameraManager` — unico punto che converte coordinate normalizzate 0-1
  in pixel canvas, con margine fisso (nessun pan/zoom nell'MVP, come da design).
- **`disegnaCampo()`**: contorno campo, linea di metà campo, cerchio di centrocampo, due aree.
- **`disegnaPallino()`** + **`renderMatchCanvas()`**: `PlayerRenderer`/`BallRenderer` in versione
  MVP — un pallino bianco (palla) e uno blu con etichetta (il protagonista) nella stessa posizione
  interpolata. **Semplificazione dichiarata**: non esiste ancora una posizione separata
  giocatore/palla (nessuno sprite multiplo) — corretto per l'MVP dove l'unico soggetto animato è
  chi calcia/riceve, da raffinare quando servirà mostrare anche chi è ancora fermo mentre la palla
  vola.
- **`avviaCanvasPartita()`/`fermaCanvasPartita()`**: loop `requestAnimationFrame` che chiama
  `matchAnimMgr.tick()` + `renderMatchCanvas()` solo mentre `screen-match` è la schermata attiva;
  fermato esplicitamente in `finishMatch()`.
- **Sicurezza per il bot**: ogni punto di accesso al canvas è dietro
  `typeof requestAnimationFrame==='function'` — in Node (dove gira `tools/test-bot.js`) quella
  funzione non esiste, quindi il bot non tocca mai `getContext()` (che nel suo DOM finto non
  esiste nemmeno) e il motore resta comprovatamente indipendente dal viewer.

**Ancora NON blocca la UI**: le scelte restano cliccabili subito, l'animazione gioca "in parallelo"
senza aspettare `onDone` per riabilitare l'input — gating dei click all'animazione è rimandato a un
passo successivo esplicito, per introdurlo come cambiamento isolato e testabile a sé.

Verificato dal vivo in browser (screenshot + ispezione `state.matchTemp`/`matchAnimMgr`): campo
disegnato correttamente con area/cerchio/linee, pallino al centro a riposo, e dopo un assist andato
a segno (`pass_long`, midfield_center→box) il pallino si sposta visibilmente verso l'area avversaria
mentre il punteggio passa a 1-1 — sequenza completa motore→evento→interpretazione→animazione→canvas
confermata end-to-end, non solo a livello di dati. `node --check` + bot (25 carriere, zero errori,
identico prima e dopo — a riprova che il canvas non tocca la logica) + nessun errore console.

## 10. Gating — implementato (2026-08-06)

Aggiunto `whenDrained(fn)` all'`AnimationManager`: se la coda è già vuota (nessuna clip per
l'evento appena emesso, es. `possession`/`tackle` nell'MVP) esegue `fn` subito, sincrono — nessun
ritardo percepito quando non c'è nulla da animare. Se invece c'è una clip in corso, la callback
resta in attesa (`drainCallback`) e viene chiamata da `tick()` solo quando la coda torna
effettivamente vuota.

In `resolveChoice()`: `matchAction` viene svuotato SUBITO al click (prima di calcolare l'esito),
per evitare che le vecchie choice-card restino cliccabili nel DOM durante l'attesa — un doppio
click sullo stesso momento non può più rilanciare `resolveChoice()` due volte. L'esito
(`showMatchEvent`/pulsante "Continua") viene mostrato solo dentro `matchAnimMgr.whenDrained(...)`
invece che subito.

Verificato dal vivo: forzando una scelta con `out:'assist'` (clip `pass_long`, 1100ms),
`matchAction` risulta vuoto e `matchAnimMgr.isIdle()===false` immediatamente dopo il click; dopo
l'attesa la palla è arrivata esattamente a destinazione e la UI si ripopola con le nuove scelte —
sequenza sincronizzata confermata end-to-end. Una scelta senza clip (es. contrasto/`tackle`)
continua a mostrare l'esito istantaneamente, senza ritardo introdotto. `node --check` + bot
(25 carriere, zero errori, invariato) + nessun errore console.

## 11. Consolidamento architetturale (2026-08-06)

Refactoring puro (nessun comportamento nuovo, nessuna modifica al motore) per arrivare alla
struttura modulare voluta: `EventInterpreter`, `AnimationManager`, `Animation Library`,
`FieldRenderer`, `PlayerRenderer`, `BallRenderer`, `CameraManager`.

**Criticità trovate e risolte**:
- **`AnimationManager` eseguiva logica di clip** (`interpolaPosizioneBalla()` conosceva
  `track_ball`/easing) invece di limitarsi a coda/tempo/notifica. Fix: ogni clip in
  `AnimationLibrary.clips` ora ha la propria funzione `run(t, animation)` — l'esecuzione è
  responsabilità della clip, il manager si limita a chiamarla e leggere il frame restituito
  (`{ballPos}`), senza sapere come viene calcolato.
- **Nessuna separazione fra clip**: prima un'unica funzione di interpolazione generica leggeva
  tutte le clip da un oggetto dati piatto. Ora ogni clip è un modulo indipendente — aggiungerne
  una nuova (es. un arco diverso per il cross, un tuffo del portiere) non tocca il manager.
- **`EventInterpreter` leggeva dentro la struttura interna delle clip**
  (`ANIMATION_LIBRARY.shot.variants[...]` direttamente). Ora chiede a `AnimationLibrary.
  clipForEvent()`/`followupFor()` — l'interpreter non conosce più la forma di una clip.
- **Renderer non separati**: `disegnaCampo`/`disegnaPallino` erano funzioni sciolte, la stessa
  funzione disegnava sia palla che giocatore. Ora `CameraManager.toPixel()` (unico punto che
  converte coordinate normalizzate in pixel), `FieldRenderer.draw()`, `BallRenderer.draw()`,
  `PlayerRenderer.draw()` sono oggetti distinti con responsabilità singola.

**Zero righe toccate nel motore**: i punti di integrazione già esistenti
(`avviaCanvasPartita`/`fermaCanvasPartita`/`creaAnimationManager`/`interpretMatchEvent`/
`emitMatchEvent`, chiamati da `beginMatch`/`beginMatchAsSub`/`finishMatch`/`applyChoiceOutcome`/
`resolveChoice`) mantengono lo stesso nome e la stessa firma — solo il loro contenuto interno è
stato riorganizzato.

Verificato: `node --check`, bot (25 carriere, zero errori, invariato), e ripetuto dal vivo lo
stesso test di gating già fatto prima del refactoring (scelta `assist`/`pass_long` forzata) —
risultato bit-per-bit identico: palla a `{x:0.92, y:0.5}`, coda tornata idle, UI ripopolata.
Verificati anche i nuovi moduli singolarmente (`AnimationLibrary.clipForEvent('shot')`→`'shot'`,
`followupFor('shot','goal')`→`'goal_celebration'`, `CameraManager.toPixel({x:0.5,y:0.5},440,200)`
→`{x:220,y:100}`).

## 12. Prova di estendibilità — clip `tackle` (2026-08-06)

Test deliberato del refactoring appena fatto: aggiunta la prima clip per `tackle` (prima senza
coreografia, `clip:null`), toccando **solo** `AnimationLibrary` (una voce in `eventClipMap` + un
blocco clip con `run()` che tiene la palla ferma in `origin` per 400ms — il contrasto avviene sul
posto, non c'è spostamento, ma occupa comunque l'AnimationManager per una durata reale).

**Zero righe toccate** in `AnimationManager`, `EventInterpreter`, renderer o motore — la previsione
del refactoring era esattamente questa: "aggiungere una clip nuova vuol dire aggiungere una voce
qui, senza toccare manager/interpreter/motore".

Verificato dal vivo: prima dell'aggiunta un contrasto risolveva l'esito istantaneamente
(`whenDrained` sincrono, nessuna clip); dopo, un contrasto riuscito mette in coda `clipId:'tackle'`
e il gating aspetta davvero i 400ms prima di ripopolare le scelte — comportamento nuovo ottenuto
senza toccare nessun modulo oltre alla libreria. `node --check` + bot (25 carriere, zero errori,
invariato) + nessun errore console.

## 13. Timeline — sequenze di clip (2026-08-06)

Su richiesta esplicita, prima di aggiungere nuove clip: infrastruttura per eseguire più clip in
sequenza (es. PASS→CONTROL→SHOT, TACKLE→FOUL→YELLOW_CARD), gestita interamente dall'
`AnimationManager` — non un nuovo stadio della pipeline (`EventInterpreter → AnimationManager →
AnimationLibrary` resta invariata).

- **`creaTimeline(steps)`**: piccola struttura interna, creata e avanzata solo dall'
  `AnimationManager`, mai vista da motore/EventInterpreter. Ogni step ha un `type`: `'clip'`
  esegue una clip di `AnimationLibrary` per la sua `durationMs` (unico tipo usato in questa fase);
  `'pause'`/`'callback'` sono già previsti nella forma dati per fasi successive, non implementati
  né testati ora, come richiesto ("non implementare ancora nuove animazioni").
- **`timelineStepsDaEvento(evt)`**: retrocompatibilità col formato evento **invariato** —
  `evt.animation.clip` (stringa singola, come sempre) diventa una Timeline di un solo step. Un
  futuro `evt.animation.timeline` (array di step) sarebbe già supportato senza toccare
  `EventInterpreter`: stesso campo `animation`, lettura diversa.
- **`AnimationManager.tick()`** non gestisce più `clipId`/`elapsed`/`durationMs` direttamente:
  delega tutto alla `timeline` dell'item corrente e legge il frame che restituisce. Le clip restano
  indipendenti — la Timeline non conosce easing/track, sa solo quanto dura ogni step.
- Aggiornato anche il guard di `emitMatchEvent()` (`evt.animation.clip || evt.animation.timeline`)
  per accettare in futuro eventi che emettono direttamente una sequenza — nessun evento la emette
  ancora oggi, zero comportamento nuovo.

Verificato dal vivo, due casi:
1. **Retrocompatibilità**: stesso test di gating di sempre (`assist`/`pass_long`) — risultato
   bit-per-bit identico a prima (`{x:0.92,y:0.5}`, gating invariato).
2. **Sequenza vera** (iniettata a mano, `pass_short`→`tackle`, 600ms+400ms): campionata a 300/650/
   950/1050ms cumulativi — la palla interpola durante il primo step, passa correttamente al
   secondo step esattamente al cambio, resta ferma in `origin` durante `tackle`, e `onDone` scatta
   **una sola volta**, solo alla fine dell'intera sequenza (non ad ogni step) — esattamente il
   comportamento richiesto ("attendere automaticamente il completamento della clip precedente").

`node --check` + bot (25 carriere, zero errori, invariato) + nessun errore console.

## 14. Il followup diventa reale (2026-08-06)

Il campo `followup` esisteva dalla sez.9 ("Primo canvas reale") ma era dichiaratamente solo
informativo, mai eseguito — doveva aspettare un `PlayerRenderer` in grado di mostrarlo senza
bloccare il gating. Ora che esiste, attivato: in `AnimationManager.tick()`, quando una timeline
finisce, il `followup` (se presente) viene accodato **dopo** aver già notificato `onDone`/
`whenDrained` — non fa parte della timeline principale che blocca le scelte, è un secondo item di
coda a sé, non gating. Zero righe in `EventInterpreter`/`AnimationLibrary`/motore: il dato
`followup` era già lì, mancava solo chi lo usasse.

Verificato dal vivo: dopo un tiro andato a segno, `matchAction` si ripopola subito (gating
identico a prima, non ritardato), mentre `matchAnimMgr` accoda da solo `goal_celebration` in coda
(`queueLen:1` subito dopo il completamento del tiro) e la esegue in background nei tick
successivi — osservato indirettamente: nel tempo reale trascorso fra due chiamate di verifica
separate, il loop `requestAnimationFrame` reale aveva già completato l'intera esultanza (1200ms) da
solo, confermando il funzionamento end-to-end senza intervento manuale. Testata anche in isolamento
con `creaTimeline()` diretto (`elapsed:50, index:0, isDone:false` a metà esecuzione, come atteso).
`node --check` + bot (25 carriere, zero errori, invariato) + nessun errore console.

**Limite noto, dichiarato non nascosto**: se l'utente clicca una nuova scelta mentre l'esultanza
del gol precedente sta ancora girando in coda, la nuova azione si accoda dietro di essa — il gating
della scelta successiva aspetterà anche la fine dell'esultanza residua (fino a 1200ms in più,
raro perché serve solo dopo un gol). Riproduzione realmente parallela (due tracce animate
indipendenti) richiederebbe un cambiamento più grande, non necessario ora.

## 15. Rifinitura visiva — piano e primo intervento (2026-08-06)

Architettura dichiarata stabile: da qui in poi solo miglioramenti visivi sull'esistente, nessun
refactoring strutturale salvo necessità reale. Analisi con piano ordinato per beneficio/complessità
(traiettoria tiro, arco sui cross, easing del tiro, feedback d'impatto sul contrasto, orientamento
giocatore, idle animation, camera con smoothing) — dettagli nella cronologia della sessione.

**Primo intervento — traiettoria del tiro (priorità massima)**: individuato un difetto reale, non
solo una rifinitura mancante — `ZONE_DEFAULT_PER_OUT.goal` aveva `destination:null`, quindi la
clip `shot` non aveva mai nulla verso cui interpolare: un tiro non spostava la palla per l'intera
durata dell'animazione. Root cause più a fondo: anche impostando la zona di default, il ramo
`choice.out==='goal'` (successo) in `applyChoiceOutcome()` non passava affatto il campo
`destination` a `emitMatchEvent()` (lo faceva solo il ramo `assist`) — un'omissione nel bridge
dati, non nella logica di gioco (probabilità/punteggi/testo invariati).

Fix: aggiunta zona `goal_line` (`ZONES`), impostata come destinazione di default per `goal`
(`ZONE_DEFAULT_PER_OUT`), e aggiunto `destination:zona.destination` alla chiamata
`emitMatchEvent()` nel ramo tiro riuscito di `applyChoiceOutcome()` — stessa categoria di modifica
già fatta in questa funzione (collegare eventi al viewer), zero righe di logica di gioco toccate.

Verificato dal vivo: un tiro a segno ora si muove concretamente da `box` (x≈0.92) a `goal_line`
(x≈0.995) con la curva `easeOutQuad` già esistente — campionato a 200/400/600/800ms:
`0.953→0.976→0.990→0.995`. `node --check` + bot (25 carriere, zero errori, invariato) + nessun
errore console.

**Limite noto, lasciato per una voce futura separata** (per non mescolare due migliorie nello
stesso passaggio): i tiri falliti (`off_target`) hanno la stessa omissione di `destination` e
quindi non si muovono ancora — intervento analogo, rimandato apposta.

## 16. Traiettoria dei tiri falliti (2026-08-06)

Completamento del punto lasciato aperto nella voce precedente: i tiri falliti (`out:'goal'`,
esito negativo) avevano la stessa omissione già trovata per i gol — nessun `destination` passato
a `emitMatchEvent()` nei due punti che li generano in `applyChoiceOutcome()` (fallimento alto
rischio non-turnover, e fallimento rischio medio/basso).

Non bastava riusare `goal_line` (la destinazione dei gol): avrebbe reso un tiro fuori
visivamente indistinguibile da un gol. Aggiunta una zona dedicata, **`goal_line_wide`**
(`ZONES`, adiacente alla porta ma fuori dalla fascia centrale 0.35-0.65 di `goal_line`), collegata
nei due punti con `destination: choice.out==='goal' ? 'goal_line_wide' : null` — zero righe di
logica di calcolo dell'esito toccate (stessa categoria di modifica del punto precedente: bridge
dati verso `emitMatchEvent()`, non regole di gioco).

Verificato dal vivo, tre casi:
- **Tiro fallito, rischio alto** (RNG forzato per evitare il ramo turnover): `destination:
  'goal_line_wide'`, `destinationXY:{x:0.985,y:0.125}` — nettamente fuori dalla fascia dei gol.
- **Tiro fallito, rischio medio**: stesso risultato, stesso ramo di codice condiviso.
- **Tiro a segno** (controllo di non-regressione): resta `destination:'goal_line'`,
  `destinationXY:{x:0.995,y:0.5}`, `followup:'goal_celebration'` — invariato.

`node --check` + bot (25 carriere, zero errori, invariato) + nessun errore console.

## 17. Arco sui cross (`pass_long`) (2026-08-06)

Secondo intervento della lista di rifinitura visiva. Prima `pass_long` era identico a
`pass_short`, solo più lento — nessuna curva percepita, un cross/lancio lungo sembrava un
passaggio dritto rallentato. Modificato solo `AnimationLibrary.clips.pass_long.run()`: aggiunge un
arco laterale perpendicolare alla direzione origine→destinazione (non solo lungo l'asse x, regge
qualunque orientamento del passaggio), che cresce e torna a zero a metà volo (`sin(π·t)`).
Contenuto interamente in questa clip — zero righe altrove (`pass_short`, motore, manager,
interpreter invariati).

Verificato in isolamento (`AnimationLibrary.get('pass_long').run(t, animation)`, campionato a
t=0/0.25/0.5/0.75/1 su un passaggio orizzontale midfield_center→box): `y` parte a 0.5, sale fino a
0.56 a metà volo, torna esattamente a 0.5 a fine corsa — arco visibile che si richiude esatto sulla
destinazione. `pass_short` sullo stesso identico input resta perfettamente in linea retta (`y`
sempre 0.5) — nessuna regressione. `node --check` + bot (25 carriere, zero errori, invariato) +
nessun errore console.

## 18. Easing del tiro (2026-08-06)

Terzo intervento della lista. `shot` usava `easeOutQuad` (parte veloce, rallenta in arrivo) —
adatto a un passaggio che "si posa" sul compagno, non a un tiro. Aggiunto `EASINGS.easeInCubic`
(`t*t*t`: parte lenta, accelera bruscamente) e collegato a `clips.shot.run()` — le uniche due righe
toccate, contenute in `AnimationLibrary`.

Verificato in isolamento: campionando `x` a t=0/0.25/0.5/0.75/1 su un tiro verso `goal_line`, gli
incrementi crescono ad ogni quarto (0.0012 → 0.0082 → 0.0222 → 0.0434) — parte lenta, accelera
verso la porta, esattamente l'opposto di prima. `pass_short` sullo stesso identico schema di test
resta con `easeOutQuad` invariato (incrementi decrescenti: 0.175 → 0.125 → 0.075 → 0.025) — nessuna
contaminazione fra clip. `node --check` + bot (25 carriere, zero errori, invariato) + nessun errore
console.

## 19. Prossimo passo naturale

Rifinire l'esperienza visiva: un indicatore leggero (es. un puntino/spinner) durante l'attesa fra
il click e la ricomparsa delle scelte, così l'utente capisce che sta succedendo qualcosa sul campo
invece di vedere semplicemente il pannello scelte vuoto per una frazione di secondo. È un
miglioramento di rifinitura, non strutturale — il contratto dati/architettura sotto è già stabile.
