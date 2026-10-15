const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 69 wilayas (58 + 11 new). Main communes by wilaya; the chief town is always offered and any other commune can be typed.
const W=['أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس','عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة','أفلو','بريكة','قصر الشلالة','مسعد','عين وسارة','بوسعادة','الأبيض سيدي الشيخ','القنطرة','بئر العاتر','قصر البخاري','العريشة'];
const C={'وهران':['بئر الجير','السانية','أرزيو','عين الترك','الكرمة'],'الجزائر':['باب الزوار','الشراقة','الرويبة','بئر مراد رايس','درارية','باب الواد'],'قسنطينة':['الخروب','علي منجلي','حامة بوزيان','زيغود يوسف'],'عنابة':['البوني','الحجار','سيدي عمار'],'البليدة':['بوفاريك','العفرون','الأربعاء','موزاية'],'تيزي وزو':['أزازقة','ذراع بن خدة','عزازقة','برج منايل'],'سطيف':['العلمة','عين أرنات','عين ولمان'],'تلمسان':['مغنية','منصورة','الرمشي','ندرومة'],'بجاية':['أقبو','القصر','خراطة'],'باتنة':['عين التوتة','مروانة','تازولت'],'بومرداس':['بودواو','برج منايل','دلس'],'تيبازة':['القليعة','شرشال','حجوط'],'الوادي':['قمار','جامعة','الرباح'],'ورقلة':['حاسي مسعود','الرويسات'],'غرداية':['العطف','متليلي','بريان'],'الشلف':['تنس','بوقادير','الأصنام'],'مستغانم':['عين تادلس','حاسي ماماش'],'سيدي بلعباس':['سفيزف','ابن باديس','تلاغ']};
let me=null,tab='trips',F={fw:'',tw:''},mode='trip',chatSub=null,liveCh=null;
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3500)};
const wopts=s=>'<option value="">—</option>'+W.map(w=>`<option ${w==s?'selected':''}>${w}</option>`).join('');
function fillC(id){const w=$('#'+id+'w').value;$('#'+id+'l').innerHTML=(w?[w,...(C[w]||[])]:[]).map(c=>`<option value="${esc(c)}">`).join('')}
const route=(p,sel={})=>['from','to'].map(k=>`<label class="lb">${t(k)}</label><div class="grid grid-cols-2 gap-2"><select id="${p}${k}w" class="inp" onchange="fillC('${p}${k}')">${wopts(sel[k])}</select><input id="${p}${k}c" list="${p}${k}l" class="inp" placeholder="${t('commune')}"><datalist id="${p}${k}l"></datalist></div>`).join('');
const v=id=>($('#'+id)?.value||'').trim();
const sizeOpts=()=>['env','small','large'].map(s=>`<option value="${s}">${t(s)}</option>`).join('');
const fmt=d=>new Date(d).toLocaleString(LANG=='ar'?'ar-DZ':LANG,{dateStyle:'medium',timeStyle:'short'});
// modal + phone back button
function modal(html){$('#modal').innerHTML=`<div class="sheet">${html}</div>`;$('#modal').classList.add('open');history.pushState({m:1},'')}
function closeModal(pop){if(!$('#modal').classList.contains('open'))return;$('#modal').classList.remove('open');if(chatSub){sb.removeChannel(chatSub);chatSub=null}if(!pop)history.back()}
addEventListener('popstate',()=>closeModal(true));
// auth
function authView(){$('#nav').innerHTML='';$('#app').innerHTML=`<div class="card space-y-2"><input id="em" type="email" class="inp" dir="ltr" placeholder="${t('email')}"><input id="pw" type="password" class="inp" dir="ltr" placeholder="${t('password')}"><button class="btn" onclick="login()">${t('login')}</button><hr><input id="nm" class="inp" placeholder="${t('name')}"><input id="ph" class="inp" dir="ltr" placeholder="${t('phone')} 05/06/07…"><button class="btn2" onclick="signup()">${t('signup')}</button></div>`}
async function login(){const{error}=await sb.auth.signInWithPassword({email:v('em'),password:v('pw')});if(error)toast(error.message)}
async function signup(){if(!v('nm')||!v('ph'))return toast(t('fill'));const{error}=await sb.auth.signUp({email:v('em'),password:v('pw'),options:{data:{full_name:v('nm'),phone:v('ph')}}});toast(error?error.message:t('checkmail'))}
// shell
function shell(){$('#tag').textContent=t('tag');$('#lang').value=LANG;
$('#nav').innerHTML=[['trips','🚗'],['parcels','📦'],['add','➕'],['mine','💬'],['me','👤']].map(([k,i])=>`<button class="nv ${tab==k?'on':''}" onclick="go('${k}')"><div class="text-lg">${i}</div>${t(k)}</button>`).join('');
({trips:()=>listView('trips'),parcels:()=>listView('parcels'),add:addView,mine:mineView,me:profileView})[tab]()}
function go(k){tab=k;shell()}
function setLang(l){LANG=l;localStorage.setItem('lang',l);document.documentElement.lang=l;document.documentElement.dir=l=='ar'?'rtl':'ltr';me?shell():authView()}
// lists
async function listView(kind){
$('#app').innerHTML=`<div class="card"><div class="grid grid-cols-2 gap-2"><select id="fw" class="inp">${wopts(F.fw)}</select><select id="tw" class="inp">${wopts(F.tw)}</select></div><button class="btn mt-2" onclick="F.fw=v('fw');F.tw=v('tw');listView('${kind}')">${t('search')}</button></div><div id="ls"></div>`;
let q=sb.from(kind).select('*,profiles(full_name,verified)').order('created_at',{ascending:false}).limit(50);
q=kind=='trips'?q.eq('status','open').gte('depart_at',new Date().toISOString()):q.eq('status','pending');
if(F.fw)q=q.eq('from_wilaya',F.fw);if(F.tw)q=q.eq('to_wilaya',F.tw);
const{data,error}=await q;if(error)return toast(error.message);
$('#ls').innerHTML=data.length?data.map(r=>`<div class="card"><div class="route"><b></b>${esc(r.from_wilaya)}<small class="opacity-60">${esc(r.from_commune)}</small><i></i>${esc(r.to_wilaya)}<small class="opacity-60">${esc(r.to_commune)}</small><b></b></div>
<p class="text-sm mt-2">${kind=='trips'?`${fmt(r.depart_at)} · ${t(r.size)}`:`${esc(r.description)} · ${r.weight_kg||'?'} kg`}</p>${r.notes?`<p class="text-sm opacity-70">${esc(r.notes)}</p>`:''}
<p class="text-xs mt-1">${esc(r.profiles?.full_name)} ${r.profiles?.verified?'✅ '+t('verified'):''}</p>
${kind=='parcels'&&r.sender_id!=me.id?`<button class="btn mt-2" onclick="acceptParcel('${r.id}')">${t('accept')}</button>`:''}</div>`).join(''):`<p class="text-center opacity-70 p-6">${t('none')}</p>`}
async function acceptParcel(id){const{error}=await sb.rpc('accept_parcel',{p_parcel:id});if(error)return toast(error.message=='no_matching_trip'?t('none'):error.message);toast(t('saved'));go('mine')}
// create
function addView(){const tr=mode=='trip';
$('#app').innerHTML=`<div class="flex gap-2 mb-3"><button class="${tr?'btn':'btn2'}" onclick="mode='trip';addView()">${t('iTravel')}</button><button class="${tr?'btn2':'btn'}" onclick="mode='parcel';addView()">${t('iSend')}</button></div><div class="card">${route('a')}
${tr?`<label class="lb">${t('date')}</label><input id="dt" type="datetime-local" class="inp"><label class="lb">${t('size')}</label><select id="sz" class="inp">${sizeOpts()}</select>`:`<label class="lb">${t('desc')}</label><input id="ds" class="inp"><label class="lb">${t('weight')}</label><input id="wt" type="number" min="0" step="0.5" class="inp">`}
<label class="lb">${t('notes')}</label><input id="nt" class="inp"><button class="btn mt-3" onclick="publish()">${t('publish')}</button></div>`}
async function publish(){
const b={from_wilaya:v('afw'),from_commune:v('afc'),to_wilaya:v('atw'),to_commune:v('atc'),notes:v('nt')};
if(!b.from_wilaya||!b.to_wilaya||!b.from_commune||!b.to_commune)return toast(t('fill'));
let r;if(mode=='trip'){if(!v('dt'))return toast(t('fill'));r=await sb.from('trips').insert({...b,user_id:me.id,depart_at:new Date(v('dt')).toISOString(),size:v('sz')})}
else{if(!v('ds'))return toast(t('fill'));r=await sb.from('parcels').insert({...b,sender_id:me.id,description:v('ds'),weight_kg:+v('wt')||null})}
if(r.error)return toast(r.error.message);toast(t('saved'));
if(mode=='parcel'){F={fw:b.from_wilaya,tw:b.to_wilaya};tab='trips'}else{F={fw:'',tw:''};tab='mine'}shell()}
// my activity + chat
async function mineView(){
const[p,tr]=await Promise.all([sb.from('parcels').select('*,trips(user_id)').or(`sender_id.eq.${me.id},status.neq.pending`).order('created_at',{ascending:false}),sb.from('trips').select('*').eq('user_id',me.id).order('depart_at',{ascending:false})]);
$('#app').innerHTML=`<h3 class="font-bold mb-2">${t('parcels')}</h3>`+(p.data||[]).map(r=>{const other=r.sender_id==me.id?r.trips?.user_id:r.sender_id;return`<div class="card"><div class="route"><b></b>${esc(r.from_wilaya)}<i></i>${esc(r.to_wilaya)}<b></b></div><p class="text-sm mt-1">${esc(r.description)} · ${t(r.status)}</p>
${r.status=='accepted'?`<div class="grid grid-cols-3 gap-2 mt-2"><button class="btn" onclick="chat('${r.id}')">${t('chat')}</button><button class="btn2" onclick="phone('${other}')">${t('showPhone')}</button>${r.sender_id==me.id?`<button class="btn2" onclick="complete('${r.id}')">${t('done')}</button>`:''}</div>`:''}</div>`}).join('')
+`<h3 class="font-bold my-2">${t('trips')}</h3>`+(tr.data||[]).map(r=>`<div class="card"><div class="route"><b></b>${esc(r.from_wilaya)}<i></i>${esc(r.to_wilaya)}<b></b></div><p class="text-sm mt-1">${fmt(r.depart_at)}</p></div>`).join('')}
async function complete(id){await sb.from('parcels').update({status:'completed'}).eq('id',id);mineView()}
async function phone(id){const{data}=await sb.from('profile_private').select('phone').eq('id',id).maybeSingle();toast(data?.phone||'—')}
const addMsg=m=>{const d=document.createElement('div');d.className='m'+(m.sender_id==me.id?' me':'');d.textContent=m.body;const b=$('#msgs');if(b){b.append(d);b.scrollTop=b.scrollHeight}};
async function chat(pid){modal(`<h3 class="font-bold">${t('chat')}</h3><div id="msgs" class="msgs"></div><div class="flex gap-2"><input id="mi" class="inp" maxlength="500"><button class="btn" style="width:auto" onclick="sendMsg('${pid}')">${t('send')}</button></div>`);
const{data}=await sb.from('messages').select('*').eq('parcel_id',pid).order('created_at');(data||[]).forEach(addMsg);
chatSub=sb.channel('m'+pid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'parcel_id=eq.'+pid},p=>addMsg(p.new)).subscribe()}
async function sendMsg(pid){const body=v('mi');if(!body)return;$('#mi').value='';const{error}=await sb.from('messages').insert({parcel_id:pid,sender_id:me.id,body});if(error)toast(error.message)}
// profile + verification docs
async function profileView(){
const[{data:p},{data:pv}]=await Promise.all([sb.from('profiles').select('*').eq('id',me.id).single(),sb.from('profile_private').select('*').eq('id',me.id).single()]);
$('#app').innerHTML=`<div class="card"><p class="font-bold text-lg">${esc(p?.full_name)} ${p?.verified?'✅':''}</p><p dir="ltr" class="text-sm opacity-70">${esc(pv?.phone)} · ${esc(me.email)}</p></div>
<div class="card"><label class="lb">${t('docs')} ${pv?.id_doc_path?'✔':''}</label><input id="fl" type="file" accept="image/*,.pdf" class="inp"><button class="btn mt-2" onclick="upDoc()">${t('upload')}</button></div>
<button class="btn2" onclick="sb.auth.signOut()">${t('logout')}</button>`}
async function upDoc(){const f=$('#fl').files[0];if(!f)return toast(t('fill'));const path=`${me.id}/id_${Date.now()}`;
const u=await sb.storage.from('docs').upload(path,f);if(u.error)return toast(u.error.message);
await sb.from('profile_private').update({id_doc_path:path}).eq('id',me.id);toast(t('saved'));profileView()}
// realtime matching
function live(){if(liveCh)return;const mt=async(table,col,r)=>{const{data}=await sb.from(table).select('id').eq(col,me.id).eq('status',table=='trips'?'open':'pending').eq('from_wilaya',r.from_wilaya).eq('to_wilaya',r.to_wilaya).limit(1);if(data?.length)toast(t('match'))};
liveCh=sb.channel('live').on('postgres_changes',{event:'INSERT',schema:'public',table:'trips'},p=>p.new.user_id!=me.id&&mt('parcels','sender_id',p.new))
.on('postgres_changes',{event:'INSERT',schema:'public',table:'parcels'},p=>p.new.sender_id!=me.id&&mt('trips','user_id',p.new)).subscribe()}
sb.auth.onAuthStateChange((_,s)=>{me=s?.user||null;if(me){shell();live()}else{if(liveCh){sb.removeChannel(liveCh);liveCh=null}authView()}});
document.documentElement.dir=LANG=='ar'?'rtl':'ltr';
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
