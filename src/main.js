import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfeaec);
scene.fog = new THREE.Fog(0xdfeaec, 38, 76);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 120);
camera.position.set(22, 29, 27);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 10;
controls.maxDistance = 52;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xfff5dc, 0x607b83, 2.35));
const sun = new THREE.DirectionalLight(0xfff0c9, 4.5);
sun.position.set(-20, 30, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
scene.add(sun);

const C = { navy:0x172033, gold:0xb99542, cream:0xf6f0e4, wall:0xfffcf5, room:0xcde6f7, toilet:0xe7d9fa, support:0xd7f1e8, community:0xd8f2dd, office:0xffead3, utility:0xe6eaed, terrace:0xffdedb, corridor:0xe5e9ed, wood:0xb88a59, darkWood:0x765238, red:0xf1464d };
const mat = (color, roughness=.82, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const M = { wall:mat(C.wall), outerWall:mat(0xe7e4dc,.72), room:mat(C.room), toilet:mat(C.toilet), support:mat(C.support), community:mat(C.community), office:mat(C.office), utility:mat(C.utility), terrace:mat(C.terrace), corridor:mat(C.corridor), wood:mat(C.wood), darkWood:mat(C.darkWood), navy:mat(C.navy) };

function box(name, size, position, material, parent=scene) {
  const architectural=/wall|floor|slab|deck|glass|rail|screen|vent|line/.test(name);
  const radius=Math.min(.075,Math.min(...size)*.16);
  const geometry=architectural||radius<.012
    ? new THREE.BoxGeometry(...size)
    : new RoundedBoxGeometry(size[0],size[1],size[2],3,radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function labelTexture(text, color='#172033') {
  const el = document.createElement('canvas'); el.width=512; el.height=160;
  const ctx=el.getContext('2d'); ctx.fillStyle='rgba(255,255,255,.88)'; ctx.roundRect(18,24,476,112,28); ctx.fill();
  ctx.fillStyle=color; ctx.font='700 48px "Noto Sans KR",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,256,82);
  const texture=new THREE.CanvasTexture(el); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}
function addLabel(text,x,z,width=3.2,color) {
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.3125),new THREE.MeshBasicMaterial({map:labelTexture(text,color),transparent:true,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2; mesh.position.set(x,.43,z); scene.add(mesh);
}
function addRoom({name,x,z,w,d,material,label=name,labelWidth=3.1,color}) {
  const floor=box(`${name}-floor`,[w-.12,.16,d-.12],[x,.15,z],material); floor.userData.room=name;
  const h=.55;
  box(`${name}-n`,[w,h,.12],[x,h/2+.22,z-d/2],M.wall); box(`${name}-s`,[w,h,.12],[x,h/2+.22,z+d/2],M.wall);
  box(`${name}-w`,[.12,h,d],[x-w/2,h/2+.22,z],M.wall); box(`${name}-e`,[.12,h,d],[x+w/2,h/2+.22,z],M.wall);
  return floor;
}
function addOpenZone({name,x,z,w,d,material,label=name,labelWidth=3.1,color}) {
  const floor=box(`${name}-floor`,[w-.12,.1,d-.12],[x,.12,z],material);
  floor.userData.room=name;
  return floor;
}

const ground=new THREE.Mesh(new THREE.CircleGeometry(48,96),mat(0xaec3a7)); ground.rotation.x=-Math.PI/2; ground.position.y=-.2; ground.receiveShadow=true; scene.add(ground);
box('building-slab',[34,.35,19.5],[0,-.02,0],mat(C.cream));

// 제공된 중간집 평면도의 상대 배치를 옮긴 개방형 3D 평면
addRoom({name:'중간집1',x:-13.7,z:-6.3,w:5.4,d:5.4,material:M.room,color:'#0878ba'});
addRoom({name:'화장실-1',x:-9.65,z:-6.3,w:2.45,d:5.4,material:M.toilet,labelWidth:2.2,color:'#8b31bb'});
addRoom({name:'중간집2',x:-5.55,z:-6.3,w:5.5,d:5.4,material:M.room,color:'#0878ba'});
addRoom({name:'화장실(여)',x:-1.45,z:-7.35,w:2.45,d:3.15,material:M.toilet,labelWidth:2.2,color:'#8b31bb'});
addRoom({name:'화장실(남)',x:-1.45,z:-4.05,w:2.45,d:3.15,material:M.toilet,labelWidth:2.2,color:'#8b31bb'});
addRoom({name:'보일러실',x:.55,z:-7.7,w:1.35,d:2.4,material:M.utility,labelWidth:1.4});
addOpenZone({name:'현관',x:3.25,z:-6.3,w:3.1,d:5.4,material:mat(0xffedb8),labelWidth:2.1,color:'#db7600'});
addRoom({name:'돌봄인력공간',x:6.9,z:-6.3,w:3.9,d:5.4,material:M.support,labelWidth:3.1,color:'#087d65'});
addRoom({name:'주방',x:10.35,z:-6.3,w:2.8,d:5.4,material:mat(0xffe4e2),labelWidth:2,color:'#df3434'});
addRoom({name:'창고',x:13.45,z:-7.15,w:2.7,d:3.7,material:M.utility,labelWidth:1.8});
addRoom({name:'린넨실',x:13.45,z:-4.1,w:2.7,d:1.95,material:M.utility,labelWidth:1.7});
addRoom({name:'방풍실',x:-15.1,z:-.4,w:2.55,d:2.35,material:M.utility,labelWidth:1.7});
addOpenZone({name:'복도',x:-6.2,z:-.4,w:15.1,d:2.35,material:M.corridor,labelWidth:2.2});
addRoom({name:'간호사실',x:13.45,z:-1.2,w:2.7,d:2.55,material:M.office,labelWidth:2,color:'#d96013'});
addRoom({name:'중간집3',x:-13.7,z:4.25,w:5.4,d:5.4,material:M.room,color:'#0878ba'});
addRoom({name:'화장실-2',x:-9.65,z:4.25,w:2.45,d:5.4,material:M.toilet,labelWidth:2.2,color:'#8b31bb'});
addRoom({name:'중간집4',x:-5.55,z:4.25,w:5.5,d:5.4,material:M.room,color:'#0878ba'});
addRoom({name:'작업치료실',x:-1.25,z:4.25,w:2.8,d:5.4,material:M.support,labelWidth:2.4,color:'#087d65'});
addOpenZone({name:'커뮤니티실',x:3.85,z:3.1,w:7.2,d:7.7,material:M.community,labelWidth:3.3,color:'#1c9448'});
addRoom({name:'사무공간',x:11.9,z:4.25,w:5.8,d:5.4,material:M.office,labelWidth:2.6,color:'#d96013'});
addOpenZone({name:'테라스-좌',x:-7.55,z:8.15,w:16.1,d:1.45,material:M.terrace,label:'테라스',labelWidth:2.2,color:'#e85c5c'});
addOpenZone({name:'테라스-우',x:11.9,z:8.15,w:5.8,d:1.45,material:M.terrace,label:'테라스',labelWidth:2.2,color:'#e85c5c'});

// 천장이 열린 미니어처 구조에서는 전등 모형보다 방 전체의 색온도와 밝기로 조명 상태를 표현한다.
// 켜짐은 따뜻한 면광원과 아이보리빛 바닥광, 꺼짐은 은은한 청회색 음영으로 구분한다.
const roomLights=new Map();
function addRoomLighting(key,x,z,w,d,isOn){
  const group=new THREE.Group(); group.name=`${key}-lighting`; group.userData.isOn=isOn;
  const overlayMaterial=new THREE.MeshBasicMaterial({
    color:isOn?0xffd77a:0x34445b,
    transparent:true,
    opacity:isOn?.13:.17,
    depthWrite:false,
    blending:isOn?THREE.AdditiveBlending:THREE.NormalBlending
  });
  const overlay=new THREE.Mesh(new THREE.PlaneGeometry(w-.3,d-.3),overlayMaterial);
  overlay.name=`${key}-light-pool`; overlay.rotation.x=-Math.PI/2; overlay.position.set(x,.246,z); overlay.renderOrder=2; group.add(overlay);
  if(isOn){
    const light=new THREE.RectAreaLight(0xffd493,5.2,w*.72,d*.72);
    light.name=`${key}-warm-light`; light.position.set(x,2.7,z); light.rotation.x=-Math.PI/2; group.add(light);
  }
  scene.add(group); roomLights.set(key,group);
}
addRoomLighting('room1',-13.7,-6.3,5.4,5.4,false);
addRoomLighting('room2',-5.55,-6.3,5.5,5.4,true);
addRoomLighting('room3',-13.7,4.25,5.4,5.4,true);
addRoomLighting('room4',-5.55,4.25,5.5,5.4,true);

// 도면의 굵은 회색 외곽선을 따라 건물 전체 외벽을 별도로 세운다.
// 현관·복도·커뮤니티실은 내부에서 서로 열려 있지만 건물 바깥과는 외벽으로 구분된다.
const OUTER_WALL_HEIGHT=1.28;
const OUTER_WALL_THICKNESS=.24;
function outerWall(name,x,z,w,d){
  return box(name,[w,OUTER_WALL_HEIGHT,d],[x,.22+OUTER_WALL_HEIGHT/2,z],M.outerWall);
}
// 도면처럼 외벽의 외곽선은 사방이 끊기지 않게 이어진다.
outerWall('outer-wall-north',-.8,-9.02,31.32,OUTER_WALL_THICKNESS);
// 좌·우 외벽은 건물 끝까지 이어진다.
outerWall('outer-wall-west',-16.46,-1.02,OUTER_WALL_THICKNESS,16.24);
outerWall('outer-wall-east',14.86,-1.02,OUTER_WALL_THICKNESS,16.24);
outerWall('outer-wall-south',-.8,7.02,31.32,OUTER_WALL_THICKNESS);

function cylinder(name,radius,height,position,material,parent=scene,segments=24){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material);
  mesh.name=name; mesh.position.set(...position); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function bed(x,z,wallSide) {
  const g=new THREE.Group(); g.position.set(x,.32,z);
  box('bed-frame',[2.2,.35,1.25],[0,.3,0],M.wood,g);
  box('mattress',[2.05,.3,1.12],[0,.61,0],mat(0xfffcf6),g);
  const wallSign=wallSide==='left'?-1:1;
  box('headboard',[.13,.72,1.28],[wallSign*1.04,.65,0],M.darkWood,g);
  box('pillow',[.42,.12,.9],[wallSign*.72,.84,0],mat(0xf3f1e8),g);
  box('blanket',[1.05,.1,1.08],[-wallSign*.25,.82,0],mat(0x8fb6ca),g);
  scene.add(g); return g;
}
function chair(x,z,color=0x91aa8b,rotation=0){
  const g=new THREE.Group(); g.position.set(x,.25,z); g.rotation.y=rotation;
  box('chair-seat',[.62,.18,.62],[0,.35,0],mat(color),g);
  box('chair-back',[.62,.7,.13],[0,.68,.25],mat(color),g); scene.add(g);
}
function cabinet(name,x,z,w=.65,d=.4,h=1.1,color=0xe3d3b9){
  const c=box(name,[w,h,d],[x,.24+h/2,z],mat(color));
  box(`${name}-line`,[.025,h*.7,d+.01],[x,.24+h/2,z],mat(0xb9a58b)); return c;
}
function toiletFixture(x,z,rotation=0){
  const g=new THREE.Group(); g.position.set(x,.25,z); g.rotation.y=rotation;
  cylinder('toilet-bowl',.34,.34,[0,.28,0],mat(0xf8f9f7),g,28);
  box('toilet-tank',[.64,.64,.26],[0,.52,.35],mat(0xf8f9f7),g); scene.add(g);
}
function sink(x,z,rotation=0){
  const g=new THREE.Group(); g.position.set(x,.28,z); g.rotation.y=rotation;
  box('sink-cabinet',[.72,.68,.42],[0,.36,0],mat(0xe8ece8),g);
  cylinder('sink-basin',.24,.08,[0,.74,0],mat(0xfafcfb),g,24); scene.add(g);
}
function showerBooth(x,z){
  const g=new THREE.Group(); g.position.set(x,.25,z);
  const glass=new THREE.MeshStandardMaterial({color:0xc9e6ea,roughness:.18,metalness:.05,transparent:true,opacity:.38,side:THREE.DoubleSide});
  box('shower-tray',[1.7,.1,1.5],[0,.12,0],mat(0xf4f6f4),g);
  box('shower-glass-back',[1.7,1.28,.045],[0,.8,.72],glass,g);
  box('shower-glass-left',[.045,1.28,1.5],[-.83,.8,0],glass,g);
  box('shower-glass-right',[.045,1.28,1.5],[.83,.8,0],glass,g);
  box('shower-door',[.78,1.22,.035],[.42,.77,-.72],glass,g);
  cylinder('shower-drain',.12,.018,[0,.19,0],mat(0x87969a,.3,.6),g,24);
  cylinder('shower-head',.1,.05,[.58,1.25,.61],mat(0xaeb8bb,.3,.65),g,24);
  scene.add(g);
}
function planter(x,z){
  cylinder('planter',.28,.5,[x,.34,z],mat(0xb77751),scene,20);
  const leaves=new THREE.Mesh(new THREE.SphereGeometry(.45,16,12),mat(0x4f8a55)); leaves.position.set(x,.86,z); leaves.castShadow=true; scene.add(leaves);
}
function flowerBox(x,z,w=1.15,flowerColor=0xf1a5b7){
  box('terrace-flower-box',[w,.32,.38],[x,.36,z],mat(0xc98758));
  box('terrace-soil',[w-.12,.06,.3],[x,.54,z],mat(0x665040));
  for(const dx of [-.35,0,.35]){
    cylinder('flower-stem',.018,.28,[x+dx,.68,z],mat(0x5d9658),scene,10);
    const bloom=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),mat(dx===0?flowerColor:0xf6cf68));
    bloom.name='terrace-flower'; bloom.position.set(x+dx,.84,z); bloom.castShadow=true; scene.add(bloom);
  }
}

// 실제 관제 스냅샷의 침대 재실 위치: 2호 1명, 3호 2명, 4호 2명.
const occupiedBedKeys=new Set(['-3.95,-7.55','-15.25,3','-15.25,5.5','-3.95,3','-3.95,5.5']);
// 중간집 1·3은 왼쪽 외벽, 중간집 2·4는 오른쪽 외벽에 침대를 밀착 배치한다.
for(const p of [[-15.25,-7.55,'left'],[-15.25,-5.05,'left'],[-3.95,-7.55,'right'],[-3.95,-5.05,'right'],[-15.25,3.0,'left'],[-15.25,5.5,'left'],[-3.95,3.0,'right'],[-3.95,5.5,'right']]){
  const bedGroup=bed(...p);
  // 사람이 있는 침대만 장식 이불을 숨겨 단순 도형 인물이 또렷하게 보이게 한다.
  if(occupiedBedKeys.has(`${p[0]},${p[1]}`)){const cover=bedGroup.getObjectByName('blanket');if(cover)cover.visible=false;}
}
cabinet('room1-wardrobe',-11.35,-7.7,.58,1.25,1.25); cabinet('room2-wardrobe',-7.95,-7.7,.58,1.25,1.25);
cabinet('room3-wardrobe',-11.35,5.55,.58,1.25,1.25); cabinet('room4-wardrobe',-7.95,5.55,.58,1.25,1.25);

// 화장실-1·2는 같은 구조: 도면 위쪽에 변기와 세면대, 아래쪽에 샤워부스.
toiletFixture(-10.15,-8.42,Math.PI); sink(-9.15,-8.42,Math.PI); showerBooth(-9.65,-4.65);
toiletFixture(-10.15,1.98,Math.PI); sink(-9.15,1.98,Math.PI); showerBooth(-9.65,5.75);
// 공용 남녀 화장실은 변기와 세면대로 구성한다.
toiletFixture(-1.45,-8.42,Math.PI); sink(-1.45,-6.75); toiletFixture(-1.45,-5.12,Math.PI); sink(-1.45,-3.45,Math.PI);
for(const [x,z] of [[-10.55,-8.42],[-10.55,1.98],[-2.2,-8.42],[-2.2,-5.12]]) box('safety-rail',[.08,.12,.9],[x,.78,z],mat(0xb8bdc1,.45,.55));

// 현관·방풍실: 열린 동선을 유지하면서 앉아서 신발을 갈아 신을 수 있도록 한다.
box('entrance-bench',[1.45,.45,.55],[2.6,.46,-7.9],M.wood); cabinet('shoe-cabinet',4.35,-7.8,.58,1.2,.9,0xd8c7aa);
box('vestibule-bench',[1.25,.42,.45],[-15.1,.43,-.75],M.wood);

// 돌봄인력공간: 휴식 소파, 티 테이블, 기록용 업무책상.
box('care-sofa',[2.2,.55,.78],[6.9,.55,-7.75],mat(0x7fa99e));
box('care-sofa-back',[2.2,.82,.18],[6.9,.88,-8.02],mat(0x668f85));
box('care-coffee-table',[1.2,.3,.7],[6.9,.42,-6.65],M.wood);
box('care-desk',[1.7,.55,.72],[6.9,.61,-4.55],M.wood); chair(6.9,-5.25,0x668f85,Math.PI);

// 주방: 벽면 조리대, 싱크, 냉장고와 2인 식탁.
box('kitchen-counter',[2.3,.9,.7],[10.35,.7,-7.8],M.darkWood);
cylinder('kitchen-sink',.2,.07,[9.9,1.18,-7.8],mat(0xb8c3c7,.35,.6),scene,24);
for(const x of [10.55,10.85]) cylinder('stove-ring',.12,.035,[x,1.17,-7.8],mat(0x30353b,.4,.4),scene,24);
box('fridge',[.72,1.5,.72],[9.35,.98,-4.85],mat(0xe7ecee,.35,.2));
box('kitchen-table',[1.3,.28,.72],[10.65,.72,-5.45],M.wood); chair(10.65,-4.8,0xb88a59,0); chair(10.65,-6.1,0xb88a59,Math.PI);

// 창고·린넨실·보일러실: 선반과 설비를 벽 쪽에 배치한다.
for(const z of [-8.1,-7.2,-6.3]) box('storage-shelf',[.52,.9,.55],[12.45,.68,z],mat(0x8b9498,.65,.15));
for(const x of [12.7,13.45,14.2]) cabinet('linen-cabinet',x,-4.1,.55,.72,.85,0xf4efe5);
cylinder('boiler',.36,1.2,[.55,.86,-7.7],mat(0xc4c9cc,.42,.35),scene,28);

// 간호사실: 관제 책상, 의자, 모니터 2대.
box('nurse-desk',[1.8,.55,.8],[13.45,.62,-1.2],M.wood); chair(13.45,-.55,0x53677b,0);
for(const x of [13.1,13.8]){box('nurse-monitor',[.55,.42,.08],[x,1.18,-1.46],mat(0x233244,.35,.15)); box('monitor-stand',[.06,.26,.06],[x,.92,-1.46],mat(0x6d747a,.4,.45));}

// 작업치료실: 높이 조절 테이블, 치료 의자, 수납장과 균형훈련 도구.
box('therapy-table',[1.5,.45,1.2],[-1.25,.65,4.2],M.wood); chair(-1.25,3.2,0x70a99a,Math.PI); chair(-1.25,5.15,0x70a99a,0);
cabinet('therapy-storage',-.05,5.55,.45,1.2,.9,0xc8ded7);
for(const [x,z,c] of [[-2.15,5.7,0xe4a253],[-2.15,5.15,0x6d9fc6]]) cylinder('therapy-ball',.25,.5,[x,.5,z],mat(c),scene,24);

// 커뮤니티실: TV는 복도 쪽이 아니라 사무공간과 맞닿은 오른쪽 벽에 설치한다.
const communityTv=new THREE.Group(); communityTv.position.set(8.86,0,3.65); communityTv.rotation.y=Math.PI/2; scene.add(communityTv);
box('community-tv-console',[3.1,.42,.5],[0,.46,-.25],M.darkWood,communityTv);
box('community-tv',[2.75,1.45,.12],[0,1.45,-.08],mat(0x1f2c36,.28,.18),communityTv);
box('community-tv-screen',[2.45,1.15,.015],[0,1.45,-.15],new THREE.MeshBasicMaterial({color:0x294f5a}),communityTv);
// 주 소파는 사무공간 벽의 TV를 바라보고, 보조 소파는 양옆에서 마주 보는 배치다.
box('community-sofa-main',[.92,.58,3.6],[2.0,.58,3.45],mat(0x739681));
box('community-sofa-main-back',[.2,.88,3.6],[1.64,.93,3.45],mat(0x5f806d));
box('community-sofa-top',[1.7,.58,.82],[3.65,.58,1.35],mat(0x86a991));
box('community-sofa-top-back',[1.7,.88,.2],[3.65,.93,.99],mat(0x6d927a));
box('community-sofa-bottom',[1.7,.58,.82],[3.65,.58,5.55],mat(0x86a991));
box('community-sofa-bottom-back',[1.7,.88,.2],[3.65,.93,5.91],mat(0x6d927a));
box('community-coffee-table',[2.2,.28,1.05],[4.4,.4,3.45],M.wood);

// 사무공간: 2인 업무 자리와 문서 수납장.
for(const z of [3.25,5.1]){box('office-desk',[2.5,.55,.78],[11.8,.62,z],M.wood); chair(11.8,z+.72,0x58687b,0); box('office-monitor',[.7,.45,.08],[11.8,1.18,z-.22],mat(0x273548,.35,.1));}
cabinet('office-file-cabinet',14.25,4.25,.58,1.4,1.1,0xd7c5a9);

// 유치원의 밝은 기억을 살린 열린 테라스: 우드 데크, 파스텔 벤치, 꽃과 작은 티 테이블.
for(let x=-15.25;x<.2;x+=1.05) box('terrace-deck-left',[.94,.035,1.25],[x,.2,8.15],mat(x%2?0xd9b27f:0xe7c898));
for(let x=9.25;x<14.65;x+=1.05) box('terrace-deck-right',[.94,.035,1.25],[x,.2,8.15],mat(x%2?0xd9b27f:0xe7c898));
box('terrace-left-bench',[2.5,.42,.52],[-8.0,.43,8.15],M.wood);
box('terrace-left-cushion',[2.28,.13,.46],[-8.0,.7,8.15],mat(0x9fc9bd));
cylinder('terrace-left-table',.28,.08,[-6.25,.56,8.15],mat(0xf0c789),scene,28);
cylinder('terrace-left-table-leg',.055,.38,[-6.25,.36,8.15],mat(0x8e7256),scene,18);
flowerBox(-13.15,8.15,1.15,0xf1a5b7); flowerBox(-3.0,8.15,1.15,0xa9c8f4); planter(-15.0,8.15); planter(.0,8.15);
box('terrace-right-bench',[2.25,.42,.52],[11.55,.43,8.15],M.wood);
box('terrace-right-cushion',[2.03,.13,.46],[11.55,.7,8.15],mat(0xf1b6a7));
cylinder('terrace-right-table',.26,.08,[13.35,.56,8.15],mat(0xf0c789),scene,28);
cylinder('terrace-right-table-leg',.05,.38,[13.35,.36,8.15],mat(0x8e7256),scene,18);
flowerBox(9.65,8.15,1.0,0xf1a5b7); flowerBox(14.35,8.15,.85,0xa9c8f4);
// 외벽에 다는 은은한 전구는 바닥 동선을 차지하지 않는다.
for(const x of [-14,-11,-8,-5,-2,9.8,12,14]) cylinder('terrace-wall-light',.07,.1,[x,1.18,7.18],mat(0xffd879,.35),scene,16);

// 도면의 설치기기 10대: 각 중간집 2대 + 화장실-1/2 각 1대.
// 실물처럼 벽에 붙는 둥근 사각형 본체에, 가운데 원이 없는 Instagram형 윤곽을 사용한다.
const sensorPoints=[
  [-15.85,-7.55, Math.PI/2],[-15.85,-5.1, Math.PI/2],[-9.65,-3.65, Math.PI],
  [-3.15,-7.55,-Math.PI/2],[-3.15,-5.1,-Math.PI/2],[-15.85,3.05, Math.PI/2],
  [-15.85,5.45, Math.PI/2],[-9.65,6.95, Math.PI],[-3.15,3.05,-Math.PI/2],[-3.15,5.45,-Math.PI/2]
];
const sensorGroup=new THREE.Group(); sensorGroup.name='installed-devices-10'; scene.add(sensorGroup);
function roundedRectPath(path,x,y,w,h,r){
  path.moveTo(x+r,y); path.lineTo(x+w-r,y); path.quadraticCurveTo(x+w,y,x+w,y+r);
  path.lineTo(x+w,y+h-r); path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  path.lineTo(x+r,y+h); path.quadraticCurveTo(x,y+h,x,y+h-r);
  path.lineTo(x,y+r); path.quadraticCurveTo(x,y,x+r,y);
}
function deviceOutlineGeometry(){
  const shape=new THREE.Shape(); roundedRectPath(shape,-.14,-.17,.28,.34,.065);
  const hole=new THREE.Path(); roundedRectPath(hole,-.09,-.12,.18,.24,.04); shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape,6);
}
function addInstalledDevice(x,z,rotationY){
  const g=new THREE.Group(); g.position.set(x,.62,z); g.rotation.y=rotationY;
  const body=box('device-body',[.38,.46,.12],[0,0,0],mat(0xf7f8f7,.6),g);
  body.castShadow=true;
  const outline=new THREE.Mesh(deviceOutlineGeometry(),new THREE.MeshBasicMaterial({color:0x91a09e,side:THREE.DoubleSide,transparent:true,opacity:.72}));
  outline.position.set(0,0,.066); g.add(outline);
  const status=new THREE.Mesh(new THREE.CircleGeometry(.024,18),new THREE.MeshBasicMaterial({color:0x59a992,transparent:true}));
  status.position.set(.085,.105,.069); status.userData.statusLight=true; g.add(status);
  for(let i=0;i<4;i++) box('device-vent',[.1,.012,.008],[.1,.04-i*.04,-.066],mat(0xadb6b4,.65),g);
  sensorGroup.add(g);
}
for(const [x,z,rotationY] of sensorPoints){
  addInstalledDevice(x,z,rotationY);
}

function standingPerson(name,x,z,outfit=0x6f8795,role='senior',rotation=0){
  const g=new THREE.Group(); g.name=name; g.userData.role=role; g.position.set(x,.3,z); g.rotation.y=rotation;
  const skin=mat(0xe6b88f), cloth=mat(outfit), trouser=mat(role==='nurse'?0xe9efef:0x596474);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.23,.28,.65,20),cloth); torso.position.y=1.0; torso.castShadow=true; g.add(torso);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.5,14),skin); arm.position.set(side*.32,.98,0); arm.rotation.z=side*.08; arm.castShadow=true; g.add(arm);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.55,14),trouser); leg.position.set(side*.12,.4,0); leg.castShadow=true; g.add(leg);
  }
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,20,14),skin); head.position.y=1.55; head.castShadow=true; g.add(head);
  scene.add(g); return g;
}
function lyingSenior(name,x,z,headSide='left',outfit=0x8aa8b5){
  const g=new THREE.Group(); g.name=name; g.userData.role='senior'; g.userData.pose='lying'; g.position.set(x,1.05,z);
  const direction=headSide==='left'?-1:1;
  const skin=mat(0xe6b88f);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.72,20),mat(outfit));
  body.rotation.z=Math.PI/2; body.position.set(-direction*.05,.08,0); body.castShadow=true; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.22,24,18),skin);
  head.position.set(direction*.52,.08,0); head.castShadow=true; g.add(head);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.5,14),skin);
    arm.rotation.z=Math.PI/2; arm.position.set(-direction*.03,.06,side*.26); arm.castShadow=true; g.add(arm);
  }
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.44,16),mat(0x596474));
    leg.rotation.z=Math.PI/2; leg.position.set(-direction*.57,.06,side*.1); leg.castShadow=true; g.add(leg);
  }
  scene.add(g); return g;
}

// 실제 관제 데이터: 방 밖 3명 + 침대 5명. 침대 상태는 수면을 뜻하지 않는다.
const avatar=standingPerson('senior-avatar-1',-6.2,-.35,0x596f83,'senior');
standingPerson('senior-avatar-2',3.1,2.25,0xb98278,'senior',-.45);
standingPerson('senior-avatar-3',5.45,4.65,0x7b9c82,'senior',2.5);
lyingSenior('senior-avatar-4',-3.95,-7.55,'right',0xc39b84);
lyingSenior('senior-avatar-5',-15.25,3.0,'left',0x8fa98c);
lyingSenior('senior-avatar-6',-15.25,5.5,'left',0x91adba);
lyingSenior('senior-avatar-7',-3.95,3.0,'right',0x9c91b6);
lyingSenior('senior-avatar-8',-3.95,5.5,'right',0x8aa8b5);
const zones={
 room1:{label:'중간집 1',sub:'생활·재실',center:[-13.7,-6.3],camera:[-5,16,7],temp:'—',humidity:'—',people:'0명',activity:'부재',status:'방 밖',light:'off',event:'1호에는 현재 재실자가 없어요',copy:'두 침대 모두 비어 있고 화장실 재실도 없어요.',guide:'실제 관제 스냅샷 기준으로 1호는 비어 있어요.',description:'현재 두 분 모두 침실 밖에 있으며 침대 재실 신호가 없습니다.',features:['조명 꺼짐','침대 재실 0명','화장실 재실 0명','방 밖 인원에 포함'],color:0x1684bf},
 room2:{label:'중간집 2',sub:'생활·재실',center:[-5.55,-6.3],camera:[4,16,7],temp:'20.7',humidity:'17',people:'1명',activity:'침대·깨어 있음',status:'재실 1명',light:'on',event:'한 분이 침대에 계세요',copy:'침대 위치로 감지됐지만 수면 상태는 아니에요.',guide:'2호는 한 분만 침대에 있고 다른 한 분은 방 밖에 있어요.',description:'실제 관제 화면에서 한 분은 침대, 한 분은 부재로 표시됩니다.',features:['조명 켜짐','침대 재실 1명','방 밖 1명','수면 상태 아님'],color:0x1684bf},
 room3:{label:'중간집 3',sub:'생활·재실',center:[-13.7,4.25],camera:[-5,16,15],temp:'22.4',humidity:'8',people:'2명',activity:'침대·깨어 있음',status:'재실 2명',light:'on',event:'두 분 모두 침대에 계세요',copy:'두 분 모두 수면 상태가 아닌 깨어 있는 상태예요.',guide:'3호의 두 침대에 각각 한 분씩 계세요.',description:'실제 관제 화면에서 두 분 모두 침대 위치로 감지됩니다.',features:['조명 켜짐','침대 재실 2명','수면 상태 아님','화장실 재실 0명'],color:0x1684bf},
 room4:{label:'중간집 4',sub:'생활·재실',center:[-5.55,4.25],camera:[4,16,15],temp:'20.0',humidity:'5',people:'2명',activity:'침대·깨어 있음',status:'재실 2명',light:'on',event:'두 분 모두 침대에 계세요',copy:'두 분 모두 수면 상태가 아닌 깨어 있는 상태예요.',guide:'4호의 두 침대에 각각 한 분씩 계세요.',description:'실제 관제 화면에서 두 분 모두 침대 위치로 감지됩니다.',features:['조명 켜짐','침대 재실 2명','수면 상태 아님','화장실 재실 0명'],color:0x1684bf},
 community:{label:'커뮤니티실',sub:'휴식·교류·TV',center:[3.85,3.1],camera:[14,16,16],temp:'22.3',humidity:'45',people:'방 밖 3명',activity:'활동 중',status:'3명 활동',light:'on',event:'세 분이 침실 밖에 계세요',copy:'화장실에는 아무도 없고 공용 생활공간에서 활동 중이에요.',guide:'침실 재실 5명을 제외한 세 분은 방 밖에 있어요.',description:'복도와 이어진 열린 생활공간에 방 밖 인원을 표시합니다.',features:['조명 켜짐','방 밖 3명','침실 재실 5명','경고 0건'],color:0x28a95d},
 therapy:{label:'작업치료실',sub:'재활·회복',center:[-1.25,4.25],camera:[8,15,15],temp:'22.0',humidity:'46',people:'0명',activity:'비어 있음',status:'정상',light:'on',event:'현재 치료실은 비어 있어요',copy:'방 밖 세 분은 복도와 커뮤니티실에 표시했어요.',guide:'실제 관제 인원 합계와 맞도록 비어 있는 공간으로 표시해요.',description:'현재 관제 스냅샷에서는 별도 재실 인원을 배치하지 않았습니다.',features:['조명 켜짐','현재 재실 0명','무장애 동선','신체 기능 훈련'],color:0x18a47e},
 nurse:{label:'간호사실',sub:'안심 관제',center:[13.45,-1.2],camera:[22,14,10],temp:'22.2',humidity:'45',people:'0명',activity:'비어 있음',status:'정상',light:'on',event:'현재 간호사실은 비어 있어요',copy:'관제 가구와 설치 기기 현황만 표시하고 있어요.',guide:'간호사 인물은 요청대로 화면에서 제외했어요.',description:'중간집 1~4와 화장실의 설치 기기 10대를 통합 확인하는 공간입니다.',features:['조명 켜짐','현재 재실 0명','기기 10대 통합 관제','돌봄 기록 연계'],color:0xda6a22},
 entrance:{label:'현관',sub:'출입·귀가',center:[3.25,-6.3],camera:[14,16,5],temp:'18.8',humidity:'51',people:'정상',activity:'출입 확인',status:'안심',light:'on',event:'출입 동선이 안전해요',copy:'오늘 귀가·외출 기록이 정상이에요.',guide:'현관에서 돌봄인력공간과 커뮤니티실로 자연스럽게 이어져요.',description:'현관과 돌봄인력공간을 연결해 안전한 외출·귀가를 돕는 동선입니다.',features:['조명 켜짐','출입 흐름 확인','귀가 알림','무장애 동선'],color:0xe09a24}
};

const ui={nav:document.querySelector('#zone-nav'),title:document.querySelector('#zone-title'),status:document.querySelector('#zone-status'),light:document.querySelector('#light-status'),temp:document.querySelector('#metric-temp'),humidity:document.querySelector('#metric-humidity'),people:document.querySelector('#metric-people'),activity:document.querySelector('#metric-activity'),event:document.querySelector('#event-title'),copy:document.querySelector('#event-copy'),guide:document.querySelector('#guide-text'),sheet:document.querySelector('#detail-sheet'),detailTitle:document.querySelector('#detail-title'),detailDescription:document.querySelector('#detail-description'),detailFeatures:document.querySelector('#detail-features'),loading:document.querySelector('#loading')};
let currentZone='room1',cameraTween;
for(const [key,zone] of Object.entries(zones)){
  const b=document.createElement('button'); b.type='button'; b.className='zone-button'; b.dataset.zone=key; b.innerHTML=`<span>${zone.label}</span><small>${zone.sub}</small>`; b.addEventListener('click',()=>selectZone(key)); ui.nav.appendChild(b);
}
function selectZone(key,animate=true){const z=zones[key];currentZone=key;document.querySelectorAll('.zone-button').forEach(b=>b.classList.toggle('active',b.dataset.zone===key));ui.title.textContent=z.label;ui.status.textContent=z.status;ui.light.textContent=z.light==='off'?'조명 꺼짐':'조명 켜짐';ui.light.className=`light-pill ${z.light==='off'?'off':'on'}`;ui.temp.innerHTML=`${z.temp}<small>°C</small>`;ui.humidity.innerHTML=`${z.humidity}<small>%</small>`;ui.people.textContent=z.people;ui.activity.textContent=z.activity;ui.event.textContent=z.event;ui.copy.textContent=z.copy;ui.guide.textContent=z.guide;if(animate)cameraTween={start:performance.now(),duration:900,from:camera.position.clone(),to:new THREE.Vector3(...z.camera),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(z.center[0],0,z.center[1])};}
document.querySelector('#detail-button').addEventListener('click',()=>{const z=zones[currentZone];ui.detailTitle.textContent=`${z.label} · 상세 정보`;ui.detailDescription.textContent=z.description;ui.detailFeatures.innerHTML=z.features.map(f=>`<li>${f}</li>`).join('');ui.sheet.classList.add('open');ui.sheet.setAttribute('aria-hidden','false');});
document.querySelector('#detail-close').addEventListener('click',()=>{ui.sheet.classList.remove('open');ui.sheet.setAttribute('aria-hidden','true');});
const keys=new Set();addEventListener('keydown',e=>keys.add(e.key.toLowerCase()));addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll('[data-move]').forEach(b=>{const k={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'}[b.dataset.move];b.addEventListener('pointerdown',()=>keys.add(k));b.addEventListener('pointerup',()=>keys.delete(k));b.addEventListener('pointerleave',()=>keys.delete(k));});
let audioContext;document.querySelector('#sound-toggle').addEventListener('click',e=>{const b=e.currentTarget;if(!audioContext)audioContext=new AudioContext();const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.firstChild.textContent=on?'🔊 ':'🔈 ';if(on){const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=523;g.gain.setValueAtTime(.05,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.8);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.8);}});
const clock=new THREE.Clock();
function animate(now){requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.05),move=new THREE.Vector3();if(keys.has('arrowup')||keys.has('w'))move.z-=1;if(keys.has('arrowdown')||keys.has('s'))move.z+=1;if(keys.has('arrowleft')||keys.has('a'))move.x-=1;if(keys.has('arrowright')||keys.has('d'))move.x+=1;if(move.lengthSq()){move.normalize().multiplyScalar(delta*3.2);avatar.position.add(move);avatar.position.x=THREE.MathUtils.clamp(avatar.position.x,-15.6,15.6);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z,-8.5,8.5);avatar.rotation.y=Math.atan2(move.x,move.z);avatar.position.y=.3+Math.abs(Math.sin(now*.009))*.06;}sensorGroup.traverse((m)=>{if(m.userData.statusLight)m.material.opacity=.58+Math.sin(now*.004+m.id)*.3;});if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=1-Math.pow(1-t,3);camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,e);if(t===1)cameraTween=null;}controls.update();renderer.render(scene,camera);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
selectZone('room1',false);requestAnimationFrame(animate);setTimeout(()=>ui.loading.classList.add('hidden'),650);
