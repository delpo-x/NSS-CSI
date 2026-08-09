#!/usr/bin/env node
/*
 * Bot di test autonomo per Carriera CSI.
 *
 * Cosa fa: carica lo <script> di "index REV2.html" dentro un contesto Node isolato (modulo `vm`,
 * nessuna dipendenza esterna, nessun browser), gli fornisce un DOM finto minimo che non fa altro
 * che non-crashare, e usa le funzioni REALI del gioco (startCareer, beginMatch, resolveChoice,
 * pickEvent/showEvent, risolviTelefonoPendente, ecc. — vedi tools/bot-helpers.js) per simulare
 * intere carriere in autonomia, cliccando sempre la prima opzione disponibile. Ad ogni settimana
 * verifica un set di invarianti sullo stato (range 0-100, numeri non NaN, array sempre array...).
 *
 * Perche': verificare a mano ogni modifica via browser (javascript_tool) consuma un giro di
 * conversazione per ogni controllo. Questo bot gira una volta, produce un file di log, e quel log
 * si puo' rileggere quante volte serve senza rieseguire nulla.
 *
 * Uso:
 *   node tools/test-bot.js [--careers 10] [--weeks 20] [--seed 12345]
 *
 * Output: tools/test-logs/<timestamp>.log (dettagliato) e tools/test-logs/latest.log (stesso
 * contenuto, nome fisso per comodita'), piu' un riassunto stampato su stdout.
 *
 * Limiti noti (non e' un giocatore perfetto, e' un cercatore di crash/incoerenze):
 * - copre la stagione regolare fino a fine-stagione/mercato estivo/coppa-oltre-la-fase-in-corso:
 *   quando li incontra si ferma quella carriera e lo segna nel log, non e' un errore del gioco.
 * - le scelte sono casuali fra quelle disponibili, non "intelligenti": non misura se il gioco e'
 *   divertente o bilanciato, solo se resta in uno stato coerente e senza eccezioni non gestite.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME_FILE = path.join(ROOT, 'index REV2.html');
const DATA_FILE = path.join(ROOT, 'data-squadre.js');
// Libreria "attributo -> probabilità" (ProbabilitaAttributi), caricata dal browser come <script
// src> prima dello script principale (vedi index REV2.html): va caricata anche qui per lo stesso
// motivo di DATA_FILE, altrimenti calcChanceTiro/calcChanceAssist/calcChancePossesso la
// referenzierebbero come non definita durante i test headless.
const LIB_FILE = path.join(ROOT, 'probabilita-attributi.js');
const HELPERS_FILE = path.join(__dirname, 'bot-helpers.js');
const LOG_DIR = path.join(__dirname, 'test-logs');

// ---------- CLI args ----------
function parseArgs(argv){
  const out = { careers: 10, weeks: 20, seed: null };
  for(let i=0;i<argv.length;i++){
    const a = argv[i];
    if(a==='--careers') out.careers = parseInt(argv[++i], 10);
    else if(a==='--weeks') out.weeks = parseInt(argv[++i], 10);
    else if(a==='--seed') out.seed = parseInt(argv[++i], 10);
  }
  return out;
}

// ---------- DOM finto minimo ----------
// Obiettivo unico: che le funzioni del gioco possano leggere/scrivere textContent/innerHTML/
// value/style/classList/dataset senza eccezioni. Non renderizza nulla, non parsa HTML: e' un
// contenitore di stato per-elemento, auto-generato per qualunque id venga richiesto.
function makeElement(){
  const data = {
    id: '', textContent: '', innerHTML: '', value: '', style: {}, dataset: {},
    disabled: false, checked: false, selected: false, label: '',
    _classSet: new Set(), children: [], parentElement: null,
    attributes: {},
  };
  const classList = {
    add: function(){ Array.prototype.forEach.call(arguments, function(c){ data._classSet.add(c); }); },
    remove: function(){ Array.prototype.forEach.call(arguments, function(c){ data._classSet.delete(c); }); },
    toggle: function(c, force){
      if(force===undefined){ if(data._classSet.has(c)) data._classSet.delete(c); else data._classSet.add(c); }
      else if(force){ data._classSet.add(c); } else { data._classSet.delete(c); }
    },
    contains: function(c){ return data._classSet.has(c); },
  };
  const el = {
    tagName: 'DIV',
    classList: classList,
    get id(){ return data.id; }, set id(v){ data.id = v; },
    get className(){ return Array.from(data._classSet).join(' '); },
    set className(v){ data._classSet = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get textContent(){ return data.textContent; },
    set textContent(v){ data.textContent = String(v); data.children = []; },
    get innerText(){ return data.textContent; },
    set innerText(v){ data.textContent = String(v); },
    get innerHTML(){ return data.innerHTML; },
    set innerHTML(v){ data.innerHTML = String(v); data.children = []; },
    get value(){ return data.value; }, set value(v){ data.value = v; },
    get style(){ return data.style; },
    get dataset(){ return data.dataset; },
    get disabled(){ return data.disabled; }, set disabled(v){ data.disabled = v; },
    get checked(){ return data.checked; }, set checked(v){ data.checked = v; },
    get selected(){ return data.selected; }, set selected(v){ data.selected = v; },
    get label(){ return data.label; }, set label(v){ data.label = v; },
    get children(){ return data.children; },
    appendChild: function(child){ data.children.push(child); child.parentElement = el; return child; },
    prepend: function(child){ data.children.unshift(child); child.parentElement = el; return child; },
    removeChild: function(child){ const i = data.children.indexOf(child); if(i>=0) data.children.splice(i,1); return child; },
    remove: function(){ if(el.parentElement) el.parentElement.removeChild(el); },
    setAttribute: function(k,v){ data.attributes[k] = v; },
    getAttribute: function(k){ return data.attributes[k]; },
    addEventListener: function(){}, removeEventListener: function(){},
    querySelector: function(){ return null; },
    querySelectorAll: function(){ return []; },
    focus: function(){}, blur: function(){},
    click: function(){ if(typeof el.onclick==='function') el.onclick(); },
    onclick: null, onchange: null, oninput: null, onkeydown: null,
  };
  return el;
}

function createFakeDocument(){
  const cache = new Map();
  const screenIds = ['create','hub','event','match','result','telefono','coppa','territorio',
    'shop','formazione','investimenti','classifica','carriera','ritiro','allenatore','seasonend',
    'offseason','market','marketwinter'];
  const screenEls = [];
  function getElementById(id){
    if(!cache.has(id)){
      const el = makeElement();
      el.id = id;
      cache.set(id, el);
    }
    return cache.get(id);
  }
  // Pre-registra gli elementi "screen-*" con classe 'screen' cosi' showScreen()/querySelectorAll
  // ('.screen') possono attivare/disattivare la schermata corrente esattamente come nel browser.
  screenIds.forEach(function(id){
    const el = getElementById('screen-'+id);
    el.classList.add('screen');
    screenEls.push(el);
  });
  // Il gioco esegue alcune chiamate (renderAllocator/renderTeamPicker/selezionaModalitaCreazione)
  // subito al caricamento dello script, PRIMA che il bot abbia la possibilita' di impostare i
  // campi del form: replichiamo qui i valori di default reali dell'HTML statico (mai parsato in
  // Node) cosi' quelle chiamate iniziali non falliscono su un ruolo/data vuoti.
  getElementById('inpRole').value = 'Ala';
  getElementById('inpDataNascita').value = '2000-01-01';
  const document = {
    getElementById: getElementById,
    createElement: function(){ return makeElement(); },
    querySelectorAll: function(sel){ return sel==='.screen' ? screenEls.slice() : []; },
    querySelector: function(){ return null; },
    addEventListener: function(){}, removeEventListener: function(){},
    body: makeElement(),
  };
  return document;
}

function createFakeLocalStorage(){
  const store = new Map();
  return {
    getItem: function(k){ return store.has(k) ? store.get(k) : null; },
    setItem: function(k,v){ store.set(k, String(v)); },
    removeItem: function(k){ store.delete(k); },
    clear: function(){ store.clear(); },
  };
}

// ---------- Caricamento gioco in un contesto vm fresco ----------
function extractScript(html){
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if(!m) throw new Error('Tag <script> non trovato in index REV2.html');
  return m[1];
}

function newGameContext(dataCode, libCode, gameCode, helpersCode){
  const document = createFakeDocument();
  const localStorage = createFakeLocalStorage();
  const sandbox = {
    document: document,
    localStorage: localStorage,
    console: console,
    setTimeout: function(fn){ try{ fn(); }catch(e){ /* propaga al chiamante tramite log dedicato */ throw e; } },
    clearTimeout: function(){},
    Math: Math, Date: Date, JSON: JSON,
  };
  vm.createContext(sandbox);
  // DB_SQUADRE vive in data-squadre.js (<script src>), caricato dal browser prima dello script
  // principale: qui va eseguito per primo per lo stesso motivo, il gioco lo referenzia subito.
  // ProbabilitaAttributi (probabilita-attributi.js) va caricato subito dopo, stesso motivo.
  vm.runInContext(dataCode, sandbox, { filename: 'data-squadre.js' });
  vm.runInContext(libCode, sandbox, { filename: 'probabilita-attributi.js' });
  vm.runInContext(gameCode, sandbox, { filename: 'index-REV2-script.js' });
  vm.runInContext(helpersCode, sandbox, { filename: 'bot-helpers.js' });
  return sandbox;
}

function playOneCareer(dataCode, libCode, gameCode, helpersCode, config, logger){
  const sandbox = newGameContext(dataCode, libCode, gameCode, helpersCode);
  const call = '__botPlayCareer(' + JSON.stringify(config) + ')';
  try{
    return vm.runInContext(call, sandbox);
  }catch(e){
    // Eccezione sfuggita anche al try/catch interno di __botPlayCareer (es. errore nel setup del
    // contesto stesso): la logghiamo come fallimento totale di questa carriera, non del bot.
    return {
      config: config, weeksPlayed: 0, matchesPlayed: 0,
      errors: [{ step: 'context', detail: e.stack || String(e) }],
      invariantViolations: [], stoppedReason: 'eccezione non gestita nel contesto vm', log: [],
    };
  }
}

// ---------- Orchestrazione ----------
const RUOLI = ['Portiere','Difensore','Regista','Ala','Attaccante'];
const GIRONI = ['A','B','C','D','E','F'];

function randomConfig(i, maxWeeks){
  const girone = GIRONI[Math.floor(Math.random()*GIRONI.length)];
  const ruolo = RUOLI[Math.floor(Math.random()*RUOLI.length)];
  const anno = 1998 + Math.floor(Math.random()*10); // 20-28 anni circa a inizio carriera
  const mese = String(1 + Math.floor(Math.random()*12)).padStart(2,'0');
  const giorno = String(1 + Math.floor(Math.random()*28)).padStart(2,'0');
  return {
    nome: 'Bot Tester '+i,
    girone: 'C|Girone '+girone,
    ruolo: ruolo,
    dataNascita: anno+'-'+mese+'-'+giorno,
    maxWeeks: maxWeeks,
  };
}

function main(){
  const args = parseArgs(process.argv.slice(2));
  if(args.seed!==null && !Number.isNaN(args.seed)){
    // Math.random non e' seedabile nativamente in Node: annotiamo solo il seed richiesto nel log
    // per riferimento (non altera davvero la sequenza). Documentato, non taciuto.
  }
  const html = fs.readFileSync(GAME_FILE, 'utf8');
  const gameCode = extractScript(html);
  const dataCode = fs.readFileSync(DATA_FILE, 'utf8');
  const libCode = fs.readFileSync(LIB_FILE, 'utf8');
  const helpersCode = fs.readFileSync(HELPERS_FILE, 'utf8');

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(LOG_DIR, stamp+'.log');
  const latestPath = path.join(LOG_DIR, 'latest.log');
  const lines = [];
  function w(line){ lines.push(line); }

  w('Bot di test — Carriera CSI');
  w('Avviato: '+new Date().toISOString());
  w('Parametri: careers='+args.careers+' weeks='+args.weeks+(args.seed!==null?' seed(richiesto, non applicato)='+args.seed:''));
  w('File testato: '+GAME_FILE);
  w('='.repeat(78));

  const summary = { careers: 0, totalWeeks: 0, totalMatches: 0, totalSeasons: 0, totalErrors: 0, totalInvariantViolations: 0, careersWithErrors: 0, careersWithViolations: 0 };

  for(let i=0;i<args.careers;i++){
    const config = randomConfig(i, args.weeks);
    const result = playOneCareer(dataCode, libCode, gameCode, helpersCode, config, w);
    summary.careers++;
    summary.totalWeeks += result.weeksPlayed;
    summary.totalMatches += result.matchesPlayed;
    summary.totalSeasons += (result.seasonsCompleted||0);
    summary.totalErrors += result.errors.length;
    summary.totalInvariantViolations += result.invariantViolations.length;
    if(result.errors.length) summary.careersWithErrors++;
    if(result.invariantViolations.length) summary.careersWithViolations++;

    w('');
    w('--- Carriera #'+i+' — '+config.ruolo+' · girone '+config.girone+' · nato '+config.dataNascita+' ---');
    w('Settimane giocate: '+result.weeksPlayed+' / partite: '+result.matchesPlayed+' / stagioni completate (fuori stagione compreso): '+(result.seasonsCompleted||0));
    w('Esito: '+(result.stoppedReason || 'limite settimane raggiunto senza interruzioni'));
    if(result.errors.length){
      w('ERRORI ('+result.errors.length+'):');
      result.errors.forEach(function(e){
        w('  ['+e.step+'] giornata='+e.giornata);
        String(e.detail).split('\n').forEach(function(l){ w('    '+l); });
      });
    }
    if(result.invariantViolations.length){
      w('VIOLAZIONI DI INVARIANTI ('+result.invariantViolations.length+'):');
      result.invariantViolations.forEach(function(v){
        w('  settimana '+v.week+' (giornata '+v.giornata+'): '+v.problems.join(' | '));
      });
    }
    const anomalie = (result.log||[]).filter(function(l){ return l.ok===false; });
    if(anomalie.length){
      w('Note dal log interno ('+anomalie.length+'):');
      anomalie.forEach(function(l){ w('  ['+l.step+'] '+l.detail); });
    }
  }

  w('');
  w('='.repeat(78));
  w('RIEPILOGO');
  w('Carriere simulate: '+summary.careers);
  w('Settimane totali giocate: '+summary.totalWeeks);
  w('Partite totali giocate: '+summary.totalMatches);
  w('Stagioni completate (fuori stagione compreso, fra tutte le carriere): '+summary.totalSeasons);
  w('Carriere con errori: '+summary.careersWithErrors+' / '+summary.careers+' (errori totali: '+summary.totalErrors+')');
  w('Carriere con violazioni di invarianti: '+summary.careersWithViolations+' / '+summary.careers+' (violazioni totali: '+summary.totalInvariantViolations+')');
  w('Esito complessivo: '+(summary.totalErrors===0 && summary.totalInvariantViolations===0 ? 'OK — nessuna anomalia trovata' : 'DA RIVEDERE — vedi dettagli sopra'));

  const content = lines.join('\n')+'\n';
  fs.writeFileSync(logPath, content, 'utf8');
  fs.writeFileSync(latestPath, content, 'utf8');

  console.log(content.split('\n').slice(-8).join('\n'));
  console.log('Log completo: '+path.relative(ROOT, logPath));
  process.exitCode = (summary.totalErrors>0) ? 1 : 0;
}

main();
