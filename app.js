const $ = s => document.querySelector(s);
const card=$('.upload-card'), token=$('#file'), arc=$('#arc'), trajectory=$('#trajectory'), hoop=$('.hoop'), hint=$('#hint');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let busy=false, dragging=false, moved=false, origin=null, current=null, sound=false, audio, queued=[], count=0, records=[], db=null, libraryURLs=[], hideTimer;
const shotPalette=[['#7060d4','#e8e3fb'],['#258b78','#dcefe8'],['#d47b36','#f8e7d9'],['#4388c9','#e0edf9'],['#c36187','#f7e2eb'],['#a18a31','#f3edcf']];
let shotColorIndex=-1;
let spawnPoint=null;
function nextShotColor(){const choices=shotPalette.map((_,i)=>i).filter(i=>i!==shotColorIndex);shotColorIndex=choices[Math.floor(Math.random()*choices.length)];const [color,soft]=shotPalette[shotColorIndex];card.style.setProperty('--shot-color',color);card.style.setProperty('--shot-soft',soft);}
const home=()=>spawnPoint??{x:61,y:455};
function randomSpawn(){
 const minX=28,maxX=Math.max(minX,card.clientWidth-86),minY=410,maxY=Math.max(minY,card.clientHeight-135);
 let p;
 for(let i=0;i<20;i++){
  p={x:minX+Math.random()*(maxX-minX),y:minY+Math.random()*(maxY-minY)};
  if(!spawnPoint||Math.hypot(p.x-spawnPoint.x,p.y-spawnPoint.y)>=80)break;
 }
 if(spawnPoint&&Math.hypot(p.x-spawnPoint.x,p.y-spawnPoint.y)<80){
  p.x=spawnPoint.x<(minX+maxX)/2?maxX:minX;
 }
 spawnPoint=p;
 return p;
}
const target=()=>({x:card.clientWidth/2,y:316});
function position(p,rotate=12,scale=1){token.style.left=`${p.x}px`;token.style.top=`${p.y}px`;token.style.transform=`rotate(${rotate}deg) scale(${scale})`;}
function reset(){if(shotColorIndex<0)nextShotColor();position(randomSpawn());token.style.opacity=1;token.disabled=false;trajectory.classList.remove('active');hint.textContent='Grab the file. Make your shot.';}
function drawArc(p){const t=target(),sx=p.x+28,sy=p.y+30;arc.setAttribute('d',`M ${sx} ${sy} Q ${sx-35} ${Math.min(sy,t.y)-310} ${t.x} ${t.y}`);$('#aim').setAttribute('cx',t.x);$('#aim').setAttribute('cy',t.y);trajectory.classList.add('active');}
function tone(){window.BasketballAudio?.cue('score');}
$('#sound').onclick=async()=>{
 const button=$('#sound');button.disabled=true;
 try{sound=await window.BasketballAudio.toggle();button.setAttribute('aria-pressed',String(sound));button.setAttribute('aria-label',sound?'关闭音乐和投篮音效':'开启音乐和投篮音效');button.title=sound?'关闭音乐和投篮音效':'开启音乐和投篮音效';}
 catch{hint.textContent='声音暂时无法开启，请再点一次音效按钮。';}
 finally{button.disabled=false;}
};
function particles(){if(reduced)return;const t=target();for(let i=0;i<14;i++){const p=document.createElement('i');p.className='particle';p.style.left=t.x+'px';p.style.top=t.y+'px';p.style.background=[...shotPalette[shotColorIndex],'#e8d591'][i%3];$('#particles').append(p);p.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*160}px,${Math.random()*65-60}px) rotate(${Math.random()*250}deg)`,opacity:0}],{duration:650,easing:'ease-out'}).onfinish=()=>p.remove();}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function shoot(file,start=home()){
 if(busy){queued.push(file);return;}busy=true;window.BasketballAudio?.cue('throw');token.disabled=true;clearTimeout(hideTimer);$('#library').hidden=true;$('#browse').style.opacity=0;hint.textContent='Nice shot. Here it goes…';trajectory.classList.remove('active');
 const t=target(),sx=start.x+28,sy=start.y+30,cx=sx-35,cy=Math.min(sy,t.y)-310;const duration=reduced?1:780;
 await new Promise(resolve=>{let began;function frame(now){began??=now;const u=Math.min((now-began)/duration,1),v=1-u;position({x:v*v*sx+2*v*u*cx+u*u*t.x-28,y:v*v*sy+2*v*u*cy+u*u*t.y-30},12+u*330,1-u*.55);if(u<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
 nextShotColor();hoop.classList.remove('swish');void hoop.offsetWidth;hoop.classList.add('swish');tone();particles();
 await token.animate([{opacity:1,transform:'scale(.45)'},{opacity:0,transform:'translateY(60px) scale(.2)'}],{duration:reduced?1:180,fill:'forwards'}).finished;token.getAnimations().forEach(a=>a.cancel());token.style.opacity=0;
 await saveFile(file);await wait(reduced?0:250);busy=false;reset();if(queued.length){shoot(queued.shift());}else{hint.textContent='Nothing but net. Take another shot.';hideTimer=setTimeout(()=>{$('#progress-list').replaceChildren();$('#browse').style.opacity=1;},3000);}
}
function demo(){return new File(['Basketball Upload\n\nNothing but net!\nThis is a demo file saved locally in your browser.'], 'document.txt',{type:'text/plain'});}
token.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;dragging=true;moved=false;origin={x:e.clientX,y:e.clientY};current={x:parseFloat(token.style.left)||home().x,y:parseFloat(token.style.top)||home().y};token.setPointerCapture(e.pointerId);token.classList.add('dragging');hint.textContent='Release to shoot!';drawArc(current);});
token.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y;moved ||= Math.hypot(dx,dy)>4;current={x:Math.max(5,Math.min(card.clientWidth-61,current.x+dx)),y:Math.max(95,Math.min(card.clientHeight-90,current.y+dy))};origin={x:e.clientX,y:e.clientY};position(current,-dx*.5);drawArc(current);});
token.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;token.classList.remove('dragging');shoot(demo(),current);});
token.addEventListener('pointercancel',()=>{dragging=false;token.classList.remove('dragging');reset();});
token.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!busy){e.preventDefault();shoot(demo());}});
$('#reset').onclick=()=>{if(!busy){nextShotColor();reset();}};$('#browse').onclick=()=>$('#file-input').click();
$('#file-input').onchange=e=>{enqueue(e.target.files);e.target.value='';};
function enqueue(files){for(const file of files){if(file.size>100*1024*1024){hint.textContent='文件过大，请选择 100 MB 以内的文件。';continue;}shoot(file);}}
let dragDepth=0;card.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;$('#drop-zone').classList.add('dragover');});card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});card.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('#drop-zone').classList.remove('dragover');}});card.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('#drop-zone').classList.remove('dragover');enqueue(e.dataTransfer.files);});window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
const ready=new Promise(resolve=>{try{const req=indexedDB.open('basketball-files',1);req.onupgradeneeded=()=>req.result.createObjectStore('files',{keyPath:'id'});req.onsuccess=()=>{db=req.result;const q=db.transaction('files').objectStore('files').getAll();q.onsuccess=()=>{records=q.result;updateCount();resolve();};q.onerror=()=>resolve();};req.onerror=()=>resolve();}catch{resolve();}});
function updateCount(){count=records.length;$('#count').textContent=count;}
async function saveFile(file){await ready;const row=document.createElement('div');row.className='progress-item';row.innerHTML='<div class="progress-top"><span class="mini-type">FILE</span><span class="progress-name"></span><span class="progress-percent">0%</span></div><div class="progress-track"><div class="progress-bar"></div></div><div class="progress-note">Preparing local file…</div>';row.querySelector('.progress-name').textContent=file.name;$('#progress-list').replaceChildren(row);row.querySelector('.progress-bar').style.width='25%';row.querySelector('.progress-percent').textContent='25%';await wait(reduced?0:220);
 const record={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,name:file.name,size:file.size,file,created:Date.now()};let persisted=false;
 if(db){try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});persisted=true;}catch{}}
 records.push(record);updateCount();row.querySelector('.progress-bar').style.width='100%';row.querySelector('.progress-percent').textContent='Done';row.querySelector('.progress-note').textContent=persisted?'Saved in this browser · Local upload complete':'Saved for this session only · Storage unavailable';row.classList.add('complete');$('#uploads').classList.add('flash');setTimeout(()=>$('#uploads').classList.remove('flash'),800);
}
async function showLibrary(){await ready;libraryURLs.forEach(URL.revokeObjectURL);libraryURLs=[];$('#library-list').replaceChildren();if(!records.length){const p=document.createElement('p');p.textContent='还没有文件。拖动小文件试投，或点击投放区选择文件。';$('#library-list').append(p);}for(const r of [...records].reverse()){const row=document.createElement('div');row.className='saved-row';const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=r.name;meta.textContent=`${r.size<1024?r.size+' B':(r.size/1024).toFixed(1)+' KB'} · ${new Date(r.created).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;info.append(name,meta);const a=document.createElement('a');a.textContent='下载';a.href=URL.createObjectURL(r.file);libraryURLs.push(a.href);a.download=r.name;const del=document.createElement('button');del.textContent='删除';del.setAttribute('aria-label','删除 '+r.name);del.onclick=async()=>{try{if(db)await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(r.id);tx.oncomplete=resolve;tx.onerror=reject;});records=records.filter(x=>x.id!==r.id);updateCount();showLibrary();}catch{hint.textContent='删除失败，请重试。';}};row.append(info,a,del);$('#library-list').append(row);}$('#library').hidden=false;$('#close-library').focus();}
$('#uploads').onclick=showLibrary;$('#close-library').onclick=()=>{$('#library').hidden=true;$('#uploads').focus();};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#library').hidden=true;$('#uploads').focus();}});window.addEventListener('resize',()=>{if(!busy&&!dragging)reset();});reset();
