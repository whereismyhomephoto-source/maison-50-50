
const KEY='maison5050_simple_v1';
const THEME_KEY='maison5050_theme';
const people=['Guillaume','Claire'];
const categories=['Salle de bains','Cuisine','Électricité','Plomberie','Peinture','Sol','Extérieur','Outillage','Mobilier / déco','Autre'];
const laborCategories=['Électricité / électricien','Carrelage / carreleur','Plomberie / plombier','Peinture / peintre','Maçonnerie / maçon','Menuiserie / menuisier','Plâtrerie / plaquiste','Couverture / couvreur','Chauffage / chauffagiste','Terrassement / terrassier','Extérieur / paysagiste','Autre prestation'];
const acquisitionCategories=['Apport personnel','Frais de notaire','Frais d’agence','Frais de dossier bancaire','Frais de garantie / caution','Autres frais d’acquisition'];
function categoriesForType(type){return type==='main_oeuvre'?laborCategories:type==='apport_frais_notaire'?acquisitionCategories:categories}
function expenseType(e){return ['materiel','main_oeuvre','apport_frais_notaire'].includes(e?.expenseType)?e.expenseType:'a_classer'}
function expenseTypeLabel(t){return t==='materiel'?'Matériel':t==='main_oeuvre'?'Main d’œuvre':t==='apport_frais_notaire'?'Apport frais et notaire':'À classer'}
function totalByType(type){return state.expenses.filter(e=>expenseType(e)===type).reduce((sum,e)=>sum+Number(e.amount||0),0)}
const emojis=['🏠','🛁','🍽️','⚡','🚿','🎨','🪵','🌿','🛠️','🪑','🧾','🚚','💡','📦','✨'];
let state=load();
let currentDocFolder=null;
let docSearch='';
let view='home';
let editingId=null;
let editingReimbursementId=null;
let editingProjectId=null;
function applyTheme(){const t=localStorage.getItem(THEME_KEY)||'dark';document.documentElement.dataset.theme=t;const b=document.getElementById('themeToggle');if(b)b.textContent=t==='dark'?'☀️ Clair':'🌙 Sombre'}
function toggleTheme(){const next=(document.documentElement.dataset.theme==='dark')?'light':'dark';localStorage.setItem(THEME_KEY,next);applyTheme()}
applyTheme();
function load(){try{const data=JSON.parse(localStorage.getItem(KEY))||{}; return {expenses:data.expenses||[], reimbursements:data.reimbursements||[], projects:data.projects||[], docFolders:data.docFolders||[{id:'general',name:'Général'}], documents:data.documents||[]}}catch(e){return{expenses:[],reimbursements:[],projects:[],docFolders:[{id:'general',name:'Général'}],documents:[]}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state)); if(cloudSession) cloudSave().catch(e=>console.error('Sync:',e))}
function money(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0))}
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function v(id){return document.getElementById(id)?.value||''}
function num(id){return parseFloat(String(v(id)).replace(',','.'))||0}
function esc(x){return String(x??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function total(){return state.expenses.reduce((s,e)=>s+Number(e.amount||0),0)}
function projectsTotal(){return state.projects.reduce((s,p)=>s+Number(p.amount||0),0)}
function paidBy(name){return state.expenses.filter(e=>e.payer===name).reduce((s,e)=>s+Number(e.amount||0),0)}
function sentBy(name){return state.reimbursements.filter(r=>r.from===name).reduce((s,r)=>s+Number(r.amount||0),0)}
function receivedBy(name){return state.reimbursements.filter(r=>r.to===name).reduce((s,r)=>s+Number(r.amount||0),0)}
function netPaid(name){return paidBy(name)+sentBy(name)-receivedBy(name)}
function paidOut(name){return paidBy(name)+sentBy(name)}
function other(name){return name==='Guillaume'?'Claire':'Guillaume'}
function balance(){const t=total()/2; const g=netPaid('Guillaume')-t; const c=netPaid('Claire')-t; return {t,g,c}}
function settleText(){const b=balance(); if(Math.abs(b.g)<0.005)return 'Vous êtes à l’équilibre.'; return b.g>0?`Claire doit ${money(b.g)} à Guillaume.`:`Guillaume doit ${money(-b.g)} à Claire.`}
function show(x){view=x;editingId=null;editingReimbursementId=null;editingProjectId=null;pendingCloudRender=false;render()}
function fabAdd(event){
  // Le clic doit ouvrir le formulaire immédiatement, même si les animations sont désactivées.
  if(event && event.preventDefault) event.preventDefault();
  if(navigator.vibrate) try{navigator.vibrate(8)}catch(e){}
  show('add');
}
function toast(t){const el=document.getElementById('toast'); el.textContent=t; el.className='show'; setTimeout(()=>el.className='',1600)}
function render(){applyTheme();document.querySelectorAll('.bottom button,.topnav button').forEach(b=>b.classList.remove('active')); document.getElementById('nav-'+view)?.classList.add('active'); document.getElementById('quick-add-fab')?.classList.toggle('active',view==='add'); document.getElementById('topnav-'+view)?.classList.add('active'); document.getElementById('topnav-'+view)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); if(view==='add')addView(); else if(view==='reimburse')reimburseView(); else if(view==='history')historyView(); else if(view==='projects')projectsView(); else if(view==='documents')documentsView(); else homeView()}
function layout(html){document.getElementById('root').innerHTML=html}
function homeView(){
  const b=balance();
  const gNet=netPaid('Guillaume'), cNet=netPaid('Claire');
  const gPaid=paidOut('Guillaume'), cPaid=paidOut('Claire');
  const gReimb=sentBy('Guillaume'), cReimb=sentBy('Claire');
  const gClass=gNet>cNet?'positive':gNet<cNet?'negative':'';
  const cClass=cNet>gNet?'positive':cNet<gNet?'negative':'';
  const lines=combinedLinesChronological();
  const unclassified=state.expenses.filter(e=>expenseType(e)==='a_classer');
  const unclassifiedTotal=totalByType('a_classer');
  layout(`<div class="grid home-grid banking-home">
    <section class="bank-dashboard" aria-label="Vue d’ensemble du budget">
      <div class="bank-hero">
        <div class="bank-hero-top"><span class="bank-eyebrow">BUDGET MAISON</span><span class="bank-balance-badge">50 / 50</span></div>
        <div class="bank-balance-label">Total des dépenses</div>
        <div class="bank-balance-amount">${money(total())}</div>
        <div class="bank-balance-caption">Toutes catégories confondues · hors remboursements</div>
        <div class="bank-hero-decoration" aria-hidden="true"></div>
      </div>
      <div class="bank-quick-actions" aria-label="Actions rapides">
        <button type="button" onclick="fabAdd(event)" class="bank-action"><span class="bank-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span><span>Ajouter</span></button>
        <button type="button" onclick="show('reimburse')" class="bank-action"><span class="bank-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l-4-4M20 17H4l4 4"/><path d="M20 7l-4 4M4 17l4-4"/></svg></span><span>Rembourser</span></button>
        <button type="button" onclick="show('history')" class="bank-action"><span class="bank-action-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3.5 2"/></svg></span><span>Historique</span></button>
      </div>
    </section>
    <section class="bank-categories" aria-label="Répartition des dépenses">
      <div class="bank-section-heading"><h2>Répartition</h2><span>Par type de dépense</span></div>
      <div class="bank-category-grid">
        <div class="bank-category bank-category-material"><div class="bank-category-top"><span class="bank-category-symbol">▦</span><span>01</span></div><div class="bank-category-name">Matériel</div><div class="bank-category-amount">${money(totalByType('materiel'))}</div></div>
        <div class="bank-category bank-category-labor"><div class="bank-category-top"><span class="bank-category-symbol">⚒</span><span>02</span></div><div class="bank-category-name">Main d’œuvre</div><div class="bank-category-amount">${money(totalByType('main_oeuvre'))}</div></div>
        <div class="bank-category bank-category-acquisition"><div class="bank-category-top"><span class="bank-category-symbol">⌂</span><span>03</span></div><div class="bank-category-name">Apport frais et notaire</div><div class="bank-category-amount">${money(totalByType('apport_frais_notaire'))}</div></div>
      </div>
    </section>
    ${unclassified.length?`<div class="classification-alert" role="status"><span><b>${unclassified.length} dépense${unclassified.length>1?'s':''} à classer</b> (${money(unclassifiedTotal)}). Déjà incluse${unclassified.length>1?'s':''} dans le total général.</span><button class="small secondary" onclick="edit('${esc(unclassified[0].id)}')">Classer</button></div>`:''}
    <section class="bank-payers-section" aria-label="Paiements par personne"><div class="bank-section-heading"><h2>Qui a payé ?</h2><span>Suivi à deux</span></div>
      <div class="home-payers"><div class="card metric halfmetric bank-payer"><div class="bank-person-avatar">G</div><div class="label">Guillaume</div><div class="value ${gClass}">${money(gPaid)}</div><div class="submetric">dont ${money(gReimb)} remboursés à Claire</div></div><div class="card metric halfmetric bank-payer"><div class="bank-person-avatar">C</div><div class="label">Claire</div><div class="value ${cClass}">${money(cPaid)}</div><div class="submetric">dont ${money(cReimb)} remboursés à Guillaume</div></div></div>
    </section>
    <section class="card full solde-card bank-settlement"><div class="bank-section-heading"><h2>Équilibre 50/50</h2><span>Solde actuel</span></div><div class="settle ${b.g>0?'positive':b.g<0?'negative':''}">${settleText()}</div><p class="muted">Chaque dépense est partagée en deux. Les remboursements déjà effectués sont pris en compte.</p><div class="mini-recap"><span>Guillaume → Claire : <b>${money(gReimb)}</b></span><span>Claire → Guillaume : <b>${money(cReimb)}</b></span></div></section>
    <section class="card full bank-transactions"><div class="bank-section-heading"><h2>Mouvements</h2><button type="button" class="bank-link" onclick="show('history')">Tout voir →</button></div><p class="muted">Dépenses et remboursements par date.</p><div class="list">${lines.map(line=>line.kind==='expense'?expenseLine(line.data):reimbursementLine(line.data)).join('')||'<p class="muted">Aucune dépense. Ajoute la première.</p>'}</div></section>
  </div>`)
}
function combinedLinesChronological(){
  const exp=state.expenses.map(e=>({kind:'expense',date:e.date||'',created:e.id||'',data:e}));
  const reimb=state.reimbursements.map(r=>({kind:'reimbursement',date:r.date||'',created:r.id||'',data:r}));
  return exp.concat(reimb).sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(b.created).localeCompare(String(a.created)));
}
function movementIcon(type){
  const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths={
    materiel:'<path d="M4 9h16l-1.3 11H5.3L4 9Z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    main_oeuvre:'<path d="m14.6 7.5-7.1 7.1-3.4 1 .9-3.4 7.2-7.1"/><path d="m15 4 5 5-3.3 3.3-5-5L15 4Z"/><path d="m4.5 19.5 2-2"/>',
    apport_frais_notaire:'<path d="m3 11 9-7 9 7"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-7h6v7"/>',
    reimbursement:'<path d="M4 8h15l-4-4"/><path d="m19 8-4 4"/><path d="M20 16H5l4 4"/><path d="m5 16 4-4"/>',
    a_classer:'<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h5"/>'
  };
  return `<svg ${common}>${paths[type]||paths.a_classer}</svg>`;
}
function movementDateLabel(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return String(date||'');
  const d=new Date(date+'T12:00:00');
  if(Number.isNaN(d.getTime()))return String(date||'');
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'});
}
function movementActionButton(item,kind){
  return `<button type="button" class="premium-more" data-movement-id="${esc(item.id)}" data-movement-kind="${kind}" onclick="openMovementActions(this)" aria-label="Options de ${kind==='expense'?'la dépense':'ce remboursement'}" title="Options"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button>`;
}
function expenseLine(e){
  const half=Number(e.amount||0)/2;
  const phrase=e.payer==='Guillaume'?`Claire doit ${money(half)} à Guillaume`:`Guillaume doit ${money(half)} à Claire`;
  const type=expenseType(e);
  const typeClass=type==='materiel'?'material':type==='main_oeuvre'?'labor':type==='apport_frais_notaire'?'acquisition':'unclassified';
  return `<article class="movement-card premium-movement movement-expense premium-${typeClass}" data-swipe-kind="expense">
    <span class="movement-icon movement-icon-${typeClass}" aria-hidden="true">${movementIcon(type)}</span>
    <div class="movement-body">
      <div class="movement-title">${esc(e.title||e.category||'Dépense')}</div>
      <div class="movement-subtitle">${esc(e.category||'Sans catégorie')} <span class="movement-sep">·</span> ${esc(movementDateLabel(e.date))}</div>
      <div class="movement-footer"><span class="movement-chip">${esc(expenseTypeLabel(type))}</span><span class="movement-payer">${esc(e.payer||'—')}</span></div>
      <details class="movement-detail"><summary>Répartition 50/50 <span aria-hidden="true">⌄</span></summary><div class="movement-breakdown"><span>Part de chacun : <b>${money(half)}</b></span><span>${phrase}</span>${e.note?`<span>Note : ${esc(e.note)}</span>`:''}</div></details>
    </div>
    <div class="premium-trailing"><div class="movement-amount">− ${money(e.amount)}</div>${movementActionButton(e,'expense')}</div>
  </article>`;
}
function emojiFor(category){const map={'Apport personnel':'🏡','Frais de notaire':'📜','Frais d’agence':'🏠','Frais de dossier bancaire':'🏦','Frais de garantie / caution':'🔑','Autres frais d’acquisition':'🧾','Salle de bains':'🛁','Cuisine':'🍽️','Électricité':'⚡','Plomberie':'🚿','Peinture':'🎨','Sol':'🪵','Extérieur':'🌿','Outillage':'🛠️','Mobilier / déco':'🪑','Autre':'🧾'};return map[category]||'🏠'}
function categoryOptions(type,selected){
  const opts=categoriesForType(type);
  const all=selected&&!opts.includes(selected)?[selected,...opts]:opts;
  return all.map(c=>`<option value="${esc(c)}" ${selected===c?'selected':''}>${esc(c)}</option>`).join('');
}
function updateExpenseCategories(){
  const category=document.getElementById('category');
  if(!category)return;
  const previous=category.value;
  const type=v('expenseType');
  const opts=categoriesForType(type);
  const selected=opts.includes(previous)?previous:opts[0];
  category.innerHTML=categoryOptions(type,selected);
  if(!editingId)document.getElementById('emoji').value=emojiFor(selected);
  preview();
}
function addView(){
  const e=editingId?state.expenses.find(x=>x.id===editingId):null;
  const type=e?expenseType(e):'materiel';
  layout(`<div class="card"><h2>${e?'Modifier':'Ajouter'} une dépense</h2><p class="muted">Choisis Matériel, Main d’œuvre ou Apport frais et notaire, puis la catégorie correspondante. Le partage 50/50 reste automatique.</p><div class="formgrid">
    <div class="field"><label for="date">Date</label><input id="date" type="date" value="${esc(e?.date||new Date().toISOString().slice(0,10))}"></div>
    <div class="field"><label for="expenseType">Nature de la dépense</label><select id="expenseType">${type==='a_classer'?'<option value="a_classer" selected>À classer (ancienne dépense)</option>':''}<option value="materiel" ${type==='materiel'?'selected':''}>Matériel</option><option value="main_oeuvre" ${type==='main_oeuvre'?'selected':''}>Main d’œuvre</option><option value="apport_frais_notaire" ${type==='apport_frais_notaire'?'selected':''}>Apport frais et notaire</option></select></div>
    <div class="field"><label for="category">Catégorie / métier</label><select id="category">${categoryOptions(type,e?.category||categoriesForType(type)[0])}</select></div>
    <div class="field"><label for="emoji">Emoji repère visuel</label><select id="emoji">${emojis.map(em=>`<option ${((e?.emoji)||emojiFor(e?.category))===em?'selected':''}>${em}</option>`).join('')}</select></div>
    <div class="field"><label for="title">Libellé</label><input id="title" placeholder="Ex : Carrelage salle de bains" value="${esc(e?.title||'')}"></div>
    <div class="field"><label for="amount">Montant payé</label><input id="amount" type="number" min="0.01" step="0.01" placeholder="0,00" value="${e?Number(e.amount||0):''}"></div>
    <div class="field"><label for="payer">Payé par</label><select id="payer">${people.map(p=>`<option ${e?.payer===p?'selected':''}>${p}</option>`).join('')}</select></div>
    <div class="field"><label for="note">Note facultative</label><input id="note" placeholder="Magasin, artisan, facture..." value="${esc(e?.note||'')}"></div>
    </div><div class="summaryline" id="preview">La moitié sera calculée automatiquement.</div><div class="actions"><button onclick="saveExpense()">${e?'Enregistrer les modifications':'Ajouter la dépense'}</button>${e?'<button class="secondary" onclick="show(\'history\')">Annuler</button>':''}</div></div>`);
  ['amount','payer'].forEach(id=>document.getElementById(id).addEventListener('input',preview));
  document.getElementById('expenseType').addEventListener('change',updateExpenseCategories);
  document.getElementById('category').addEventListener('change',()=>{if(!editingId)document.getElementById('emoji').value=emojiFor(v('category'));preview()});
  preview();
}
function preview(){const amount=num('amount'), payer=v('payer'); const half=amount/2; const recipient=payer==='Guillaume'?'Claire':'Guillaume'; const el=document.getElementById('preview'); if(!el)return; el.innerHTML=amount?`Part chacun : <b>${money(half)}</b>. ${recipient} doit <b>${money(half)}</b> à ${payer}.`:'La moitié sera calculée automatiquement.'}
function saveExpense(){
  const amount=num('amount');
  if(!amount||amount<=0){toast('Entre un montant valide');return}
  const expenseTypeValue=v('expenseType');
  if(!['materiel','main_oeuvre','apport_frais_notaire'].includes(expenseTypeValue)){toast('Choisis une nature de dépense');return}
  const data={date:v('date'),expenseType:expenseTypeValue,category:v('category'),title:v('title')||v('category'),emoji:v('emoji')||emojiFor(v('category')),amount,payer:v('payer'),note:v('note')};
  if(editingId){Object.assign(state.expenses.find(e=>e.id===editingId),data);toast('Dépense modifiée')}
  else{state.expenses.push({id:uid(),...data});toast('Dépense ajoutée')}
  save();show('home');
}
function reimburseView(){const r=editingReimbursementId?state.reimbursements.find(x=>x.id===editingReimbursementId):null;layout(`<div class="card"><h2>${r?'Modifier':'Ajouter'} un remboursement</h2><p class="muted">Note un virement ou paiement entre Guillaume et Claire. Ce montant ne compte pas comme une dépense : il vient uniquement réduire le solde dû entre vous.</p><div class="formgrid"><div class="field"><label>Date</label><input id="rdate" type="date" value="${esc(r?.date||new Date().toISOString().slice(0,10))}"></div><div class="field"><label>Qui a envoyé l’argent ?</label><select id="rfrom">${people.map(p=>`<option ${r?.from===p?'selected':''}>${p}</option>`).join('')}</select></div><div class="field"><label>À qui ?</label><select id="rto">${people.map(p=>`<option ${r?.to===p?'selected':''}>${p}</option>`).join('')}</select></div><div class="field"><label>Montant envoyé</label><input id="ramount" type="number" step="0.01" placeholder="0,00" value="${r?Number(r.amount||0):''}"></div><div class="field"><label>Note facultative</label><input id="rnote" placeholder="Ex : virement pour solder les dépenses en retard" value="${esc(r?.note||'')}"></div></div><div class="summaryline" id="rpreview">Le remboursement sera déduit du solde entre vous.</div><div class="actions"><button onclick="saveReimbursement()">${r?'Enregistrer les modifications':'Enregistrer le remboursement'}</button><button class="secondary" onclick="show('home')">Annuler</button></div></div>`); ['rfrom','rto','ramount'].forEach(id=>document.getElementById(id).addEventListener('input',previewReimbursement)); previewReimbursement()}
function previewReimbursement(){const amount=num('ramount'), from=v('rfrom'), to=v('rto'); if(from===to){document.getElementById('rpreview').innerHTML='<b>Choisis deux personnes différentes.</b>';return} document.getElementById('rpreview').innerHTML=amount?`${from} envoie <b>${money(amount)}</b> à ${to}. Ce montant viendra réduire ce que ${from} doit éventuellement à ${to}.`:'Le remboursement sera déduit du solde entre vous.'}
function saveReimbursement(){const amount=num('ramount'), from=v('rfrom'), to=v('rto'); if(!amount){toast('Entre un montant');return} if(from===to){toast('Choisis deux personnes différentes');return} const data={date:v('rdate'),from,to,amount,note:v('rnote')}; if(editingReimbursementId){Object.assign(state.reimbursements.find(r=>r.id===editingReimbursementId),data); toast('Remboursement modifié')} else {state.reimbursements.push({id:uid(),...data}); toast('Remboursement ajouté')} save(); show('home')}
function reimbursementLine(r){return `<article class="movement-card premium-movement movement-reimbursement premium-transfer" data-swipe-kind="reimbursement">
  <span class="movement-icon movement-icon-reimbursement" aria-hidden="true">${movementIcon('reimbursement')}</span>
  <div class="movement-body"><div class="movement-title">Remboursement</div>
  <div class="movement-subtitle">${esc(r.from||'—')} → ${esc(r.to||'—')} <span class="movement-sep">·</span> ${esc(movementDateLabel(r.date))}</div>
  <div class="movement-footer"><span class="movement-chip movement-chip-reimbursement">Virement</span></div>
  ${r.note?`<div class="movement-note">${esc(r.note)}</div>`:''}</div>
  <div class="premium-trailing"><div class="movement-amount movement-credit">+ ${money(r.amount)}</div>${movementActionButton(r,'reimbursement')}</div>
</article>`}
let movementActionContext=null;
let movementSheetHideTimer=null;
let movementTouchStart=null;
function openMovementActions(button){
  const kind=button?.dataset?.movementKind;
  const id=button?.dataset?.movementId;
  const item=kind==='expense'?state.expenses.find(e=>e.id===id):kind==='reimbursement'?state.reimbursements.find(r=>r.id===id):null;
  if(!item)return;
  clearTimeout(movementSheetHideTimer);
  movementActionContext={kind,id,origin:button};
  const sheet=document.getElementById('movementSheet');
  document.getElementById('movementSheetTitle').textContent=kind==='expense'?(item.title||item.category||'Dépense'):'Remboursement';
  document.getElementById('movementSheetSubtitle').textContent=(kind==='expense'?expenseTypeLabel(expenseType(item)):'Virement')+' · '+money(item.amount);
  sheet.hidden=false;
  document.body.classList.add('movement-sheet-open');
  requestAnimationFrame(()=>{sheet.classList.add('is-open');document.getElementById('movementEditAction')?.focus({preventScroll:true})});
}
function closeMovementActions(immediate=false){
  const sheet=document.getElementById('movementSheet');
  if(!sheet||sheet.hidden)return;
  sheet.classList.remove('is-open');
  document.body.classList.remove('movement-sheet-open');
  const origin=movementActionContext?.origin;
  movementActionContext=null;
  clearTimeout(movementSheetHideTimer);
  if(immediate||window.matchMedia('(prefers-reduced-motion: reduce)').matches){sheet.hidden=true;origin?.isConnected&&origin.focus({preventScroll:true})}
  else movementSheetHideTimer=setTimeout(()=>{if(!sheet.classList.contains('is-open'))sheet.hidden=true;origin?.isConnected&&origin.focus({preventScroll:true})},240);
}
function executeMovementAction(action){
  if(!movementActionContext)return;
  const {kind,id}=movementActionContext;
  closeMovementActions(true);
  if(action==='edit')return kind==='expense'?edit(id):editReimbursement(id);
  if(action==='delete')return kind==='expense'?del(id):delReimbursement(id);
}
// Le balayage est facultatif : le bouton Options fonctionne aussi sans geste tactile.
document.addEventListener('touchstart',event=>{
  const card=event.target.closest('.premium-movement');
  if(!card||event.target.closest('button,summary,details,a,input,select,textarea')){movementTouchStart=null;return;}
  const t=event.touches[0];if(!t)return;
  movementTouchStart={x:t.clientX,y:t.clientY,card};
},{passive:true});
document.addEventListener('touchend',event=>{
  const data=movementTouchStart;movementTouchStart=null;
  if(!data||!data.card.isConnected)return;
  const t=event.changedTouches[0];if(!t)return;
  const dx=t.clientX-data.x,dy=t.clientY-data.y;
  if(dx< -65&&Math.abs(dx)>Math.abs(dy)*1.35){
    const button=data.card.querySelector('.premium-more');
    if(button)openMovementActions(button);
  }
},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMovementActions()});
function editReimbursement(id){editingReimbursementId=id; editingId=null; view='reimburse'; render()}
function delReimbursement(id){if(!confirm('Supprimer ce remboursement ?'))return; state.reimbursements=state.reimbursements.filter(r=>r.id!==id); save(); render(); toast('Remboursement supprimé')}


function projectsView(){
  const p=editingProjectId?state.projects.find(x=>x.id===editingProjectId):null;
  layout(`<div class="card"><h2>${p?'Modifier':'Ajouter'} un projet à venir</h2><p class="muted">Cette section sert uniquement à lister les projets prévus. Ils ne modifient pas le solde entre Guillaume et Claire tant qu’ils ne sont pas saisis comme dépenses payées.</p><div class="formgrid"><div class="field"><label>Projet / catégorie</label><select id="pcategory">${categories.map(c=>`<option ${p?.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label>Emoji</label><select id="pemoji">${emojis.map(em=>`<option ${((p?.emoji)||emojiFor(p?.category))===em?'selected':''}>${em}</option>`).join('')}</select></div><div class="field"><label>Nom du projet</label><input id="ptitle" placeholder="Ex : Électricité" value="${esc(p?.title||'')}"></div><div class="field"><label>Montant estimé</label><input id="pamount" type="number" step="0.01" placeholder="0,00" value="${p?Number(p.amount||0):''}"></div></div><div class="field"><label>Remarques</label><textarea id="pnote" placeholder="Ex : devis à demander, prises à déplacer, tableau électrique…">${esc(p?.note||'')}</textarea></div><div class="actions"><button onclick="saveProject()">${p?'Enregistrer les modifications':'Ajouter le projet'}</button>${p?'<button class="secondary" onclick="show(\'projects\')">Annuler</button>':''}<button class="secondary" onclick="show('home')">Retour accueil</button></div></div><section class="card full"><div class="project-total"><div><span class="label">Total projets à venir</span><strong>${money(projectsTotal())}</strong></div><button onclick="editingProjectId=null;render()">+ Nouveau projet</button></div><h3>Liste des projets à venir</h3><div class="list">${state.projects.slice().sort((a,b)=>(a.category||'').localeCompare(b.category||'') || (a.title||'').localeCompare(b.title||'')).map(projectLine).join('')||'<p class="muted">Aucun projet à venir. Ajoute par exemple “Électricité” avec une somme estimée et des remarques.</p>'}</div></section>`);
  document.getElementById('pcategory')?.addEventListener('change',()=>{if(!editingProjectId)document.getElementById('pemoji').value=emojiFor(v('pcategory'))});
}
function projectLine(p){const emo=p.emoji||emojiFor(p.category);return `<div class="item project-line"><div class="expense-main"><div class="expense-emoji">${esc(emo)}</div><div><b>${esc(p.title||p.category||'Projet')}</b><span>${esc(p.category||'')}<br>${p.note?esc(p.note):'Aucune remarque'}</span></div></div><div class="rowactions"><div class="amount">${money(p.amount)}</div><button class="small secondary" onclick="editProject('${p.id}')">Modifier</button><button class="small danger" onclick="delProject('${p.id}')">Supprimer</button></div></div>`}
function saveProject(){const amount=num('pamount'); const data={category:v('pcategory'),emoji:v('pemoji')||emojiFor(v('pcategory')),title:v('ptitle')||v('pcategory'),amount,note:v('pnote')}; if(editingProjectId){Object.assign(state.projects.find(p=>p.id===editingProjectId),data);toast('Projet modifié')}else{state.projects.push({id:uid(),...data});toast('Projet ajouté')} save(); editingProjectId=null; show('projects')}
function editProject(id){editingProjectId=id; view='projects'; render()}
function delProject(id){if(!confirm('Supprimer ce projet à venir ?'))return; state.projects=state.projects.filter(p=>p.id!==id); save(); render(); toast('Projet supprimé')}

const docTypes=['Facture','Devis artisan','Photo','Projection IA','Plan / mesure','Autre'];
function documentsTotalSize(){return state.documents.reduce((s,d)=>s+Number(d.size||0),0)}
function prettySize(bytes){bytes=Number(bytes||0); if(bytes<1024)return bytes+' o'; if(bytes<1024*1024)return (bytes/1024).toFixed(1).replace('.',',')+' Ko'; return (bytes/1024/1024).toFixed(1).replace('.',',')+' Mo'}
function folderName(id){return (state.docFolders.find(f=>f.id===id)||{}).name||'Général'}
function documentsView(){
  const folders=state.docFolders||[];
  const q=(docSearch||'').trim().toLowerCase();
  const activeFolder=currentDocFolder?state.docFolders.find(f=>f.id===currentDocFolder):null;
  const docs=state.documents.slice().filter(d=>{
    const inFolder=!activeFolder || d.folderId===activeFolder.id;
    const text=[d.title,d.name,d.type,d.note,folderName(d.folderId),d.date].join(' ').toLowerCase();
    return inFolder && (!q || text.includes(q));
  }).sort((a,b)=>(b.created||'').localeCompare(a.created||'') || (b.date||'').localeCompare(a.date||''));
  layout(`<div class="grid"><section class="card hero"><h2>Documents</h2><p class="muted">Crée des dossiers, entre dedans et retrouve facilement tes PDF, factures, devis artisans, photos ou projections IA.</p><div class="actions"><button onclick="newFolder()">+ Nouveau dossier</button><button class="secondary" onclick="document.getElementById('docFile').click()">Importer un fichier</button><input id="docFile" type="file" class="hiddenfile" accept="image/*,.pdf,.txt,.json,.doc,.docx,.xls,.xlsx" onchange="prepareDocumentImport(this)"></div></section><div class="card metric documents-card-home"><div class="label">Documents</div><div class="value">${state.documents.length}</div><div class="submetric">${prettySize(documentsTotalSize())} stockés</div></div><div class="card metric documents-card-home"><div class="label">Dossiers</div><div class="value">${folders.length}</div><div class="submetric">clique pour ouvrir</div></div><section class="card full"><div class="documents-toolbar"><div class="field searchfield"><label>Recherche documents</label><input id="docSearch" type="search" placeholder="Rechercher une facture, un devis, une photo…" value="${esc(docSearch)}" oninput="docSearch=this.value;documentsView()"></div>${activeFolder?`<button class="secondary" onclick="currentDocFolder=null;documentsView()">← Tous les dossiers</button>`:''}</div>${activeFolder?`<div class="section-title"><h3>📁 ${esc(activeFolder.name)}</h3><span class="muted">${docs.length} fichier${docs.length>1?'s':''} dans ce dossier</span></div><div class="list">${docs.map(documentLine).join('')||'<p class="muted">Aucun fichier dans ce dossier.</p>'}</div>`:`<div class="section-title"><h3>Dossiers</h3><span class="muted">Clique sur un dossier pour voir les fichiers qu’il contient.</span></div><div class="foldergrid">${folders.map(folderCard).join('')}</div>${q?`<div class="section-title search-results-title"><h3>Résultats de recherche</h3><span class="muted">${docs.length} fichier${docs.length>1?'s':''} trouvé${docs.length>1?'s':''}</span></div><div class="list">${docs.map(documentLine).join('')||'<p class="muted">Aucun document trouvé.</p>'}</div>`:''}`}</section></div>`)
}
function folderCard(f){const count=state.documents.filter(d=>d.folderId===f.id).length;return `<div class="foldercard folder-open" onclick="openFolder('${f.id}')"><div class="foldericon">📁</div><div><b>${esc(f.name)}</b><span>${count} fichier${count>1?'s':''}</span></div><div class="rowactions"><button class="small secondary" onclick="event.stopPropagation();renameFolder('${f.id}')">Renommer</button>${f.id==='general'?'':`<button class="small danger" onclick="event.stopPropagation();deleteFolder('${f.id}')">Supprimer</button>`}</div></div>`}
function openFolder(id){currentDocFolder=id;documentsView()}
function newFolder(){const name=prompt('Nom du nouveau dossier ?'); if(!name)return; state.docFolders.push({id:uid(),name:name.trim()}); save(); render(); toast('Dossier créé')}
function renameFolder(id){const f=state.docFolders.find(x=>x.id===id); if(!f)return; const name=prompt('Nouveau nom du dossier',f.name); if(!name)return; f.name=name.trim(); save(); render(); toast('Dossier modifié')}
function deleteFolder(id){if(!confirm('Supprimer ce dossier ? Les fichiers seront déplacés dans Général.'))return; state.documents.forEach(d=>{if(d.folderId===id)d.folderId='general'}); state.docFolders=state.docFolders.filter(f=>f.id!==id); if(currentDocFolder===id)currentDocFolder=null; save(); render(); toast('Dossier supprimé')}
function prepareDocumentImport(input){const file=input.files&&input.files[0]; if(!file)return; const max=4.5*1024*1024; if(file.size>max){toast('Fichier trop lourd : max 4,5 Mo'); input.value=''; return} const reader=new FileReader(); reader.onload=()=>showDocumentImportForm(file,reader.result); reader.readAsDataURL(file)}
function showDocumentImportForm(file,dataUrl){const folders=state.docFolders||[{id:'general',name:'Général'}]; layout(`<div class="card"><h2>Importer un document</h2><p class="muted">Choisis le dossier et la nature du fichier avant de l’ajouter.</p><div class="import-preview"><div class="filebig">${file.type.startsWith('image/')?'🖼️':'📄'}</div><div><b>${esc(file.name)}</b><span>${esc(file.type||'fichier')} · ${prettySize(file.size)}</span></div></div><div class="formgrid"><div class="field"><label>Dossier</label><select id="docFolder">${folders.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></div><div class="field"><label>Nature du fichier</label><select id="docType">${docTypes.map(t=>`<option>${t}</option>`).join('')}</select></div><div class="field"><label>Nom affiché</label><input id="docTitle" value="${esc(file.name)}"></div><div class="field"><label>Date</label><input id="docDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div><div class="field"><label>Remarques</label><textarea id="docNote" placeholder="Ex : facture carrelage, devis électricité, projection cuisine…"></textarea></div><div class="actions"><button onclick="saveDocumentFromImport('${esc(dataUrl)}', '${esc(file.name)}', '${esc(file.type)}', ${Number(file.size)})">Ajouter le document</button><button class="secondary" onclick="show('documents')">Annuler</button></div></div>`)}
async function saveDocumentFromImport(dataUrl,name,mime,size){const folderId=v('docFolder')||'general'; const doc={id:uid(),folderId,type:v('docType')||'Autre',title:v('docTitle')||name,date:v('docDate'),note:v('docNote'),name,mime,size,dataUrl,created:new Date().toISOString()}; state.documents.push(doc); currentDocFolder=folderId; show('documents'); toast('Envoi du document…'); try{if(cloudSession) await uploadDocument(doc); save(); toast('Document ajouté et synchronisé')}catch(e){console.error(e);save();toast('Document ajouté localement — envoi cloud à réessayer')}}
function documentLine(d){return `<div class="item document-line"><div class="expense-main"><div class="expense-emoji">${(d.mime||'').startsWith('image/')?'🖼️':'📄'}</div><div><b>${esc(d.title||d.name)}</b><span>${esc(d.date||'')} · ${esc(folderName(d.folderId))} · ${esc(d.type||'Autre')} · ${prettySize(d.size)}${d.note?'<br>'+esc(d.note):''}</span></div></div><div class="rowactions"><button class="small secondary" onclick="openDocument('${d.id}')">Ouvrir</button><button class="small secondary" onclick="editDocument('${d.id}')">Modifier</button><button class="small danger" onclick="deleteDocument('${d.id}')">Supprimer</button></div></div>`}
async function openDocument(id){const d=state.documents.find(x=>x.id===id); if(!d)return; let url=d.dataUrl; try{if(d.storagePath&&cloudSession) url=await signedDocumentUrl(d.storagePath)}catch(e){console.error(e)} if(!url){toast('Document indisponible');return} window.open(url,'_blank')}
function editDocument(id){const d=state.documents.find(x=>x.id===id); if(!d)return; layout(`<div class="card"><h2>Modifier le document</h2><div class="formgrid"><div class="field"><label>Dossier</label><select id="docFolder">${state.docFolders.map(f=>`<option value="${f.id}" ${d.folderId===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div><div class="field"><label>Nature du fichier</label><select id="docType">${docTypes.map(t=>`<option ${d.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Nom affiché</label><input id="docTitle" value="${esc(d.title||'')}"></div><div class="field"><label>Date</label><input id="docDate" type="date" value="${esc(d.date||'')}"></div></div><div class="field"><label>Remarques</label><textarea id="docNote">${esc(d.note||'')}</textarea></div><div class="actions"><button onclick="saveDocumentEdit('${d.id}')">Enregistrer</button><button class="secondary" onclick="show('documents')">Annuler</button></div></div>`)}
function saveDocumentEdit(id){const d=state.documents.find(x=>x.id===id); if(!d)return; Object.assign(d,{folderId:v('docFolder'),type:v('docType'),title:v('docTitle'),date:v('docDate'),note:v('docNote')}); save(); show('documents'); toast('Document modifié')}
async function deleteDocument(id){if(!confirm('Supprimer ce document ?'))return; const d=state.documents.find(x=>x.id===id); if(d&&d.storagePath&&cloudSession){try{await deleteStoredDocument(d.storagePath)}catch(e){console.error(e)}} state.documents=state.documents.filter(d=>d.id!==id); save(); render(); toast('Document supprimé')}

function historyView(){layout(`<div class="card"><h2>Historique</h2><p class="muted">Toutes les dépenses et remboursements enregistrés.</p><div class="actions"><button onclick="exportData()">Exporter</button><button class="secondary" onclick="importData()">Importer</button></div><h3>Dépenses</h3><div class="list" style="margin-top:14px">${state.expenses.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(b.id).localeCompare(String(a.id))).map(expenseLine).join('')||'<p class="muted">Aucune dépense.</p>'}</div><h3>Remboursements</h3><div class="list" style="margin-top:14px">${state.reimbursements.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(b.id).localeCompare(String(a.id))).map(reimbursementLine).join('')||'<p class="muted">Aucun remboursement.</p>'}</div></div>`) }
function edit(id){editingId=id; view='add'; render()}
function del(id){if(!confirm('Supprimer cette dépense ?'))return; state.expenses=state.expenses.filter(e=>e.id!==id); save(); render(); toast('Dépense supprimée')}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='maison-50-50-depenses.json'; a.click(); URL.revokeObjectURL(a.href)}
function importData(){const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange=async()=>{try{const data=JSON.parse(await inp.files[0].text()); if(!data.expenses)throw new Error(); state={expenses:data.expenses||[],reimbursements:data.reimbursements||[],projects:data.projects||[],docFolders:data.docFolders||[{id:'general',name:'Général'}],documents:data.documents||[]}; save(); render(); toast('Import réussi')}catch(e){toast('Fichier invalide')}}; inp.click()}
function resetAll(){if(confirm('Effacer toutes les dépenses et remboursements ?')){state={expenses:[],reimbursements:[],projects:[],docFolders:[{id:'general',name:'Général'}],documents:[]}; save(); render(); toast('Données effacées')}}
// --- Synchronisation Supabase ---
const SUPABASE_URL='https://vcdztuiwethnqdubqbkf.supabase.co';
const SUPABASE_KEY='sb_publishable_rcdRN1EIjIpLR0TEZ5kW9g_uWYpdGW3';
const SESSION_KEY='maison5050_supabase_session';
let cloudSession=null, syncTimer=null;
let syncState='idle', lastSyncAt=null, syncBusy=0, pendingCloudRender=false;
function normalizedState(src){return {expenses:src?.expenses||[],reimbursements:src?.reimbursements||[],projects:src?.projects||[],docFolders:src?.docFolders||[{id:'general',name:'Général'}],documents:src?.documents||[]}}
function stateSignature(src){try{return JSON.stringify(normalizedState(src))}catch(e){return ''}}
function formIsOpen(){const root=document.getElementById('root');return !!root?.querySelector('input, textarea, select')}
function safeToRefreshUI(){return !formIsOpen() && !['add','reimburse'].includes(view)}
function syncLabel(){
  if(!navigator.onLine)return '⚠️ Hors ligne';
  if(syncState==='syncing')return '↻ Synchronisation…';
  if(syncState==='error')return '⚠️ Erreur de synchro';
  if(lastSyncAt)return '☁️ Synchronisé · '+lastSyncAt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  return '☁️ Connecté';
}
function updateSyncIndicator(){const el=document.getElementById('syncIndicator');if(!el)return;el.textContent=syncLabel();el.dataset.state=!navigator.onLine?'offline':syncState;}
function beginSync(){syncBusy++;syncState='syncing';updateSyncIndicator()}
function endSync(ok=true){syncBusy=Math.max(0,syncBusy-1);if(syncBusy===0){syncState=ok?'ok':'error';if(ok)lastSyncAt=new Date();updateSyncIndicator()}}
function ensureSyncIndicator(){const top=document.querySelector('.top');if(!top)return;let el=document.getElementById('syncIndicator');if(!el){el=document.createElement('div');el.id='syncIndicator';el.className='sync-indicator';el.setAttribute('aria-live','polite');top.appendChild(el)}updateSyncIndicator()}

function apiHeaders(extra={}){return {'apikey':SUPABASE_KEY,'Authorization':'Bearer '+cloudSession.access_token,...extra}}
function loginView(message=''){
  document.querySelector('.bottom').style.display='none';document.querySelector('.topnav').style.display='none';
  layout(`<div class="card login-card"><h2>🏠 La maison des mimis</h2><p class="muted">Connecte-toi pour retrouver les mêmes données sur Mac et iPhone.</p>${message?`<p class="sync-error">${esc(message)}</p>`:''}<div class="field"><label>E-mail</label><input id="loginEmail" type="email" autocomplete="username"></div><div class="field"><label>Mot de passe</label><input id="loginPassword" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')login()"></div><div class="actions"><button onclick="login()">Se connecter</button></div></div>`)
}
async function login(){
  const email=v('loginEmail'),password=v('loginPassword'); if(!email||!password){toast('Entre ton e-mail et ton mot de passe');return}
  try{const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})}); const j=await r.json(); if(!r.ok)throw new Error(j.error_description||j.msg||'Connexion impossible'); cloudSession=j; localStorage.setItem(SESSION_KEY,JSON.stringify(j)); await startCloud() }catch(e){loginView(e.message)}
}
async function logout(){localStorage.removeItem(SESSION_KEY);cloudSession=null;clearInterval(syncTimer);loginView('Déconnecté.')}
async function refreshSession(){
  if(!cloudSession?.refresh_token)return false;
  const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:cloudSession.refresh_token})});
  if(!r.ok)return false; cloudSession=await r.json();localStorage.setItem(SESSION_KEY,JSON.stringify(cloudSession));return true
}
function cloudState(){return {...state,documents:(state.documents||[]).map(({dataUrl,...d})=>d)}}
async function cloudFetch(){
  beginSync();
  try{
    let r=await fetch(SUPABASE_URL+'/rest/v1/app_data?id=eq.maison-50-50&select=data,updated_at',{headers:apiHeaders()});
    if(r.status===401&&await refreshSession())r=await fetch(SUPABASE_URL+'/rest/v1/app_data?id=eq.maison-50-50&select=data,updated_at',{headers:apiHeaders()});
    if(!r.ok)throw new Error('Lecture cloud impossible'); const rows=await r.json(); endSync(true); return rows[0]?.data||{}
  }catch(e){endSync(false);throw e}
}
async function cloudSave(){
  beginSync();
  try{
    const body={data:cloudState(),updated_at:new Date().toISOString()}; let r=await fetch(SUPABASE_URL+'/rest/v1/app_data?id=eq.maison-50-50',{method:'PATCH',headers:apiHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(body)});
    if(r.status===401&&await refreshSession())r=await fetch(SUPABASE_URL+'/rest/v1/app_data?id=eq.maison-50-50',{method:'PATCH',headers:apiHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(body)}); if(!r.ok)throw new Error('Sauvegarde cloud impossible'); endSync(true)
  }catch(e){endSync(false);throw e}
}
function dataUrlToBlob(dataUrl){const [h,b]=dataUrl.split(',');const mime=(h.match(/data:(.*?);/)||[])[1]||'application/octet-stream';const bin=atob(b),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}
async function uploadDocument(d){if(!d.dataUrl||d.storagePath)return; const safe=(d.name||'document').replace(/[^a-zA-Z0-9._-]/g,'_'); const path=d.id+'-'+safe; const r=await fetch(SUPABASE_URL+'/storage/v1/object/maison-documents/'+encodeURIComponent(path),{method:'POST',headers:apiHeaders({'Content-Type':d.mime||'application/octet-stream','x-upsert':'true'}),body:dataUrlToBlob(d.dataUrl)}); if(!r.ok)throw new Error('Envoi document impossible'); d.storagePath=path; delete d.dataUrl}
async function signedDocumentUrl(path){const r=await fetch(SUPABASE_URL+'/storage/v1/object/sign/maison-documents/'+encodeURIComponent(path),{method:'POST',headers:apiHeaders({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:3600})});const j=await r.json();if(!r.ok)throw new Error('Ouverture impossible');return SUPABASE_URL+'/storage/v1'+j.signedURL}
async function deleteStoredDocument(path){const r=await fetch(SUPABASE_URL+'/storage/v1/object/maison-documents/'+encodeURIComponent(path),{method:'DELETE',headers:apiHeaders()});if(!r.ok)throw new Error('Suppression cloud impossible')}
async function migrateLocalDocuments(){for(const d of state.documents||[]){if(d.dataUrl&&!d.storagePath){try{await uploadDocument(d)}catch(e){console.error(e)}}}}
async function pullCloud(){
  // Ne jamais interrompre une sauvegarde en cours : évite qu'une ancienne version cloud
  // remplace momentanément une dépense qui vient d'être ajoutée.
  if(syncBusy>0)return;
  try{
    const c=await cloudFetch();
    if(!c||!Object.keys(c).length)return;
    const next=normalizedState(c);
    // Si rien n'a changé dans Supabase, on ne reconstruit surtout pas l'interface.
    if(stateSignature(next)===stateSignature(state))return;
    state=next;
    localStorage.setItem(KEY,JSON.stringify(state));
    // Pendant une saisie, on synchronise les données en arrière-plan mais on conserve
    // intégralement le formulaire affiché (texte, montant, clavier, focus, etc.).
    if(!safeToRefreshUI()){
      pendingCloudRender=true;
      return;
    }
    pendingCloudRender=false;
    render();
  }catch(e){console.error(e)}
}
async function startCloud(){
  document.querySelector('.bottom').style.display='flex';document.querySelector('.topnav').style.display='flex';
  try{const cloud=await cloudFetch(); const local=load(); const cloudEmpty=!(cloud.expenses?.length||cloud.reimbursements?.length||cloud.projects?.length||cloud.documents?.length);
    if(cloudEmpty&&(local.expenses.length||local.reimbursements.length||local.projects.length||local.documents.length)){state=local;await migrateLocalDocuments();await cloudSave();toast('Données locales envoyées dans le cloud')}
    else if(Object.keys(cloud).length){state={expenses:cloud.expenses||[],reimbursements:cloud.reimbursements||[],projects:cloud.projects||[],docFolders:cloud.docFolders||[{id:'general',name:'Général'}],documents:cloud.documents||[]};localStorage.setItem(KEY,JSON.stringify(state))}
    render(); addCloudButton(); ensureSyncIndicator(); clearInterval(syncTimer);syncTimer=setInterval(pullCloud,60000)
  }catch(e){loginView('Connexion au cloud impossible. Vérifie la connexion internet.')}
}
function addCloudButton(){const top=document.querySelector('.top');if(!top)return;let actions=top.querySelector('.top-actions');if(!actions){actions=document.createElement('div');actions.className='top-actions';const reset=top.querySelector('button.secondary');if(reset){reset.classList.add('reset-btn');actions.appendChild(reset)}top.appendChild(actions)}if(!document.getElementById('themeToggle')){const t=document.createElement('button');t.id='themeToggle';t.className='secondary theme-toggle';t.onclick=toggleTheme;actions.appendChild(t)}if(!document.getElementById('cloudLogout')){const b=document.createElement('button');b.id='cloudLogout';b.className='secondary';b.textContent='Déconnexion';b.onclick=logout;actions.appendChild(b)}applyTheme();ensureSyncIndicator()}
async function boot(){try{cloudSession=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){} if(cloudSession){await startCloud()}else loginView()}
window.addEventListener('focus',()=>{if(cloudSession&&safeToRefreshUI())pullCloud()});
window.addEventListener('online',()=>{updateSyncIndicator();if(cloudSession)pullCloud()});
window.addEventListener('offline',updateSyncIndicator);
boot();
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}


