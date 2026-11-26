window.MOCK_PROJS=[{key:'NOVA',name:'Chiplet System'}];
window.MOCK_USERS=[];
window.OPTS={
projectimpact:[],
riskcategory:['None','Financial and Cost','Human and Resource','Legal, Regulatory and Compliance','Market and Customer','Operational and Manufacturing','Partnership and Collaboration','Quality and Security','Supply Chain and Vendor','Technical'],
treatment:['None','Avoid','Mitigate','Transfer','Accept/Ignore','Share','Enhance','Exploit'],
preimpact:['0 - Unspecified','1 - Insignificant Threat','2 - Minor Threat','3 - Moderate Threat','4 - Major Threat','5 - Catastrophic Threat'],
preprobability:['0 - Unspecified','1 - Rare','2 - Unlikely','3 - Possible','4 - Likely','5 - Very likely']
};
window.SEV_META={Critical:{c:'#DE350B',bg:'#FFEBE6'},High:{c:'#FF991F',bg:'#FFF0B3'},Medium:{c:'#0052CC',bg:'#DEEBFF'},Low:{c:'#006644',bg:'#E3FCEF'},Unrated:{c:'#42526E',bg:'#DFE1E6'}};
window.eH=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
window.ini=function(n){var p=String(n||'U').trim().split(' ');return((p[0]&&p[0][0]||'')+(p[1]&&p[1][0]||'')).toUpperCase()||'U';};
window.numLv=function(v){var n=parseInt(String(v||'0')[0],10);return isNaN(n)?0:n;};
window.calcSev=function(p,i){
var pn=window.numLv(p),in0=window.numLv(i),sc=pn*in0;
if(!pn&&!in0)return'Unrated';
return(sc>=16||in0===5)?'Critical':((sc>=9||pn>=4||in0>=4)?'High':((sc>=4||pn>=2||in0>=2)?'Medium':'Low'));
};
window.sevBadge=function(p,i){
var sv=window.calcSev(p,i),m=window.SEV_META[sv]||window.SEV_META.Unrated,pn=window.numLv(p),in0=window.numLv(i);
return'<span class="bdg" style="background:'+m.bg+';color:'+m.c+'">Pre-Sev: '+sv+(pn||in0?' (P'+pn+'×I'+in0+'='+(pn*in0)+')':'')+'</span>';
};
window.missingFields=function(b){
var m=[];
if(!b.sum.trim())m.push('Summary');
if(!b.rc.trim())m.push('Root Cause');
if(!b.eff.trim())m.push('Effect');
if(!b.pImp.trim()||b.pImp==='None')m.push('Project Impact');
if(!b.asg.trim())m.push('Assignee');
return m;
};
window.isValid=function(b){return!window.missingFields(b).length;};
window.toP=function(t){return{type:'doc',version:1,content:[{type:'paragraph',content:[{type:'text',text:String(t||'')}]}]};};
window.selH=function(idx,f,lbl,arr,val,req){
var esc=window.eH;
return'<div><label class="lbl">'+lbl+(req?' <span class="req">*</span>':'')+'</label><select class="sel f-ch" data-i="'+idx+'" data-f="'+f+'">'+arr.map(function(v){return'<option value="'+esc(v)+'"'+(val===v?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select></div>';
};
window.inpH=function(idx,f,lbl,val,ph,req){
var esc=window.eH;
return'<div><label class="lbl">'+lbl+(req?' <span class="req">*</span>':'')+'</label><input class="inp f-in" data-i="'+idx+'" data-f="'+f+'" value="'+esc(val)+'" placeholder="'+esc(ph)+'"/></div>';
};
window.rHist=function(hist){
if(!hist.length)return'';
var esc=window.eH,h='<div class="box" style="border-color:#00875A;margin-top:6px"><div class="box-h" style="background:#E3FCEF;padding:4px 10px"><strong style="color:#006644">📋 Registered Risk Tickets on This Page ('+hist.length+')</strong></div>';
h+='<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#F4F5F7;color:#42526E;text-align:left;border-bottom:1px solid #DFE1E6"><th style="padding:5px 8px;width:125px">Ticket ID</th><th style="padding:5px 8px">Summarize</th><th style="padding:5px 8px;width:180px">Owner</th></tr></thead><tbody>';
hist.forEach(function(it){
h+='<tr style="border-bottom:1px solid #DFE1E6"><td style="padding:5px 8px"><a href="https://chiplet-system.atlassian.net/browse/'+esc(it.key)+'" target="_blank" class="bdg" style="background:#DEEBFF;color:#0052CC;text-decoration:none">🔗 '+esc(it.key)+'</a></td><td style="padding:5px 8px;font-weight:600">'+esc(it.sum)+'</td><td style="padding:5px 8px;color:#42526E">👤 '+esc(it.own||'Unassigned')+'</td></tr>';
});
return h+'</tbody></table></div>';
};
window.normK=function(nm){
return String(nm||'').toLowerCase().replace('custom field','').replace(/[^a-z0-9]/g,'');
};
window.applyFields=function(arr,CF){
var list=Array.isArray(arr)?arr:Object.keys(arr||{}).map(function(k){var o=arr[k]||{};o.fieldId=o.fieldId||k;return o;});
list.forEach(function(fd){
if(fd&&fd.name){
var fId=fd.fieldId||fd.key||fd.id,k=window.normK(fd.name);
var av=(fd.allowedValues||[]).map(function(v){return String(v.value||v.name||v.label||'').trim();}).filter(Boolean);
var tp=(fd.schema&&fd.schema.type)||'',itp=(fd.schema&&fd.schema.items)||'';
if(!CF[k]||(av.length&&(!CF[k].opts||!CF[k].opts.length)))CF[k]={id:fId,tp:tp,itp:itp,opts:(CF[k]&&CF[k].opts)||[]};
if(av.length){
if(k!=='projectimpact'&&av.indexOf('None')<0&&!av[0].match(/^[0-9]/))av.unshift('None');
CF[k].opts=av;CF[k].id=fId;
}
}
});
};
window.setCF=function(CF,flds,nm,val,isSel){
var f=CF[nm];if(!f||!val||val==='None'||val==='0 - Unspecified')return;
if(f.tp==='array')flds[f.id]=(f.itp==='option'||isSel)?[{value:val}]:[val];
else if(isSel||(f.opts&&f.opts.length)||(f.tp&&f.tp.indexOf('option')>=0))flds[f.id]={value:val};
else flds[f.id]=val;
};
window.syncHeight=function(){
var h=Math.max(54,document.body.scrollHeight+36);
if(window.iFrameId)window.parent.postMessage('[iFrameSizer]'+window.iFrameId+':'+h+':1100:size','*');
};
window.addEventListener('message',function(e){
if(typeof e.data==='string'&&e.data.indexOf('[iFrameSizer]')===0){
window.iFrameId=e.data.slice(13).split(':')[0];
window.syncHeight();
}
});
