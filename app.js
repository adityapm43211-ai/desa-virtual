
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const el = id => document.getElementById(id);
const noticeDialog = el("notice");

function notice(title, message) {
  el("noticeTitle").textContent = title;
  el("noticeText").textContent = message;
  noticeDialog.showModal();
}

el("closeNotice").addEventListener("click", () => noticeDialog.close());

// =====================================
// KONFIGURASI AVATAR
// =====================================

const defaultAvatar = {
  name: "Warga Baru",
  skin: "#f1c49b",
  hair: "#30251f",
  hairStyle: "short",
  shirt: "#2869b2",
  pants: "#263b59"
};

let avatarData = { ...defaultAvatar };

function readAvatarForm() {
  return {
    name: el("avatarName").value.trim().slice(0, 20) || "Warga",
    skin: el("skinColor").value,
    hair: el("hairColor").value,
    hairStyle: el("hairStyle").value,
    shirt: el("shirtColor").value,
    pants: el("pantsColor").value
  };
}

function fillAvatarForm(data) {
  el("avatarName").value = data.name || "Warga";
  el("skinColor").value = data.skin || defaultAvatar.skin;
  el("hairColor").value = data.hair || defaultAvatar.hair;
  el("hairStyle").value = data.hairStyle || "short";
  el("shirtColor").value = data.shirt || defaultAvatar.shirt;
  el("pantsColor").value = data.pants || defaultAvatar.pants;
}

function material(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8
  });
}

// =====================================
// MEMBUAT KARAKTER KOTAK ROBLOX
// =====================================

function buildAvatar(group, data) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    child.traverse?.(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    });
  }

  const skin = material(data.skin);
  const hair = material(data.hair);
  const shirt = material(data.shirt);
  const pants = material(data.pants);
  const shoe = material("#333333");
  const eye = material("#242424");

  function part(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Kaki
  part(.38, .9, .42, pants, -.22, .48, 0);
  part(.38, .9, .42, pants, .22, .48, 0);

  // Sepatu
  part(.4, .18, .55, shoe, -.22, .09, .04);
  part(.4, .18, .55, shoe, .22, .09, .04);

  // Badan
  part(.88, .85, .45, shirt, 0, 1.42, 0);

  // Lengan
  part(.32, .82, .38, skin, -.61, 1.43, 0);
  part(.32, .82, .38, skin, .61, 1.43, 0);

  // Kepala
  part(.68, .68, .62, skin, 0, 2.25, 0);

  // Mata menghadap depan (sumbu Z positif)
  part(.075, .075, .025, eye, -.16, 2.31, .316);
  part(.075, .075, .025, eye, .16, 2.31, .316);

  // Rambut
  if (data.hairStyle !== "none") {
    if (data.hairStyle === "short") {
      part(.72, .19, .67, hair, 0, 2.65, -.015);
      part(.72, .17, .12, hair, 0, 2.54, .27);
    }

    if (data.hairStyle === "spiky") {
      part(.72, .16, .67, hair, 0, 2.65, 0);

      for (let i = -1; i <= 1; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(.13, .38, 4),
          hair
        );
        spike.position.set(i * .2, 2.89, 0);
        spike.castShadow = true;
        group.add(spike);
      }
    }

    if (data.hairStyle === "long") {
      part(.72, .17, .67, hair, 0, 2.65, 0);
      part(.14, .68, .65, hair, -.31, 2.25, 0);
      part(.14, .68, .65, hair, .31, 2.25, 0);
    }
  }

  group.position.y = 0;
}

// =====================================
// DUNIA DESA 3D
// =====================================

const mount = el("world");
const scene = new THREE.Scene();

scene.background = new THREE.Color(0xb9d8e8);
scene.fog = new THREE.Fog(0xb9d8e8, 28, 65);

const camera = new THREE.PerspectiveCamera(
  48,
  mount.clientWidth / mount.clientHeight,
  .1,
  100
);

camera.position.set(13, 13, 17);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 7;
controls.maxDistance = 35;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x66815b, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(8, 15, 7);
sun.castShadow = true;
scene.add(sun);

const mat = color => new THREE.MeshStandardMaterial({
  color,
  roughness: .88
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  mat(0x83b978)
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.BoxGeometry(4, .08, 36),
  mat(0x777d78)
);
road.position.y = .05;
road.receiveShadow = true;
scene.add(road);

const road2 = new THREE.Mesh(
  new THREE.BoxGeometry(36, .08, 3),
  mat(0x777d78)
);
road2.position.y = .06;
scene.add(road2);

function house(x, z, color) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.1, 2.8),
    mat(color)
  );
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.35, 1.5, 4),
    mat(0x874b37)
  );
  roof.position.y = 2.85;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(.65, 1.25, .08),
    mat(0x583b2a)
  );
  door.position.set(0, .65, 1.44);
  group.add(door);

  group.position.set(x, 0, z);
  scene.add(group);
}

house(-7, -7, 0xf0d7a5);
house(7, -7, 0xe9c6a9);
house(-7, 7, 0xd9e5c5);
house(8, 7, 0xf1dfbd);

const hall = new THREE.Mesh(
  new THREE.BoxGeometry(5, 2.6, 4),
  mat(0xe7e7d6)
);
hall.position.set(0, 1.3, -12);
scene.add(hall);

const hallRoof = new THREE.Mesh(
  new THREE.ConeGeometry(3.8, 1.8, 4),
  mat(0x3f6d50)
);
hallRoof.position.set(0, 3.5, -12);
hallRoof.rotation.y = Math.PI / 4;
scene.add(hallRoof);

function tree(x, z) {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(.18, .25, 1.4, 7),
    mat(0x795137)
  );
  trunk.position.y = .7;
  g.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 9, 8),
    mat(0x347c45)
  );
  crown.position.y = 1.9;
  crown.castShadow = true;
  g.add(crown);

  g.position.set(x, 0, z);
  scene.add(g);
}

[[-14, -13], [-13, 12], [14, -12], [14, 13], [-2, 12], [3, -4]]
  .forEach(p => tree(...p));

// Avatar utama di desa
const avatar = new THREE.Group();
buildAvatar(avatar, avatarData);
avatar.position.set(0, 0, 3);
scene.add(avatar);

// =====================================
// STUDIO AVATAR 3D
// =====================================

const previewMount = el("avatarPreview");

const previewScene = new THREE.Scene();
previewScene.background = new THREE.Color(0xc9e2ed);

const previewCamera = new THREE.PerspectiveCamera(
  38,
  1,
  .1,
  100
);
previewCamera.position.set(3.5, 3, 5.5);
previewCamera.lookAt(0, 1.45, 0);

const previewRenderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
previewRenderer.shadowMap.enabled = true;
previewMount.innerHTML = "";
previewMount.appendChild(previewRenderer.domElement);

previewScene.add(
  new THREE.HemisphereLight(0xffffff, 0x778877, 2)
);

const previewSun = new THREE.DirectionalLight(0xffffff, 2.2);
previewSun.position.set(4, 8, 5);
previewSun.castShadow = true;
previewScene.add(previewSun);

const previewGround = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  mat(0x83b978)
);
previewGround.rotation.x = -Math.PI / 2;
previewGround.position.y = -.02;
previewGround.receiveShadow = true;
previewScene.add(previewGround);

const previewAvatar = new THREE.Group();
previewScene.add(previewAvatar);

buildAvatar(previewAvatar, avatarData);

function resizePreview() {
  const w = Math.max(previewMount.clientWidth, 200);
  const h = Math.max(previewMount.clientHeight, 250);

  previewCamera.aspect = w / h;
  previewCamera.updateProjectionMatrix();

  previewRenderer.setSize(w, h);
}

resizePreview();

new ResizeObserver(resizePreview).observe(previewMount);

// =====================================
// PREVIEW DAN PILIHAN AVATAR
// =====================================

function updateAvatar() {
  avatarData = readAvatarForm();

  buildAvatar(previewAvatar, avatarData);
  buildAvatar(avatar, avatarData);

  el("avatarStatus").textContent =
    "Penampilan diperbarui. Tekan Simpan Avatar untuk menyimpan.";
}

el("previewAvatar").addEventListener("click", updateAvatar);

[
  "avatarName",
  "skinColor",
  "hairStyle",
  "hairColor",
  "shirtColor",
  "pantsColor"
].forEach(id => {
  el(id).addEventListener("change", updateAvatar);
});

// Putar avatar pada studio dengan sentuhan atau mouse
let dragging = false;
let lastX = 0;

previewRenderer.domElement.addEventListener("pointerdown", event => {
  dragging = true;
  lastX = event.clientX;
  previewRenderer.domElement.setPointerCapture(event.pointerId);
});

previewRenderer.domElement.addEventListener("pointermove", event => {
  if (!dragging) return;

  const delta = event.clientX - lastX;
  previewAvatar.rotation.y += delta * .012;
  lastX = event.clientX;
});

previewRenderer.domElement.addEventListener("pointerup", () => {
  dragging = false;
});

previewRenderer.domElement.addEventListener("pointercancel", () => {
  dragging = false;
});

// =====================================
// KONTROL GERAKAN
// =====================================

const keys = {};

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

function bindMoveButton(id, key) {
  const button = el(id);
  if (!button) return;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[key] = true;
    button.setPointerCapture(event.pointerId);
  });

  const stop = () => {
    keys[key] = false;
  };

  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
}

bindMoveButton("moveUp", "w");
bindMoveButton("moveDown", "s");
bindMoveButton("moveLeft", "a");
bindMoveButton("moveRight", "d");

window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false);
});

el("resetView").onclick = () => {
  camera.position.set(13, 13, 17);
  controls.target.set(0, 0, 0);
  controls.update();
};

// =====================================
// SUPABASE DAN AKUN
// =====================================

const cfg = window.DESAV_CONFIG || {};

let supabase = null;
let user = null;

if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
  supabase = createClient(
    cfg.supabaseUrl,
    cfg.supabaseAnonKey
  );

  supabase.auth.onAuthStateChange((_event, session) => {
    refresh(session?.user || null);
  });

  supabase.auth.getSession().then(({ data }) => {
    refresh(data.session?.user || null);
  });
} else {
  el("status").textContent = "Pratinjau offline";
  el("adminStatus").textContent =
    "Database belum dihubungkan.";

  ["signup", "login"].forEach(id => {
    el(id).onclick = () => notice(
      "Database belum terhubung",
      "Konfigurasi Supabase perlu diperiksa."
    );
  });
}

async function refresh(nextUser) {
  user = nextUser;

  el("authBox").hidden = !!user;
  el("profileBox").hidden = !user;

  el("status").textContent = user
    ? "Warga masuk"
    : "Belum masuk";

  if (!user) {
    el("adminStatus").textContent =
      "Masuk untuk memeriksa peran akun.";
    el("avatarStatus").textContent =
      "Masuk ke akun untuk menyimpan avatar.";
    return;
  }

  el("avatarStatus").textContent = "Memuat avatar...";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("platform_id,display_name,role,balance,avatar_data")
    .eq("id", user.id)
    .single();

  if (error) {
    el("profileInfo").textContent =
      "Akun aktif, profil belum dapat dimuat.";
    el("avatarStatus").textContent =
      "Profil gagal dimuat. Periksa koneksi database.";
    console.error(error);
    return;
  }

  el("profileInfo").textContent =
    `ID ${profile.platform_id} • ${profile.display_name} • ${profile.role}`;

  el("balance").textContent = `${profile.balance} CC`;

  el("adminStatus").textContent =
    profile.role === "admin"
      ? "Akun ini memiliki akses admin. Pengelolaan bangunan akan dikembangkan berikutnya."
      : "Akun warga: dapat menjelajahi desa. Perubahan bangunan permanen hanya untuk admin.";

  if (profile.avatar_data &&
      Object.keys(profile.avatar_data).length > 0) {
    avatarData = {
      ...defaultAvatar,
      ...profile.avatar_data
    };
  } else {
    avatarData = { ...defaultAvatar };
  }

  fillAvatarForm(avatarData);
  buildAvatar(previewAvatar, avatarData);
  buildAvatar(avatar, avatarData);

  el("avatarStatus").textContent =
    "Avatar akun berhasil dimuat. Kamu bisa mengubah penampilan.";
}

// =====================================
// SIMPAN AVATAR KE DATABASE
// =====================================

el("saveAvatar").addEventListener("click", async () => {
  if (!supabase || !user) {
    notice(
      "Belum masuk",
      "Masuk ke akun Desa Virtual terlebih dahulu sebelum menyimpan avatar."
    );
    return;
  }

  updateAvatar();

  const button = el("saveAvatar");
  button.disabled = true;
  button.textContent = "Menyimpan...";

  el("avatarStatus").textContent =
    "Sedang menyimpan avatar ke database...";

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_data: avatarData })
    .eq("id", user.id);

  button.disabled = false;
  button.textContent = "Simpan Avatar";

  if (error) {
    console.error(error);
    el("avatarStatus").textContent =
      "Avatar belum tersimpan. Periksa koneksi atau aturan database.";

    notice(
      "Gagal menyimpan",
      error.message
    );
    return;
  }

  el("avatarStatus").textContent =
    "Avatar berhasil disimpan ke akunmu!";

  notice(
    "Avatar tersimpan!",
    "Penampilan karaktermu sudah disimpan. Avatar ini akan dimuat kembali saat kamu masuk akun."
  );
});

// =====================================
// DAFTAR, MASUK, DAN KELUAR
// =====================================

el("signup").onclick = async () => {
  if (!supabase) return;

  const email = el("email").value.trim();
  const password = el("password").value;

  if (!email || password.length < 8) {
    notice(
      "Periksa data",
      "Masukkan email dan kata sandi minimal 8 karakter."
    );
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    notice("Pendaftaran gagal", error.message);
  } else {
    notice(
      "Pendaftaran dikirim",
      "Periksa email jika verifikasi diaktifkan. Setelah itu masuk menggunakan akunmu."
    );
  }
};

el("login").onclick = async () => {
  if (!supabase) return;

  const { error } = await supabase.auth.signInWithPassword({
    email: el("email").value.trim(),
    password: el("password").value
  });

  if (error) {
    notice("Tidak bisa masuk", error.message);
  }
};

el("logout").onclick = async () => {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) notice("Gagal keluar", error.message);
  }
};

// =====================================
// ANIMASI
// =====================================

function animate() {
  requestAnimationFrame(animate);

  const speed = .11;

  if (keys.w || keys.arrowup) avatar.position.z -= speed;
  if (keys.s || keys.arrowdown) avatar.position.z += speed;
  if (keys.a || keys.arrowleft) avatar.position.x -= speed;
  if (keys.d || keys.arrowright) avatar.position.x += speed;

  avatar.position.x = THREE.MathUtils.clamp(
    avatar.position.x, -17, 17
  );

  avatar.position.z = THREE.MathUtils.clamp(
    avatar.position.z, -17, 17
  );

  renderer.render(scene, camera);
  previewRenderer.render(previewScene, previewCamera);
}

animate();

new ResizeObserver(() => {
  const w = mount.clientWidth;
  const h = mount.clientHeight;

  if (!w || !h) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}).observe(mount);
