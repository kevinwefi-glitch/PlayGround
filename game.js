import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101919);
scene.fog = new THREE.FogExp2(0x101919, 0.023);
const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clock = new THREE.Clock();
const mats = {};
const mat = (name, color, roughness = 1, extra = {}) => mats[name] ||= new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const groundMat = mat('ground', 0x18201c), roadMat = mat('road', 0x292d28), barkMat = mat('bark', 0x292b24), leafMat = mat('leaf', 0x19231e), leafLightMat = mat('leafLight', 0x273128), rustMat = mat('rust', 0x493a2b), concreteMat = mat('concrete', 0x41443d), darkMat = mat('dark', 0x111817), metalMat = mat('metal', 0x687066, .68, { metalness: .48 }), glowMat = mat('glow', 0xd4ef76, .28, { emissive: 0x8eaa34, emissiveIntensity: 1.7 }), skinMat = mat('skin', 0x7d7770), coatMat = mat('coat', 0x343b35), zombieMat = mat('zombie', 0x526054), redMat = mat('red', 0x8c3328, .6, { emissive: 0x3e0b07 });
const hemi = new THREE.HemisphereLight(0x91a59a, 0x10110e, 1.2); scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9baea5, 1.25); moon.position.set(-12, 24, 8); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -32; moon.shadow.camera.right = 32; moon.shadow.camera.top = 35; moon.shadow.camera.bottom = -35; scene.add(moon);
const fill = new THREE.PointLight(0x84998e, 1.1, 24); scene.add(fill);
const flashlight = new THREE.SpotLight(0xdce9c8, 24, 28, Math.PI / 7, .55, 1.3); flashlight.castShadow = false; scene.add(flashlight, flashlight.target);

function box(parent, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = options.cast ?? true; mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh); return mesh;
}
function sphere(parent, radius, position, material, scale = [1,1,1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), material); mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function cylinder(parent, rt, rb, h, position, material, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

// Mud road and the dark forest corridor.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -.12; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 130), roadMat); road.rotation.x = -Math.PI / 2; road.position.set(0, -.09, -43); road.receiveShadow = true; scene.add(road);
for (let i=0;i<34;i++) {
  const z = 11 - i * 3.65;
  const dash = new THREE.Mesh(new THREE.BoxGeometry(.06, .012, .35), mat('roadmark'+i, 0x625e4d)); dash.position.set((i%2 ? 1 : -1)*3.2, -.075, z); scene.add(dash);
}
// Gravel clumps along the verges.
for(let i=0;i<210;i++){
  const side = Math.random()<.5?-1:1, z=-92+Math.random()*111, x=side*(5+Math.random()*24);
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.15+Math.random()*.55,0), i%3?barkMat:concreteMat);
  rock.position.set(x,-.02,z); rock.scale.y=.35+Math.random()*.55; rock.rotation.set(Math.random(),Math.random()*3,Math.random()); rock.castShadow=true; scene.add(rock);
}
function makeTree(x,z,scale=1){
  const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(scale); scene.add(g);
  cylinder(g,.22,.38,4,[0,2,0],barkMat,7);
  const crownCount=3+Math.floor(Math.random()*2);
  for(let n=0;n<crownCount;n++){
    const c=new THREE.Mesh(new THREE.ConeGeometry(1.7-n*.16,3.8,7),n%2?leafMat:leafLightMat);
    c.position.set((Math.random()-.5)*.4,3.7+n*1.05,(Math.random()-.5)*.3); c.rotation.y=Math.random()*2; c.castShadow=true; g.add(c);
  }
  if(Math.random()<.24){const branch=cylinder(g,.07,.13,2.1,[.65,2.7,0],barkMat,6); branch.rotation.z=-.9;}
}
for(let i=0;i<54;i++){
 const z=8-Math.random()*105, side=i%2?-1:1;
 makeTree(side*(7+Math.random()*17),z,.75+Math.random()*.95);
}
// Dead branch silhouettes and roadside debris.
for(let i=0;i<20;i++){
 const x=(Math.random()<.5?-1:1)*(5.2+Math.random()*4),z=-Math.random()*85;
 const limb=cylinder(scene,.05,.11,2.4,[x,.28,z],barkMat,5); limb.rotation.z=Math.random()*1.8-0.9; limb.rotation.x=Math.random()*.5;
}

// Abandoned roadside clinic, seen through the fog.
const clinic=new THREE.Group(); clinic.position.set(11,0,-55); scene.add(clinic);
box(clinic,[8,5.4,6],[0,2.7,0],concreteMat);
box(clinic,[8.2,.35,6.2],[0,5.45,0],darkMat);
box(clinic,[8.3,.28,6.4],[0,5.7,0],rustMat);
for(let i=-1;i<=1;i++){
 box(clinic,[1.15,1.65,.14],[i*2.35,3.4,3.06],darkMat);
 box(clinic,[.88,1.38,.05],[i*2.35,3.4,3.15],mat('window'+i,0x25332f,.3,{emissive:0x101c19}));
 box(clinic,[1.3,.1,.18],[i*2.35,3.4,3.22],rustMat);
}
box(clinic,[2.1,2.5,.18],[0,1.25,3.1],darkMat);
box(clinic,[1.45,.42,.3],[0,5.92,3.2],rustMat);
const sign=box(clinic,[3.2,.55,.12],[0,4.8,3.2],redMat);
box(clinic,[.8,.12,.13],[0,4.8,3.3],mat('signLine',0xc9c6a9));

// Gate at the end of the road.
const gate = new THREE.Group(); gate.position.set(0,0,-79); scene.add(gate);
for(const x of [-4.6,4.6]){
 box(gate,[.45,7,.55],[x,3.5,0],rustMat);
 box(gate,[.72,.45,.82],[x,7.05,0],metalMat);
}
box(gate,[9.5,.48,.65],[0,6.9,0],rustMat);
const gateDoor=new THREE.Group(); gate.add(gateDoor);
for(let i=0;i<13;i++){
 box(gateDoor,[.17,5.2,.22],[-4.25+i*.71,2.65,0],metalMat);
}
for(const y of [1,4.3]) box(gateDoor,[9.1,.22,.27],[0,y,0],rustMat);
box(gate,[1.7,.3,.2],[0,7.5,0],darkMat);
const gateLamp=new THREE.PointLight(0xd8bd79,2,12); gateLamp.position.set(0,7.9,.4); gate.add(gateLamp);

// The player is a small, readable third-person survivor silhouette.
const player = new THREE.Group(); scene.add(player); player.position.set(0,0,8);
const body = new THREE.Group(); player.add(body);
const torso=box(body,[.72,1.05,.42],[0,1.3,0],coatMat); torso.castShadow=true;
sphere(body,.29,[0,2.05,0],skinMat,[.88,1.05,.9]);
// hood/cap and tiny face details
sphere(body,.32,[0,2.24,-.02],darkMat,[1,.48,1]);
box(body,[.32,.08,.08],[0,2.03,-.27],mat('face',0xb6ab8e));
const armL=box(body,[.22,.8,.24],[-.53,1.32,-.02],coatMat), armR=box(body,[.22,.8,.24],[.53,1.32,-.02],coatMat);
armL.rotation.z=-.13; armR.rotation.z=.2;
const legL=box(body,[.22,.72,.24],[-.23,.42,0],darkMat), legR=box(body,[.22,.72,.24],[.23,.42,0],darkMat);
box(body,[.12,.16,.28],[.48,1.24,-.26],metalMat);
const gun=box(body,[.12,.14,.56],[.53,1.45,-.58],metalMat); gun.rotation.x=-.06;
// Keep limb references for the simple walking animation.

// Fuel cells use a bright, pulsing cage so they're easy to spot.
const pickups=[];
function makeCell(x,z,index){
 const g=new THREE.Group(); g.position.set(x,.12,z); scene.add(g);
 const core=new THREE.Mesh(new THREE.BoxGeometry(.35,.52,.28),glowMat); core.position.y=.55; g.add(core);
 for(const sx of [-.25,.25]) box(g,[.07,.75,.07],[sx,.52,0],metalMat);
 for(const sy of [.2,.88]) box(g,[.56,.07,.12],[0,sy,0],metalMat);
 const halo=new THREE.PointLight(0xbde568,1.8,6); halo.position.y=.8; g.add(halo);
 const loop=new THREE.Mesh(new THREE.TorusGeometry(.48,.025,5,18),mat('cellRing'+index,0xc0e56d,.4,{emissive:0x607a22,emissiveIntensity:.7})); loop.rotation.x=Math.PI/2; loop.position.y=.06; g.add(loop);
 pickups.push({group:g,halo,active:true,index});
}
makeCell(-3.2,-13,1); makeCell(3.1,-37,2); makeCell(-2.2,-61,3);

// Stalker enemy, built from simple primitives but animated in silhouette.
const enemy=new THREE.Group(); enemy.position.set(.9,0,-26); scene.add(enemy);
const enemyBody=new THREE.Group(); enemy.add(enemyBody);
const enemyTorso=box(enemyBody,[.9,1.35,.48],[0,1.45,0],zombieMat);
const enemyHead=sphere(enemyBody,.38,[0,2.48,-.01],skinMat,[.92,1.12,.88]);
sphere(enemyBody,.405,[0,2.65,-.04],mat('rottedHair',0x252b27),[1,.57,.97]);
box(enemyBody,[.28,.07,.08],[0,2.45,-.34],redMat);
const eArmL=box(enemyBody,[.27,1.18,.27],[-.67,1.49,-.02],zombieMat),eArmR=box(enemyBody,[.27,1.18,.27],[.67,1.49,-.02],zombieMat);
eArmL.rotation.z=-.4;eArmR.rotation.z=.38;
box(enemyBody,[.27,.95,.29],[-.27,.48,0],darkMat);box(enemyBody,[.27,.95,.29],[.27,.48,0],darkMat);
const enemyLight=new THREE.PointLight(0x5e1911,.8,4); enemyLight.position.set(0,2.3,-.4); enemy.add(enemyLight);
let enemyHealth=6, enemyDead=false, enemyStagger=0, enemyAttack=0;

// Atmospheric drifting particles.
const dustCount=380, dustGeo=new THREE.BufferGeometry(), dustPos=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){dustPos[i*3]=(Math.random()-.5)*45;dustPos[i*3+1]=Math.random()*8;dustPos[i*3+2]=-95+Math.random()*110;}
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xb8c3a5,size:.055,transparent:true,opacity:.32,depthWrite:false}));scene.add(dust);

// Runtime state and browser audio.
const state={running:false,won:false,health:100,ammo:12,reserve:48,cells:0,light:100,flashOn:true,reloading:false,gateOpen:false,elapsed:0,fireCooldown:0,interactTime:0};
let audioCtx=null, soundOn=true, lastMessageTimer=0;
function audio(type){
 if(!soundOn)return;
 try{
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const now=audioCtx.currentTime, osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
  osc.connect(gain);gain.connect(audioCtx.destination);
  if(type==='shot'){osc.type='square';osc.frequency.setValueAtTime(130,now);osc.frequency.exponentialRampToValueAtTime(45,now+.12);gain.gain.setValueAtTime(.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+.14);osc.start(now);osc.stop(now+.15)}
  else if(type==='pickup'){osc.type='sine';osc.frequency.setValueAtTime(530,now);osc.frequency.exponentialRampToValueAtTime(940,now+.18);gain.gain.setValueAtTime(.07,now);gain.gain.exponentialRampToValueAtTime(.001,now+.35);osc.start(now);osc.stop(now+.36)}
  else if(type==='hit'){osc.type='sawtooth';osc.frequency.setValueAtTime(88,now);osc.frequency.exponentialRampToValueAtTime(38,now+.28);gain.gain.setValueAtTime(.11,now);gain.gain.exponentialRampToValueAtTime(.001,now+.3);osc.start(now);osc.stop(now+.31)}
  else if(type==='reload'){osc.type='triangle';osc.frequency.setValueAtTime(360,now);osc.frequency.setValueAtTime(210,now+.11);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);osc.start(now);osc.stop(now+.23)}
  else if(type==='win'){osc.type='sine';osc.frequency.setValueAtTime(440,now);osc.frequency.setValueAtTime(660,now+.18);gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.7);osc.start(now);osc.stop(now+.72)}
 }catch(e){}
}

const $=s=>document.querySelector(s);
const titleScreen=$('#title-screen'), endScreen=$('#end-screen'), hud=$('#hud'), touchControls=$('#touch-controls');
const mobile=matchMedia('(pointer:coarse)').matches || innerWidth<760;
const touchDevice=mobile || navigator.maxTouchPoints>0;
if(mobile)$('#interact-prompt').textContent='TAP TO OPEN GATE';
const keys=new Set();
let moveTouch={x:0,y:0}, pointerDown=false, aimYaw=0, aimPitch=0, joyPointer=null;
const yawForward=()=>new THREE.Vector3(Math.sin(aimYaw),0,-Math.cos(aimYaw));
function showToast(text,duration=1700){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(lastMessageTimer);lastMessageTimer=setTimeout(()=>t.classList.remove('show'),duration)}
function centerMessage(text,duration=1800){const el=$('#center-message');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),duration)}
function updateHud(){
 $('#health-value').textContent=`${Math.max(0,Math.ceil(state.health))}%`;$('#health-meter').style.width=`${Math.max(0,state.health)}%`;
 $('#ammo-value').textContent=state.ammo;$('#cell-count').textContent=state.cells;
 $('#flash-meter').style.width=`${Math.max(0,state.light)}%`;$('#flash-value').textContent=`${Math.ceil(state.light)}%`;
 $('#objective').textContent=state.cells<3?'RESTORE THE GATE':'REACH THE GATE';
 $('#objective-sub').textContent=state.cells<3?`Find ${3-state.cells} more power cell${3-state.cells===1?'':'s'} in the woods`:'Gate power restored — head to the north road';
}
function startGame(){
 if(state.running)return;
 titleScreen.classList.remove('visible');titleScreen.classList.add('hidden');endScreen.classList.add('hidden');hud.classList.remove('hidden');if(touchDevice)touchControls.classList.remove('hidden');
 state.running=true;state.elapsed=0;clock.start();audio('reload');showToast('RADIO: CELLS ARE MARKED BY THEIR LIGHT',2400);canvas.focus?.();
}
function endGame(won){
 if(!state.running)return;
 state.running=false;state.won=won;hud.classList.add('hidden');touchControls.classList.add('hidden');
 $('#end-kicker').textContent=won?'EXTRACTION CONFIRMED':'SIGNAL LOST';$('#end-title').textContent=won?'YOU MADE IT.':'OVERRUN.';
 $('#end-copy').textContent=won?'The gate groans shut behind you. Dawn is still hours away.':'The forest swallows the last of your signal.';
 $('#end-stats').textContent=`CELLS RECOVERED: ${state.cells}/3  ·  AMMO LEFT: ${state.ammo}`;
 endScreen.classList.remove('hidden');requestAnimationFrame(()=>endScreen.classList.add('visible'));audio(won?'win':'hit');
}
function resetGame(){
 state.running=false;state.health=100;state.ammo=12;state.reserve=48;state.cells=0;state.light=100;state.flashOn=true;state.reloading=false;state.gateOpen=false;state.elapsed=0;state.fireCooldown=0;state.interactTime=0;
 player.position.set(0,0,8);player.rotation.y=0;enemy.position.set(.9,0,-26);enemyHealth=6;enemyDead=false;enemyStagger=0;enemyAttack=0;enemy.visible=true;gateDoor.rotation.y=0;
 pickups.forEach(p=>{p.active=true;p.group.visible=true});aimYaw=0;aimPitch=0;$('#reload-label').textContent='9MM · SEMI';$('#interact-prompt').classList.add('hidden');
 endScreen.classList.remove('visible');endScreen.classList.add('hidden');titleScreen.classList.remove('hidden');requestAnimationFrame(()=>titleScreen.classList.add('visible'));
 updateHud();touchControls.classList.add('hidden');
}
function reload(){if(!state.running||state.reloading||state.ammo>=12||state.reserve<=0)return;state.reloading=true;$('#reload-label').textContent='RELOADING';audio('reload');setTimeout(()=>{if(!state.reloading)return;const amount=Math.min(12-state.ammo,state.reserve);state.ammo+=amount;state.reserve-=amount;state.reloading=false;$('#reload-label').textContent=`9MM · ${state.reserve} RES`;updateHud()},950)}
const raycaster=new THREE.Raycaster();
function shoot(){
 if(!state.running||state.fireCooldown>0||state.reloading)return;
 if(state.ammo<=0){showToast('EMPTY — RELOAD',650);return}
 state.fireCooldown=.23;state.ammo--;audio('shot');updateHud();
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 if(!enemyDead){const hits=raycaster.intersectObject(enemy,true);if(hits.length&&hits[0].distance<45){enemyHealth--;enemyStagger=.3;enemyBody.rotation.x=.15;showToast(enemyHealth<=0?'STALKER DOWN':'TARGET HIT',500);if(enemyHealth<=0){enemyDead=true;enemy.visible=false;centerMessage('THE WOODS GO QUIET… FOR NOW',1700)}}}
}
function interact(){
 if(!state.running||state.gateOpen)return;
 if(state.cells<3){showToast('GATE POWER INCOMPLETE',850);return}
 const d=player.position.distanceTo(gate.position);
 if(d>5.5){showToast('MOVE CLOSER TO THE GATE',850);return}
 state.gateOpen=true;gateDoor.rotation.y=.72;audio('win');setTimeout(()=>endGame(true),650);
}
$('#start-button').addEventListener('click',startGame);$('#restart-button').addEventListener('click',resetGame);$('#interact-prompt').addEventListener('click',interact);
$('#touch-fire').addEventListener('pointerdown',e=>{e.preventDefault();shoot()});$('#touch-reload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});
$('#touch-light').addEventListener('pointerdown',e=>{e.preventDefault();state.flashOn=!state.flashOn;$('#touch-light').classList.toggle('active',state.flashOn);showToast(state.flashOn?'FLASHLIGHT ON':'FLASHLIGHT OFF',600)});
$('#sound-button').addEventListener('click',()=>{soundOn=!soundOn;$('#sound-button').innerHTML=`${soundOn?'♫':'×'} <span>SOUND ${soundOn?'ON':'OFF'}</span>`});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.key===' '||e.key.toLowerCase()==='f')shoot();if(e.key.toLowerCase()==='r')reload();if(e.key.toLowerCase()==='e')interact();if(e.key.toLowerCase()==='q')state.flashOn=!state.flashOn});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown',e=>{if(!state.running||touchDevice)return;pointerDown=true;shoot()});
window.addEventListener('pointerup',()=>pointerDown=false);
canvas.addEventListener('pointermove',e=>{if(!state.running||touchDevice||e.pointerType!=='mouse')return;if(pointerDown){aimYaw-=e.movementX*.003;aimPitch=THREE.MathUtils.clamp(aimPitch-e.movementY*.0015,-.17,.18)}});
// Touch joystick is deliberately independent of the shooting buttons.
const joystick=$('#joystick'),knob=$('#joy-knob');
joystick.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);updateJoy(e)});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e)});
function updateJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}moveTouch={x:dx/max,y:dy/max};knob.style.transform=`translate(${dx}px,${dy}px)`}
function endJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;moveTouch={x:0,y:0};knob.style.transform='translate(0,0)'}
joystick.addEventListener('pointerup',endJoy);joystick.addEventListener('pointercancel',endJoy);

function damage(amount){
 state.health=Math.max(0,state.health-amount);updateHud();const f=$('#damage-flash');f.style.background='rgba(185,25,15,.34)';setTimeout(()=>f.style.background='rgba(190,20,12,0)',130);audio('hit');
 if(state.health<=0)endGame(false);
}
function update(dt,time){
 if(!state.running)return;
 state.elapsed+=dt;state.fireCooldown=Math.max(0,state.fireCooldown-dt);
 const forwardInput=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-moveTouch.y;
 const sideInput=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+moveTouch.x;
 const len=Math.hypot(forwardInput,sideInput), fwd=yawForward(), right=new THREE.Vector3(Math.cos(aimYaw),0,Math.sin(aimYaw));
 if(len>.08){const dx=(fwd.x*forwardInput+right.x*sideInput)/Math.max(1,len),dz=(fwd.z*forwardInput+right.z*sideInput)/Math.max(1,len);player.position.x=THREE.MathUtils.clamp(player.position.x+dx*4.25*dt,-4.9,4.9);player.position.z=THREE.MathUtils.clamp(player.position.z+dz*4.25*dt,-75,10);if(!touchDevice)player.rotation.y=Math.atan2(dx,-dz);body.position.y=Math.abs(Math.sin(time*10))*.055;legL.rotation.x=Math.sin(time*10)*.36;legR.rotation.x=-Math.sin(time*10)*.36;armL.rotation.x=-Math.sin(time*10)*.22;armR.rotation.x=Math.sin(time*10)*.22;
 }else{body.position.y=0;legL.rotation.x*=.8;legR.rotation.x*=.8;armL.rotation.x*=.8;armR.rotation.x*=.8;}
 const camPos=new THREE.Vector3(player.position.x-Math.sin(aimYaw)*7.4,player.position.y+4.15+aimPitch*5,player.position.z+Math.cos(aimYaw)*7.4);
 camera.position.lerp(camPos,1-Math.pow(.0008,dt));
 const look=new THREE.Vector3(player.position.x+Math.sin(aimYaw)*.4,player.position.y+1.35+aimPitch*2,player.position.z-Math.cos(aimYaw)*4.7);camera.lookAt(look);
 const head=new THREE.Vector3(player.position.x,player.position.y+1.72,player.position.z);const lightDir=new THREE.Vector3(Math.sin(aimYaw),-.08,-Math.cos(aimYaw));
 flashlight.position.copy(head);flashlight.target.position.copy(head).add(lightDir.multiplyScalar(18));flashlight.intensity=state.flashOn&&state.light>0?24:0;
 fill.position.set(player.position.x+1,3,player.position.z-1);
 if(state.flashOn&&state.light>0)state.light=Math.max(0,state.light-.34*dt);else state.light=Math.min(100,state.light+.62*dt);
 if(Math.floor(state.elapsed*3)%3===0&&Math.random()<.05)updateHud();
 pickups.forEach(p=>{if(!p.active)return;p.group.rotation.y+=dt*.7;p.group.position.y=.12+Math.sin(time*2.1+p.index)*.09;p.halo.intensity=1.5+Math.sin(time*4+p.index)*.45;if(player.position.distanceTo(p.group.position)<1.55){p.active=false;p.group.visible=false;state.cells++;state.reserve=Math.min(60,state.reserve+12);audio('pickup');updateHud();showToast(`POWER CELL RECOVERED  ·  ${state.cells}/3`,1800);if(state.cells===3)centerMessage('GATE CIRCUIT RESTORED — KEEP MOVING',2400)}});
 if(!enemyDead){
  const toPlayer=new THREE.Vector3(player.position.x-enemy.position.x,0,player.position.z-enemy.position.z),dist=toPlayer.length();
  if(dist>1.55){toPlayer.normalize();enemy.position.addScaledVector(toPlayer,1.22*dt);enemy.rotation.y=Math.atan2(toPlayer.x,-toPlayer.z);enemyBody.position.y=Math.abs(Math.sin(time*7))*.08;enemyBody.rotation.x=enemyStagger>0?.15:Math.sin(time*3)*.035;}
  else{enemyBody.position.y=0;enemyAttack-=dt;if(enemyAttack<=0){enemyAttack=1.25;damage(11)}}
  enemyStagger=Math.max(0,enemyStagger-dt);
 }
 const nearGate=player.position.distanceTo(gate.position)<5.5;
 $('#interact-prompt').classList.toggle('hidden',!(nearGate&&state.cells===3));
 if(nearGate&&state.cells===3&&keys.has('e')){state.interactTime+=dt;if(state.interactTime>.45)interact()}else state.interactTime=0;
 // A little environmental sway and crawling motes keep the scene alive.
 dust.rotation.y=Math.sin(time*.06)*.06;
}

function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;update(dt,time);renderer.render(scene,camera)}
render();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setSize(innerWidth,innerHeight)});
