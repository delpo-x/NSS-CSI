/* ---------- BOT HELPERS ----------
   Questo file NON fa parte del gioco (index REV2.html resta l'unico file caricato dal browser):
   è codice di test, eseguito da tools/test-bot.js DENTRO lo stesso contesto vm in cui gira lo
   script del gioco, cosi' puo' chiamare direttamente le funzioni reali (state, EVENTS, beginMatch,
   resolveChoice, ecc.) invece di duplicarne la logica. Guida il gioco esattamente come farebbe un
   giocatore che clicca sempre la prima cosa disponibile: nessuna intelligenza speciale, solo
   copertura ampia e verifica di invarianti ad ogni passo.

   Convenzione: tutte le funzioni qui dentro hanno prefisso __bot per non entrare in conflitto con
   nessun nome del gioco vero. */

function __botCheckInvariants(){
  const problems = [];
  if(!state) return problems;
  const s = state;
  ['energia','forma','morale','reputazione'].forEach(function(f){
    const v = s[f];
    if(typeof v!=='number' || Number.isNaN(v) || v<0 || v>100) problems.push(f+' fuori range 0-100: '+v);
  });
  if(!s.finanze || typeof s.finanze.saldo!=='number' || Number.isNaN(s.finanze.saldo)) problems.push('finanze.saldo non numerico: '+(s.finanze && s.finanze.saldo));
  if(!(s.livello>=1)) problems.push('livello invalido: '+s.livello);
  if(!(s.xp>=0)) problems.push('xp negativo: '+s.xp);
  if(!(s.giornata>=1)) problems.push('giornata invalida: '+s.giornata);
  if(!s.attr || Object.keys(s.attr).some(function(k){ const v=s.attr[k]; return typeof v!=='number' || Number.isNaN(v) || v<0 || v>99; })){
    problems.push('state.attr con valori fuori range: '+JSON.stringify(s.attr));
  }
  Object.keys(s.persone||{}).forEach(function(id){
    const p = s.persone[id];
    if(typeof p.affinita!=='number' || Number.isNaN(p.affinita) || p.affinita<0 || p.affinita>100){
      problems.push('persona '+id+' affinita fuori range: '+p.affinita);
    }
  });
  if(s.gruppoSociale && s.gruppoSociale.affinita){
    Object.keys(s.gruppoSociale.affinita).forEach(function(g){
      const v = s.gruppoSociale.affinita[g];
      if(typeof v!=='number' || Number.isNaN(v)) problems.push('gruppoSociale.affinita.'+g+' non numerico: '+v);
    });
  }
  if(!Array.isArray(s.telefonoPendenti)) problems.push('telefonoPendenti non e\' un array');
  if(s.brescia && s.brescia.usato){
    Object.keys(s.brescia.usato).forEach(function(id){
      if(typeof s.brescia.usato[id]!=='number') problems.push('brescia.usato.'+id+' non numerico');
    });
  }
  if(s.matchTemp){
    ['myGoals','oppGoals'].forEach(function(f){
      const v = s.matchTemp[f];
      if(typeof v!=='number' || Number.isNaN(v) || v<0) problems.push('matchTemp.'+f+' invalido: '+v);
    });
  }
  return problems;
}

const __BOT_SCREEN_IDS = ['create','hub','event','match','result','telefono','coppa','territorio',
  'shop','formazione','investimenti','classifica','carriera','ritiro','allenatore','seasonend',
  'offseason','market','marketwinter'];

function __botActiveScreen(){
  for(let i=0;i<__BOT_SCREEN_IDS.length;i++){
    const el = document.getElementById('screen-'+__BOT_SCREEN_IDS[i]);
    if(el.classList.contains('active')) return __BOT_SCREEN_IDS[i];
  }
  return null;
}

function __botClickRandomChild(containerId){
  const box = document.getElementById(containerId);
  const clickable = box.children.filter(function(c){ return typeof c.onclick==='function'; });
  if(!clickable.length) return false;
  const el = clickable[Math.floor(Math.random()*clickable.length)];
  el.onclick();
  return true;
}

function __botClickElement(id){
  const el = document.getElementById(id);
  if(typeof el.onclick==='function'){ el.onclick(); return true; }
  return false;
}

// Continua a risolvere schermi "interstiziali" (event/match) finche' non si arriva a uno schermo
// stabile (hub/result/seasonend/marketwinter/coppa/...), esattamente come un giocatore che clicca
// sempre la prima cosa disponibile. showEvent()/showMatchEvent() usano choice-card vere
// (appendChild + onclick reale, tracciabili), il fallback "Continua" di resolveChoice() invece
// scrive innerHTML come stringa statica (stesso pattern usato per quasi tutte le altre schermate
// del gioco, non intercettabile via children): quel singolo caso e' gestito a parte chiamando
// nextMoment() direttamente, unica eccezione necessaria.
function __botPump(log, maxSteps){
  for(let i=0;i<(maxSteps||300);i++){
    const screen = __botActiveScreen();
    if(screen==='event'){
      const clicked = __botClickRandomChild('eventChoices');
      if(clicked){ __botClickElement('eventContinue'); continue; }
      log.push({step:'pump', ok:false, detail:'screen event senza scelte cliccabili'});
      return screen;
    } else if(screen==='match'){
      const clicked = __botClickRandomChild('matchAction');
      if(clicked) continue;
      const box = document.getElementById('matchAction');
      if(String(box.innerHTML||'').indexOf('nextMoment()')>=0){ nextMoment(); continue; }
      log.push({step:'pump', ok:false, detail:'screen match senza azioni cliccabili'});
      return screen;
    } else {
      return screen;
    }
  }
  log.push({step:'pump', ok:false, detail:'limite di sicurezza raggiunto (possibile loop) dopo '+maxSteps+' passi'});
  return 'STUCK';
}

function __botStartCareer(config){
  selezionaModalitaCreazione('nuovo');
  document.getElementById('inpGirone').value = config.girone;
  renderTeamPickerByGirone();
  const gironeLabel = config.girone.split('|')[1];
  const squadre = squadreSerieC().filter(function(sq){ return sq.girone===gironeLabel; });
  if(!squadre.length) throw new Error('nessuna squadra trovata per il girone '+config.girone);
  selectedStartTeam = squadre[Math.floor(Math.random()*squadre.length)].nome;
  document.getElementById('inpName').value = config.nome;
  document.getElementById('inpRole').value = config.ruolo;
  document.getElementById('inpDataNascita').value = config.dataNascita;
  // Nel browser reale il cambio ruolo scatena onchange="renderAllocator()", che resetta
  // `allocated` sul set di skill giuste per il ruolo (GK_ATTR_KEYS per il Portiere). Qui il
  // "cambio" e' solo un'assegnazione di .value, senza evento: va richiamata a mano, altrimenti
  // per il Portiere si allocano punti su chiavi (tecnica/fisico) che il suo attr non ha, persi nel
  // nulla in startCareer() — non un crash, solo una carriera creata con meno punti del dovuto.
  renderAllocator();
  const keys = attrKeysFor(config.ruolo);
  allocPoint(keys[0], 5);
  allocPoint(keys[1], 5);
  startCareer();
  if(!state) throw new Error('startCareer() non ha creato lo stato (form non validato?)');
}

// Copertura leggera e opzionale di territorio/formazione: non essenziale al loop principale,
// eventuali errori qui vengono loggati ma non interrompono la carriera.
function __botAzioniExtra(log){
  try{
    if(Math.random()<0.3 && typeof DB_POI!=='undefined' && DB_POI.length && !state.territorio.fattaSettimana){
      const poi = DB_POI[Math.floor(Math.random()*DB_POI.length)];
      vivEsperienza(poi.id);
      __botPump(log, 20);
    }
  }catch(e){ log.push({step:'territorio', ok:false, detail:e.stack||String(e)}); }
  try{
    if(Math.random()<0.3 && typeof DB_FORMAZIONE!=='undefined' && DB_FORMAZIONE.length && !state.formazione.fattaSettimana){
      const f = DB_FORMAZIONE[Math.floor(Math.random()*DB_FORMAZIONE.length)];
      seguiFormazione(f.id);
    }
  }catch(e){ log.push({step:'formazione', ok:false, detail:e.stack||String(e)}); }
}

function __botResolveTelefono(log){
  try{
    pulisciTelefonoPendenti();
    const pendenti = state.telefonoPendenti.slice();
    pendenti.forEach(function(item){
      const ev = EVENTS.find(function(e){ return e.id===item.eventId; });
      if(!ev) return;
      const idx = Math.floor(Math.random()*ev.scelte.length);
      risolviTelefonoPendente(item.eventId, item.personaId, idx);
    });
    if(pendenti.length) log.push({step:'telefono', ok:true, detail:pendenti.length+' messaggi risolti'});
  }catch(e){ log.push({step:'telefono', ok:false, detail:e.stack||String(e)}); }
}

// Schermi su cui e' del tutto normale finire dopo una giornata/partita, che non richiedono altra
// azione dal bot prima di procedere alla settimana successiva (marketwinter/coppa: la logica di
// gioco ha gia' fatto tutto il necessario, sono solo schermate di passaggio).
const __BOT_SCREEN_OK_PROSEGUI = ['hub','marketwinter','coppa','telefono'];

// Guida l'intero fuori-stagione (schermo 'seasonend' -> 'offseason'/'market'/eventuali partite di
// Coppa Leonessa -> nuova stagione), riusando le stesse funzioni reali del gioco
// (iniziaFuoriStagione/avanzaSettimanaFuoriStagione/aggiornaFuoriStagione dietro le quinte).
// Scelta deliberatamente semplice per il mercato estivo: resta sempre alla squadra attuale
// (restaAllaSquadra()) invece di seguire trattative/cambio squadra, che aprirebbe una superficie
// di test molto più ampia (nuova rosa, nuovo calendario, nuovi compagni...) — lasciata per una
// futura estensione dedicata, non necessaria per verificare che il ciclo stagionale regga.
// Ritorna true se una nuova stagione e' partita correttamente, false se si e' interrotto per un
// errore o uno schermo non previsto (loggato in ogni caso, mai un'eccezione che risale al chiamante).
function __botPlayOffSeason(log, maxSteps, result){
  try{
    iniziaFuoriStagione();
    for(let i=0;i<(maxSteps||80);i++){
      if(state.coppa && state.coppa.prossimi && state.coppa.prossimi.length){
        beginMatch();
        const afterBegin = __botPump(log, 400);
        if(afterBegin==='result'){ result.matchesPlayed++; closeResult(); __botPump(log, 400); }
        else if(__BOT_SCREEN_OK_PROSEGUI.indexOf(afterBegin)===-1 && afterBegin!==null){
          log.push({step:'offseason-coppa', ok:false, detail:'schermo non previsto dopo beginMatch() in Coppa: '+afterBegin});
        }
      } else {
        const screen = __botActiveScreen();
        if(screen==='market'){
          restaAllaSquadra();
        } else if(screen==='offseason'){
          avanzaSettimanaFuoriStagione();
        } else if(screen==='hub'){
          // avviaNuovaStagione() azzera state.giornata a 1: e' il segnale che il fuori-stagione e'
          // concluso con successo. Se invece siamo qui per un altro motivo (raro), si prova
          // comunque ad avanzare invece di considerarlo un errore.
          if(state.giornata===1) return true;
          avanzaSettimanaFuoriStagione();
        } else {
          log.push({step:'offseason', ok:false, detail:'schermo inatteso durante il fuori stagione: '+screen});
          return false;
        }
      }
      const problems = __botCheckInvariants();
      if(problems.length) log.push({step:'offseason-invariant', ok:false, detail: problems.join(' | ')});
    }
    log.push({step:'offseason', ok:false, detail:'limite di sicurezza raggiunto durante il fuori stagione (possibile loop)'});
    return false;
  }catch(e){
    log.push({step:'offseason', ok:false, detail:e.stack||String(e)});
    return false;
  }
}

function __botPlayCareer(config){
  const log = [];
  const result = { config: config, weeksPlayed: 0, matchesPlayed: 0, seasonsCompleted: 0, errors: [], invariantViolations: [], stoppedReason: null };
  try{
    __botStartCareer(config);
    log.push({step:'startCareer', ok:true, detail:'squadra='+selectedStartTeam+' ruolo='+config.ruolo});
  }catch(e){
    result.errors.push({step:'startCareer', detail: e.stack || String(e)});
    result.stoppedReason = 'errore alla creazione del personaggio';
    result.log = log;
    return result;
  }

  const maxWeeks = config.maxWeeks || 20;
  for(let week=0; week<maxWeeks; week++){
    if(!state){ result.stoppedReason = 'stato mancante (creazione fallita a monte?)'; break; }
    // Stagione conclusa (di solito rilevato subito sotto, dopo closeResult(); questo e' solo un
    // controllo difensivo per il primo giro del loop o casi limite): l'intero fuori-stagione
    // (mercato estivo, eventuale Coppa Leonessa in corso, nuova stagione) e' gestito da
    // __botPlayOffSeason(), che riusa le funzioni reali del gioco invece di duplicarne la logica.
    if(state.giornata > state.calendario.length){
      const ok = __botPlayOffSeason(log, 80, result);
      if(!ok){ result.stoppedReason = 'fuori stagione interrotto (vedi note nel log)'; break; }
      result.seasonsCompleted++;
      continue;
    }
    try{
      if(Math.random()<0.7){
        const opts = TRAININGS.map(function(t){ return t.id; });
        scegliAllenamento(opts[Math.floor(Math.random()*opts.length)]);
      }
      __botAzioniExtra(log);

      beginMatch();
      const afterBegin = __botPump(log, 400);
      if(afterBegin==='result'){
        result.matchesPlayed++;
        closeResult();
        __botPump(log, 400);
      } else if(afterBegin!=='seasonend' && __BOT_SCREEN_OK_PROSEGUI.indexOf(afterBegin)===-1){
        // Non necessariamente un bug (es. skipGiornata per condizione fisica bassa puo' atterrare
        // su schermi non ancora coperti esplicitamente qui), ma vale la pena annotarlo nel log.
        log.push({step:'match', ok:false, detail:'schermo non previsto dopo beginMatch(): '+afterBegin});
      }

      __botResolveTelefono(log);

      const problems = __botCheckInvariants();
      if(problems.length){
        result.invariantViolations.push({ week: week, giornata: state.giornata, problems: problems });
      }
      result.weeksPlayed++;

      if(__botActiveScreen()==='seasonend'){
        const ok = __botPlayOffSeason(log, 80, result);
        if(!ok){ result.stoppedReason = 'fuori stagione interrotto (vedi note nel log)'; break; }
        result.seasonsCompleted++;
      }
    }catch(e){
      result.errors.push({ step:'settimana '+week, giornata: state && state.giornata, detail: e.stack || String(e) });
      result.stoppedReason = 'errore durante la simulazione';
      break;
    }
  }
  result.log = log;
  return result;
}
