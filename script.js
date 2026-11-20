import * as THREE from 'three';
const canvas=document.querySelector('#scene'),loading=document.querySelector('#loading');
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020611,.035);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(0,.15,innerWidth<700?14:12);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
const heartGroup=new THREE.Group();scene.add(heartGroup);
const count=innerWidth<700?4200:8000,positions=new Float32Array(count*3),targets=new Float32Array(count*3),velocities=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
for(let i=0;i<count;i++){const t=Math.random()*Math.PI*2,v=Math.random(),puff=.78+.22*Math.sin(v*Math.PI),x=16*Math.pow(Math.sin(t),3)*.19*puff,y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.19*puff,z=(Math.random()-.5)*1.95,k=i*3;targets[k]=x;targets[k+1]=y;targets[k+2]=z;positions[k]=x*(.2+Math.random()*1.5);positions[k+1]=y*(.2+Math.random()*1.5);positions[k+2]=z*(.2+Math.random()*1.5);const g=Math.random();colors[k]=.12+g*.22;colors[k+1]=.55+g*.38;colors[k+2]=.85+g*.15;sizes[i]=Math.random()}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{uTime:{value:0}},vertexShader:'attribute float aSize; varying vec3 vColor; uniform float uTime; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);float twinkle=.75+.25*sin(uTime*2.0+aSize*40.0);gl_PointSize=(1.1+aSize*2.0)*twinkle*(260.0/-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);float a=1.0-smoothstep(.12,.5,d);gl_FragColor=vec4(vColor,a*.9);}'});
heartGroup.add(new THREE.Points(geo,mat));
const platform=new THREE.Group();platform.position.y=-3.15;scene.add(platform);
for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5+i*.48,.01,6,144),new THREE.MeshBasicMaterial({color:i%2?0x087cff:0x48dfff,transparent:true,opacity:.45-i*.055}));ring.rotation.x=-Math.PI/2+i*.018;ring.position.y=i*.012;platform.add(ring)}
const light=new THREE.PointLight(0x168dff,16,8);light.position.set(0,.5,0);platform.add(light);
const starPos=new Float32Array(900*3);for(let i=0;i<900;i++){starPos[i*3]=(Math.random()-.5)*25;starPos[i*3+1]=(Math.random()-.5)*16;starPos[i*3+2]=(Math.random()-.5)*12-3}
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x4a9edb,size:.018,transparent:true,opacity:.6}));scene.add(stars);
let paused=false,exploded=false,px=0,py=0,sound=false,audio;
function tone(f){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.setValueAtTime(.03,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13)}catch(e){}}
function scatter(){if(exploded)return;exploded=true;for(let i=0;i<count;i++){const k=i*3;let x=positions[k],y=positions[k+1],z=positions[k+2],n=Math.hypot(x,y,z)||1,f=1.3+Math.random()*3;velocities[k]=x/n*f+(Math.random()-.5);velocities[k+1]=y/n*f+(Math.random()-.5);velocities[k+2]=z/n*f+(Math.random()-.5)}if(sound)tone(520)}
function reform(){exploded=false;if(sound)tone(760)}
canvas.addEventListener('pointermove',e=>{px=(e.clientX/innerWidth-.5)*.5;py=(e.clientY/innerHeight-.5)*.25});
canvas.addEventListener('pointerdown',()=>exploded?reform():scatter());
document.querySelector('#explodeBtn').onclick=()=>exploded?reform():scatter();
document.querySelector('#pauseBtn').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'▶ RESUME':'Ⅱ PAUSE'};
document.querySelector('#soundBtn').onclick=e=>{sound=!sound;e.currentTarget.textContent=sound?'♪ SOUND ON':'♪ SOUND OFF';if(sound)tone(660)};
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);if(paused)return;const t=clock.getElapsedTime();mat.uniforms.uTime.value=t;heartGroup.scale.setScalar(1+Math.sin(t*2.2)*.025);heartGroup.rotation.y+=(px*.55+Math.sin(t*.22)*.12-heartGroup.rotation.y)*.025;heartGroup.rotation.x+=(-py*.35-heartGroup.rotation.x)*.025;heartGroup.position.y=.15+Math.sin(t*.8)*.07;const a=geo.attributes.position.array;for(let i=0;i<count;i++){const k=i*3;if(exploded){a[k]+=velocities[k]*.018;a[k+1]+=velocities[k+1]*.018;a[k+2]+=velocities[k+2]*.018;velocities[k]*=.986;velocities[k+1]*=.986;velocities[k+2]*=.986;a[k]*=.999;a[k+1]*=.999;a[k+2]*=.999}else{a[k]+=(targets[k]-a[k])*.045;a[k+1]+=(targets[k+1]-a[k+1])*.045;a[k+2]+=(targets[k+2]-a[k+2])*.045}}geo.attributes.position.needsUpdate=true;platform.children.forEach((r,i)=>r.rotation.z=t*(i%2?.08:-.06));stars.rotation.y=t*.006;renderer.render(scene,camera)}
animate();setTimeout(()=>loading.classList.add('done'),500);
function resize(){camera.aspect=innerWidth/innerHeight;camera.position.z=innerWidth<700?14:12;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight)}
addEventListener('resize',resize,{passive:true});