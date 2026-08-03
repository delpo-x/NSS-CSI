# Carriera CSI — Riepilogo progetto

> Ultimo aggiornamento: 2026-08-02 (sessione lunga, più aggiornamenti), dopo (in aggiunta a tutto quanto
> sotto): la formula dei punti attributo in creazione personaggio (ora +1 assoluto per punto), il
> riordino della card "Lavoro" in hub, una revisione della cronaca di partita (eventi ◆ inline, cronaca
> con gerarchia visiva, niente più percentuale di riuscita sulle choice-card), la correzione del costo
> energia del lavoro Full-time, una regola di convocazione basata su reputazione/energia/forma/morale/
> rapporto col mister (panchina/non convocato, con subentro reale), il recupero energia uniformato a +40
> per riposo/salta partita/infortunio, una curva bonus/malus per le relazioni (mister/compagni) sia in
> partita che in simulazione, un riflesso settimanale della reputazione sulle relazioni, la Coppa
> Leonessa che ora parte dalla seconda settimana di aprile con avanzamento data settimanale partita per
> partita e una scheda che mostra sempre Preliminare + Fase Principale, il **completamento di tutte le
> 10 fasi** di un piano concordato per un nuovo **sistema territoriale/shop/formazione/investimenti** —
> territorio bresciano con 30 POI reali, esperienze territoriali, shop equipaggiamento (parastinchi/
> scarpe/ecc.), formazione (libri/corsi/mentor), eventi relazionali che generano opportunità, 5 livelli di
> investimento con rischio calcolato e maturazione nel tempo —, una **riorganizzazione lean/mobile-first
> dell'interfaccia** (componente tab riutilizzabile, Shop e Formazione da liste lunghe a tab per
> categoria, Scheda giocatore rinominata "Giocatore" e divisa in 4 tab, "Vita da calciatore" spostata
> dentro Giocatore come 5° tab invece di card separata in hub, `data-block` sui contenitori dell'hub in
> vista di una futura UI PC separata), e l'**estensione del sistema di personalità esistente**
> (`state.personalita`) a 4 assi — azioni nei momenti chiave di partita, allenamento settimanale, economia
> extra-campo (shop/formazione/investimenti), dialoghi fuori dal campo — con calcolo del tratto dominante
> e una card dedicata in Giocatore, e il **completamento del piano a 7 fasi "sistema personaggi"
> (A-G)**: memoria relazionale per persona con identità stabile e storico narrativo (Fase A), un
> Telefono come hub eventi con filtro anti-spam (Fase B), rivalità dinamiche interne/esterne con 10
> eventi che evolvono in rispetto/odio/amicizia/collaborazione (Fase C), eventi di vita privata e
> imprevisti "caos controllato" (Fase D), un mercato narrativo con voci vere/false/manipolate e
> Deadline Day (Fase E), una timeline legacy "La tua storia" che sopravvive a fine carriera (Fase F),
> e un **ritiro → allenatore** con 20 connessioni pratiche derivate dalle persone incontrate durante
> la carriera e un motore da allenatore che riusa la simulazione di girone già esistente (Fase G) —
> tutto riusando gli stessi motori già esistenti (EVENTS/pickEvent, diario, simSquadra/
> buildTierSeason), mai un secondo sistema parallelo. Richiesto esplicitamente (vedi nota in fondo e
> sezioni dedicate più sotto).
>
> **Aggiornamento 2026-08-03**: bug fix (giocatore esistente non più a rischio di ritrovarsi come
> proprio compagno/rivale), logo del gioco (immagine reale al posto del segnaposto "C7"), **40 nuovi
> MATCH_EVENTS in 5 pool per ruolo** (Attaccante/Att-Cen/Centrocampista/Cen-Dif/Difensore), sponsor
> personale reso più raro, +5 energia extra su riposo/salta partita/infortunio, soglia panchina al
> 50%, curva di livellaggio più ripida, relazioni coi compagni anche in "Simula partita", **sistema
> procuratore/agente** (`state.agent` + 8 `AGENT_EVENTS` + `calcChance` esteso ad array di 2 skill),
> **sistema famiglia** (`state.family` + 8 `FAMILY_EVENTS`), **rete sociale** (10 `SOCIAL_EVENTS`,
> conoscenze in `state.persone` con `ruolo:'conoscenza'`), **gruppi sociali dello spogliatoio**
> (`state.gruppoSociale` + 10 `GRUPPO_EVENTS`, appartenenza emergente da età/personalità/ruolo), e
> un bug fix sulla durata delle partite (subentro dalla panchina corretto da 65' — dopo il fischio
> finale a 50' — a 28', reso visivamente evidente con un badge, e ora anche legato alle skill del
> giocatore rispetto al resto della rosa reale).

## Cos'è

"Carriera CSI" è un gioco di carriera calcistica testuale, single-page, in italiano. Un unico file
[`index.html`](index.html) contiene tutto: markup, CSS e logica JS (nessuna build, nessuna dipendenza esterna
a parte i font Google). Il giocatore crea un calciatore, sceglie girone/squadra di Serie C reale, e scala la
piramide CSI Brescia (C → B → A) tra partite simulate a scelte, eventi narrativi, mercato ed economia.

## Requisito trasversale: accessibilità (WCAG 2.1 AA)

Vincolo permanente richiesto esplicitamente dall'utente, non legato a una singola modifica: **tutta
l'interfaccia deve sempre essere conforme alle Web Content Accessibility Guidelines 2.1, livello AA**.
Vale per ogni schermata esistente e per ogni nuova UI aggiunta d'ora in poi — non solo per le parti
toccate in una singola richiesta. Da tenere presente in particolare per: contrasto colore testo/sfondo
(≥4.5:1 per il testo normale, ≥3:1 per il testo grande, criterio 1.4.3), stati interattivi (focus visibile
su bottoni/scelte/link, criterio 2.4.7), semantica e leggibilità per screen reader (etichette non affidate
al solo colore, criterio 1.4.1), dimensione target di tocco e navigabilità da tastiera. Non è ancora stato
fatto un audit sistematico del file esistente rispetto a questo requisito: da verificare/correggere man
mano che si toccano le varie schermate.

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
  Costo energia settimanale (`energiaCostoLavoro`: -15 PT, -30 FT) applicato ogni giornata via
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
- `MATCH_EVENTS`: oltre agli 8 eventi rappresentativi originali (5 normali + 3 GK) e ai 12 trade-off
  generici, ora ci sono 40 eventi specifici per ruolo (5 pool da 8, vedi sezione dedicata) — restano
  scoperte solo le categorie TACTICAL/PHYSICAL/PROVINCIAL_LIFE del brief narrativo originario
  (campo pesante, pioggia, freddo, pubblico avversario, borracce dimenticate, presidente a bordo
  campo, terzo tempo, ecc.). L'architettura (schema dati + resolver + cooldown/pesi) è già pronta
  per aggiungerne altri senza toccare il motore.
- "Più rapporti coi compagni di squadra" (richiesta dell'utente, risposta ricevuta: espandere il
  numero di compagni nominati stabili, non solo i 2 attuali best-ATT/best-DIF, con possibilità di
  affinità anche negativa) — **non ancora implementata**: la conversazione è passata ad altre
  richieste (logo, poi il resto di questa sessione) prima di arrivare al codice.
- Rischio panchina per skill (`rischioPanchinaPerSkill`) confronta solo l'overall pesato con gli
  altri giocatori reali del proprio ruolo nella squadra attuale — non tiene conto di anzianità,
  rapporto col mister o andamento recente, che potrebbero in futuro affinare ulteriormente la % di
  rischio.
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

## Punti attributo in creazione: da bonus flat a +1 assoluto per punto

Richiesta iniziale: far aumentare le qualità dell'1% per punto invece del vecchio flat `+2`, perché
maxare un solo attributo con `+2` per punto era troppo conveniente (chi metteva tutti i 10 punti su un
solo attributo otteneva un salto sproporzionato, specie su basi già basse). Passaggi:

1. Prima implementazione: `+1%` del valore di **base** per punto (`base*(1+punti*0.01)`), sia
   nell'anteprima live dell'allocatore sia nel calcolo effettivo a inizio carriera.
2. L'utente ha verificato in browser che 10 punti su un attributo con base 55 producevano solo `61`
   (+10,9%), non l'esito atteso, e ha chiarito cosa intendeva davvero: **+1 punto assoluto per punto
   assegnato** (base 55 → 56 con 1 punto, 57 con 2, 58 con 3, ecc. — non una percentuale).
3. Corretto definitivamente a `base + punti` (clampato 20-90), in entrambi i punti (anteprima
   dell'allocatore e calcolo a `startCareer()`). Verificato in browser: 3 click su "+" portano la
   Tecnica da 55 a 58, un punto alla volta.

## Card "Lavoro" riposizionata nell'hub

Su richiesta esplicita, la card "Lavoro" (stato lavoro + selezione Part-time/Full-time) è stata spostata
subito **sopra** il blocco con "Scendi in campo"/"Simula partita" nell'hub, invece che sotto il bottone
Coppa Leonessa. La card "Lavoro extrasportivo" nella scheda giocatore (riepilogo di sola lettura) era già
al posto giusto e non è stata toccata.

## Coerenza e leggibilità della cronaca di partita

Serie di richieste sulla presentazione degli eventi ◆ durante la partita (`MATCH_EVENTS`), per renderli
coerenti con i momenti chiave (`MOMENTS`) invece che un sistema a parte:

1. **Evento "Primo pallone conteso" riportato al motore a verifica di abilità**: `primo_contrasto` usava
   ancora `applica`/`esito` fissi (bonus garantiti a personalità/morale), diversamente dagli altri eventi
   GAMEPLAY a inizio partita (`ricezione_spalle_porta`, `pressing`) che sono vere verifiche di abilità via
   `skillScelta`. Riscritto con 3 `skillScelta` (contrasto fisico rischioso, anticipo tecnico, temporeggio
   sicuro) ed esclusione del Portiere via `conditions`, come i suoi eventi "fratelli".
2. **Cronaca con gerarchia visiva**: l'evento più recente nel log (`#commentaryLog`, aggiunto con
   `log.prepend`) resta a piena opacità con un piccolo rilievo (ombra), i precedenti sfumano
   progressivamente via CSS `nth-child` (1°=pieno, 2°=0.75, 3°=0.6, oltre=0.45) — così l'occhio va
   sull'azione appena successa invece di perdersi nello storico. Solo CSS, nessuna logica toccata.
3. **Eventi ◆ mostrati nella stessa finestra della partita**: prima `showMatchEvent` dirottava su una
   schermata separata (`screen-event`, icona ◆ statica), interrompendo il flusso della cronaca. Riscritta
   per aggiungere testo ed esito **nello stesso `commentary-log`** e le scelte come `choice-card` nello
   stesso `matchAction` usato da `nextMoment()`/`resolveChoice()` — nessun cambio di schermata, stesso
   bottone "Continua ▸" per proseguire. Le due chiamate che passavano `()=>{ showScreen('match');
   nextMoment(); }` come callback sono state semplificate a `()=>nextMoment()` (il cambio schermata non
   serve più). `showEvent()`/`screen-event` restano invariate per gli eventi **fuori** dalla partita (il
   pool `EVENTS` settimanale in hub, l'evento "resti in panchina" prima che inizi la partita).
4. **Rischio/percentuale mostrati anche sugli eventi**: le scelte a verifica di abilità (`skillScelta`)
   ora espongono `attr/attr2/risk/out` sull'oggetto scelta (prima chiusi solo dentro `applica`), così sia
   `showEvent()` sia la nuova resa inline di `showMatchEvent()` possono calcolare e mostrare rischio (e,
   in un primo momento, la percentuale) esattamente come `nextMoment()` — stesso `calcChance()`, nessun
   secondo motore.
5. **Percentuale di riuscita rimossa ovunque**: su richiesta successiva, la "% riuscita" mostrata sulle
   choice-card (sia eventi sia momenti chiave) è stata tolta — resta solo l'etichetta di rischio
   (Sicuro/Rischioso/Estremo). Tolto anche il calcolo di `chance` ormai morto nei punti dove serviva solo
   per la stringa rimossa (il calcolo resta dove serve ancora, es. per determinare l'esito in
   `skillScelta`/`resolveChoice`).

Verificato in browser ad ogni passaggio: evento "Pressing" mostrato inline con etichetta di rischio
corretta e senza percentuale, cronaca con opacità decrescente confermata via `getComputedStyle`, bottone
"Continua" che avanza correttamente al momento successivo.

## Costo energia lavoro Full-time corretto

`energiaCostoLavoro('FullTime')` restituiva `35`/settimana; corretto a `30` su richiesta esplicita (il
Part-time resta invariato a `15`).

## Convocazione legata a reputazione/energia/forma/morale (panchina/non convocato)

Su richiesta esplicita, aggiunta una regola di convocazione basata sui 4 valori chiave del giocatore
(`state.reputazione`, `state.energia`, `state.forma`, `state.morale`), oltre al preesistente controllo
casuale legato al solo rapporto col mister (`state.relazioni.mister<25`, tenuto come possibilità
aggiuntiva, non rimosso):

- **1 valore sotto il 40%** → il mister ti lascia in panchina (stesso evento ◆ "resti in panchina" già
  esistente, testo differenziato in base alla causa).
- **2 o più valori sotto il 35%** → non vieni nemmeno convocato: niente partita, il campionato prosegue
  simulato senza di te (`skipGiornata`) e recuperi con la settimana di riposo (nessuna energia consumata
  per una partita non giocata).
- Nuovo helper condiviso `contaValoriSottoSoglia(soglia)`, usato in `beginMatch()`, `simulaPartita()` (per
  non poter aggirare la regola simulando invece di scendere in campo) e in `renderHub()` (banner "Fuori
  dai convocati" + pulsanti "Scendi in campo"/"Simula partita" disabilitati quando scatta la non
  convocazione, stesso pattern già in uso per "Energia troppo bassa"). Si applica solo fuori dalla Coppa
  Leonessa, coerente con il comportamento preesistente del controllo sul mister.
- **Correzione della richiesta**: la prima implementazione trattava la panchina come un mancato utilizzo
  completo (stessa simulazione "senza il giocatore" del caso "non convocato"). L'utente ha chiarito che
  partire dalla panchina **non** vuol dire non giocare affatto: riscritta con `beginMatchAsSub()`, che fa
  scendere davvero in campo a partita in corso (minuto 65, 2 momenti chiave invece dei 4 normali — pool
  ridotto passato a `nextMoment()` via `state.matchTemp.momentiOutfieldRidotti`/`gkMomenti`, stesso motore
  di `beginMatch()` per il resto: `finishMatch`, voto, XP, infortuni, cartellini, tutto invariato), con un
  costo energia ridotto (-8 invece di -15) coerente con un tempo di gioco più corto.
- Verificato in browser: 2 valori sotto 35 → banner "Fuori dai convocati" e pulsanti disabilitati; 1
  valore sotto 40 → evento panchina con testo corretto; scelta "subentro" confermata end-to-end (ingresso
  al 65', 2 scelte reali, punteggio e voto finali coerenti, arrivo regolare a `screen-result`).

## Correzioni successive alla panchina/subentro (stessa giornata)

- **Recupero energia uniformato a +40**: "Riposo e recupero" (`TRAININGS`), "Salta partita"
  (`saltaPartitaVolontariamente`) e il recupero per infortunio (`skipGiornata`, sia in Coppa che
  campionato) erano a valori diversi (30/35) — allineati tutti a +40/settimana su richiesta esplicita.
- **Curva bonus/malus per le relazioni**: `calcChance()` (partita a scelte) teneva conto solo del
  rapporto coi compagni; aggiunto lo stesso trattamento (curva centrata su 50, sotto=malus sopra=bonus)
  per il rapporto col mister. `simulaPartita()` non teneva conto di nessuna relazione: aggiunta la
  stessa curva per mister e compagni nella `condizione` che pesa sulla qualità simulata.
- **Riflesso della reputazione sulle relazioni**: nuova `applyRiflessoReputazioneSuRelazioni()`,
  richiamata ogni giornata in `postGiornataFlow()`: una reputazione sopra 50 tira leggermente verso
  l'alto mister/procuratore/compagni ogni settimana, sotto 50 verso il basso (effetto piccolo e
  progressivo, non sostituisce le scelte esplicite negli eventi).
- **Rapporto col mister incluso nella soglia di convocazione**: `contaValoriSottoSoglia()` ora considera
  anche `state.relazioni.mister` insieme a reputazione/energia/forma/morale; rimosso il vecchio controllo
  casuale separato (mister<25 con 30% di chance), ormai ridondante perché un mister basso rientra già
  deterministicamente nella stessa casistica.
- **Allenamento invernale reso non vincolante**: durante la pausa invernale (`renderMercatoInvernale`),
  scegliere un allenamento supplementare lo rendeva definitivo (card bloccate). Ora usa lo stesso pattern
  a snapshot già usato per l'allenamento settimanale in hub (`scegliAllenamentoInvernale`, nuovo
  `state.allenamentoSnapshotInvernale`): si può cambiare idea più volte prima di tornare in campo.

## Coppa Leonessa: avvio da aprile, avanzamento settimanale, scheda con entrambe le fasi

Tre richieste collegate sulla Coppa Leonessa, tutte nello stesso motore già esistente (nessun secondo
sistema di partite):

- **Avvio dalla seconda settimana di aprile**: prima la Coppa partiva sempre subito a fine campionato
  (`renderSeasonEnd`), che per un girone corto poteva voler dire gennaio/febbraio — troppo presto rispetto
  ai tempi reali. Nuovo helper `secondaSettimanaAprile(anno)` (primo sabato dall'8 aprile in poi): se il
  campionato finisce prima di quella data, la Coppa resta "in attesa" (nuovo banner in fine-stagione con
  la data) finché il fuori-stagione (`aggiornaFuoriStagione()`, stesso ciclo settimanale già usato per
  mercato estivo/settimane morte) non la raggiunge; se il campionato finisce dopo, parte subito come
  prima. Nel farlo è stato anche **sistemato un vicolo cieco preesistente**: a torneo Coppa concluso,
  `finalizzaGironeCoppa()` tornava sempre all'hub, che a campionato già finito non aveva più nulla da
  proporre (bottone "Scendi in campo" puntava a un avversario inesistente) — ora riprende/inizializza il
  conto fuori-stagione invece di tornare all'hub.
- **Ogni partita di Coppa avanza il calendario di una settimana**: prima tutte le partite di uno stesso
  girone di Coppa avvenivano sulla stessa data (nessun avanzamento). Ora `postCoppaMatch()` (unico punto
  che tutte le vie di risoluzione di una partita di Coppa attraversano: giocata, simulata, saltata per
  infortunio/squalifica) fa avanzare `state.offSeasonData` di una settimana a ogni partita — così, se si
  esce dalla competizione, la data mostrata in "Fuori stagione" riflette davvero quando si è usciti.
  L'hub mostra ora anche questa data accanto a "Coppa · Fase · Partita N/M".
- **Scheda Coppa con Preliminare + Fase Principale insieme**: `renderCoppa()` mostrava solo il girone
  della fase corrente/più recente, nascondendo il preliminare una volta passati alla fase principale. Ora
  mostra sempre entrambe le tabelle quando disponibili (il preliminare recuperato da
  `state.coppaPrelim.gironi`, mai svuotato durante la stagione); per una squadra di Serie A (nessun
  preliminare) la sezione preliminare semplicemente non compare.

## Sistema territoriale, shop, formazione (Fasi 2-7 di 10)

Richiesto con un brief strutturato molto dettagliato (vita da calciatore amatoriale nel territorio
bresciano, non da professionista: niente jet privati/ville/supercar). Prima di implementare è stata
fatta un'analisi esplicita dell'architettura esistente (richiesta dall'utente, confermata prima di
procedere): nessun sistema di POI/territorio/shop/investimenti esisteva già, quindi costruito da zero
seguendo **lo stesso pattern dati-motore-UI** già in uso per `TRAININGS`/`EVENTS`/`MATCH_EVENTS` (array di
oggetti con id stabile + funzione generica che li applica a `state` + render dedicato), mai una nuova
architettura parallela. Procede a fasi con verifica in browser dopo ognuna, come da piano concordato.

- **Fase 2-4, sistema territoriale** (`index.html`): `TERRITORIO_AREE` (6 macroaree: Brescia Città,
  Franciacorta, Lago d'Iseo, Garda Bresciano, Valle Camonica, Altre Valli) e `DB_POI` — **30 POI iniziali
  reali e verificabili** (monumenti, parchi, laghi, siti UNESCO come le incisioni rupestri della Val
  Camonica), non i 50 richiesti: scelto deliberatamente di restare su luoghi pubblici inequivocabilmente
  reali piuttosto che inventare dati o usare nomi di attività commerciali senza aver verificato i diritti
  (`real_reference_name`/`display_name`/`generic_name` separati come richiesto, per poter sostituire i
  nomi senza toccare il gameplay). Motore `vivEsperienza(poiId)`: scala denaro/energia dallo `state`
  esistente, applica bonus su campi già esistenti (morale/forma/reputazione/xp — nessuna nuova
  statistica), una esperienza a settimana (stesso schema di `allenamentoFatto`, reset in
  `postGiornataFlow`). Nuova schermata "Territorio" (aree → POI → esperienza), pulsante in hub.
- **Fase 5, shop equipaggiamento**: `DB_EQUIPAGGIAMENTO`, 25 oggetti su 7 categorie (Scarpe, Parastinchi
  in 5 varianti come richiesto — tradizionali/moderni/ultraleggeri/rinforzati/"fortunati" —, Guanti,
  Abbigliamento tecnico, Accessori, Borsoni, Recupero). I bonus **non toccano mai `state.attr`**: si
  sommano solo a runtime dentro `calcChance()` (stesso punto già esteso per mister/compagni), così
  equipaggiare/disequipaggiare resta sempre reversibile senza dover tracciare cosa togliere. Pochi item
  con effetti su morale/forma/reputazione (parastinchi fortunati, tuta da riscaldamento, alcuni
  accessori) usano invece un bonus una tantum all'atto di indossarli (`onEquip`, stesso pattern di
  `TRAININGS.apply`). I RECUPERO sono consumabili (si usano e spariscono dall'inventario). Nessuna usura:
  il progetto non aveva un sistema di durabilità, quindi il campo `durability` resta solo descrittivo,
  come da istruzione esplicita di non crearne uno nuovo. Nuova schermata "Shop", pulsante in hub.
- **Fase 6, formazione**: `DB_FORMAZIONE`, 12 contenuti (5 libri con titoli fittizi come richiesto —
  "Il gioco senza palla", "La mentalità del gruppo", ecc., autori fittizi —, 3 corsi, 2 mentor/ex
  allenatori, 2 esperienze formative). "Conoscenza tattica"/"leadership"/"mentalità" richieste dalla spec
  sono mappate sui contatori `state.personalita` già esistenti (`ragionatore`/`trascinatore`) invece di
  inventare due nuovi campi paralleli. I corsi danno un bonus **permanente** a un attributo (stesso
  meccanismo del level-up in `addXP`, diverso dall'equipaggiamento perché è un investimento acquisito,
  non qualcosa che si toglie). I mentor hanno un esito **probabilistico** legato alle relazioni esistenti
  (mai un bonus garantito, come richiesto), stesso principio degli eventi di partita a verifica di
  abilità. Stesso gating "una formazione a settimana" del territorio, più un elenco libri già letti
  (non rileggibili). Nuova schermata "Formazione", pulsante in hub.
- **Fase 7, eventi relazionali/opportunità**: `TERRITORIO_EVENTI`, eventi generici per categoria/soglia
  di visite a un POI (non per singolo POI, così valgono anche per i POI aggiunti in futuro), risolti da
  `pickTerritorioEvento`/`showTerritorioEvento` che **riusano lo stesso `showEvent()`** già esistente
  (nessun secondo Event Engine): cambia solo il criterio di attivazione (visite ripetute a un POI). Uno
  degli eventi ("il gestore ha una proposta da farti") è l'aggancio esplicito alla Fase 8: registra solo
  un record in `state.opportunitaInvestimento[]`, senza logiche di investimento che non esistono ancora
  (evita di costruire in anticipo pezzi della fase successiva).
- **Fase 8, investimenti**: `TIPI_INVESTIMENTO` — i 5 livelli richiesti (piccolo investimento,
  finanziamento progetto, quota societaria, socio di minoranza, investimento speculativo) con
  capitale/rischio/rendimento/durata/liquidità crescenti; **nessuna categoria calcistica** (vincolo
  esplicito rispettato). **Nessun menu statico**: gli investimenti sono raggiungibili solo dalle
  opportunità generate dagli eventi territoriali della Fase 7 (`state.opportunitaInvestimento`), come
  richiesto. Il rischio (`calcolaRischioInvestimento`) non è una % piatta: parte da un livello base per
  tipo e si affina in base a quante volte si è visitato il POI, alla reputazione e alla stagionalità
  dell'area — pochi fattori concreti, non un motore finanziario reale. La maturazione degli investimenti
  attivi (`avanzaInvestimenti()`, richiamata ogni giornata in `postGiornataFlow`, stesso ciclo settimanale
  già esistente) risolve l'esito quando le settimane residue arrivano a zero: successo (rendimento
  accreditato, +reputazione) o fallimento (recupero parziale in base al rischio, -reputazione). Nuova
  schermata "Investimenti" (opportunità in attesa con scelta del tipo, investimenti in corso con
  countdown, storico esiti).
- **Fase 9, coerenza UI**: i 4 pulsanti territorio/shop/formazione/investimenti erano ripetuti identici
  in tutti e 3 i rami dei pulsanti hub (fino a 9 pulsanti nel ramo normale) — consolidati in un'unica card
  "Vita da calciatore" in hub, sempre visibile anche durante infortunio/squalifica, separata dai pulsanti
  di partita. Aggiunto un badge col numero di opportunità di investimento in attesa sul pulsante
  "Investimenti". Trovata e corretta un'incoerenza: lo Shop non mostrava alcun avviso per saldo
  insufficiente (usciva silenziosamente), a differenza delle altre 3 schermate nuove — uniformato.
- **Fase 10, test di regressione**: carriera creata dal flusso reale (non dati sintetici) e verificata
  fino in hub; tutte e 4 le nuove schermate raggiunte con click reali, incluso un ciclo completo di
  un'esperienza territoriale dall'interfaccia; nessun errore in console; migrazione salvataggi verificata
  rimuovendo di proposito i nuovi campi da un salvataggio e ricaricando — `boot()` li ripristina con i
  default corretti, nessun crash.
- **Piano a 10 fasi completo.** Limiti accettati (non bug, scelte deliberate): dataset POI fermo a 30 non
  50 (accuratezza sopra copertura, vedi sopra); nessun sistema di usura/durabilità (il progetto non ne
  aveva già uno, istruzione esplicita di non crearne uno nuovo); categorie RISTORAZIONE/OSPITALITÀ/
  BUSINESS del territorio non popolate (richiederebbero nomi di attività commerciali verificati, non solo
  monumenti/luoghi pubblici) — estendibili in un secondo momento con verifica caso per caso.
- Verificato in browser a ogni fase: acquisto/equip/vendita con bonus reale su `calcChance` (53%→55%→53%
  su acquisto/equip/vendita di un item), corso con bonus permanente su un attributo, mentor con esito
  legato alla relazione, gating settimanale su territorio/formazione, evento territoriale che scatta alla
  soglia di visite corretta con ritorno alla stessa area invece che alla lista aree (bug trovato e
  corretto durante il test), capitale/rischio di un investimento coerenti con relazione/reputazione,
  maturazione con esito e impatto reale su saldo/reputazione, regressione completa senza errori.

## Riorganizzazione lean/mobile-first dell'interfaccia

Richiesta esplicita di ridurre lo scrolling verticale raggruppando le sezioni più lunghe in blocchi
compatti, senza toccare la logica di gioco né introdurre nuove dipendenze — analisi delle schermate
esistenti fatta prima di scrivere codice, per capire cosa fosse davvero troppo lungo (Shop: 25 oggetti
in un'unica lista; Scheda giocatore: 7 card impilate) e cosa già andasse bene così (Territorio ha già un
drill-down area→POI, Investimenti è già diviso in 3 sezioni brevi — nessuna modifica lì).

- **Componente tab riutilizzabile** (`.tab-bar`/`.tab-btn`/`.tab-panel` in CSS + `switchTab(scope,tabId)`
  in JS): pensato per restare valido sia da mobile (barra a scorrimento orizzontale) sia in un futuro
  layout PC separato (stessa struttura dati/markup, disposizione diversa).
- **Shop equipaggiamento**: da un'unica lista di 25 oggetti su 7 categorie a 7 tab (una per categoria),
  con il riepilogo "Equipaggiato" sempre visibile sopra. `renderShop()` ora filtra per
  `shopCategoriaSel` (stesso pattern di selezione+re-render già usato da `territorioAreaSel`) invece di
  disegnare tutto insieme.
- **Formazione**: stesso trattamento, 4 tab (Libri/Corsi/Mentor/Esperienze) via `formazioneTipoSel`.
- **Scheda giocatore → "Giocatore"**: rinominata e riorganizzata da 7 card impilate a 4 tab
  (Panoramica/Statistiche/Traguardi/Storico) — il taglio di scroll più netto. Nessuna funzione di
  render esistente (`renderCarriera`) ha richiesto modifiche alla logica interna: gli stessi id
  (`carAttrs`, `carStats`, ecc.) vivono ora dentro i pannelli tab.
- **"Vita da calciatore" spostata dentro Giocatore**: la card separata in hub (territorio/shop/
  formazione/investimenti) è stata rimossa e ricreata come 5° tab di Giocatore. Il badge delle
  opportunità di investimento in attesa (`badgeOpportunita`) è rimasto lo stesso elemento, solo
  spostato; il conteggio è stato estratto in `aggiornaBadgeOpportunita()`, richiamata sia da
  `renderHub()` (che ora mostra il badge anche sul pulsante "Giocatore" in hub) sia da
  `renderCarriera()`, così resta sincronizzato indipendentemente da quale schermata si visita prima.
- **`data-block` sui contenitori dell'hub** (stato-giocatore, relazioni, prossimo-impegno,
  preparazione, lavoro, azioni-partita, coppa, vita-calciatore, reset): zero impatto visivo, rende
  esplicita nel markup la struttura logica dei blocchi in vista di una futura separazione UI PC/mobile,
  senza anticipare quella separazione con astrazioni non richieste ora.
- Verificato in browser su un salvataggio reale esistente: acquisto in Shop con tab che resta
  selezionata dopo il re-render, tutti e 4 i tab di Giocatore navigabili con contenuto corretto,
  "Vita da calciatore" raggiungibile da Giocatore e poi Shop, saldo/diario coerenti dopo l'acquisto,
  nessun errore in console.

## Sistema di personalità: estensione a 4 assi (azioni, allenamento, economia, dialoghi)

Richiesta con uno spec dettagliato in stile "pub-sub/event hooks/TypeScript" per tre archetipi
(Maverick/Virtuoso/Heartbeat). Prima di implementare sono stati segnalati due disallineamenti con lo
stato attuale del progetto e fatti confermare dall'utente: (1) `state.personalita =
{individualista, ragionatore, trascinatore}` esiste **già** dalla Fase 6 (Formazione) e i
`MATCH_EVENTS` lo alimentavano **già** da tempo tramite il parametro `tratto` di `skillScelta()` — gli
archetipi richiesti coincidono concettualmente con i 3 contatori esistenti; (2) il resto del file è JS
vanilla senza build/TypeScript/event bus, tutto integrato con chiamate dirette. L'utente ha confermato
di **estendere il sistema esistente** con **integrazione diretta, nessun event bus nuovo** — nessun
secondo stato parallelo, nessuna astrazione mai usata prima nel progetto.

- **Azioni nei momenti chiave di partita**: i `MATCH_EVENTS` erano già coperti (`tratto` per scelta).
  Colmato l'unico varco rimasto — i 4 momenti chiave "core" (`MOMENTS`) e i momenti del Portiere
  (`GK_MOMENTS_POOL`) — riusando il campo `out` già esistente nel motore (`PERSONALITA_OUT_MAP`:
  goal→individualista, assist/recupero→trascinatore, possesso→ragionatore) dentro `resolveChoice()`,
  invece di taggare manualmente 8+ scelte una per una. Semplificazione dichiarata in un commento: un
  dribbling che smista un assist conta come "trascinatore" e non "individualista" — accettabile perché
  conta la tendenza aggregata sulla stagione, non il singolo episodio, e l'asse resta comunque ben
  coperto anche dai `MATCH_EVENTS` che invece taggano scelta per scelta.
- **Allenamento settimanale**: le 3 sedute di `TRAININGS` (tecnica/fisico/tattico, non riposo) danno ora
  anche un punto di personalità coerente col contenuto (tecnica/tattico→ragionatore, fisico→
  trascinatore). Nessuna delle 4 opzioni esistenti è una vera seduta di tiro/finalizzazione: l'asse
  "allenamento" non alimenta quindi l'individualista, gap documentato in un commento — resta comunque
  coperto da azioni in campo, shop ed eventi.
- **Economia extra-campo**: shop (`acquistaEquip`) — oggetti con `rarity:'rara'` (campo già esistente)
  danno un punto individualista come proxy dell'acquisto vistoso, **senza inventare** auto di lusso o
  marchi di moda che non hanno riscontro nei dati del gioco; formazione (`applicaEffettiFormazione`) —
  i corsi/mentor senza già un effetto `personalita` esplicito (COR_001, COR_002, MEN_002) ora danno un
  punto ragionatore di base; investimenti (`avviaInvestimento`) — mappatura sul tipo di investimento già
  esistente invece di inventare categorie "beneficenza"/"cena di squadra": speculativo→individualista
  (guadagno personale veloce), socio di minoranza/quota→trascinatore (impegno lungo su un'attività del
  territorio), piccolo/finanziamento→ragionatore (scelta prudente e calcolata).
- **Dialoghi fuori dal campo**: i 13 eventi narrativi di `EVENTS` (inclusi `scandalo_media` ed
  `evento_sponsor`, i più "media" in senso stretto) ora taggano le scelte coerenti con un archetipo;
  dove nessuno dei 3 calzava onestamente (es. "vai in famiglia", "resti in silenzio") si è lasciata la
  scelta senza punto invece di forzare un'etichetta.
- **Tratto dominante**: nuova `personalitaDistribuzione(s)` calcola percentuali e tratto dominante dai 3
  contatori. Nuova card "Personalità" nella tab Panoramica di Giocatore (barre nello stesso stile già
  usato per Relazioni), con messaggio d'attesa finché i contatori sono tutti a zero.
- Verificato in browser: tutti i punti di innesco (allenamento, acquisto shop, corso formazione,
  investimento nei 3 tipi mappati, risoluzione di un momento chiave con ciascuno dei 4 `out`, scelta di
  un evento dialogo) aggiornano correttamente `state.personalita`; card con percentuali/tratto dominante
  corretta; salvataggio/caricamento coerente; nessun errore in console; nessuna regressione sui flussi
  esistenti.

## Sistema "personaggi": piano completo a 7 fasi (A-G)

Richiesto con uno spec molto ampio in stile "sezioni 5-25" (telefono, memoria narrativa, rivalità,
mondo dinamico/mercato, vita privata, eventi/legacy, ritiro→allenatore). Prima di scrivere codice è
stata segnalata l'enormità dello scope rispetto a un file HTML singolo di ~4000 righe senza controllo
versione né test automatici, e proposto un piano a fasi con conferma esplicita prima di ogni fase
(stesso processo già seguito per il sistema territoriale) — l'utente ha confermato di procedere
fase per fase. Due conflitti reali con quanto già costruito sono stati risolti PRIMA di iniziare: gli
"archetipi nascosti" richiesti si sono rivelati alias dei 3 tratti di personalità appena estesi
(Ribelle=Individualista, Virtuoso=Professionista=Ragionatore, Leader=Trascinatore/Heartbeat) — nessuna
sostituzione dello schema esistente; e la memoria relazionale è stata data priorità come fondamenta
(Fase A prima di tutto), perché Telefono, Rivalità e la futura transizione a Allenatore dipendono
tutte da un'identità stabile per persona.

- **Fase A — Memoria relazionale** (`index.html`): nuovo `state.persone{}`, registro **additivo**
  (i 3 numeri aggregati in `state.relazioni` restano invariati e continuano a guidare
  `calcChance`/convocazione come sempre). Ogni persona ha un id stabile, un'affinità propria 0-100
  (indipendente dall'aggregato) e uno storico eventi (`registraPersona`/`registraEventoPersona`,
  stesso pattern engine-generico di `TRAININGS`/`EVENTS`). Identità stabili: `MISTER`/`PROCURATORE`/
  `FAMIGLIA` (fisse, create a inizio carriera), compagni reali (id derivato da nome+squadra da
  `sceglieCompagni()`, che già pescava sempre lo stesso miglior ATT/DIF della rosa reale — la stessa
  persona finché si resta in quella squadra), e un "ex allenatore" creato al primo utilizzo del
  mentor in Formazione, primo esempio concreto di persona che sopravvive a un cambio di squadra.
  Agganciato a un sottoinsieme rappresentativo di eventi esistenti (non tutti i punti che toccano
  `relazioni.mister/procuratore`): il resto si arricchisce via via, come documentato nel codice.
- **Fase B — Telefono del calciatore**: nuova schermata, **puramente presentazione** sopra i dati
  della Fase A (nessuna nuova logica di gioco). Lista conversazioni (una per persona, ordinata per
  evento più recente) → thread per persona che riusa `.commentary`/`.commentary-log` già esistenti
  (stessa opacità decrescente della cronaca di partita). Filtro anti-spam nel motore, non nella UI:
  `registraEventoPersona()` alza `nonLetti` solo per eventi con `|impatto|>=3`
  (`NOTIFICA_SOGLIA_IMPATTO`) — i micro-eventi restano nello storico senza generare notifica. Bottone
  "Telefono" in hub con badge del totale non letti.
- **Fase C — Rivalità dinamiche**: 10 eventi aggiunti all'array `EVENTS` esistente (stesso motore
  `pickEvent`, zero nuovo trigger). Rivali interni = il migliore nel tuo ruolo nella TUA rosa reale
  (concorrente per il posto); rivali esterni = il migliore nel tuo ruolo nella rosa reale della
  squadra avversaria appena affrontata **in campionato** (dati veri da `DB_SQUADRE`, mai inventati;
  legato solo al campionato perché Coppa passa da un flusso separato che non tocca `pickEvent`).
  Nessuno stato "rivalità" nuovo: `statoRivalita()` deriva una delle 4 etichette richieste
  (rispetto/odio/amicizia/collaborazione) dalla stessa affinità 0-100 già di Fase A. I rivali
  compaiono già nel Telefono come qualunque altra persona.
- **Fase D — Vita privata ed eventi imprevisti**: 6 nuovi `EVENTS` (invasione della privacy,
  tensione col tempo dedicato alla famiglia — agganciato alla persona `FAMIGLIA` —, intervista TV in
  casa, hater sui social, imprevisto dell'auto la mattina di una gara, richiesta di beneficenza
  territoriale nel giorno di riposo), stesso motore, stesso pattern di tag `personalita` già usato
  altrove.
- **Fase E — Mercato narrativo con rumor e Deadline Day**: `RUMOR_MERCATO`, 8 voci di calciomercato
  con un tipo interno vero/falso/manipolato **mai mostrato al giocatore** (il punto è l'informazione
  imperfetta) che finiscono nel diario già esistente — zero nuova UI. Deliberatamente **solo
  narrativo**: non si toccano mai forza/rosa reali di `DB_SQUADRE` per non rischiare di squilibrare
  le simulazioni delle altre squadre per il resto della carriera — "il mondo che vive da solo" è
  raccontato, non simulato meccanicamente, scelta esplicita per restare lean e a zero rischio di
  regressione. Deadline Day (`isDeadlineDayMercato`, l'ultima settimana della finestra 1 luglio-31
  agosto) genera sempre una voce ed è segnalato in etichetta sulla schermata di mercato; nelle
  settimane normali una voce compare col 45% di probabilità.
- **Fase F — Timeline legacy "La tua storia"**: estende il concetto di `diario` invece di
  duplicarlo (stesso shape `{stagione, giornata, testo}`), ma senza il troncamento a 60 voci di
  `diario` — pensata per sopravvivere intatta fino a fine carriera. Nuova `registraLegacy(tipo,
  testo)`, agganciata a 4 punti esistenti: nuovo traguardo sbloccato (`checkAchievements`), eventi
  relazionali di grande impatto (`registraEventoPersona`, soglia `|impatto|>=8`, più alta di quella
  "notifica" del Telefono), debutto professionistico (`startCareer`) e fine di ogni stagione
  (`renderSeasonEnd`). Nessun nuovo meccanismo di salvataggio: vive dentro `state`, quindi persiste
  già con `save()` — è questo il senso di "salvata automaticamente". Nuovo 6° tab "La tua storia" in
  Giocatore, stesso stile `.diario-entry` già esistente, zero CSS nuovo.
- **Fase G — Ritiro → Allenatore**: la fase più grande, isolata a fine carriera come richiesto.
  Trigger volontario (età≥33, `calcolaEta` già esistente) con bottone in Giocatore > Panoramica.
  **Le 20 connessioni pratiche** (`generaConnessioniAllenatore`): si leggono le persone già raccolte
  in `state.persone` durante tutta la carriera (mister, procuratore, ex allenatore, famiglia,
  compagni reali, rivali) ordinate per quanto la relazione sia stata significativa (positiva o
  negativa), e la loro affinità diventa un effetto concreto sulla nuova carriera (reputazione
  iniziale da allenatore più alta/bassa, "alleato"/"ostacolo") — nessun dato nuovo, solo lettura di
  ciò che si è già costruito. La carriera da giocatore resta congelata in `state`, mai riscritta.
  Il motore delle partite da allenatore **riusa `simSquadra()`/`applyResultToClassifica()`** già
  esistenti (gli stessi che simulano ogni fixture delle altre squadre di un girone ogni giornata:
  da allenatore la propria squadra viene semplicemente simulata con lo stesso motore) e
  `buildTierSeason()` per costruire calendario/classifica della squadra assegnata — la stessa
  funzione già usata per la creazione del personaggio, riusata identica. Tattica settimanale
  (`TATTICHE_ALLENATORE`, 3 opzioni con un piccolo modificatore di forza) è lo stesso pattern
  dati-motore di `TRAININGS`. Quando si affronta la squadra di origine di una connessione nota
  (ex compagno/rivale ora altrove), il diario lo segnala. Fine stagione registra anche in legacy.
  **Fuori scope dichiarato per questo MVP** (non omissione silenziosa): nessuna gestione
  staff/rosa/scouting, nessuna scelta tattica approfondita, nessuna progressione di carriera da
  allenatore oltre il loop stagionale — un'eventuale estensione futura.
- **Piano completo A-G**: tutte le 7 fasi del sistema "personaggi" sono state implementate.
  Limite accettato riportato in Fase E: "il mondo che vive da solo" resta narrativo (rumor), non una
  simulazione meccanica di trasferimenti/esoneri reali — scelta deliberata per non rischiare di
  squilibrare le simulazioni delle altre 280 squadre.
- Verificato in browser a ogni fase: persona reale creata da `sceglieCompagni`/rosa avversaria con
  nomi veri, affinità che si muove nella direzione narrativa attesa, badge Telefono che si azzera
  aprendo una conversazione e si aggiorna anche sul bottone hub, `statoRivalita()` corretto ai 4
  confini di soglia, eventi di Fase D con condizioni verificate (es. `crisi_tempo_famiglia` legato
  all'affinità di `FAMIGLIA`), rumor di mercato visibili nel diario esistente con prefisso Deadline
  Day quando previsto, tab "La tua storia" popolato da traguardi/eventi/stagioni reali, ritiro con
  età forzata a 34 che genera correttamente le connessioni e cambia schermata, carriera da
  allenatore con squadra reale assegnata, classifica dell'intero girone aggiornata via
  `applyResultToClassifica`, rollover di stagione, ricarica pagina che rientra correttamente in
  modalità allenatore invece che in hub — nessun errore in console, nessuna regressione sui flussi
  esistenti.

## Bug: giocatore esistente poteva ritrovarsi come proprio compagno/rivale

Limite documentato in "Creazione carriera: continua con un giocatore esistente" (vedi sopra) è
diventato un bug reale da correggere: la riga della rosa reale che il giocatore ha sostituito
restava nei dati sorgente, quindi `sceglieCompagni()`/`migliorGiocatoreRuolo()` potevano pescare
te stesso come tuo "compagno" in partita o come tuo "rivale interno" nello stesso ruolo.

- Nuovo `state.giocatoreRealeOrigine` (`{nome, squadra}`, valorizzato solo in modalità
  `'esistente'`) + nuova `rosaSenzaGiocatoreReale(rosa, nomeSquadra)`: filtra quella singola riga
  quando la squadra combacia con l'origine, riusata da `sceglieCompagni()` e
  `migliorGiocatoreRuolo()` — nessun nuovo motore, solo un filtro in più sulla stessa fonte dati.
- Migrazione in `boot()` per i salvataggi esistenti (`giocatoreRealeOrigine: null`, quindi restano
  esposti al bug retroattivamente — vale per le carriere create da ora in poi).
- Verificato in browser: la rosa reale del DB continua a includere il proprio nome (dato statico
  invariato), ma `sceglieCompagni()`/`migliorGiocatoreRuolo()` non lo restituiscono più.

## Logo del gioco

Sostituito il segnalibro testuale "C7" (3 occorrenze: topbar, creazione carriera, scheda
giocatore) con il logo fornito dall'utente ("New Star Brescia"), incorporato come immagine
base64 nella regola CSS `.crest` (ridimensionata a 160×160px, ~53KB, per restare un solo file
senza gonfiarlo troppo) — nessun file esterno aggiunto. Su richiesta successiva, rimossi
`border-radius`/`box-shadow` dalla stessa regola (il "riquadro smussato" attorno al logo).

## Sistema eventi per ruolo durante la partita (40 nuovi MATCH_EVENTS)

Richiesto con un task strutturato lean (analisi confermata prima di scrivere codice). Estende
ulteriormente `MATCH_EVENTS` con **40 nuovi eventi** in **5 pool per ruolo** (8 ciascuno), oltre ai
12 trade-off "generici" (`role!=='Portiere'`) già esistenti — stesso motore, stessa `skillScelta()`
(2 skill attive + 1 conservativa a rischio basso), nessuna nuova skill, nessuna modifica a
`calcChance()`/`resolveChoice()`/`pickMatchEvent()`/`nextMoment()`.

- **Pool per ruolo**: Attaccante (`roleRequirement:'Attaccante'`), Attaccante/Centrocampista
  (`conditions` su `RUOLI_ATT_CEN=['Attaccante','Regista','Ala']`), Centrocampista
  (`RUOLI_CEN=['Regista','Ala']`), Centrocampista/Difensore (`RUOLI_CEN_DIF=[...,'Difensore']`),
  Difensore (`roleRequirement:'Difensore'`) — 3 nuove costanti array riusate dalle `conditions`,
  nessun nuovo campo sullo schema evento.
- Verificato: eleggibilità per ruolo corretta (Attaccante 16 eventi eligibili, Regista/Ala 24,
  Difensore 16, Portiere 0), 720 esecuzioni di test su tutte le 120 scelte senza errori, ciclo UI
  reale evento→scelta→esito→continua.

## Riduzione probabilità sponsor personale

`sponsor_call` (proposta di sponsor personale dal procuratore) usciva troppo spesso rispetto agli
altri eventi finanziari. Aggiunta `COOLDOWN_EVENTO_OVERRIDE` (per ora solo `{sponsor_call: 24}`),
riusata dallo stesso meccanismo di cooldown già esistente per `EVENTI_FINANZIARI` — nessun nuovo
sistema di probabilità, solo una soglia dedicata più lunga per questo singolo id.

## +5 energia extra su riposo/salta partita/infortunio

Portato da +40 a **+45** in tutti e 3 gli scenari: `TRAININGS` id `'riposo'` (incluso quando si
applica implicitamente se non si sceglie un allenamento), `saltaPartitaVolontariamente()`, e il
recupero per infortunio in `skipGiornata('infortunio')` (sia campionato che Coppa Leonessa).

## Soglia panchina al 50%, curva di livellaggio più ripida, relazioni anche simulando

Tre richieste indipendenti nello stesso messaggio:

- **Soglia "non giochi la partita per intero" alzata da 40% a 50%**: in `beginMatch()`, se anche
  solo uno tra Reputazione/Energia/Forma/Morale/rapporto col Mister è sotto il 50% (`sottoSoglia50`,
  rinominata da `sottoSoglia40`), il giocatore entra dalla panchina (`beginMatchAsSub()`) invece di
  partire titolare. La soglia dei "2+ sotto 35%" che tiene fuori dai convocati del tutto resta
  invariata.
- **Curva XP più ripida**: il moltiplicatore di `addXP()` per il costo del livello successivo è
  passato da `1.15` a `1.22` (100→122→149→182→222→271 sui primi 5 livelli, contro
  100→115→132→152→174 di prima).
- **`simulaPartita()` ora costruisce relazioni coi compagni**: prima non toccava mai
  `state.persone` (solo giocando a scelte si costruivano rapporti con compagni nominati). Ogni
  assist simulato pesca un compagno reale (stessa `sceglieCompagni()`/`pescaCompagno()` di
  partita giocata) e ne fa crescere l'affinità (+2, stesso impatto di un assist "vero"). Verificato
  su 25 partite simulate: 15 assist totali → 2 compagni registrati con affinità cresciuta.

## Sistema procuratore/agente (state.agent, AGENT_EVENTS) + calcChance esteso

Richiesto con un task strutturato lean.

- **`calcChance(attrKey, risk, out, attrKey2)` esteso**: se `attrKey` è un Array di 2 skill (es.
  `['tecnica','velocita']`), viene decomposto internamente in `attrKey=attrKey[0]`,
  `attrKey2=attrKey[1]` — stessa media già esistente per la combinazione a 2 skill, piena
  retrocompatibilità con tutte le chiamate esistenti (verificato: risultato identico chiamando via
  Array o via il parametro `attrKey2` già esistente).
- **`state.agent`** (`{name, type, trust, influence}`, default `"Gino 'Il Calibra' Baresi"` /
  `'Cacciatore'` / `50` / `60`): identità con archetipo, aggiuntiva rispetto a
  `relazioni.procuratore`/persona `PROCURATORE` già esistenti (che restano invariati e vengono
  comunque aggiornati in parallelo dove ha senso). Migrazione in `boot()`.
- **8 `AGENT_EVENTS`** integrati direttamente nell'array `EVENTS` esistente (stesso
  `pickEvent()`/`showEvent()`): Proposta di Cambio Maglia (gated sulla finestra della pausa
  invernale già esistente), Cena di Rappresentanza, Provino a Sorpresa in Eccellenza, Richiesta
  Aumento Rimborso Spese, Articolo sul Giornale di Brescia, Offerta da una Rivale Storica, Sponsor
  Tecnico Locale (aggiunto a `EVENTI_FINANZIARI` per il cooldown), Chiarimento a Fine Stagione
  (`s.giornata===s.calendario.length`, con opzione "licenzia l'agente" → `state.agent=null`, dopo
  la quale gli eventi smettono semplicemente di comparire via `condizione:s=>s.agent&&...`).
- Verificato: tutti e 8 gli eventi senza errori, ciclo UI reale completo (evento→scelta→saldo/trust
  aggiornati→esito→callback).

## Sistema famiglia (state.family, FAMILY_EVENTS)

Stesso pattern del procuratore/agente, stesso motore `EVENTS`/`pickEvent`/`showEvent`.

- **`state.family`** (`{harmony:60, support:50, focus:'Tradizionale'}`), aggiuntivo rispetto alla
  persona `FAMIGLIA` già esistente. Migrazione in `boot()`.
- **8 `FAMILY_EVENTS`**: Pranzo della Domenica, Laurea/Compleanno di Venerdì, Padre "mister da
  tribuna" (solo dopo una sconfitta, `ctx.risultato==='L'`), Auto di Famiglia (con costo reale sul
  saldo se si sceglie un taxi), Pressioni per un Lavoro Vero (solo se `finanze.statoLavoro==='Nessuno'`
  — la scelta di compromesso attiva davvero `statoLavoro='PartTime'`, riusando il sistema
  economico esistente), Domenica coi Tifosi in Tribuna, Weekend Fuori con la Compagna (gated sulla
  stessa finestra della pausa invernale usata per l'evento agente), Emergenza Familiare
  Last-Minute.
- Verificato: tutti e 8 senza errori, ciclo UI reale (scelta → `family.harmony`/`support`
  aggiornati → esito → callback).

## Rete sociale ed opportunità extracampo (SOCIAL_EVENTS)

Richiesto con un task strutturato lean, con un'analisi preliminare che ha stabilito di **non**
creare `state.relazioni.giocatori` come suggerito nel prompt, perché `state.persone` (Fase A del
sistema "personaggi") è già esattamente quel registro (id stabile, affinità 0-100, storico eventi,
`tratti[]` già riusabile come "opportunità sbloccate") — nessun secondo registro di persone.

- Nuovi helper: `idConoscenza`/`registraConoscenza` (wrapper di `registraPersona` con
  `ruolo:'conoscenza'`), `pescaGiocatoreCasuale(nomeSquadra)` (un giocatore reale a caso dalla rosa,
  via `getRosaReale`/`rosaSenzaGiocatoreReale`), `contaConoscenze(s)`.
- **10 eventi `social_*`** + 1 evento speciale `social_rete_consolidata` (soglia 6 conoscenze, flag
  one-shot `reteConsolidataMostrata`), tutti in `EVENTS`: nuovo compagno, birra dopo la partita, il
  veterano, "conosco uno" (allenatore/preparatore/osservatore/imprenditore o un giocatore reale,
  pescato quando possibile), gruppo WhatsApp, torneo estivo, "ti ha visto giocare" (da
  `squadraAppenaAffrontata`), vecchio allenatore, compagno che cambia squadra, telefonata
  inaspettata.
- **Cooldown**: nuovo Set `EVENTI_SOCIALI` con soglia dedicata (5 giornate, 2 dopo la rete
  consolidata), stesso meccanismo già usato per `EVENTI_FINANZIARI` (esteso, non duplicato) in
  `pickEvent()`.
- **Bug trovato e corretto durante il testing**: un edit della richiesta precedente (aggiunta di
  `reteConsolidataMostrata` allo stato di `startCareer()`) aveva rimosso per errore la parentesi di
  chiusura `};` dell'oggetto stato, bloccando l'intero script (nessun errore in console perché il
  parse falliva silenziosamente lato browser preview) — individuato con `node --check` sullo script
  estratto dal file, corretto. Da quel momento in poi ogni modifica di questa sessione è stata
  validata con `node --check` prima di aprire il browser.
- Verificato: tutti e 10 gli eventi + lo speciale senza errori, ciclo UI reale (nuova conoscenza
  registrata in `state.persone` con `ruolo:'conoscenza'`).

## Gruppi sociali dello spogliatoio (GRUPPO_EVENTS)

Estende la rete sociale appena costruita, stesso principio "nessun registro parallelo".

- **`state.gruppoSociale`** (`{principale:null, secondari:[]}`) — unica struttura nuova, solo
  l'appartenenza del protagonista; le persone che appartengono a un gruppo restano in
  `state.persone` con un campo `.gruppo` aggiuntivo (stesso pattern di `squadraOrigine`/`fonte`).
  Migrazione in `boot()`.
- **`GRUPPI_SOCIALI`** (5 tipi: Veterani, Birra, Ambiziosi, Locali, Ex) + **`assegnaGruppoEmergente(s)`**:
  pesi su età (`calcolaEta`), personalità dominante (`personalitaDistribuzione`) e ruolo — nessuna
  formula complessa, idempotente (non ricalcola se già assegnato), chiamata lazy dentro l'`applica`
  del primo evento di gruppo che capita invece che forzata a inizio carriera.
- **10 eventi `gruppo_*`** aggiunti a `EVENTI_SOCIALI` (stesso cooldown): la birra, il veterano, il
  torneo, un membro che cambia squadra, "il contatto" (allenatore/dirigente/imprenditore o un
  giocatore reale), la cena, il gruppo si divide (litigio interno), nuovo compagno (con opzione
  "presentalo a un altro gruppo" → ponte fra gruppi), gli ambiziosi/squadra che cerca, i
  locali/attività extracampo (solo collegamento predisposto, nessuna nuova economia).
- **Cambio squadra** (`accettaOfferta`): `state.persone` non si tocca mai; solo
  `gruppoSociale.principale` si azzera e finisce in `secondari` — perdi l'accesso quotidiano al
  gruppo ma mantieni i contatti già conosciuti.
- Verificato: tutti e 10 gli eventi senza errori, assegnazione emergente del gruppo, reset al
  cambio squadra (`principale:'veterani'`→`null`, `secondari:['veterani']`), ciclo UI reale.

## Bug: partite da 50', subentro poco visibile, schieramento slegato dalle skill

Tre richieste collegate:

- **Bug reale trovato**: `finishMatch()` fissa sempre il fischio finale al **50'** (corretto, è la
  durata regolamentare del calcio a 7, 2×25'), ma `beginMatchAsSub()` faceva entrare il giocatore
  dalla panchina al minuto **65'** — dopo la fine della partita. Corretto a **28'** (con 2 momenti
  residui, si arriva realisticamente vicino al 50' finale).
- **Subentro più evidente**: nuovo badge dorato "Subentrato dalla panchina" (`#matchSubBadge`)
  nell'header della partita, mostrato solo da `beginMatchAsSub()` e nascosto per le partite da
  titolare (`beginMatch()`).
- **Schieramento legato alle skill**: nuova `rischioPanchinaPerSkill(s)` confronta il proprio
  overall (`overallPesato`, già usato da `simulaPartita()`) con gli altri giocatori reali dello
  stesso ruolo nella rosa (`DB_SQUADRE`/`getRosaReale`): fra il 15% più scarso del ruolo → 50% di
  rischio panchina; fra il 15-35% → 20%; altrimenti nessun rischio aggiuntivo. Riusa lo stesso
  evento/flusso panchina→subentro già esistente (testo differenziato in base alla causa).
- Verificato: overall minimo (20) → 50% rischio, overall massimo (95) → 0%; badge e minuto
  verificati dal vivo con `beginMatchAsSub()`/`finishMatch()` (28'→38' dopo un momento→50' a fine
  partita).

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
(2026-08-03) è stato richiesto esplicitamente ("aggiorna riepilogo.md"), dopo una sessione molto densa che ha
introdotto: il bug fix giocatore-esistente-come-proprio-compagno, il logo del gioco, 40 nuovi MATCH_EVENTS
per ruolo, la riduzione dello sponsor personale, +5 energia extra, soglia panchina al 50%, curva XP più
ripida, relazioni coi compagni anche simulando, il sistema procuratore/agente, il sistema famiglia, la rete
sociale, i gruppi sociali dello spogliatoio, e il bug fix su durata/subentro/schieramento delle partite; il
conteggio del ciclo riparte da qui.*
