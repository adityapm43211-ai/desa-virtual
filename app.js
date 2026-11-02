import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const el = id => document.getElementById(id);
const dialog = el("notice");
function notice(title, message){el("noticeTitle").textContent=title;el("noticeText").textContent=message;dialog.showModal();}
el("closeNotice").addEventListener("click",()=>dialog.close());

// 3D village preview
const mount=el("world");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb9d8e8);
scene.fog=new THREE.Fog(0xb9d8e8,28,65);
const camera=new THREE.PerspectiveCamera(48,mount.clientWidth/mount.clientHeight,.1,100);
camera.position.set(13,13,17);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(mount.clientWidth,mount.clientHeight); renderer.shadowMap.enabled=true;
mount.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement); controls.target.set(0,0,0); controls.maxPolarAngle=Math.PI/2.05; controls.minDistance=7; controls.maxDistance=35; controls.update();
scene.add(new THREE.HemisphereLight(0xffffff,0x66815b,2));
const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(8,15,7);sun.castShadow=true;scene.add(sun);
const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),mat(0x83b978));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const road=new THREE.Mesh(new THREE.BoxGeometry(4,.08,36),mat(0x777d78));road.position.y=.05;road.receiveShadow=true;scene.add(road);
const road2=new THREE.Mesh(new THREE.BoxGeometry(36,.08,3),mat(0x777d78));road2.position.y=.06;scene.add(road2);
function house(x,z,color){
 const group=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(3,2.1,2.8),mat(color));body.position.y=1.1;body.castShadow=true;body.receiveShadow=true;group.add(body);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(2.35,1.5,4),mat(0x874b37));roof.position.y=2.85;roof.rotation.y=Math.PI/4;roof.castShadow=true;group.add(roof);
 const door=new THREE.Mesh(new THREE.BoxGeometry(.65,1.25,.08),mat(0x583b2a));door.position.set(0,.65,1.44);group.add(door);
 group.position.set(x,0,z);scene.add(group);
}
house(-7,-7,0xf0d7a5);house(7,-7,0xe9c6a9);house(-7,7,0xd9e5c5);house(8,7,0xf1dfbd);
const hall=new THREE.Mesh(new THREE.BoxGeometry(5,2.6,4),mat(0xe7e7d6));hall.position.set(0,1.3,-12);scene.add(hall);
const hallRoof=new THREE.Mesh(new THREE.ConeGeometry(3.8,1.8,4),mat(0x3f6d50));hallRoof.position.set(0,3.5,-12);hallRoof.rotation.y=Math.PI/4;scene.add(hallRoof);
function tree(x,z){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.4,7),mat(0x795137));trunk.position.y=.7;g.add(trunk);const crown=new THREE.Mesh(new THREE.SphereGeometry(1.05,9,8),mat(0x347c45));crown.position.y=1.9;crown.castShadow=true;g.add(crown);g.position.set(x,0,z);scene.add(g);}
[[-14,-13],[-13,12],[14,-12],[14,13],[-2,12],[3,-4]].forEach(p=>tree(...p));
const avatar=new THREE.Group();const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.75,4,8),mat(0x2869b2));torso.position.y=1.15;avatar.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),mat(0xf0c49a));head.position.y=1.85;avatar.add(head);avatar.position.set(0,0,3);scene.add(avatar);
const keys={};window.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;});window.addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});
el("resetView").onclick=()=>{camera.position.set(13,13,17);controls.target.set(0,0,0);controls.update();};
function animate(){requestAnimationFrame(animate);const v=.11;if(keys.w||keys.arrowup)avatar.position.z-=v;if(keys.s||keys.arrowdown)avatar.position.z+=v;if(keys.a||keys.arrowleft)avatar.position.x-=v;if(keys.d||keys.arrowright)avatar.position.x+=v;avatar.position.x=THREE.MathUtils.clamp(avatar.position.x,-17,17);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z,-17,17);renderer.render(scene,camera);}
animate();
new ResizeObserver(()=>{const w=mount.clientWidth,h=mount.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(mount);

// Supabase is optional until configured
const cfg=window.DESAV_CONFIG||{};
let supabase=null,user=null;
if(cfg.supabaseUrl && cfg.supabaseAnonKey){
  supabase=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  supabase.auth.onAuthStateChange((_event,session)=>refresh(session?.user||null));
  supabase.auth.getSession().then(({data})=>refresh(data.session?.user||null));
}else{
  el("status").textContent="Pratinjau offline";
  el("adminStatus").textContent="Database belum dihubungkan. Dunia 3D dapat dicoba, akun online belum aktif.";
  ["signup","login"].forEach(id=>el(id).onclick=()=>notice("Hubungkan database dulu","Akun online belum aktif. Ikuti panduan README untuk membuat proyek Supabase gratis dan mengisi konfigurasi."));
}
async function refresh(nextUser){
 user=nextUser;
 el("authBox").hidden=!!user;el("profileBox").hidden=!user;
 el("status").textContent=user?"Warga masuk":"Belum masuk";
 if(!user){el("adminStatus").textContent="Masuk untuk memeriksa peran akun.";return;}
 const {data:profile,error}=await supabase.from("profiles").select("platform_id,display_name,role,balance").eq("id",user.id).single();
 if(error){el("profileInfo").textContent="Akun aktif, profil belum dapat dimuat.";return;}
 el("profileInfo").textContent=`ID ${profile.platform_id} • ${profile.display_name} • ${profile.role}`;
 el("balance").textContent=`${profile.balance} CC`;
 el("adminStatus").textContent=profile.role==="admin"?"Akun ini memiliki akses admin. Pengelolaan bangunan permanen akan tersedia pada tahap berikutnya.":"Akun warga: hanya dapat menjelajahi desa. Perubahan bangunan permanen dibatasi untuk admin.";
}
el("signup").onclick=async()=>{
 if(!supabase)return;
 const email=el("email").value.trim(),password=el("password").value;
 if(!email||password.length<8){notice("Periksa data","Masukkan email dan kata sandi minimal 8 karakter.");return;}
 const {error}=await supabase.auth.signUp({email,password});
 if(error)notice("Pendaftaran gagal",error.message);else notice("Pendaftaran dikirim","Periksa email jika verifikasi diaktifkan. Setelah verifikasi, masuk menggunakan akunmu.");
};
el("login").onclick=async()=>{
 if(!supabase)return;
 const {error}=await supabase.auth.signInWithPassword({email:el("email").value.trim(),password:el("password").value});
 if(error)notice("Tidak bisa masuk",error.message);
};
el("logout").onclick=async()=>{await supabase.auth.signOut();};
