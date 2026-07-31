# Carriera CSI — Riepilogo progetto

> Ultimo aggiornamento: 2026-07-31, dopo il batch di 12 correzioni, il sistema di eventi dinamici di
> partita, la revisione completa del ruolo Portiere, i 12 eventi trade-off per giocatori di movimento,
> la modalità "continua con un giocatore esistente", il rename ruolo "Mezzala"→"Ala" con correzioni dati
> (IMPLAST, GSO CAPRIOLO/B), l'integrazione delle date di nascita reali, il calendario reale di
> campionato (inizio stagione, pausa invernale), il mercato invernale, il fix dell'età e dello stipendio,
> il rifacimento del fuori-stagione ad avanzamento settimanale con mercato estivo 1/7-31/8, e il sabato
> come giorno fisso di riferimento di ogni settimana di gioco. Richiesto esplicitamente (vedi nota in
> fondo e sezioni dedicate più sotto).

## Cos'è

"Carriera CSI" è un gioco di carriera calcistica testuale, single-page, in italiano. Un unico file
[`index.html`](index.html) contiene tutto: markup, CSS e logica JS (nessuna build, nessuna dipendenza esterna
a parte i font Google). Il giocatore crea un calciatore, sceglie girone/squadra di Serie C reale, e scala la
piramide CSI Brescia (C → B → A) tra partite simulate a scelte, eventi narrativi, mercato ed economia.

## Struttura del file

Tutto vive in `index.html`:
- **HTML**: una serie di `<div class="screen" id="screen-XXX">` (create, hub, match, event, classifica,
  carriera, seasonend, market) mostrate/nascoste da `showScreen(id)`.
- **CSS**: variabili custom in `:root` (tema navy/blu/oro).
- **JS**: un unico `<script>` in fondo al file con tutta la logica di gioco.

## Strato 1 — Dati reali (NON toccare senza motivo)

- `DB_SQUADRE`: oggetto con **280 squadre reali CSI Brescia** (Serie A e B da `ranking_squadre_3.xlsx`,
  poi rimappate su Serie A/B/C a 6+ gironi ciascuna con `gironi_2026_27_ricomposti.xlsx` per la stagione
  2026/27), ognuna con `nome`, `serie`, `girone`, `forza`, `mod`, `vecchio_nome`, `rosa` (giocatori reali con
  `nome`, `ruolo`, `ovr` da `giocatori_overall_stimato.xlsx`, ~5511 giocatori collegati).
- `LEAGUES` (C/B/A): pool di squadre selezionabili per lega. Il pool `C` ora copre **tutte le 80 squadre
  reali di Serie C sui 6 gironi A–F** (non solo Girone E come in origine).
- Selezione girone/squadra in creazione personaggio: `squadreSerieC()` filtra `DB_SQUADRE` per
  `serie==='C'`; `renderGironiPicker()` / `renderTeamPickerByGirone()` popolano le select in base al girone
  reale scelto (mostrano sempre "Serie X — Girone Y" per evitare ambiguità tra lettere di girone duplicate
  su serie diverse). Il picker mostra tutte le squadre del girone (14, non più limitate a 12).
- `buildTierSeason(tierKey, myTeam)`: costruisce calendario e classifica usando **solo le squadre dello
  stesso girone reale** del club scelto (fallback al pool intero se il club non ha compagni di girone
  individuabili). **Andata e ritorno**: ogni avversario si affronta due volte, quindi un girone da 14 squadre
  genera **26 giornate** (non più 13 di sola andata). Il numero di giornate resta comunque dinamico
  (`state.calendario.length`), non fisso.

## Strato 2 — Economia (implementato di recente)

- **Compenso sportivo mensile**: `compensoSportivo(lega, overall)` — scala base→top per lega
  (C: 30–120€, B: 120–400€, A: 350–900€) in base all'overall pesato del giocatore.
- **Budget club**: `buildBudgetClub(lega)` — budget annuale fisso per lega (C: 8.000€, B: 25.000€,
  A: 70.000€), suddiviso Sponsor 40% / Premi 15% / Coppa 10% / Marketing 35%; `limiteIngaggi` = 60% del
  totale, flag `crisi` quando la spesa in ingaggi supera il 75% del limite. Si rigenera a ogni nuova
  stagione (`finalizzaMercato`).
- **Marketing club mensile**: `calcolaMarketing(lega, posizioneClassifica, famaTotale, isDerby)` — base per
  categoria, pesata 60% posizione in classifica / 40% fama (reputazione), con bonus derby opzionale (+30%,
  parametro predisposto ma non ancora agganciato a una rilevazione automatica dei derby).
- **Lavoro giocatore**: `impostaLavoro(tipo)` — tre stati (Nessuno/PartTime/FullTime), scelti da 3 bottoni
  nell'hub. Stipendio mensile a scaglioni di anzianità (0-2/3-5/6-10/11-15/16+ anni) via `salarioLavoro()`.
  Costo energia settimanale (`energiaCostoLavoro`: -15 PT, -35 FT) applicato ogni giornata via
  `applyLavoroSettimanale()`. Anzianità con carry-over 50% se il lavoro viene interrotto/cambiato.
  **La scelta è modificabile solo a inizio stagione** (`lavoroModificabile()` → `state.giornata===1`); nelle
  altre giornate i 3 bottoni sono disabilitati con avviso in UI.
- **Ciclo mensile**: ogni 4 giornate (`postGiornataFlow` → `applyPagamentoMensile`) si accreditano compenso
  sportivo + salario lavoro sul saldo, si aggiorna il marketing e si verifica la crisi di budget.
- **UI**: card "Lavoro" nell'hub (stato + 3 bottoni); scheda giocatore (`carFinRel`) mostra saldo, compenso
  sportivo, budget club (con badge ⚠️ se in crisi) e marketing del mese.
- Compatibilità salvataggi vecchi gestita in `boot()` (patch dei campi mancanti in `state.finanze`).

## Coppa Leonessa

Le squadre reali di Serie A/B/C giocano gironi da 4 su due fasi; **le partite del giocatore si giocano
davvero** con lo stesso motore del campionato (non più una simulazione istantanea a fine stagione — era un
bug, corretto: vedi cronologia). Le partite di tutte le altre squadre restano invece auto-simulate.

- **Fase preliminare**: tutte le squadre reali di Serie B + C (196 squadre) → 49 gironi da 4
  (`buildCoppaPreliminary`). Passano i **49 primi classificati + le 47 migliori seconde** (punti, poi
  differenza reti) → **96 qualificate** alla Fase Principale (`qualificaConMiglioriSeconde`). Si simula
  sempre, anche per un giocatore di Serie A, perché serve a produrre le 96 squadre qualificate.
- **Fase principale**: le 84 squadre di Serie A (teste di serie, max 2 per girone, distribuzione il più
  possibile equa) + le 96 qualificate dal preliminare = 180 squadre → **45 gironi da 4**
  (`buildCoppaPrincipale`). Passano i **45 primi + le 19 migliori seconde** → **64 squadre ai "32esimi"**.
  Una squadra di Serie A entra qui direttamente, senza preliminare.
- **Partite giocabili (fix architetturale)**: a fine stagione (`iniziaCoppaLeonessa`, chiamata da
  `renderSeasonEnd`) si costruisce il girone del giocatore, si simulano SUBITO solo le partite fra le altre
  3 squadre del girone (`simulaGironeConGiocatore`), e le **3 partite del giocatore restano in coda**
  (`state.coppa = {tipo, girone, prossimi, giocate}`). Si giocano dall'hub — dopo il mercato, prima che
  riparta il campionato — con `beginMatch()`/`skipGiornata()`/`simulaPartita()` resi "context-aware"
  (`state.matchTemp.contesto: 'coppa'|'campionato'`): stesso motore a scelte, compagni che intervengono,
  infortuni/cartellini, ma il risultato va in `applyResultToCoppaGirone` invece che in `applyResultToClassifica`,
  e `closeResult()`/`postCoppaMatch()` non toccano giornata/economia del campionato (fixture "fuori
  calendario"). Finito il girone (`finalizzaGironeCoppa`), si calcolano primi/migliori seconde e — se
  qualificato — si passa in automatico alle 3 partite della Fase Principale (`procediAFasePrincipale`),
  stesso meccanismo.
- **Stato**: `state.coppaPrelim` / `state.coppaPrincipale` (tutti i gironi + qualificati),
  `state.coppa` (girone del giocatore **in corso**, `null` quando non c'è nulla da giocare),
  `state.coppaTorneo` con `fase` (`eliminato_preliminare` / `eliminato_principale` / `trentaduesimi`) —
  valorizzato solo a girone concluso.
- **Indicazione "giornata" durante la coppa**: hub, schermo partita e schermata Coppa mostrano tutti
  "Partita X/3" (`state.coppa.giocate.length+1` su `giocate.length+prossimi.length`), per non perdere il
  riferimento di quante partite di girone mancano.
- **UI**: banner dorato animato in fine-stagione (`coppa-banner`, CSS `coppaPop`/`coppaGlow`) che segnala se
  c'è un girone da giocare o l'esito finale; schermata `screen-coppa` (`renderCoppa`, bottone in hub visibile
  quando c'è un girone in corso o un esito registrato) mostra tabellina del girone con la squadra del
  giocatore evidenziata (`renderTabellaGirone`).
- **Non ancora implementato**: il tabellone a eliminazione diretta dei 32esimi vero e proprio (per ora si
  determina solo chi vi accede); bonus derby (+30% marketing) predisposto ma non agganciato a rilevazione
  automatica dei derby.

## Partita: attributi, compagni, modalità simulata

- **Attributi**: ogni attributo pesa su scelte specifiche in `calcChance(attrKey, risk, out)` —
  tiro→tentativi di gol, passaggio→assist/cross, tecnica→dribbling/gestione palla sicura,
  velocità→scatti/pressing, fisico→contrasti (riduce anche la chance di infortunio), difesa→recuperi.
  Formula: `50 + (attributo-50)×0.65 + bonus rischio + bonus forma + bonus feeling squadra [+ bonus compagno]`.
  L'"overall pesato" del giocatore (quello di mercato/compenso) NON entra in questa formula — solo gli
  attributi grezzi.
- **Dipendenza dalla forza avversaria**: sì, in due punti — `finishMatch()` aggiunge "gol extra" impliciti
  calcolati sulla `forza` reale (da `DB_SQUADRE`) della squadra avversaria; `simSquadra()` (usata da
  `skipGiornata`/`simulaPartita`/altre partite del girone) usa direttamente le due forze.
- **Compagni di squadra attivi** (`sceglieCompagni(nomeSquadra)`): pesca dalla rosa reale
  (`DB_SQUADRE.rosa`) il miglior attaccante/centrocampista e il miglior difensore della squadra del
  giocatore (fallback generato via `NOMI_POOL`/`COGNOMI_POOL` se la rosa non è in DB). Il loro overall
  **aumenta la % di riuscita** delle scelte con esito `assist`/`recupero` (bonus in `calcChance`) e vengono
  **citati per nome** nei log di partita ("Assist perfetto di X per Rossi...").
- **Modalità "Simula partita"** (`simulaPartita()`): bottone in hub accanto a "Scendi in campo", risolve la
  giornata (o la partita di coppa pendente) senza il minigioco a scelte, stesso motore di `skipGiornata`.
- **Preparazione settimanale bloccata a una scelta**: `state.allenamentoFatto`/`ultimoAllenamento` impedisce
  di applicare più allenamenti nella stessa settimana (bug corretto: prima "Riposo e recupero" si poteva
  cliccare più volte); si resetta a ogni giornata/nuova stagione.

## Altri sistemi principali

- **Creazione personaggio**: nome, ruolo, data di nascita, girone/squadra Serie C, allocazione punti
  attributo (10 pt su 6 attributi generici, o sulle 7 skill dedicate se il ruolo è Portiere — vedi sezione
  dedicata).
- **Overall/attributi**: `overallPesato`, `attributiDaOverall`, `ROLE_BASE`/`GK_ROLE_BASE`,
  `ROLE_WEIGHTS`/`GK_ROLE_WEIGHTS`, selezionati con `attrKeysFor`/`roleBaseFor`/`roleWeightsFor`.
- **Età**: `calcolaEta`, `etaMultiplier`, `etaCarrieraMultiplier` basati su `dataNascita`.
- **Mercato/valore**: `valoreMercato`, `disciplinaMultiplier`, offerte di mercato a fine stagione
  (`generateOffers`, `negoziaOfferta`, `accettaOfferta`, `rifiutaOfferta`, `finalizzaMercato`).
- **Scheda giocatore ripulita**: `carStats`/`carFinRel` mostrano solo saldo, compenso sportivo, valore di
  mercato, reputazione e rapporti — rimossi "Moltip. disciplina", "Budget club" e "Marketing (mese)" (non
  attinenti alla sola parte giocatore).
- **Partita**: `MOMENTS` (4 momenti chiave per partita, scelte con rischio safe/mid/high; per un Portiere
  vengono usati 4 momenti pescati a caso da `GK_MOMENTS_POOL`, vedi sezione dedicata), `calcChance`,
  `resolveChoice`, `finishMatch` (voto, XP, infortuni, cartellini) — ora "context-aware" campionato/coppa
  (vedi sopra) e con eventi dinamici intermezzati (`MATCH_EVENTS`, vedi sezione dedicata).
- **Simulazione senza giocare**: `skipGiornata`, `simSquadra`, `applyResultToClassifica` (simula anche le
  altre partite del girone).
- **Eventi narrativi**: `EVENTS`, `pickEvent`, `showEvent` (scelte con conseguenze su relazioni/morale/ecc.).
- **Achievement**: `ACHIEVEMENTS`, `checkAchievements`.
- **Regen/newgen**: `generaRegen`, `generaRegenStagionali` (giocatori generati narrativamente per le
  squadre rivali a fine stagione).
- **Promozione/retrocessione**: `renderSeasonEnd` (primi 2 promossi, ultimi 2 retrocessi, salvo tetto/fondo
  piramide C/A).
- **Salvataggio**: `localStorage`, chiave `carriera_csi_save`, oggetto `state` unico.
- **Ricomincia carriera**: bottone "Ricomincia carriera (cancella salvataggio)" nell'hub, `restartCareer()`
  cancella il salvataggio, azzera le variabili di creazione e torna a `screen-create` (con conferma via
  `confirm()`).

## Ambiente di sviluppo

- Nessun `package.json`: progetto statico a file singolo.
- `.claude/launch.json` configura un server statico (`python -m http.server 8080`) per l'anteprima nel
  Browser pane.

## Cronologia sintetica delle modifiche in questa serie di conversazioni

1. Creazione iniziale di `index.html` (poi sovrascritto due volte con versioni v0.3 → v0.4 fornite
   dall'utente).
2. Import dati reali completi (280 squadre, 5511 giocatori) in `DB_SQUADRE` da
   `ranking_squadre_3.xlsx` + `giocatori_overall_stimato.xlsx`, sostituendo un `DB_SQUADRE` troncato.
3. Aggiunta UI di creazione personaggio con data di nascita e girone/squadra reale
   (`inpDataNascita`, `inpGirone`, `renderGironiPicker`, `renderTeamPickerByGirone`).
4. Correzione nome girone `"Girone G?_DA_CONFERMARE"` → `"Girone G"` (13 occorrenze).
5. Filtro selezione girone di partenza limitato alle sole squadre di "Serie C" (con serie sempre mostrata
   accanto al girone per evitare ambiguità).
6. Rimosso il limite artificiale di 12 squadre nel picker di girone (ora mostra tutte le 14).
7. Aggiornamento `DB_SQUADRE` con serie/gironi della stagione 2026/27 da
   `gironi_2026_27_ricomposti.xlsx` (276/280 squadre aggiornate; 4 non più presenti nel nuovo file).
8. Espansione `LEAGUES.C` a tutte le 80 squadre reali di Serie C (6 gironi A–F).
9. Correzione calendario: partite ora solo contro squadre dello stesso girone reale, numero di giornate
   dinamico invece di fisso a 7.
10. Implementazione completa del Sistema Economico Strato 2 (compenso sportivo, budget club, marketing,
    lavoro, ciclo di pagamento mensile) con test funzionali (Node + browser).
11. Configurazione ambiente di anteprima (`.claude/launch.json` + server statico Python).
12. Creato questo file `RIEPILOGO.md`, con aggiornamento automatico ogni 5 messaggi utente.
13. Vincolata la scelta del lavoro a inizio stagione (`lavoroModificabile`), bottoni disabilitati nelle
    altre giornate.
14. Aggiunto bottone "Ricomincia carriera" (`restartCareer`) nell'hub.
15. Implementata la Coppa Leonessa: fase preliminare (B+C, 49 gironi da 4, primi + 47 migliori seconde) e
    fase principale (Serie A come teste di serie max 2/girone + qualificate, 45 gironi da 4, primi + 19
    migliori seconde → 64 squadre ai 32esimi), con schermata dedicata e tabellina di girone.
16. Aggiunta modalità "Simula partita" in hub (`simulaPartita`).
17. Scheda giocatore ripulita: rimossi moltiplicatore disciplina, budget club e marketing dalla card
    finanze/statistiche.
18. Compagni di squadra resi attivi in partita: pescati dalla rosa reale (`sceglieCompagni`), bonus a
    assist/recupero, citati per nome nei log.
19. Campionato ora andata e ritorno: ogni girone raddoppia le giornate (es. 26 invece di 13 per 14 squadre).
20. Banner dorato animato in fine-stagione per segnalare l'esito/stato della Coppa Leonessa.
21. **Bug fix architetturale Coppa Leonessa**: prima si simulava tutto istantaneamente a fine stagione senza
    che il giocatore giocasse nulla; ora le 3 partite di girone del giocatore (preliminare, poi principale se
    qualificato) si giocano davvero dall'hub con lo stesso motore del campionato, tramite
    `state.coppa`/`iniziaCoppaLeonessa`/`avviaFaseCoppa`/`postCoppaMatch`/`finalizzaGironeCoppa`.
22. Aggiunta indicazione "Partita X/3" durante la Coppa (hub, schermo partita, schermata Coppa), per non
    perdere il riferimento di quante partite di girone mancano.

## TODO aperti

- Tabellone a eliminazione diretta dei 32esimi di Coppa Leonessa (oggi si determina solo chi vi accede, non
  si gioca il turno a eliminazione).
- Bonus derby (+30% marketing) predisposto in `calcolaMarketing` ma non agganciato a una rilevazione
  automatica dei derby in calendario.
- Meccanismo promozione/retrocessione di Serie B: la regola reale ("primo + 14 migliori seconde"/"ultimo +
  14 peggiori penultime" su TUTTI i gironi B) è solo approssimata (`calcolaEsitoStagione`) perché il motore
  segue soltanto il girone del giocatore, non l'intera Serie B in parallelo. Servirebbe simulare tutti i
  gironi B (come si fa già per la Coppa Leonessa) per renderla esatta.
- `MATCH_EVENTS`: implementati solo 8 eventi rappresentativi (5 normali + 3 GK) sui ~22 archetipi
  originariamente proposti (primo contrasto, compagno che non passa, errore arbitrale, occasione sbagliata,
  gol segnato, compagno in difficoltà, duello personale, richiamo allenatore, partita in equilibrio,
  cartellino, crisi di fiducia, errore consecutivo, campo pesante, pioggia, freddo, pubblico avversario,
  compagno in ritardo, pallone perso fuori, borracce dimenticate, presidente a bordo campo, ex compagno
  sugli spalti, terzo tempo) — per ora coperte solo le prime 5-6 categorie (GAMEPLAY, RELATIONSHIP,
  ENVIRONMENTAL, PSYCHOLOGICAL, TEAM, GOALKEEPER); mancano ancora TACTICAL, PHYSICAL, PROVINCIAL_LIFE.
  L'architettura (schema dati + resolver + cooldown/pesi) è già pronta per aggiungerne altri senza toccare
  il motore.
- Sistema rigori: non esiste, nemmeno come struttura minima (scelta esplicita dell'utente, da fare solo
  quando si svilupperà davvero quel sistema).
- Mercato invernale (pausa 21 dic-24 gen): niente trasferimenti, solo allenamento + rinnovo col club
  attuale — limite tecnico (il calendario/classifica campionato è costruito una volta a stagione intorno
  alla squadra del giocatore, spostarlo a metà stagione richiederebbe ricostruirlo, vedi sezione dedicata).
- 14 dei 16 giocatori reali con età implausibile (51-90 anni) trovati nello scan del database non sono
  stati ancora verificati/corretti (solo Poli Federico e Turelli Massimo sono stati decisi dall'utente).

## Batch di correzioni richieste dall'utente (2026-07-29)

Sessione dedicata a 12 bug/richieste segnalate insieme, verificate con test riprodotti in browser
(non solo lette dal codice) prima di essere corrette:

1. **Coppa Leonessa, punti già presenti prima di giocare**: `simulaGironeConGiocatore` simulava
   SUBITO tutte le partite fra le altre 3 squadre del girone appena creato, quindi all'ingresso in Coppa
   si vedevano già punti non giocati. Ora quelle partite restano in coda (`state.coppa.altreSfide`) e se ne
   gioca una alla volta, in parallelo a ogni partita del giocatore (`simulaProssimaSfidaAltrui`, richiamata
   da `applyResultToCoppaGirone`).
2. **Coppa Leonessa, classifica di girone non ordinata**: la tabella in corso (`renderCoppa`) mostrava
   `state.coppa.girone` nell'ordine di creazione, non per punti. Aggiunta `ordinaGirone()` (ordinamento non
   distruttivo per punti poi differenza reti) usata nel rendering della tabella "in corso".
3. **Nessuna vera fase di mercato/preparazione estiva fra una stagione e l'altra**: la schermata mercato
   era un'unica finestra istantanea. Ora è una "preparazione estiva" di **4 sessioni**
   (`state.mercatoSessione`, `avanzaSessioneMercato`): a ogni sessione nuove offerte di mercato +
   un allenamento estivo scelto fra le stesse 4 opzioni della settimana in campionato
   (`state.allenamentoFattoMercato`); dopo la 4ª sessione (o prima, se si firma/si resta) si passa alla
   nuova stagione.
4. **Girone di Serie B con 21 squadre invece di 14** (bug riprodotto: appena promossi, `calLen` risultava
   40 invece di 28): `buildTierSeason` cercava compagni di girone confrontando `serie`/`girone` REALI del
   club scelto in creazione (fissi, sempre di Serie C), che dopo una promozione non combaciano più con la
   nuova serie; il fallback usava l'intero pool `LEAGUES.B` (20 squadre "flavor", non i gironi reali). Ora,
   se la squadra gioca in una serie diversa da quella reale d'origine, si sceglie un girone realmente
   esistente in quella serie da `DB_SQUADRE` (stessa dimensione dei gironi veri) invece dell'intero pool.
5. **Meccanismo promozioni/retrocessioni identico per tutte le leghe**: prima "primi 2 su / ultimi 2 giù"
   ovunque. Nuova `calcolaEsitoStagione()`: Serie C promuove solo le prime due, Serie A retrocede solo le
   ultime due; Serie B promuove il primo + (con probabilità legata al rendimento in punti/partita) la
   seconda come "una delle 14 migliori seconde nazionali", e specularmente retrocede l'ultimo + (con
   probabilità) il penultimo (vedi TODO aperti per il limite di questa approssimazione).
6. **"Riposo e recupero" non implicito**: se il giocatore non sceglieva alcun allenamento settimanale,
   prima non succedeva nulla. Ora `postGiornataFlow` applica automaticamente "Riposo e recupero" se
   `state.allenamentoFatto` è ancora `false` a fine giornata.
7. **Gioco bloccato a fine prima stagione, nessuna scelta possibile (bug riprodotto)**: causa reale
   trovata simulando in browser — se il giocatore firma un nuovo contratto con un'altra squadra
   (`accettaOfferta`) mentre una Coppa Leonessa è ancora in corso (`state.coppa` non nullo) per la vecchia
   squadra, la partita di coppa successiva andava in eccezione (`applyResultToCoppaGirone` non trovava più
   la vecchia squadra nel girone, causando un crash che interrompeva `finishMatch()` a metà, senza mai
   arrivare a `save()`/cambio schermata: il gioco restava "congelato" sulla schermata di partita). Corretto:
   cambiare squadra mentre la Coppa è in corso ora chiude anticipatamente quel percorso di coppa
   (`state.coppa`/`state.coppaTorneo` azzerati) invece di andare in errore.
8. **"Persa la funzione di salvataggio"**: il salvataggio automatico su `localStorage` (`save()`/`load()`)
   di per sé funzionava (verificato: stagione/giornata/saldo sopravvivono a un reload); il "salvataggio
   perso" segnalato coincide quasi certamente col blocco del punto 7 (l'ultimo stato salvato restava
   comunque quello precedente al crash, dando l'impressione di aver perso progressi).
9. **Accordi commerciali troppo frequenti / arricchimento troppo rapido**: `pickEvent` pescava un evento
   nel 65% delle giornate senza alcun limite di frequenza per gli eventi economici. Ridotta la probabilità
   generale (40%) e aggiunto un cooldown di 6 giornate per gli eventi a base finanziaria
   (`EVENTI_FINANZIARI`/`COOLDOWN_EVENTO_FINANZIARIO`); ridotti anche gli importi di "sponsor_call" e
   "evento_sponsor".
10. **Voti sempre sufficienti / il gioco sembra impossibile da perdere**: `calcChance` non teneva conto
    della forza reale dell'avversario nelle singole scelte di partita (solo nei gol impliciti di fine
    gara), rendendo ogni partita ugualmente facile. Aggiunta una penalità legata a `opp.forza`. Il voto di
    fine partita partiva da una base già sufficiente (5.5) con margini di sconfitta minimi; abbassata la
    base (4.4) e resi più pesanti gli scarti per vittoria/pareggio/sconfitta.
11. **Partite più lunghe di 50'**: la durata mostrata a schermo (`matchMinute`) cresceva troppo tra un
    momento chiave e l'altro (fino a 68-84' all'ultimo momento). Corretto due volte: prima un tentativo con
    minuto forzato a 90' (sbagliato: l'utente vuole che le partite durino **50'**, non 90'), poi corretto
    definitivamente — `finishMatch()` forza il minuto a **50'** e gli incrementi fra un momento e l'altro
    sono stati ridotti (`rand(9,13)` fisso, senza più l'escalation `+idx*6`) così il conteggio cresce in
    modo coerente verso i 50' invece di saltare a valori più alti.
12. **L'energia non rende il giocatore "non schierabile"**: il bottone "Scendi in campo" si disabilitava
    sotto 15 di energia, ma "Simula partita" restava sempre attivo e non consumava energia, permettendo di
    proseguire senza conseguenze. Ora anche "Simula partita" si disabilita sotto 15 di energia (bottone e
    funzione), consuma energia quando eseguita, e con energia troppo bassa l'hub mostra un avviso più un
    bottone dedicato "Riposa (salta giornata)".

## Correzioni successive al batch (stessa giornata, messaggi separati)

- **Bug: hub non aggiornata tornando da Classifica/Scheda giocatore/Coppa**: `showScreen(id)` aggiornava
  Classifica/Carriera/Coppa quando mostrate, ma non la hub — "Torna all'hub"/"Torna alla carriera" potevano
  lasciare visibile il vecchio badge "Giornata X/Y" invece di "Coppa · Preliminare · Partita 1/3" (e il
  bottone "Scendi in campo" puntava all'ultimo avversario di campionato). Corretto: `showScreen('hub')`
  richiama sempre `renderHub()`.
- **Bug: si poteva iniziare la carriera senza scegliere girone/squadra**: `selectedStartTeam` partiva già
  valorizzato su una squadra mai scelta (`LEAGUES.C.startChoices[0]`). Ora parte `null` e `startCareer()`
  blocca con un avviso finché non si sceglie davvero girone e squadra.
- **Box "Lavoro"** spostato nell'hub subito sopra il bottone "Ricomincia carriera".
- **Registro partite**: nuova tabella nella Scheda giocatore (`state.registroPartite`, popolata da
  `registraPartita()`, unico punto di raccolta usato da tutte le vie di conclusione di una partita —
  giocata, simulata, campionato o Coppa) con stagione/giornata, avversario, risultato, gol/assist personali
  e voto.
- **Difficoltà — causa reale trovata e corretta**: nella simulazione automatica (`skipGiornata`/"Simula
  partita") la forza della propria squadra era fissa a `58` per tutti (invece della forza reale del club) e
  usava una formula più permissiva di quella con cui si simulano le altre squadre del girone
  (`simSquadra`: baseline `rand(0,2)`/`diff/10` invece di `rand(0,3)`/`diff/8`). Questo garantiva punti
  facili indipendentemente dalla squadra scelta (test: ASTON 5 PERLE, forza reale ~9.7, arrivava
  regolarmente a metà classifica o meglio). Corretto: stessa formula per tutti, forza reale del club
  (`getForzaSquadra(teamName())`) al posto del valore fisso. Verificato su 10 stagioni simulate: posizioni
  finali quasi sempre nella parte bassa/medio-bassa della classifica, coerenti con una squadra reale debole.
- **Profilo iniziale per ruolo non visibile in creazione**: `ROLE_BASE` differenziava già i valori di
  partenza per ruolo, ma l'allocatore mostrava solo "0" per tutti. Ora ogni attributo mostra la base del
  ruolo scelto fra parentesi e il totale aggiornato in tempo reale; cambiare ruolo aggiorna subito i valori.
- **Preparazione settimanale non modificabile**: una volta scelto un allenamento non si poteva più
  cambiare idea nella stessa settimana. Aggiunta `scegliAllenamento(id)` con uno snapshot dei valori
  (`state.allenamentoSnapshot`) preso prima del primo click della settimana: ogni nuova scelta riparte da
  quella base invece di sommarsi alla precedente, finché non si procede (partita/simulazione/salta
  giornata). Stessa logica applicata anche all'allenamento estivo di mercato.

## Sistema eventi dinamici di partita (MATCH_EVENTS)

Richiesto con un task strutturato (analisi → conferma → implementazione a fasi). Riusa il motore eventi
già esistente (`EVENTS`/`pickEvent`/`showEvent`), non ne crea uno parallelo.

- **Schema dati** (`MATCH_EVENTS`, array): `id, category, trigger, conditions, weight, cooldown,
  roleRequirement, testo, scelte` — stessi nomi campo (`testo`/`scelte` con `applica`/`esito`) che
  `showEvent()` già si aspetta, quindi zero modifiche alla UI eventi.
- **Resolver** (`pickMatchEvent(triggersAttivi, ctx)`): filtro trigger → `roleRequirement` (es. `'Portiere'`,
  nessun secondo Event Engine) → `conditions(state,ctx)` → cooldown per id in giornate
  (`state.eventiMatchUltimaGiornata`, stesso pattern già in uso per gli eventi economici) → estrazione
  pesata (`weight` come probabilità). `showMatchEvent(ev, cb)` è un sottile wrapper su `showEvent()`.
- **Trigger implementati**: `match_start` (in `beginMatch`), `after_goal`, `after_missed_chance`,
  `after_mistake`, `after_two_mistakes`, `after_yellow_card` (riusa il flag del cartellino rosso esistente:
  non esiste un sistema giallo separato), `team_winning`/`team_drawing`/`team_losing` — tutti valutati in
  `resolveChoice()` **dopo** l'aggiornamento di `myGoals/oppGoals/attempts/successes`, mai prima, e mai più
  di un evento per momento chiave (un solo `resolveChoice` per momento, nessuna catena evento→evento).
  `player_low_energy`/`player_low_morale`/`player_high_morale` sono condizioni, non trigger a parte.
- **Personalità**: `state.personalita = {individualista, trascinatore, ragionatore}` — 3 contatori minimi,
  non un sistema autonomo: crescono solo come effetto collaterale di alcune scelte (`applica`), nessuna
  logica di gioco li legge ancora in modo deterministico.
- **8 eventi implementati**: 5 normali (`primo_contrasto`, `compagno_non_passa`, `errore_arbitrale`,
  `crisi_fiducia`, `richiamo_allenatore`) + 3 GOALKEEPER (`uscita_alta`, `uno_contro_uno`,
  `pressione_psicologica_gk`, filtrati con `roleRequirement:'Portiere'`).
- **Rigori**: non implementati (né una struttura minima), su indicazione esplicita dell'utente — da fare
  solo quando si svilupperà davvero il sistema rigori.
- Verificato in browser: evento normale, condizionale, con cooldown, ruolo-specifico, GK disponibile/
  bloccato per ruolo, partita reale con eventi intermezzati senza alterare `attempts/successes` né
  bloccare mai `nextMoment()`.

## Ruolo Portiere: skill dedicate e momenti di partita dedicati

Prima un Portiere aveva gli stessi 6 attributi generici (tecnica/fisico/velocità/tiro/passaggio/difesa) e
gli stessi 4 "momenti chiave" pensati per un giocatore di movimento (tiro, dribbling, cross, contrasto in
fascia) — scelte senza senso per chi gioca in porta. Rifatto su richiesta esplicita:

- **7 skill dedicate** (`GK_ATTR_KEYS`, solo per `role==='Portiere'`): Presa, Anticipo, Riflessi, Uno
  contro uno, Distribuzione, Comunicazione, Posizionamento — con base di partenza (`GK_ROLE_BASE`) e pesi
  per l'overall (`GK_ROLE_WEIGHTS`) analoghi a `ROLE_BASE`/`ROLE_WEIGHTS` ma in un set separato. Selezionati
  ovunque serva tramite gli helper `attrKeysFor(role)` / `attrLabelsFor(role)` / `roleBaseFor(role)` /
  `roleWeightsFor(role)`, usati da overall, allocatore in creazione, salita di livello (`addXP`) e scheda
  giocatore — nessuna duplicazione di logica, solo selezione del set giusto.
- **Migrazione salvataggi vecchi**: un Portiere con gli attributi generici viene rigenerato sulle nuove
  skill mantenendo l'overall già maturato (`overallPesatoLegacyGK` + `attributiDaOverall`), in `boot()`.
- **8 nuovi momenti di partita da Portiere** (`GK_MOMENTS_POOL`): cross in area piccola, uno contro uno,
  retropassaggio sotto pressione, tiro da fuori, palla alle spalle della difesa, cross o tiro, pallone
  sporco, comunicazione difensiva. Ogni momento ha 2 scelte che combinano due skill (`attr`+`attr2`,
  mediate in `calcChance`) più una terza scelta "Cautela" senza alcun test di abilità (`attr:null` →
  base neutra fissa in `calcChance`, nessun bonus). A ogni partita se ne estraggono **4 a caso** dagli 8
  (`state.matchTemp.gkMomenti`), così le partite da portiere non sono sempre identiche, mantenendo la
  stessa durata (4 momenti) delle partite da movimento.
- **Recap di fine stagione differenziato**: per un Portiere "Gol stagione"/"Assist stagione" sono sostituiti
  da **Gol subiti** e **Clean sheet** (`state.stagioneStats.golSubiti`/`cleanSheet`, aggiornati in
  `registraPartita()` per ogni partita); media voto resta invariata per tutti i ruoli.
- Verificato in browser: allocator con le 7 skill per un Portiere, partita reale con 4 momenti diversi da
  GK e percentuali coerenti (le scelte "serie" variano con le skill, "Cautela" resta fissa).

## Eventi trade-off per giocatori di movimento (estensione di MATCH_EVENTS)

Estende il motore `MATCH_EVENTS` già esistente (nessun secondo Event Engine, nessuna nuova skill):
12 eventi in cui ogni scelta è una vera verifica di abilità con 2 skill (o 1 sola per l'opzione
cautelativa), non solo `applica`/`esito` fisso come i primi 5 eventi "narrativi".

- **`skillScelta(label, attr, attr2, risk, out, esitoOk, esitoKo, tratto)`**: fabbrica che genera la
  scelta. Dentro `applica(s)`: calcola la chance con lo stesso `calcChance(attr, risk, out, attr2)` dei
  momenti chiave, incrementa `attempts`/`successes` **una sola volta** (nessun doppio conteggio, non
  passa da `resolveChoice`), applica il risultato con **`applyChoiceOutcome(choice, success)`** (estratta
  da `resolveChoice` per essere condivisa, stessa logica di goal/assist/recupero/possesso/rosso), poi
  incrementa opzionalmente un contatore di `state.personalita` e **restituisce il testo di esito**
  dipendente dalla riuscita.
- **`showEvent()` esteso minimamente**: ora usa `sc.applica(state)` come testo di esito se non-vuoto,
  altrimenti ricade su `sc.esito` statico — retrocompatibile con tutti gli eventi esistenti (economici,
  narrativi, GK) che non restituiscono nulla da `applica`.
- **6 skill usate, quelle già esistenti**: tecnica, fisico, velocità, tiro, passaggio, difesa — nessuna
  nuova statistica per ruolo.
- **12 eventi implementati** (`category:'GAMEPLAY'`, tutti con `conditions: s=>s.role!=='Portiere'` per
  escludere il Portiere, che resta sui suoi eventi `roleRequirement:'Portiere'` separati): 
  `ricezione_spalle_porta`, `contropiede`, `uno_contro_uno_fascia`, `passaggio_filtrante`, `tiro_da_fuori`,
  `difensore_spalle`, `pallone_alto`, `cross`, `duello_fisico`, `pressing`, `difesa_campo_aperto`,
  `occasione_da_gol`. Ognuno con 3 scelte: due "serie" (skill diverse, rischio/ricompensa diversi) + una
  cautelativa contestuale (es. tiro → passo al compagno; contropiede → rallento; duello → non intervengo),
  mai una "scelta senza rischio" pura.
- Riusano i trigger già esistenti (`match_start`, `after_goal`, `after_missed_chance`, `after_mistake`,
  `after_two_mistakes`, `team_winning`/`team_drawing`/`team_losing`): nessun nuovo trigger, competono per
  estrazione con gli eventi narrativi già presenti sullo stesso trigger.
- Verificato in browser: partita reale creata a runtime, evento `ricezione_spalle_porta` estratto a
  `match_start`, scelta con esito successo (gol, `attempts`/`successes` incrementati una volta,
  personalità aggiornata) e fallimento, scelta cautelativa a skill singola, esclusione confermata per
  Portiere, `pickMatchEvent` verificato su tutti i 7 trigger riusati, ritorno corretto a `nextMoment()`
  dopo l'evento senza bloccare il flusso partita.

## Creazione carriera: "continua con un giocatore esistente"

In `#screen-create` è stata aggiunta una scelta di modalità (`selezionaModalitaCreazione('nuovo'|'esistente')`,
default `'nuovo'`), prima della selezione girone/squadra già esistente:

- **Nuovo giocatore** (comportamento invariato): nome libero, ruolo a scelta, allocatore punti su
  `ROLE_BASE`.
- **Giocatore esistente**: dopo aver scelto girone e squadra, `renderRealPlayerPicker()` mostra la rosa
  reale della squadra (`getRosaReale`, da `DB_SQUADRE[...].rosa`) ordinata per OVR decrescente, cliccabile
  come i team-picker già esistenti. Selezionato un giocatore, `startCareer()` usa **le funzioni già
  esistenti**, nessun nuovo sistema di attributi:
  - `ruoloDBtoInterno(g.ruolo)` per il ruolo di gioco (POR/DIF/CEN/ALA/ATT → Portiere/Difensore/Regista/
    Ala/Attaccante, con Ala come fallback — la stessa mappatura già usata per i compagni di squadra nei
    match);
  - `attributiDaOverall(g.ovr, role)` per generare l'intero set di attributi (i 6 generici o i 7 GK a
    seconda del ruolo) dal suo overall reale — la stessa funzione già usata per la migrazione dei
    salvataggi legacy dei Portieri;
  - `generaDataNascita(...)` per una data di nascita plausibile (il giocatore reale non ha una data di
    nascita nei dati sorgente, solo `nome`/`ruolo`/`ovr`).
  - L'allocatore punti e i campi nome/ruolo/data manuale (`#blockNuovoGiocatore`) sono nascosti in questa
    modalità: gli attributi derivano interamente dall'OVR reale, senza punti da assegnare.
  - Se la squadra scelta non ha rosa reale nel database (es. `GSO CAPRIOLOB`, vedi limite sotto),
    `renderRealPlayerPicker()` mostra un avviso e blocca l'avvio finché non si cambia squadra o modalità.
- Verificato in browser: toggle modalità, lista giocatori popolata per una squadra con rosa reale,
  avvio carriera con ruolo/attributi/overall coerenti col giocatore scelto (Portiere, overall
  ricalcolato = overall originale), messaggio di fallback per squadra senza rosa, percorso "nuovo
  giocatore" invariato.
- Limite accettato: il giocatore reale scelto resta comunque presente nella rosa usata per generare i
  "compagni" narrativi in partita (`sceglieCompagni`) — non viene rimosso dai dati sorgente, quindi può
  in teoria comparire anche come proprio "compagno" nei commenti testuali. Corner case narrativo minore,
  non corretto per restare lean (richiederebbe filtrare la rosa ovunque venga letta).

## Correzione dati: rose GSO CAPRIOLO / GSO CAPRIOLOB scorporate

Bug nei dati sorgente: 15 giocatori appartenenti realmente a `GSO CAPRIOLOB` erano stati inclusi per
errore nella rosa di `GSO CAPRIOLO` (che restava con la rosa dell'altra squadra reale + quella
"riserva" mescolate insieme), mentre `GSO CAPRIOLOB` aveva `rosa: []`. Corretto su lista fornita
esplicitamente dall'utente:

- Rimossi da `GSO CAPRIOLO`: Amodeo Felotti Luca, Bessi Thomas, Bettoni Andrea, Bioh Nicholas, Bogachev
  Konstantin, Bono Matteo, Leporati Matteo, Malzani Davide, Pedersoli Davide, Raddi Davide, Sabbadini
  Gabriele, Schembri Giovanni, Suardi Luca, Tommesani Liam, Zanotti Nicola (ora 19 giocatori, invariati).
- Assegnati a `GSO CAPRIOLOB` (ora 17 giocatori): gli stessi 15 sopra + 2 non ancora presenti in nessuna
  rosa (`Fontana Davide`, POR, e `Garufi Simone`, CEN — overall stimato a 58, non fornito dall'utente,
  in linea con la media del resto della rosa).
- Ruoli corretti secondo la lista dell'utente durante lo spostamento: Suardi Luca e Malzani Davide erano
  salvati come `DIF` in `GSO CAPRIOLO`, ma l'utente li indica come `CEN` — corretti nel passaggio a
  `GSO CAPRIOLOB`.
- Non toccate le date di nascita fornite dall'utente: lo schema `rosa` (`nome`/`ruolo`/`ovr`) non prevede
  un campo data di nascita per i compagni di squadra (solo per il giocatore controllato, `state.dataNascita`)
  — introdurlo per 17 giocatori di una sola squadra sarebbe incoerente col resto del database.
- Verificato in browser: `getRosaReale('GSO CAPRIOLO').length === 19`,
  `getRosaReale('GSO CAPRIOLOB').length === 17`, nessun giocatore duplicato tra le due rose.

## Bug: gironi duplicati nel picker di creazione

`renderGironiPicker()` popola il `<select id="inpGirone">` aggiungendo `<option>` senza mai svuotarlo
prima. Veniva richiamata più volte nello stesso ciclo di vita della pagina (all'avvio, in
`restartCareer()`, e in `boot()` dopo il caricamento di un salvataggio esistente), quindi ogni girone
compariva duplicato (2 o 3 volte) nella tendina. Corretto azzerando il `<select>`
(`select.innerHTML = '<option value="">— Scegli girone —</option>'`) a inizio funzione, prima di
ricalcolare e riaggiungere i gironi. Verificato in browser: 3 chiamate consecutive a
`renderGironiPicker()` producono sempre 7 opzioni totali, zero duplicati.

## Ruolo "Mezzala" rinominato in "Ala" + taratura rosa IMPLAST

- Rinominato solo il nome del ruolo (chiave `Ala` al posto di `Mezzala`) in `ROLE_BASE`, `ROLE_WEIGHTS`,
  `ROLE_VALUE_MULT`, select `#inpRole`, `ruoliPossibili` e fallback di `ruoloDBtoInterno` — stessi
  attributi/pesi di prima, cambia solo l'etichetta. Aggiunto anche un codice esplicito `ALA` alla mappa
  di `ruoloDBtoInterno` (prima solo POR/DIF/CEN/ATT, con fallback implicito su Mezzala/Ala per codici
  sconosciuti) per poter marcare esplicitamente un'ala nei dati reali.
- **Migrazione salvataggi**: un vecchio salvataggio con `state.role==='Mezzala'` viene rinominato in
  `'Ala'` in `boot()`.
- **Overall tarati su richiesta esplicita** per la rosa reale di IMPLAST (Girone E, Serie C): Turla 67,
  Paderno 68, Fra Nicholas 69 (ruolo passato da `CEN` ad `ALA`), Facchi 68, Vezzoli 67, Menassi 66,
  Bonardi 65 (ruolo passato da `CEN` ad `ALA`), Vavassori 66, Laudani 62, Mingotti 60, Regazzoni 67. Gli
  altri giocatori della rosa (Simoni, Notari, Santinelli, Brescianini) non sono stati toccati.
- Verificato in browser: nessun riferimento residuo a "Mezzala" nel codice (a parte il commento/riga di
  migrazione), opzione "Ala" presente nel select, picker "giocatore esistente" su IMPLAST mostra
  correttamente "Fra Nicholas — Ala (OVR 69)" e "Bonardi Stefano — Ala (OVR 65)", avvio carriera con Fra
  Nicholas produce `role:'Ala'` e overall ricalcolato coerente (~68-69, piccolo jitter atteso da
  `attributiDaOverall`).

## Date di nascita reali per i giocatori esistenti (da database_csi_pulito_v3.xlsx)

Integrate le date di nascita reali fornite dall'utente in un file Excel esterno (fuori dal progetto,
usato **solo** per questo scopo, nessun'altra informazione ne è stata estratta):

- Il file copre solo Serie A (7 gironi) e Serie B (10 gironi) — **nessun foglio di Serie C**. Su 5.329
  giocatori nel file, 2.838 hanno una data reale (il resto è `-`, non censito).
- Squadre abbinate a `DB_SQUADRE` tramite `vecchio_nome` (con normalizzazione minima di
  maiuscole/punteggiatura/spazi per gestire varianti come "E.C. Madernese" vs "E. C. Madernese"): 267
  squadre su 271 abbinate; le 4 non abbinate sono voci non valide o assenti dal database
  (`VEDI TESTO IN CHAT`, `N.D.`, `Lepore Group`, refuso `Paratico Whit`→corretto manualmente in
  `PARATICO WHITE`). Giocatori abbinati per nome all'interno della rosa della squadra corrispondente:
  2.790 voci `rosa` hanno ora un campo `dataNascita: "YYYY-MM-DD"` in più (nessuna nuova struttura dati,
  solo un campo opzionale sull'oggetto giocatore già esistente). Numero totale di giocatori nel database
  invariato (5.513).
- **Cascata a 3 livelli** nel ramo `'esistente'` di `startCareer()` ([index.html](index.html)), su richiesta
  esplicita dell'utente: 1) data reale del giocatore se presente; 2) altrimenti un intorno (`±3` anni,
  `generaDataNascita`) dell'età media dei compagni di rosa che HANNO una data reale; 3) se nessun
  compagno ha una data reale (tipicamente le squadre di Serie C, non coperte dal file), un intorno
  (`±4` anni) dell'età media di lega (`ETA_MEDIA_LEGA`, nuova piccola costante accanto ad
  `ANNO_INIZIO_CARRIERA`). Riusa `generaDataNascita` già esistente, nessun nuovo generatore.
- Verificato in browser sui 3 casi: giocatore con data reale (Marini Daniele, ROBY PASI → data invariata),
  giocatore senza data ma con compagni datati (Martinelli Stefano, ASTON 5 PERLE → età coerente con la
  media squadra), giocatore senza data e senza compagni datati (Fra Nicholas, IMPLAST, Serie C → età
  nell'intorno della media di lega).

## Calendario reale: inizio stagione e pausa invernale

Prima il gioco teneva traccia solo di `giornata`/`stagione` come numeri, senza alcuna data di calendario
reale. Aggiunto su richiesta esplicita:

- **`dataGiornata(stagione, giornataNum)`** (nuova funzione, [index.html](index.html)): ogni stagione parte il
  **26 settembre** dell'anno corrispondente (`ANNO_INIZIO_CARRIERA + stagione-1`), giornate a cadenza
  settimanale. La **pausa invernale dal 21 dicembre al 24 gennaio compreso** viene saltata: qualunque
  giornata che cadrebbe in quell'intervallo slitta al 25 gennaio in avanti (poi riprende la cadenza
  settimanale da lì).
- Aritmetica in **UTC** (`Date.UTC`) apposta per evitare un bug di sfasamento di un giorno quando la somma
  di 7 giorni attraversa il cambio dell'ora legale di fine ottobre (con `Date` in orario locale la
  giornata 6 risultava erroneamente 30 ottobre invece di 31 — trovato e corretto in fase di verifica).
- Mostrata nell'hub accanto al badge esistente: `Giornata X/Y · 26 settembre 2026` (in
  `renderHub()`, solo per il campionato — la Coppa Leonessa continua a mostrare la sua etichetta
  `Coppa · Fase · Partita N/M` invariata, nessuna data inventata lì).
- Verificato in browser: giornata 1 = 26 settembre 2026, giornata 13 = 19 dicembre 2026, giornata 14 =
  25 gennaio 2027 (salto corretto della pausa), stagione 2 riparte il 26 settembre 2027, badge hub
  aggiornato correttamente in una carriera reale.
- Non toccati: mercato estivo (`mercatoSessione`, ancora basato su sessioni post-stagione, non su una
  data di calendario), Coppa Leonessa, contratti/scadenze — restano come prima, per restare nello scope
  della richiesta.

## Bug: età calcolata solo sull'anno di nascita

`calcolaEta(s)` sottraeva solo l'anno (`annoCorrente(s) - annoNascita`), senza verificare se il
compleanno fosse già passato rispetto alla data corrente in-game: un giocatore nato dopo il 26
settembre (inizio stagione) risultava già "invecchiato" di un anno in anticipo. Corretto confrontando
mese/giorno di nascita con `dataGiornata(s.stagione, s.giornata)` (la data reale introdotta nella
sezione precedente): l'età ora si aggiorna esattamente al giorno del compleanno in-game, non a inizio
stagione per tutti. Verificato: un giocatore nato il 4 novembre passa da 23 a 24 anni esattamente alla
giornata del 7 novembre, non dal 26 settembre.

Durante la verifica, uno scan di tutte le 2.774 date reali nel database ha trovato 16 giocatori con età
implausibili (51-90 anni) — dati della fonte Excel originale, non un bug di calcolo. Su richiesta
dell'utente: rimossa la `dataNascita` di **Poli Federico** (POLI PEZZAZE, dava 90 anni — scartata come
refuso), mantenuta quella di **Turelli Massimo** (I.G.D., 58 anni — confermata come corretta). Gli altri
14 casi implausibili individuati non sono stati toccati, in attesa di eventuale verifica dell'utente.

## Bug: etichetta stipendio "€/gg" invece di "€/sett."

`payStipendio()` viene chiamato una sola volta per giornata (`postGiornataFlow()`), e con il calendario
reale introdotto sopra ogni giornata è una settimana: lo stipendio del contratto è quindi settimanale,
non giornaliero. L'etichetta "/gg" era sbagliata in tutti i punti dove compare lo stipendio (hub,
scheda mercato, offerte di mercato, diario) — corretta in "/sett." in tutti e 5 i punti
([index.html:1311](index.html:1311) e altri). Il "0€/mese" di Compenso sportivo in Scheda giocatore
segnalato insieme non era un bug: è accreditato solo ogni 4 giornate (mensilità), quindi resta 0 a
inizio carriera per costruzione.

## Mercato invernale (nuova sessione durante la pausa)

Aggiunta su richiesta esplicita una sessione di mercato invernale, agganciata alla pausa 21 dic-24 gen
già introdotta nel calendario. A differenza del mercato estivo (`goToMarket`/`finalizzaMercato`), **non
tocca stagione, giornata, calendario o classifica**: il calendario campionato è costruito una volta a
stagione intorno alla squadra del giocatore, e ricostruirlo a metà stagione per un eventuale
trasferimento falserebbe risultati/classifica già maturati — per questo la finestra invernale **non
offre trasferimenti**, solo:
- un allenamento supplementare (stesse `TRAININGS` del mercato estivo);
- un tentativo di rinnovo col club attuale tramite il procuratore (`chiediRinnovoInvernale()`, stessa
  logica di chance già usata in `negoziaOfferta()`), una volta sola per pausa, che può alzare lo
  stipendio settimanale del 10-25% o, se fallisce, incrinare leggermente il rapporto col mister.
- **Trigger** ([index.html](index.html), in `postGiornataFlow()`): confronta la data della giornata appena
  giocata con quella della prossima via `dataGiornata()` già esistente — se il salto supera gli 8 giorni
  (cioè ha appena attraversato la pausa), si apre `apriMercatoInvernale()` una sola volta a stagione
  (`state.mercatoInvernaleFatto`), poi il gioco riprende esattamente dalla giornata successiva.
- Nuova schermata `#screen-marketwinter`, nuovi campi di stato (`mercatoInvernaleFatto`,
  `allenamentoFattoInvernale`, `ultimoAllenamentoInvernale`, `rinnovoInvernaleFatto`), reset ad ogni
  nuova stagione in `finalizzaMercato()`, migrazione in `boot()` per i salvataggi esistenti (marcata
  come già fatta se la stagione in corso è già oltre la pausa, per non farla comparire retroattivamente).
- Verificato in browser su una carriera reale simulando l'intera stagione: la finestra si apre esatta
  al passaggio giornata 13 (19 dicembre) → 14 (25 gennaio), allenamento e rinnovo funzionano (stipendio
  110→127/sett., pulsante disabilitato dopo il primo tentativo), il "Torna in campo" riprende da
  giornata 14 senza toccare calendario/classifica/stagione, non si ripresenta più nel resto della
  stagione, e i flag si resettano correttamente alla stagione successiva.

## Rifatto il fuori stagione: avanzamento settimanale, mercato estivo 1/7-31/8

Su richiesta esplicita, sostituita la logica "a sessioni" del mercato estivo (4 sessioni fisse subito
dopo l'ultima giornata) con un vero **avanzamento settimana per settimana** dalla fine del campionato
alla stagione successiva, coerente con l'aver reso `dataGiornata()` la fonte di verità per il tempo di
gioco. Nessun'automazione a salto: ogni settimana, morta o no, richiede un click esplicito (scelta
confermata dall'utente tra "salto automatico" e "click settimana per settimana").

- **`state.offSeasonData`** (nuovo, stringa `YYYY-MM-DD`): traccia la settimana corrente fuori
  stagione, partendo da una settimana dopo l'ultima giornata giocata
  (`dataGiornata(stagione, calendario.length)`), fino al raggiungimento del 26 settembre (stessa data
  di inizio stagione già usata da `dataGiornata`), quando scatta in automatico `avviaNuovaStagione()`
  (ex `finalizzaMercato`, stessa logica di ricostruzione calendario/classifica/budget di prima).
- **Mercato estivo aperto solo dall'1 luglio al 31 agosto** (`inFinestraMercatoEstivo`, mesi 7-8):
  fuori da quella finestra (fine campionato-giugno, e settembre fino al 26) si passa dalla nuova
  schermata **"Fuori stagione"** (`#screen-offseason`), con solo un allenamento libero settimanale — le
  altre settimane "morte" non hanno più nulla di sessioni fisse, sono vere settimane di calendario.
  Rimossi `MERCATO_SESSIONI_TOTALI`/`goToMarket`/`avanzaSessioneMercato` (sessioni a conteggio fisso).
- **`iniziaFuoriStagione()`** (dal pulsante "Prosegui fuori stagione" a fine stagione) e
  **`avanzaSettimanaFuoriStagione()`** (chiamata da entrambe le schermate) fanno da dispatcher comune
  (`aggiornaFuoriStagione()`): decide se mostrare mercato, settimana morta, o avviare la nuova stagione,
  in base solo alla data.
- **Accettare un'offerta o restare** (`accettaOfferta`/`restaAllaSquadra`) non salta più subito alla
  stagione successiva: chiude le trattative (`state.mercatoEstivoConcluso`, niente più offerte per il
  resto dell'estate) ma continua ad avanzare settimana per settimana come tutte le altre, fino al 26
  settembre — coerente con "avanziamo ogni settimana".
- Verificato in browser su una carriera reale completa: fine stagione → settimane morte
  (26 apr - 28 giu) → mercato aperto puntualmente dal 5 luglio alla settimana del 30 agosto → settimane
  morte (6-20 settembre) → nuova stagione il 26 settembre con calendario/classifica ricostruiti;
  allenamento sia nelle settimane morte sia a mercato aperto; accettazione di un'offerta con cambio
  squadra effettivo (chiusura trattative, mercato non più riproposto, nuova stagione con la nuova
  squadra); "resta alla squadra attuale" (decremento stagioni di contratto, mercato chiuso, non
  riappare più).

## Inizio stagione spostato a inizio settembre + banner di segnalazione

Su richiesta esplicita, l'inizio di ogni stagione (sia la prima carriera sia le successive) è stato
spostato dal 26 settembre al **1° settembre** ("prima settimana di settembre"), centralizzato in una
nuova costante `GIORNO_INIZIO_STAGIONE = 1` usata sia da `dataGiornata()` sia dalla soglia di fine
fuori-stagione in `aggiornaFuoriStagione()` (unica fonte di verità, nessun valore duplicato). La pausa
invernale (21 dic-24 gen) resta invariata e continua a funzionare correttamente con la nuova data di
partenza (verificato: giornata 16 = 15 dicembre, giornata 17 salta a 25 gennaio).

Aggiunto anche un **piccolo banner in hub** che segnala l'inizio della nuova stagione: mostrato una
volta (`state.nuovaStagioneBanner`, impostato in `avviaNuovaStagione()`), con stagione/lega/squadra,
richiudibile con un "Ok" (stesso pattern del toast dei traguardi già esistente, `#achToast`/
`dismissAch()`) tramite la nuova `dismissNuovaStagioneBanner()`. Verificato in browser: prima giornata
= 1 settembre 2026, transizione di fine mercato = 1 settembre 2027, banner mostrato con testo corretto
e richiudibile.

## Il sabato come giorno di riferimento fisso di ogni settimana

Su richiesta esplicita: il sabato è ora il giorno fisso di ogni evento/data di gioco, non solo
un giorno del mese fisso. Prima l'inizio stagione era il "1° settembre" letterale, che non cade di
sabato ogni anno (es. nel 2029 sì, nel 2030 no) — e la ripresa dopo la pausa invernale saltava sempre
al "25 gennaio" fisso, che nemmeno quello è sempre sabato: la cadenza settimanale (+7 giorni esatti)
avrebbe quindi silenziosamente smesso di cadere di sabato per il resto della stagione ogni volta che
uno di questi due punti fissi non fosse stato un sabato.

- **`primoSabatoDaData(d)`** (nuovo helper generico): avanza giorno per giorno finché non trova un
  sabato (`d.getUTCDay()===6`).
- **`primoSabatoDiSettembre(anno)`**: il primo sabato a partire dal 1° settembre di quell'anno — usato
  da `dataGiornata()` come inizio stagione (al posto della vecchia costante fissa
  `GIORNO_INIZIO_STAGIONE`, rimossa) e da `aggiornaFuoriStagione()` come soglia di fine fuori-stagione.
- **Ripresa dopo la pausa invernale**: `dataGiornata()` non salta più al "25 gennaio" fisso, ma al primo
  sabato a partire dal 25 gennaio (`primoSabatoDaData`), garantendo che anche dopo la pausa tutte le
  giornate restanti continuino a cadere di sabato.
- Testi in UI (banner nuova stagione, avviso "fuori stagione") ora mostrano la data reale calcolata
  (`formattaDataIT(...)`) invece di un giorno fisso scritto a mano, quindi restano sempre coerenti.
- Verificato in browser: nessuna eccezione su 5 stagioni consecutive (26 giornate ciascuna, anni
  diversi) — tutte le giornate cadono di sabato; prima giornata varia correttamente per anno (5 set
  2026, 4 set 2027, 2 set 2028, 1 set 2029, 7 set 2030); tutte le settimane fuori stagione (morte e di
  mercato) restano di sabato fino alla stagione successiva.

## Bug noti/limiti accettati

- `GSO CAPRIOLOB` ha ancora `forza: 0.0` nei dati sorgente (piazzamento "riserva" nel file originale) —
  ricade sul valore di default (`getForzaSquadra(...)||58`) per le partite. Ora ha però una rosa reale
  propria (vedi sezione dedicata), quindi la modalità "giocatore esistente" funziona anche per questa
  squadra.
- I 4 momenti chiave "core" di un giocatore di movimento (`MOMENTS`) restano fissi (sempre gli stessi 4,
  non pescati da un pool più ampio come ora fa il Portiere con `GK_MOMENTS_POOL`) — possibile
  miglioramento futuro simmetrico. I nuovi 12 eventi trade-off aggiungono varietà come intermezzi, ma non
  sostituiscono questo pool fisso.
- Solo 12 dei ~22 eventi di movimento originariamente proposti sono stati implementati (categorie
  TACTICAL/PHYSICAL/PROVINCIAL_LIFE ancora mancanti) — architettura pronta per estendere senza toccare il
  motore.

---
*Nota di processo: l'utente ha chiesto di aggiornare questo file ogni 5 suoi messaggi. Questo aggiornamento
(2026-07-31) è stato richiesto esplicitamente con "aggiorna RIEPILOGO.md"; il conteggio del ciclo riparte
da qui.*
