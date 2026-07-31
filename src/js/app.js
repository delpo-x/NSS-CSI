const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 2;
const STORAGE_KEY = 'carriera_csi_save';

const fallbackSquads = {
  'Aston 5 Perle': { nome: 'Aston 5 Perle', serie: 'C', girone: 'Girone E' },
  'Elettrotecnic': { nome: 'Elettrotecnic', serie: 'C', girone: 'Girone E' },
  'Gso Capriolo': { nome: 'Gso Capriolo', serie: 'C', girone: 'Girone E' },
  'Softmetal': { nome: 'Softmetal', serie: 'C', girone: 'Girone E' },
  'Nigoline': { nome: 'Nigoline', serie: 'C', girone: 'Girone E' },
  'Sangiu United': { nome: 'Sangiu United', serie: 'C', girone: 'Girone E' },
  'Implast': { nome: 'Implast', serie: 'C', girone: 'Girone E' },
  'Brescia Passion': { nome: 'Brescia Passion', serie: 'C', girone: 'Girone F' },
  'Real Benaco': { nome: 'Real Benaco', serie: 'C', girone: 'Girone F' },
  'A.C. Medole': { nome: 'A.C. Medole', serie: 'C', girone: 'Girone F' },
  'U.S. Cignano': { nome: 'U.S. Cignano', serie: 'C', girone: 'Girone F' },
  'Riversoc': { nome: 'Riversoc', serie: 'C', girone: 'Girone F' },
  'Lions 25': { nome: 'Lions 25', serie: 'C', girone: 'Girone F' },
  'G.S.O. Brandico': { nome: 'G.S.O. Brandico', serie: 'C', girone: 'Girone F' }
};

const state = {
  squads: [],
  selectedGirone: '',
  selectedTeam: '',
  selectedRealPlayer: null,
  mode: 'nuovo',
  player: {
    name: '',
    role: 'Ala',
    birthDate: '2000-01-01',
    attributes: {
      tecnica: 0,
      fisico: 0,
      velocita: 0,
      tiro: 0,
      passaggio: 0,
      difesa: 0
    },
    pointsLeft: 10
  },
  save: null,
  history: [],
  redo: [],
  loading: true,
  confirmAction: null
};

const roleBase = {
  Portiere: { presa: 60, anticipo: 50, riflessi: 60, unoControUno: 50, distribuzione: 45, comunicazione: 50, posizionamento: 60 },
  Difensore: { tecnica: 45, fisico: 60, velocita: 45, tiro: 30, passaggio: 50, difesa: 65 },
  Regista: { tecnica: 55, fisico: 45, velocita: 45, tiro: 40, passaggio: 65, difesa: 50 },
  Ala: { tecnica: 55, fisico: 50, velocita: 55, tiro: 50, passaggio: 55, difesa: 45 },
  Attaccante: { tecnica: 55, fisico: 50, velocita: 60, tiro: 65, passaggio: 40, difesa: 25 }
};

const attrLabels = {
  tecnica: 'Tecnica',
  fisico: 'Fisico',
  velocita: 'Velocità',
  tiro: 'Tiro',
  passaggio: 'Passaggio',
  difesa: 'Difesa',
  presa: 'Presa',
  anticipo: 'Anticipo',
  riflessi: 'Riflessi',
  unoControUno: 'Uno contro uno',
  distribuzione: 'Distribuzione',
  comunicazione: 'Comunicazione',
  posizionamento: 'Posizionamento'
};

const roleKeys = {
  Portiere: ['presa', 'anticipo', 'riflessi', 'unoControUno', 'distribuzione', 'comunicazione', 'posizionamento'],
  default: ['tecnica', 'fisico', 'velocita', 'tiro', 'passaggio', 'difesa']
};

/**
 * Inizializza il bind degli eventi e il primo render dell’app.
 */
function init() {
  bindEvents();
  initAllocator();
  loadSquads();
  renderHub();
  showScreen('create');
}

function bindEvents() {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('app-ready');
  });

  document.getElementById('inpRole').addEventListener('change', () => {
    state.player.role = document.getElementById('inpRole').value;
    initAllocator();
    renderAttrAllocator();
  });

  document.getElementById('inpGirone').addEventListener('change', () => {
    state.selectedGirone = document.getElementById('inpGirone').value;
    renderTeamPickerByGirone();
  });

  document.getElementById('startCareerBtn').addEventListener('click', () => startCareer());
  document.getElementById('exportStateBtn').addEventListener('click', exportState);
  document.getElementById('importStateBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('importFileInput').addEventListener('change', handleImportFile);
  document.getElementById('restartCareerBtn').addEventListener('click', () => openConfirmModal('Vuoi davvero ricominciare la carriera? Questo cancella il salvataggio locale.', restartCareer));
  document.getElementById('btnModoNuovo').addEventListener('click', () => selectMode('nuovo'));
  document.getElementById('btnModoEsistente').addEventListener('click', () => selectMode('esistente'));
  document.getElementById('undoAllocation').addEventListener('click', undoAllocation);
  document.getElementById('redoAllocation').addEventListener('click', redoAllocation);

  document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmAcceptBtn').addEventListener('click', () => {
    if (state.confirmAction) {
      state.confirmAction();
    }
    closeConfirmModal();
  });

  document.addEventListener('keydown', handleGlobalKeydown);
}

function handleGlobalKeydown(event) {
  const modal = document.getElementById('confirmModal');
  if (modal && !modal.classList.contains('hidden') && event.key === 'Escape') {
    closeConfirmModal();
    return;
  }

  if (event.key === 'Tab' && document.getElementById('confirmModal') && !document.getElementById('confirmModal').classList.contains('hidden')) {
    trapFocusInModal(event);
  }
}

function trapFocusInModal(event) {
  const dialog = document.querySelector('#confirmModal .modal-dialog');
  const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openConfirmModal(message, callback) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmMessage').textContent = message;
  state.confirmAction = callback;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('confirmCancelBtn').focus();
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  state.confirmAction = null;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');
  const topbar = document.getElementById('topbar');
  topbar.style.display = screenId === 'create' ? 'none' : 'flex';
}

function normalizeSquads(data) {
  if (!data) return [];
  const source = Array.isArray(data) ? data : Object.values(data);
  return source
    .filter(item => item && item.nome)
    .map(item => ({
      nome: String(item.nome).trim(),
      serie: String(item.serie || 'C').toUpperCase(),
      girone: String(item.girone || 'Girone A')
    }));
}

/**
 * Carica il database delle squadre da data/squads.json e usa un fallback locale se il file non è disponibile.
 */
function loadSquads() {
  const loadingNode = document.getElementById('loadingSquads');
  if (loadingNode) {
    loadingNode.textContent = 'Caricamento squadre…';
  }
  state.loading = true;
  fetch('data/squads.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Fetch failed');
      }
      return response.json();
    })
    .then(data => {
      state.squads = normalizeSquads(data);
      state.loading = false;
      if (loadingNode) {
        loadingNode.textContent = `${state.squads.length} squadre caricate`;
      }
      renderGironiPicker();
    })
    .catch(() => {
      state.squads = normalizeSquads(fallbackSquads);
      state.loading = false;
      if (loadingNode) {
        loadingNode.textContent = 'Fallback locale attivo';
      }
      renderGironiPicker();
    });
}

/**
 * Popola il select dei gironi senza duplicati, evitando append multipli durante il refresh.
 */
function renderGironiPicker() {
  const select = document.getElementById('inpGirone');
  const uniqueGironi = Array.from(new Set(state.squads
    .filter(squad => squad.serie === 'C')
    .map(squad => `${squad.girone}`)))
    .sort((a, b) => a.localeCompare(b));

  select.innerHTML = '<option value="">— Scegli girone —</option>';
  uniqueGironi.forEach(girone => {
    const option = document.createElement('option');
    option.value = girone;
    option.textContent = `Serie C — ${girone}`;
    select.appendChild(option);
  });

  if (state.selectedGirone) {
    select.value = state.selectedGirone;
  }
}

/**
 * Mostra le squadre disponibili per il girone selezionato e gestisce il focus da tastiera.
 */
function renderTeamPickerByGirone() {
  const box = document.getElementById('teamPicker');
  const selectedValue = document.getElementById('inpGirone').value;
  state.selectedGirone = selectedValue;
  box.innerHTML = '';

  if (!selectedValue) {
    state.selectedTeam = '';
    return;
  }

  const teams = state.squads
    .filter(squad => squad.serie === 'C' && squad.girone === selectedValue)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  teams.forEach(team => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `team-option ${team.nome === state.selectedTeam ? 'selected' : ''}`;
    card.textContent = team.nome;
    card.setAttribute('aria-label', `Seleziona squadra ${team.nome}`);
    card.setAttribute('tabindex', '0');
    card.title = `${team.nome}`;
    card.addEventListener('click', () => {
      state.selectedTeam = team.nome;
      state.selectedRealPlayer = null;
      renderTeamPickerByGirone();
      renderRealPlayerPicker();
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
    box.appendChild(card);
  });

  if (!teams.length) {
    box.innerHTML = '<div class="subtle">Nessuna squadra disponibile per questo girone.</div>';
  }
}

function selectMode(mode) {
  state.mode = mode;
  document.getElementById('blockNuovoGiocatore').classList.toggle('hidden', mode !== 'nuovo');
  document.getElementById('blockGiocatoreEsistente').classList.toggle('hidden', mode !== 'esistente');
  document.getElementById('btnModoNuovo').classList.toggle('active', mode === 'nuovo');
  document.getElementById('btnModoEsistente').classList.toggle('active', mode === 'esistente');
  if (mode === 'esistente') {
    renderRealPlayerPicker();
  }
}

function renderRealPlayerPicker() {
  const box = document.getElementById('realPlayerPicker');
  box.innerHTML = '';

  if (!state.selectedTeam) {
    box.innerHTML = '<div class="subtle">Seleziona prima una squadra di partenza.</div>';
    return;
  }

  const squadra = state.squads.find(item => item.nome === state.selectedTeam);
  if (!squadra) {
    box.innerHTML = '<div class="subtle">Squadra non trovata.</div>';
    return;
  }

  const players = [
    { nome: 'Marco Rossi', ruolo: 'Ala', ovr: 72 },
    { nome: 'Luca Moretti', ruolo: 'Difensore', ovr: 70 },
    { nome: 'Giuseppe Bianchi', ruolo: 'Regista', ovr: 74 },
    { nome: 'Davide Neri', ruolo: 'Portiere', ovr: 68 },
    { nome: 'Matteo Verdi', ruolo: 'Attaccante', ovr: 76 }
  ];

  players.forEach(player => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `team-option ${state.selectedRealPlayer && state.selectedRealPlayer.nome === player.nome ? 'selected' : ''}`;
    button.textContent = `${player.nome} — ${player.ruolo} (OVR ${player.ovr})`;
    button.addEventListener('click', () => {
      state.selectedRealPlayer = player;
      renderRealPlayerPicker();
    });
    box.appendChild(button);
  });
}

function initAllocator() {
  const base = roleBase[state.player.role] || roleBase.Ala;
  const keys = roleKeys[state.player.role] || roleKeys.default;
  state.player.attributes = {};
  state.player.pointsLeft = 10;

  keys.forEach(key => {
    state.player.attributes[key] = Number(base[key] ?? 50);
  });

  state.history = [];
  state.redo = [];
}

function renderAttrAllocator() {
  const box = document.getElementById('attrAllocator');
  const role = state.player.role;
  const keys = roleKeys[role] || roleKeys.default;
  const base = roleBase[role] || roleBase.Ala;

  box.innerHTML = '';
  keys.forEach(key => {
    const row = document.createElement('div');
    row.className = 'attribute-ruler';
    row.setAttribute('title', `${attrLabels[key] || key}: ${base[key]} base + distribuzione punti`);
    row.setAttribute('aria-label', `${attrLabels[key] || key} attributo`);

    const label = document.createElement('span');
    label.textContent = attrLabels[key] || key;
    label.setAttribute('aria-hidden', 'true');

    const controls = document.createElement('div');
    controls.className = 'row align-center';

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('aria-label', `Riduci ${attrLabels[key] || key}`);
    minusBtn.addEventListener('click', () => adjustAttribute(key, -1));

    const value = document.createElement('span');
    value.className = 'value';
    value.id = `alloc-${key}`;
    value.textContent = state.player.attributes[key];

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('aria-label', `Aumenta ${attrLabels[key] || key}`);
    plusBtn.addEventListener('click', () => adjustAttribute(key, 1));

    const total = document.createElement('span');
    total.className = 'total';
    total.textContent = `= ${base[key]}`;

    controls.appendChild(minusBtn);
    controls.appendChild(value);
    controls.appendChild(plusBtn);

    row.appendChild(label);
    row.appendChild(controls);
    row.appendChild(total);
    box.appendChild(row);
  });

  document.getElementById('pointsLeft').textContent = `${state.player.pointsLeft} pt`;
}

function pushHistory() {
  state.history.push({
    attributes: { ...state.player.attributes },
    pointsLeft: state.player.pointsLeft
  });
  if (state.history.length > 20) {
    state.history.shift();
  }
  state.redo = [];
}

function undoAllocation() {
  if (!state.history.length) return;
  const previous = state.history.pop();
  state.redo.push({
    attributes: { ...state.player.attributes },
    pointsLeft: state.player.pointsLeft
  });
  state.player.attributes = previous.attributes;
  state.player.pointsLeft = previous.pointsLeft;
  renderAttrAllocator();
}

function redoAllocation() {
  if (!state.redo.length) return;
  const next = state.redo.pop();
  state.history.push({
    attributes: { ...state.player.attributes },
    pointsLeft: state.player.pointsLeft
  });
  state.player.attributes = next.attributes;
  state.player.pointsLeft = next.pointsLeft;
  renderAttrAllocator();
}

function adjustAttribute(key, delta) {
  const base = roleBase[state.player.role] || roleBase.Ala;
  const current = state.player.attributes[key] || base[key] || 50;
  const nextValue = current + delta;

  if (delta > 0 && state.player.pointsLeft <= 0) return;
  if (delta < 0 && current <= (base[key] || 50)) return;
  if (nextValue < 0 || nextValue > 99) return;

  pushHistory();
  state.player.attributes[key] = nextValue;
  state.player.pointsLeft -= delta;
  renderAttrAllocator();
}

function validatePlayer() {
  const errors = [];
  const name = document.getElementById('inpName').value.trim();
  if (state.mode === 'nuovo') {
    if (!name) {
      errors.push('Inserisci un nome giocatore.');
    } else if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      errors.push(`Il nome deve essere lungo tra ${MIN_NAME_LENGTH} e ${MAX_NAME_LENGTH} caratteri.`);
    }
  }

  const birthDateValue = document.getElementById('inpDataNascita').value;
  if (birthDateValue) {
    const date = new Date(`${birthDateValue}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      errors.push('La data di nascita non può essere nel futuro.');
    }
  }

  if (!state.selectedTeam) {
    errors.push('Scegli una squadra di partenza.');
  }

  if (state.mode === 'esistente' && !state.selectedRealPlayer) {
    errors.push('Seleziona un giocatore esistente dalla rosa.');
  }

  if (state.player.pointsLeft < 0) {
    errors.push('Distribuisci correttamente i punti dei modificatori.');
  }

  return errors;
}

function setFormErrors(errors) {
  const el = document.getElementById('createErrors');
  el.textContent = errors.length ? errors.join(' ') : '';
}

/**
 * Avvia la carriera con le impostazioni di creazione correnti dopo validazione.
 */
function startCareer() {
  const errors = validatePlayer();
  setFormErrors(errors);
  if (errors.length) {
    return;
  }

  const role = document.getElementById('inpRole').value;
  const name = state.mode === 'nuovo'
    ? document.getElementById('inpName').value.trim()
    : state.selectedRealPlayer?.nome || 'Giocatore';

  const player = {
    name,
    role: role || 'Ala',
    birthDate: document.getElementById('inpDataNascita').value || '2000-01-01',
    attributes: { ...state.player.attributes },
    overall: calculateOverall({ role, attributes: state.player.attributes }),
    team: state.selectedTeam,
    league: 'C',
    saldo: 300,
    niveau: 1
  };

  const savePayload = { id: 'carriera-csi', player, selectedTeam: state.selectedTeam, mode: state.mode };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savePayload));
  state.save = savePayload;

  renderHub();
  showScreen('hub');
}

function renderHub() {
  const save = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const player = save?.player;
  if (!player) {
    document.getElementById('hubName').textContent = '—';
    document.getElementById('hubRole').textContent = 'Nessuna carriera attiva';
    document.getElementById('hubTeam').textContent = '—';
    document.getElementById('hubLeague').textContent = 'Serie C';
    document.getElementById('hubSaldo').textContent = '€0';
    document.getElementById('hubOverall').textContent = 'OVR 60';
    document.getElementById('playerAttributes').innerHTML = '';
    return;
  }

  document.getElementById('tbName').textContent = player.name;
  document.getElementById('hubName').textContent = player.name;
  document.getElementById('hubRole').textContent = `${player.role} · ${player.team}`;
  document.getElementById('hubTeam').textContent = player.team;
  document.getElementById('hubLeague').textContent = `Serie ${player.league}`;
  document.getElementById('hubSaldo').textContent = `€${player.saldo}`;
  document.getElementById('hubOverall').textContent = `OVR ${player.overall}`;
  document.getElementById('hubLevel').textContent = `Lv. ${player.niveau || 1}`;

  const attrBox = document.getElementById('playerAttributes');
  const entries = Object.entries(player.attributes);
  attrBox.innerHTML = '';

  entries.forEach(([key, value]) => {
    const attrEl = document.createElement('div');
    attrEl.className = 'attr';
    attrEl.innerHTML = `
      <span class="attr-name" title="${attrLabels[key] || key}" aria-label="${attrLabels[key] || key}">${attrLabels[key] || key}</span>
      <span class="attr-value">${value}</span>
    `;
    attrBox.appendChild(attrEl);
  });
}

function calculateOverall({ role, attributes }) {
  const values = Object.values(attributes || {});
  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  const length = values.length || 1;
  return Math.round(total / length);
}

function exportState() {
  const save = localStorage.getItem(STORAGE_KEY);
  if (!save) {
    setFormErrors(['Nessun salvataggio disponibile da esportare.']);
    return;
  }

  const blob = new Blob([save], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'carriera-csi-save.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const valid = validateImportedState(parsed);
      if (!valid.ok) {
        setFormErrors([valid.error]);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid.data));
      state.save = valid.data;
      setFormErrors([]);
      renderHub();
      showScreen('hub');
    } catch (error) {
      setFormErrors(['Il file JSON non è valido.']);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function validateImportedState(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Lo schema del file JSON non è valido.' };
  }

  const player = payload.player;
  if (!player || !player.name || !player.team || !player.role) {
    return { ok: false, error: 'Il file deve contenere almeno player.name, player.team e player.role.' };
  }

  if (typeof player.name !== 'string' || player.name.trim().length < MIN_NAME_LENGTH) {
    return { ok: false, error: 'Il nome nel file di import non è valido.' };
  }

  if (!player.attributes || typeof player.attributes !== 'object') {
    return { ok: false, error: 'Il salvataggio importato non contiene attributi validi.' };
  }

  return { ok: true, data: payload };
}

function restartCareer() {
  localStorage.removeItem(STORAGE_KEY);
  state.selectedTeam = '';
  state.selectedGirone = '';
  state.selectedRealPlayer = null;
  state.player = {
    name: '',
    role: 'Ala',
    birthDate: '2000-01-01',
    attributes: { tecnica: 0, fisico: 0, velocita: 0, tiro: 0, passaggio: 0, difesa: 0 },
    pointsLeft: 10
  };
  document.getElementById('inpName').value = '';
  document.getElementById('inpDataNascita').value = '2000-01-01';
  document.getElementById('inpRole').value = 'Ala';
  selectMode('nuovo');
  initAllocator();
  renderAttrAllocator();
  renderGironiPicker();
  showScreen('create');
}

document.addEventListener('DOMContentLoaded', init);
