(function(){
var projs=[],curP='NOVA',issTypes=['Risk','Task','Bug','Story'],itMap={},curT='Risk',esc=window.eH,CF={},users=[],uOpen=-1,uTimer=null;
var pageId='local-page',hist=[],boxes=[],statusMsg='v2.7 Ready',posting=false;
function gOpt(k){return(CF[k]&&CF[k].opts&&CF[k].opts.length)?CF[k].opts:(window.OPTS[k]||[]);}
function newBox(){
return{id:Date.now()+Math.random(),sum:'',rc:'',eff:'',pImp:gOpt('projectimpact')[0]||'',asg:'',asgId:'',cat:gOpt('riskcategory')[0]||'None',trt:gOpt('treatment')[0]||'None',tPlan:'',preI:gOpt('preimpact')[0]||'0 - Unspecified',preP:gOpt('preprobability')[0]||'0 - Unspecified',openOpt:true,err:''};
}
function hasB(){return!!(window.__bridge&&window.__bridge.callBridge);}
function lsKey(){return'conf_risk_hist_'+pageId;}
function saveLocal(){try{localStorage.setItem(lsKey(),JSON.stringify(hist));}catch(e){}}
function loadLocal(){try{var s=localStorage.getItem(lsKey());if(s)hist=JSON.parse(s)||[];}catch(e){}}
async function reqJ(p,o){
var m=(o&&o.method)||'GET',i={method:m,headers:[['X-Atlassian-Token','no-check'],['Accept','application/json'],['Content-Type','application/json']]};
if(o&&o.body)i.body=o.body;
var r=await window.__bridge.callBridge('fetchProduct',{product:'jira',provider:'jira',restPath:p,fetchRequestInit:i});
var st=(r&&r.status)||200,bs=(r&&typeof r.body==='string')?r.body:JSON.stringify((r&&r.body)||{});
return{status:st,ok:st>=200&&st<300,json:async function(){return JSON.parse(bs);}};
}
function on(s,f){document.querySelectorAll(s).forEach(function(el){el.onclick=f;});}
function renderUserList(idx){
var el=document.getElementById('udd-'+idx);if(!el)return;
var q=String((boxes[idx]&&boxes[idx].asg)||'').toLowerCase().trim();
var flt=users.filter(function(u){
var nm=String(u.displayName||'').toLowerCase(),em=String(u.emailAddress||'').toLowerCase();
return!q||nm.indexOf(q)>=0||em.indexOf(q)>=0;
}).slice(0,15);
if(!flt.length){
el.innerHTML='<div class="u-it" style="color:#42526E">Type colleague name/email...</div>';
}else{
el.innerHTML=flt.map(function(u){
var nm=u.displayName||u.emailAddress||u.accountId,em=u.emailAddress?(' ('+u.emailAddress+')'):'';
return'<div class="u-it" data-i="'+idx+'" data-id="'+esc(u.accountId)+'" data-nm="'+esc(nm)+'"><span class="bdg" style="background:#0052CC;color:#FFF">'+esc(window.ini(nm))+'</span><div><strong>'+esc(nm)+'</strong><span style="color:#42526E;font-size:11px">'+esc(em)+'</span></div></div>';
}).join('');
}
el.querySelectorAll('.u-it[data-id]').forEach(function(it){
it.onmousedown=function(e){
e.preventDefault();
var i=Number(it.getAttribute('data-i'));
boxes[i].asg=it.getAttribute('data-nm');
boxes[i].asgId=it.getAttribute('data-id');
if(boxes[i].err&&window.isValid(boxes[i]))boxes[i].err='';
uOpen=-1;render();
};
});
window.syncHeight();
}
function render(){
var root=document.getElementById('root');if(!root)return;
var selH=window.selH,inpH=window.inpH,piOpts=gOpt('projectimpact');
var h='<div class="bar"><div class="flts"><button id="add-box" class="btn">➕ Register New Risk</button>';
h+='<span>Project:</span><select id="prj-sel" class="sel" style="width:auto">';
projs.forEach(function(p){h+='<option value="'+esc(p.key)+'"'+(curP===p.key?' selected':'')+'>'+esc(p.key)+'</option>';});
h+='</select><span>Type:</span><select id="ty-sel" class="sel" style="width:auto">';
issTypes.forEach(function(t){h+='<option value="'+esc(t)+'"'+(curT===t?' selected':'')+'>'+esc(t)+'</option>';});
h+='</select><span class="bdg" style="background:#DEEBFF;color:#0052CC">'+esc(statusMsg)+'</span></div>';
h+='<div class="flts">';
if(boxes.length>1)h+='<button id="post-all" class="btn btn-s"'+(posting?' disabled':'')+'>🚀 Post All ('+boxes.length+')</button>';
h+='<button id="ref-hist" class="btn btn-g">↻ ('+hist.length+')</button></div></div>';
h+=window.rHist(hist);
boxes.forEach(function(b,idx){
h+='<div class="box" style="border-color:'+(b.err?'#DE350B':'#DFE1E6')+'">';
h+='<div class="box-h"><div class="flts"><strong>🛡 New Risk Draft #'+(idx+1)+'</strong>'+window.sevBadge(b.preP,b.preI);
if(b.err)h+='<span class="bdg" style="background:#FFEBE6;color:#DE350B">⚠ Missing Mandatory: '+esc(b.err)+'</span>';
h+='</div><div class="flts">';
h+='<button class="btn btn-g b-opt" data-i="'+idx+'">'+(b.openOpt?'▾ Hide Optional':'▸ Show Optional')+'</button>';
h+='<button class="btn btn-s b-post" data-i="'+idx+'"'+(posting?' disabled':'')+'>🚀 Post Risk Ticket</button>';
h+='<button class="btn btn-g b-del" data-i="'+idx+'">✕</button></div></div>';
h+='<div class="sec-m"><div style="font-size:11px;font-weight:700;color:#DE350B">AREA 1 — MANDATORY INFORMATION (*)</div>';
h+='<div class="grd" style="grid-template-columns:2fr 1fr">'+inpH(idx,'sum','Summary',b.sum,'Summary...',1);
h+='<div style="position:relative"><label class="lbl">Assignee <span class="req">*</span>'+(b.asgId?' <span style="color:#00875A;font-weight:700">✓ Jira User</span>':'')+'</label>';
h+='<input class="inp u-inp" id="uinp-'+idx+'" data-i="'+idx+'" value="'+esc(b.asg)+'" autocomplete="off" placeholder="Search colleague..."/>';
if(uOpen===idx)h+='<div class="u-dd" id="udd-'+idx+'"></div>';
h+='</div></div>';
h+='<div class="grd">'+inpH(idx,'rc','Root Cause',b.rc,'Root cause...',1)+inpH(idx,'eff','Effect',b.eff,'Effect...',1)+(piOpts.length?selH(idx,'pImp','Project Impact',piOpts,b.pImp,1):inpH(idx,'pImp','Project Impact',b.pImp,'Project Impact...',1))+'</div></div>';
if(b.openOpt){
h+='<div class="sec-o"><div style="font-size:11px;font-weight:700;color:#0052CC">AREA 2 — OPTIONAL INFORMATION</div>';
h+='<div class="grd">'+selH(idx,'cat','Risk Category',gOpt('riskcategory'),b.cat,0)+selH(idx,'trt','Treatment',gOpt('treatment'),b.trt,0)+selH(idx,'preI','Pre-Impact',gOpt('preimpact'),b.preI,0)+selH(idx,'preP','Pre-Probability',gOpt('preprobability'),b.preP,0)+'</div>';
h+='<div style="margin-top:6px">'+inpH(idx,'tPlan','Treatment Plan',b.tPlan,'Treatment plan...',0)+'</div></div>';
}
h+='</div>';
});
root.innerHTML=h;
if(uOpen>=0)renderUserList(uOpen);
window.syncHeight();
var ps=document.getElementById('prj-sel');if(ps)ps.onchange=function(e){curP=e.target.value;loadProjectMeta(curP);loadProjectUsers(curP,'');};
var ts=document.getElementById('ty-sel');if(ts)ts.onchange=function(e){curT=e.target.value;loadTypeFields(curP,curT);};
on('#add-box',function(){boxes.push(newBox());statusMsg='Drafts: '+boxes.length;render();});
on('#ref-hist',function(){loadProjectMeta(curP);loadPageHistory();});
on('.b-opt',function(e){var i=Number(e.target.getAttribute('data-i'));boxes[i].openOpt=!boxes[i].openOpt;render();});
on('.b-del',function(e){var i=Number(e.target.getAttribute('data-i'));boxes.splice(i,1);uOpen=-1;statusMsg='Drafts: '+boxes.length;render();});
document.querySelectorAll('.f-in').forEach(function(el){
el.oninput=function(e){
var i=Number(e.target.getAttribute('data-i')),f=e.target.getAttribute('data-f');
boxes[i][f]=e.target.value;
if(boxes[i].err&&window.isValid(boxes[i])){boxes[i].err='';render();}
};
});
document.querySelectorAll('.u-inp').forEach(function(el){
var i=Number(el.getAttribute('data-i'));
el.onfocus=el.onclick=function(e){if(e.stopPropagation)e.stopPropagation();if(uOpen!==i){uOpen=i;render();var inpEl=document.getElementById('uinp-'+i);if(inpEl)inpEl.focus();}};
el.oninput=function(e){
boxes[i].asg=e.target.value;boxes[i].asgId='';uOpen=i;renderUserList(i);
if(uTimer)clearTimeout(uTimer);
var q=e.target.value.trim();
uTimer=setTimeout(function(){loadProjectUsers(curP,q,i);},200);
};
});
document.querySelectorAll('.f-ch').forEach(function(el){
el.onchange=function(e){
var i=Number(e.target.getAttribute('data-i'));
boxes[i][e.target.getAttribute('data-f')]=e.target.value;
if(boxes[i].err&&window.isValid(boxes[i]))boxes[i].err='';
render();
};
});
on('.b-post',async function(e){await postBoxes([boxes[Number(e.target.getAttribute('data-i'))]]);});
on('#post-all',async function(){await postBoxes(boxes.slice());});
}
document.addEventListener('click',function(e){
if(uOpen>=0&&!e.target.closest('.u-inp')&&!e.target.closest('.u-dd')){uOpen=-1;render();}
});
function mergeUsers(arr){
(arr||[]).forEach(function(u){
if(u&&u.accountId&&u.accountType!=='app'&&!users.some(function(x){return x.accountId===u.accountId;}))users.push(u);
});
}
async function loadTypeFields(pk,tName){
if(!hasB())return;
var tid=itMap[tName];
try{
if(tid){
for(var st=0;st<100;st+=50){
var fR=await reqJ('/rest/api/3/issue/createmeta/'+encodeURIComponent(pk||'NOVA')+'/issuetypes/'+encodeURIComponent(tid)+'?startAt='+st+'&maxResults=50');
if(!fR.ok)break;
var fd=await fR.json(),arr=fd.fields||fd.values||[];
window.applyFields(arr,CF);
if(arr.length<50)break;
}
}
var sR=await reqJ('/rest/api/3/search/jql',{method:'POST',body:JSON.stringify({jql:'project="'+(pk||'NOVA')+'"',maxResults:1,fields:['summary']})});
if(sR.ok){
var sd=await sR.json(),ik=sd&&sd.issues&&sd.issues[0]&&sd.issues[0].key;
if(ik){
var eR=await reqJ('/rest/api/3/issue/'+ik+'/editmeta');
if(eR.ok){var ed=await eR.json();if(ed&&ed.fields)window.applyFields(ed.fields,CF);}
}
}
}catch(e){}
boxes.forEach(function(b){if(!b.pImp)b.pImp=gOpt('projectimpact')[0]||'';});
render();
}
async function loadProjectMeta(pk){
if(!hasB())return;
try{
var r=await reqJ('/rest/api/3/issue/createmeta/'+encodeURIComponent(pk||'NOVA')+'/issuetypes');
if(r.ok){
var d=await r.json(),arr=d.issueTypes||d.values||[];
if(arr.length){
itMap={};issTypes=[];
arr.forEach(function(t){if(t&&t.name&&!t.subtask){issTypes.push(t.name);itMap[t.name]=t.id;}});
if(issTypes.indexOf(curT)<0)curT=issTypes.indexOf('Risk')>=0?'Risk':issTypes[0];
}
}
await loadTypeFields(pk,curT);
}catch(e){}
render();
}
async function loadProjectUsers(pk,q,openIdx){
if(!hasB()){users=window.MOCK_USERS;if(openIdx!=null)renderUserList(openIdx);return;}
try{
var eq=encodeURIComponent(q||'');
var u1=await reqJ('/rest/api/3/user/assignable/search?project='+encodeURIComponent(pk||'NOVA')+'&query='+eq+'&maxResults=50');
if(u1.ok)mergeUsers(await u1.json());
var u2=await reqJ('/rest/api/3/user/search?query='+eq+'&maxResults=50');
if(u2.ok)mergeUsers(await u2.json());
}catch(e){}
if(openIdx!=null)renderUserList(openIdx);
}
async function loadPageHistory(){
loadLocal();render();
if(!hasB())return;
try{
var r=await reqJ('/rest/api/3/search/jql',{method:'POST',body:JSON.stringify({jql:'labels="conf-page-'+pageId+'" ORDER BY created ASC',maxResults:100,fields:['summary','assignee']})});
if(r.ok){
var d=await r.json(),arr=(d&&d.issues)||[];
if(arr.length){
hist=arr.map(function(x){var f=x.fields||{};return{key:x.key,sum:f.summary||x.key,own:(f.assignee&&f.assignee.displayName)||'Unassigned'};});
saveLocal();render();
}
}
}catch(e){}
}
async function resolveUser(b){
if(b.asgId)return b.asgId;
var q=String(b.asg||'').trim().toLowerCase();
var m=users.find(function(u){return String(u.displayName||'').toLowerCase()===q||String(u.emailAddress||'').toLowerCase()===q;});
return m?m.accountId:null;
}
async function createIssueSmart(baseFlds,cfFlds){
var f1=Object.assign({},baseFlds,cfFlds);
var r=await reqJ('/rest/api/3/issue',{method:'POST',body:JSON.stringify({fields:f1})});
if(!r.ok){
var errObj=await r.json(),errs=(errObj&&errObj.errors)||{};
Object.keys(errs).forEach(function(k){
if(String(errs[k]).indexOf('Atlassian Document')>=0&&typeof f1[k]==='string')f1[k]=window.toP(f1[k]);
else delete f1[k];
});
r=await reqJ('/rest/api/3/issue',{method:'POST',body:JSON.stringify({fields:f1})});
}
if(!r.ok){
if(baseFlds.issuetype.name!=='Task')baseFlds.issuetype={name:'Task'};
r=await reqJ('/rest/api/3/issue',{method:'POST',body:JSON.stringify({fields:baseFlds})});
}
return r;
}
async function postBoxes(list){
var inv=false;
list.forEach(function(b){var m=window.missingFields(b);b.err=m.join(', ');if(m.length)inv=true;});
if(inv){statusMsg='Fill all 5 Mandatory fields (*)!';render();return;}
posting=true;statusMsg='Posting '+list.length+' ticket(s)...';render();
var cnt=0;
for(var i=0;i<list.length;i++){
var b=list[i],nk=curP+'-'+Math.floor(300+Math.random()*600);
if(hasB()){
try{
var baseFlds={project:{key:curP},summary:b.sum,issuetype:{name:curT},labels:['confluence-risk','conf-page-'+pageId]};
var accId=await resolveUser(b);
if(accId)baseFlds.assignee={accountId:accId};
var cfFlds={},sC=window.setCF;
sC(CF,cfFlds,'rootcause',b.rc,0);
sC(CF,cfFlds,'effect',b.eff,0);
sC(CF,cfFlds,'projectimpact',b.pImp,1);
sC(CF,cfFlds,'treatmentplan',b.tPlan,0);
sC(CF,cfFlds,'riskcategory',b.cat,1);
sC(CF,cfFlds,'treatment',b.trt,1);
sC(CF,cfFlds,'preimpact',b.preI,1);
sC(CF,cfFlds,'preprobability',b.preP,1);
var r=await createIssueSmart(baseFlds,cfFlds);
if(r.ok){var jd=await r.json();if(jd&&jd.key)nk=jd.key;}
}catch(e){}
}
hist.push({key:nk,sum:b.sum,own:b.asg});
saveLocal();
var idx=boxes.indexOf(b);
if(idx>=0)boxes.splice(idx,1);
cnt++;
}
posting=false;statusMsg='Posted '+cnt+' ticket(s)!';render();
}
async function init(){
loadLocal();render();
for(var i=0;i<12&&!hasB();i++)await new Promise(function(r){setTimeout(r,100);});
if(!hasB()){projs=window.MOCK_PROJS;users=window.MOCK_USERS;statusMsg='v2.7 Preview';render();return;}
try{
var ctx=await window.__bridge.callBridge('getContext');
var cid=(ctx&&ctx.extension&&ctx.extension.content&&ctx.extension.content.id)||(ctx&&ctx.extension&&ctx.extension.space&&ctx.extension.space.key)||'global';
pageId=String(cid).replace(/[^a-zA-Z0-9_-]/g,'');
await loadPageHistory();
var pR=await reqJ('/rest/api/3/project');
if(pR.ok){projs=(await pR.json())||[];if(projs[0])curP=projs[0].key;}
var fR=await reqJ('/rest/api/3/field');
if(fR.ok){
((await fR.json())||[]).forEach(function(f){
if(f&&f.custom&&f.name){
var k=window.normK(f.name),tp=(f.schema&&f.schema.type)||'';
if(!CF[k]||tp.indexOf('option')>=0||tp==='array')CF[k]={id:f.id,tp:tp,itp:(f.schema&&f.schema.items)||'',opts:[]};
}
});
}
await loadProjectMeta(curP);
await loadProjectUsers(curP,'');
var piF=CF.projectimpact||{};
statusMsg='v2.7 ('+curP+' | PI:'+(piF.id||'none')+'['+gOpt('projectimpact').length+'])';
}catch(e){}
render();
}
init();
})();
