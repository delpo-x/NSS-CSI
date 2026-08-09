/* ====== ProbabilitaAttributi ======
   Libreria di funzioni pure "attributo -> probabilità": un unico punto in cui vivono le formule
   già concordate (tiro, portiere, curve posizione/passaggio, controllo palla, ecc.), da richiamare
   invece di essere ridefinite in giro per index REV2.html. Nessuna dipendenza da state/DOM: ogni
   funzione riceve solo numeri già estratti dal chiamante (es. un attributo 0-100 già diviso per
   100) e restituisce un numero — nessun side effect, nessuna lettura di stato di gioco.

   Caricato come <script src="probabilita-attributi.js"></script> PRIMA dello script principale in
   index REV2.html, stesso schema già usato da data-squadre.js. Il bot di test (test-bot.js) è
   stato aggiornato per caricare anche questo file nel proprio contesto vm, altrimenti il gioco lo
   referenzierebbe come non definito durante i test headless.

   Convenzione dei nomi: <attributo><Direzione>(x) — "Attacco"/"Difesa" indicano l'uso offensivo o
   difensivo dell'attributo (la stessa skill può servire in entrambe le direzioni a seconda della
   scelta: es. velocità per attaccare in progressione o per rincorrere in copertura). x è sempre
   normalizzato 0-1 salvo dove diversamente specificato (passaggio, che lavora in metri reali).

   Gli eventi di gioco (tiro, assist, controllo palla, in futuro recupero/parata) combinano sempre
   più di una di queste probabilità "in serie" (moltiplicate fra loro) — vedi calcChanceTiro/
   calcChanceAssist/calcChancePossesso in index REV2.html per come vengono composte.

   Attributi del portiere (presa/anticipo/riflessi/unoControUno/comunicazione/posizionamento):
   aggiunti su richiesta esplicita dell'utente, NON ancora richiamati da nessuna funzione di
   calcolo del motore (nessun calcChanceXxx li usa oggi) — pronti per quando si lavorerà nello
   specifico sul portiere. Nota: `parataDifesa` (sigmoide su ovr) resta la funzione usata oggi da
   calcChanceTiro/calcChanceAssist contro il portiere AVVERSARIO, perché per una squadra avversaria
   il roster reale ha solo l'ovr aggregato, non i singoli attributi da portiere — `presaDifesa`/
   `anticipoDifesa`/`comunicazioneDifesa` (stessa sigmoide, valori diversi) sono per quando si
   calcolerà la parata del PROPRIO portiere, che ha invece i suoi attributi reali in state.attr. */
const ProbabilitaAttributi = {
  // Velocità, positivo/attacco: F(x)=sin((π/2)·x). Vincoli: F(0)=0, F(1)=1, monotona crescente.
  velocitaAttacco(x){
    return Math.sin((Math.PI/2) * x);
  },

  // Velocità, negativo/difesa: F(x)=cos((π/2)·x). Vincoli: F(0)=1, F(1)=0, monotona decrescente.
  velocitaDifesa(x){
    return Math.cos((Math.PI/2) * x);
  },

  // Fisico, solo positivo/attacco: F(x)=0.5+x³. F(0)=0.5, F(1)=1.5.
  fisicoAttacco(x){
    return 0.5 + Math.pow(x, 3);
  },

  // Difesa (dell'avversario), solo negativo/difesa: sigmoide calibrata sui tre punti forniti
  // dall'utente — F(0.5)=0.85, F(0.7)=0.50, F(1)=0.33.
  difesaDifesa(x){
    return 7.781230915 * Math.exp(2.53617955*x*x - 5.69655672*x);
  },

  // Tecnica, solo positivo/attacco: F(x)=sin((π/2)·x). Vincoli: F(0)=0, F(1)=1, monotona crescente.
  tecnicaAttacco(x){
    return Math.sin((Math.PI/2) * x);
  },

  // Tiro, solo positivo/attacco: F(x)=50·4^(x³), qui già /100 (fattore, non percentuale) perché
  // il chiamante lo moltiplica direttamente con le altre probabilità del prodotto in serie.
  tiroAttacco(x){
    return (50 * Math.pow(4, Math.pow(x, 3))) / 100;
  },

  // Sigmoide logistica normalizzata condivisa da parata/presa/anticipo/comunicazione (stessa
  // forma, stessi c/k/M): un'unica implementazione, non quattro copie della stessa formula. c/k/M
  // forniti dall'utente sul dominio originale 0-200 (c=105, k=0.055, M=200); qui riscalati sul
  // dominio normalizzato 0-1 di questa libreria (c'=c/100=1.05, k'=100·k=5.5, M'=M/100=2) —
  // stesso identico risultato numerico, solo l'unità di x cambia. Non esposta direttamente:
  // richiamata dalle funzioni pubbliche sotto.
  _sigmoidePortiere(x){
    const c = 1.05, k = 5.5, M = 2;
    const g = v => 1 / (1 + Math.exp(k*(v-c)));
    const gMax = g(0), gMin = g(M);
    return (g(x) - gMin) / (gMax - gMin);
  },
  // Parata (del portiere avversario), solo negativo/difesa: sigmoide su ovr reale (unico dato
  // disponibile per un portiere avversario, vedi nota in cima al file).
  parataDifesa(x){
    return this._sigmoidePortiere(x);
  },
  // Presa, solo negativo/difesa: stessa sigmoide, su x = Presa/100 del proprio portiere.
  presaDifesa(x){
    return this._sigmoidePortiere(x);
  },
  // Anticipo, solo negativo/difesa: stessa sigmoide, su x = Anticipo/100 del proprio portiere.
  anticipoDifesa(x){
    return this._sigmoidePortiere(x);
  },
  // Comunicazione, solo negativo/difesa: stessa sigmoide, su x = Comunicazione/100 del proprio
  // portiere (voce semplice — vedi anche posizionamentoMoltiplicatorePericolo sotto, un
  // moltiplicatore distinto e più complesso, gated su calci piazzati/cross).
  comunicazioneDifesa(x){
    return this._sigmoidePortiere(x);
  },

  // Uno contro uno, solo negativo/difesa: F(x)=cos((π/2)·x). Vincoli: F(0)=1, F(1)=0, monotona
  // decrescente (stessa forma di velocitaDifesa, funzione propria per non accoppiare i due
  // attributi: se uno cambia formula in futuro l'altro non deve risentirne).
  unoControUnoDifesa(x){
    return Math.cos((Math.PI/2) * x);
  },

  // Efficienza sinusoidale E(attributo) condivisa da riflessi/posizionamento sotto: converte un
  // attributo 0-100 (qui passato normalizzato 0-1, come il resto della libreria) in una
  // percentuale di efficienza 0-100%. E(0)=0%, E(50)=50%, E(100)=100%.
  _efficienzaSinusoidale(x){
    const attributo = x * 100;
    return 50 + 50 * Math.sin(((attributo-50)/50) * (Math.PI/2));
  },
  // Riflessi, solo negativo/difesa: moltiplicatore sulla probabilità di gol di un tiro, attivo
  // SOLO per tiri ravvicinati (distanzaM < 7.0m — oltre, moltiplicatore fisso 1.00, nessun
  // intervento dell'attributo). E=0% -> ×1.15 (tiro più pericoloso), E=50% -> ×1.00 (neutro),
  // E=100% -> ×0.85 (portiere più efficace, -15% sulla probabilità di subire gol).
  riflessiMoltiplicatoreTiro(x, distanzaM){
    if(distanzaM >= 7.0) return 1.00;
    return 1.15 - 0.30 * (this._efficienzaSinusoidale(x) / 100);
  },
  // Posizionamento, solo negativo/difesa: stesso schema di riflessiMoltiplicatoreTiro ma attivato
  // dal TIPO di azione (calcio piazzato a sfavore o cross in area) invece che dalla distanza —
  // per il gioco standard (tiri da azione manovrata, contropiedi centrali) il moltiplicatore resta
  // fisso a 1.00. Nota: il testo fornito dall'utente per questa voce descrive l'attributo come
  // "Comunicazione (C)", ma l'intestazione della voce è "Posizionamento" — segnalato all'utente,
  // implementata seguendo l'intestazione (il nome del parametro qui è generico, "x", per questo
  // la formula resta corretta in entrambi i casi: cambia solo quale attributo il chiamante decide
  // di passarci).
  posizionamentoMoltiplicatorePericolo(x, isSetPieceOrCross){
    if(!isSetPieceOrCross) return 1.00;
    return 1.15 - 0.30 * (this._efficienzaSinusoidale(x) / 100);
  },

  // Passaggio, solo positivo/attacco: definita quando si è parlato dell'assist/campo di
  // probabilità di passaggio — non un singolo F(x) di uno scalare, ma un modello a due passi
  // (sigma ricavata dall'attributo, poi probabilità dalla distanza reale in metri) perché la
  // riuscita di un passaggio dipende dalla distanza percorsa, non solo dalla skill del passatore.
  // passaggioSigma: sigma_base=32.5/√(-2·ln(0.33))≈21.83m (vincolo P(32.5m)=0.33 a centrocampo,
  // per un giocatore con Passaggio=50/100), pavimento 18m a Passaggio=0.
  passaggioSigma(x){
    const floor = 18, base = 32.5 / Math.sqrt(-2 * Math.log(0.33));
    const coeff = 2 * (base - floor);
    return floor + coeff * x;
  },
  // passaggioAttacco: P(r)=exp(-r²/(2σ²)), isotropa — stessa probabilità a parità di distanza in
  // ogni direzione. r e sigma nella stessa unità (metri).
  passaggioAttacco(distanzaM, sigmaM){
    return Math.exp(-(distanzaM*distanzaM) / (2*sigmaM*sigmaM));
  },
  // passaggioRaggioIndifferenza: inversa di passaggioAttacco, r(p)=σ·√(-2·ln(p)) — mai
  // hardcodato, si adatta automaticamente a qualunque sigma.
  passaggioRaggioIndifferenza(probabilita, sigmaM){
    if(!(probabilita>0) || probabilita>=1) return null;
    return sigmaM * Math.sqrt(-2 * Math.log(probabilita));
  },

  // Distribuzione (portiere), solo positivo/attacco: su indicazione esplicita dell'utente, "uguale
  // alla funzione passaggio per i giocatori di movimento ma utilizza l'attributo distribuzione" —
  // stesso identico modello a due passi di passaggioSigma/passaggioAttacco (stessa calibrazione,
  // stessa forma), qui deleghe pure per non duplicare la formula una seconda volta: cambia solo
  // quale attributo il chiamante normalizza e passa come x.
  distribuzioneSigma(x){
    return this.passaggioSigma(x);
  },
  distribuzioneAttacco(distanzaM, sigmaM){
    return this.passaggioAttacco(distanzaM, sigmaM);
  }
};
