/*! Winter Gym — hareket veritabanı, program üretici ve ilerleme kuralları. MIT © Enskygr234 */
"use strict";

// ---------------------------------------------------------------- hareketler
// ekip: salon (bar, makine, kablo), ev (dambıl), vucut (sadece vücut ağırlığı)
// tur: bar | dambil | makine | vucut   oran: yeni başlayan bir erkeğin çalışma ağırlığı / vücut ağırlığı
// dambıl oranları tek el içindir. sure: true ise tekrar yerine saniye.
const HAREKETLER = {
  squat:        { ad: "Squat", kas: "Bacak", tur: "bar", oran: .55, ekip: ["salon"], ana: true, ipucu: "Ayaklar omuz genişliğinde, göğüs dik. Kalçayı geriye it, dizler ayak uçları yönünde." },
  bench:        { ad: "Bench press", kas: "Göğüs", tur: "bar", oran: .42, ekip: ["salon"], ana: true, ipucu: "Kürek kemiklerini sık, ayaklar yere bassın. Bar göğsün alt kısmına insin." },
  deadlift:     { ad: "Deadlift", kas: "Sırt · bacak", tur: "bar", oran: .65, ekip: ["salon"], ana: true, ipucu: "Sırt düz, bar bacaklara yakın. Kaldırırken yeri itiyormuş gibi düşün." },
  ohp:          { ad: "Omuz press (bar)", kas: "Omuz", tur: "bar", oran: .27, ekip: ["salon"], ana: true, ipucu: "Karın ve kalça sıkı, beli bükme. Bar yüzünün önünden düz yukarı çıksın." },
  row:          { ad: "Barbell row", kas: "Sırt", tur: "bar", oran: .37, ekip: ["salon"], ana: true, ipucu: "Gövde öne eğik, sırt düz. Barı karnına doğru çek, dirsekler geriye." },
  rdl:          { ad: "Romanian deadlift", kas: "Arka bacak", tur: "bar", oran: .45, ekip: ["salon"], ipucu: "Dizler hafif kırık, kalçayı geriye it. Arka bacakta gerilmeyi hisset." },
  legpress:     { ad: "Leg press", kas: "Bacak", tur: "makine", oran: 1.0, ekip: ["salon"], ipucu: "Dizleri tamamen kilitleme, belini sehpadan kaldırma." },
  latpull:      { ad: "Lat pulldown", kas: "Sırt", tur: "makine", oran: .45, ekip: ["salon"], ipucu: "Barı göğsün üstüne çek, gövdeyi sallama." },
  cablerow:     { ad: "Kablo row", kas: "Sırt", tur: "makine", oran: .42, ekip: ["salon"], ipucu: "Göğüs dik, kürek kemiklerini birbirine yaklaştır." },
  inclinedb:    { ad: "Incline dambıl press", kas: "Üst göğüs", tur: "dambil", oran: .13, ekip: ["salon", "ev"], ipucu: "Sehpa 30 derece. Dambıllar göğsün üst kısmına insin." },
  dbpress:      { ad: "Dambıl göğüs press", kas: "Göğüs", tur: "dambil", oran: .15, ekip: ["ev"], ana: true, ipucu: "Yerde ya da sehpada; dirsekler gövdeye 45 derece açıyla." },
  dbohp:        { ad: "Dambıl omuz press", kas: "Omuz", tur: "dambil", oran: .11, ekip: ["salon", "ev"], ana: true, ipucu: "Oturarak ya da ayakta, belini bükmeden yukarı it." },
  dbrow:        { ad: "Tek kol dambıl row", kas: "Sırt", tur: "dambil", oran: .17, ekip: ["salon", "ev"], ana: true, ipucu: "Bir el ve diz sehpada, dambılı kalçana doğru çek." },
  goblet:       { ad: "Goblet squat", kas: "Bacak", tur: "dambil", oran: .2, ekip: ["ev"], ana: true, ipucu: "Dambılı göğsünde tut, dirsekler dizlerin içinden geçsin." },
  dbrdl:        { ad: "Dambıl Romanian deadlift", kas: "Arka bacak", tur: "dambil", oran: .18, ekip: ["ev"], ipucu: "Dambıllar bacağa yakın, sırt düz, kalça geriye." },
  lunge:        { ad: "Dambıl lunge", kas: "Bacak", tur: "dambil", oran: .1, ekip: ["salon", "ev"], ipucu: "Adım uzun, arka diz yere yaklaşsın. Her bacak için sayılır." },
  lateral:      { ad: "Yana açış (lateral raise)", kas: "Yan omuz", tur: "dambil", oran: .045, ekip: ["salon", "ev"], ipucu: "Dirsekler hafif bükük, omuz hizasının üstüne çıkma." },
  curl:         { ad: "Biceps curl", kas: "Ön kol", tur: "dambil", oran: .085, ekip: ["salon", "ev"], ipucu: "Dirsekler gövdeye sabit, sallanmadan kaldır." },
  hammer:       { ad: "Hammer curl", kas: "Ön kol", tur: "dambil", oran: .085, ekip: ["salon", "ev"], ipucu: "Avuçlar birbirine bakar, yavaş indir." },
  pushdown:     { ad: "Triceps pushdown", kas: "Arka kol", tur: "makine", oran: .22, ekip: ["salon"], ipucu: "Dirsekler sabit, sadece ön kol hareket eder." },
  dbtriceps:    { ad: "Baş üstü triceps", kas: "Arka kol", tur: "dambil", oran: .1, ekip: ["ev"], ipucu: "Tek dambılı iki elle tut, dirsekler tavana baksın." },
  legcurl:      { ad: "Leg curl", kas: "Arka bacak", tur: "makine", oran: .27, ekip: ["salon"], ipucu: "Kalçayı kaldırma, yavaşça indir." },
  legext:       { ad: "Leg extension", kas: "Ön bacak", tur: "makine", oran: .32, ekip: ["salon"], ipucu: "Üstte bir saniye bekle, kontrollü indir." },
  calf:         { ad: "Calf raise", kas: "Baldır", tur: "makine", oran: .55, ekip: ["salon"], ipucu: "En üstte sık, en altta tam esnet." },
  facepull:     { ad: "Face pull", kas: "Arka omuz", tur: "makine", oran: .17, ekip: ["salon"], ipucu: "İpi yüzüne doğru çek, dirsekler yukarıda." },
  pecdeck:      { ad: "Pec deck", kas: "Göğüs", tur: "makine", oran: .3, ekip: ["salon"], ipucu: "Kollar hafif bükük, göğsü sıkarak kapat." },
  // vücut ağırlığı
  pushup:       { ad: "Şınav", kas: "Göğüs", tur: "vucut", ekip: ["vucut", "ev"], ana: true, ipucu: "Vücut tek çizgi; zor gelirse dizler yerde yap." },
  bwsquat:      { ad: "Squat (vücut ağırlığı)", kas: "Bacak", tur: "vucut", ekip: ["vucut"], ana: true, ipucu: "Kollar önde, kalçayı geriye at, topuklar yerde." },
  bwlunge:      { ad: "Lunge", kas: "Bacak", tur: "vucut", ekip: ["vucut"], ipucu: "Adımlar uzun, gövde dik. Her bacak için sayılır." },
  pullup:       { ad: "Barfiks", kas: "Sırt", tur: "vucut", ekip: ["vucut", "salon", "ev"], ana: true, ipucu: "Çıkamıyorsan sadece yavaşça in (negatif) ya da lastikle yardım al." },
  invrow:       { ad: "Masa altı çekiş", kas: "Sırt", tur: "vucut", ekip: ["vucut"], ana: true, ipucu: "Sağlam bir masanın kenarını tut, göğsünü masaya çek." },
  dips:         { ad: "Dips (sandalye)", kas: "Arka kol", tur: "vucut", ekip: ["vucut", "ev"], ipucu: "İki sandalye ya da kanepe kenarı; omzunu kulağına yaklaştırma." },
  pike:         { ad: "Pike şınav", kas: "Omuz", tur: "vucut", ekip: ["vucut"], ana: true, ipucu: "Kalça yukarıda, ters V. Başını ellerinin arasına indir." },
  glute:        { ad: "Kalça köprüsü", kas: "Kalça", tur: "vucut", ekip: ["vucut", "ev"], ipucu: "Sırt üstü, topuklardan it, en üstte kalçayı sık." },
  plank:        { ad: "Plank", kas: "Karın", tur: "vucut", sure: true, ekip: ["vucut", "ev", "salon"], ipucu: "Dirsekler omuz altında, kalça ne çökük ne havada." },
  crunch:       { ad: "Mekik (crunch)", kas: "Karın", tur: "vucut", ekip: ["vucut", "ev", "salon"], ipucu: "Boynunu çekme, karınla kalk." },
  legraise:     { ad: "Bacak kaldırma", kas: "Alt karın", tur: "vucut", ekip: ["vucut", "ev", "salon"], ipucu: "Belini yere bastır, bacakları yavaş indir." },
};

// Her slot: ekipmana göre sırayla denenecek hareketler
const SLOTLAR = {
  bacakAna:   { salon: ["squat", "legpress"], ev: ["goblet", "lunge"], vucut: ["bwsquat"] },
  bacak2:     { salon: ["legpress", "lunge"], ev: ["lunge", "goblet"], vucut: ["bwlunge"] },
  arkaBacak:  { salon: ["rdl", "legcurl"], ev: ["dbrdl"], vucut: ["glute"] },
  arkaBacak2: { salon: ["legcurl"], ev: ["dbrdl"], vucut: ["glute"] },
  onBacak:    { salon: ["legext"], ev: ["goblet"], vucut: ["bwsquat"] },
  baldir:     { salon: ["calf"], ev: [], vucut: [] },
  deadlift:   { salon: ["deadlift"], ev: ["dbrdl"], vucut: ["glute"] },
  gogusAna:   { salon: ["bench"], ev: ["dbpress"], vucut: ["pushup"] },
  gogus2:     { salon: ["inclinedb", "pecdeck"], ev: ["inclinedb", "pushup"], vucut: ["pushup"] },
  omuzAna:    { salon: ["ohp", "dbohp"], ev: ["dbohp"], vucut: ["pike"] },
  yanOmuz:    { salon: ["lateral"], ev: ["lateral"], vucut: ["pike"] },
  sirtAna:    { salon: ["row", "dbrow"], ev: ["dbrow"], vucut: ["invrow"] },
  sirtDikey:  { salon: ["latpull", "pullup"], ev: ["pullup", "dbrow"], vucut: ["pullup"] },
  sirt2:      { salon: ["cablerow", "dbrow"], ev: ["dbrow"], vucut: ["invrow"] },
  arkaOmuz:   { salon: ["facepull"], ev: ["lateral"], vucut: [] },
  biceps:     { salon: ["curl", "hammer"], ev: ["curl", "hammer"], vucut: [] },
  triceps:    { salon: ["pushdown"], ev: ["dbtriceps", "dips"], vucut: ["dips"] },
  karin:      { salon: ["plank", "legraise"], ev: ["plank", "crunch"], vucut: ["plank", "crunch"] },
};

// Bölünmeler (split): gün adı + slotlar
const GUNLER = {
  tamA:   { ad: "Tüm vücut A", slot: ["bacakAna", "gogusAna", "sirtAna", "omuzAna", "biceps", "karin"] },
  tamB:   { ad: "Tüm vücut B", slot: ["deadlift", "omuzAna", "sirtDikey", "gogus2", "triceps", "karin"] },
  tamC:   { ad: "Tüm vücut C", slot: ["bacak2", "gogusAna", "sirt2", "yanOmuz", "arkaBacak2", "karin"] },
  ust:    { ad: "Üst vücut", slot: ["gogusAna", "sirtAna", "omuzAna", "sirtDikey", "biceps", "triceps"] },
  alt:    { ad: "Alt vücut", slot: ["bacakAna", "arkaBacak", "bacak2", "baldir", "karin"] },
  ust2:   { ad: "Üst vücut 2", slot: ["omuzAna", "sirtDikey", "gogus2", "sirt2", "yanOmuz", "biceps"] },
  alt2:   { ad: "Alt vücut 2", slot: ["deadlift", "bacak2", "onBacak", "arkaBacak2", "baldir", "karin"] },
  itis:   { ad: "İtiş (göğüs, omuz, arka kol)", slot: ["gogusAna", "omuzAna", "gogus2", "yanOmuz", "triceps"] },
  cekis:  { ad: "Çekiş (sırt, ön kol)", slot: ["deadlift", "sirtDikey", "sirtAna", "arkaOmuz", "biceps"] },
  bacak:  { ad: "Bacak", slot: ["bacakAna", "arkaBacak", "bacak2", "onBacak", "baldir", "karin"] },
};
const PLANLAR = {
  2: ["tamA", "tamB"],
  3: ["tamA", "tamB", "tamC"],
  4: ["ust", "alt", "ust2", "alt2"],
  5: ["itis", "cekis", "bacak", "ust", "alt"],
  6: ["itis", "cekis", "bacak", "itis", "cekis", "bacak"],
};
// Haftanın hangi günleri (0 Pazartesi)
const HAFTA_DUZENI = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };

const HEDEFLER = {
  kas:   { ad: "Kas yapmak", tekrar: [8, 12], set: 3, dinlenme: 90, carpan: 1 },
  guc:   { ad: "Güçlenmek", tekrar: [4, 6], set: 4, dinlenme: 180, carpan: 1.12 },
  yag:   { ad: "Yağ yakmak", tekrar: [12, 15], set: 3, dinlenme: 60, carpan: .82 },
  form:  { ad: "Genel form", tekrar: [10, 12], set: 3, dinlenme: 75, carpan: .92 },
};
const DENEYIM = { yeni: { ad: "Yeni başlıyorum", carpan: 1 }, orta: { ad: "6 ay – 2 yıl", carpan: 1.45 }, ileri: { ad: "2 yıldan fazla", carpan: 1.9 } };

// vücut ağırlığı hareketlerinde başlangıç tekrar sayıları
const VUCUT_TEKRAR = { yeni: [6, 10], orta: [10, 15], ileri: [15, 20] };
const PLANK_SN = { yeni: 30, orta: 45, ileri: 60 };

// ---------------------------------------------------------------- yardımcılar
function yuvarla(kg, tur) {
  if (tur === "bar") return Math.max(20, Math.round(kg / 2.5) * 2.5);
  if (tur === "dambil") return Math.max(2, Math.round(kg));
  if (tur === "makine") return Math.max(5, Math.round(kg / 2.5) * 2.5);
  return 0;
}
function artis(tur) { return tur === "bar" ? 2.5 : tur === "dambil" ? 1 : tur === "makine" ? 2.5 : 0; }

function bki(profil) {
  const m = profil.boy / 100;
  return profil.kilo / (m * m);
}

function baslangicAgirlik(id, profil) {
  const h = HAREKETLER[id];
  if (h.tur === "vucut") return 0;
  let kg = profil.kilo * h.oran * DENEYIM[profil.deneyim].carpan * HEDEFLER[profil.hedef].carpan;
  if (profil.cinsiyet === "kadin") kg *= ["Bacak", "Arka bacak", "Kalça", "Sırt · bacak"].includes(h.kas) ? .72 : .58;
  if (profil.yas >= 50) kg *= .85;
  if (profil.yas < 16) kg *= .6;
  // ağır vücutlarda oran sonsuza gitmesin
  if (profil.kilo > 95) kg *= .92;
  return yuvarla(kg, h.tur);
}

function slotHareketi(slot, ekip, kullanilan) {
  const liste = (SLOTLAR[slot][ekip] || []).filter(id => !kullanilan.has(id));
  return liste[0] || null;
}

// ---------------------------------------------------------------- program üret
function programUret(profil) {
  const plan = PLANLAR[profil.gun];
  const hedef = HEDEFLER[profil.hedef];
  const genc = profil.yas < 16;
  const gunler = plan.map((anahtar, gi) => {
    const sablon = GUNLER[anahtar];
    const kullanilan = new Set();
    const hareketler = [];
    for (const slot of sablon.slot) {
      const id = slotHareketi(slot, profil.ekip, kullanilan);
      if (!id) continue;
      kullanilan.add(id);
      const h = HAREKETLER[id];
      let set = hedef.set, tekrar = hedef.tekrar.slice();
      if (!h.ana && profil.hedef === "guc") { set = 3; tekrar = [8, 10]; }
      if (h.tur === "vucut") { tekrar = h.sure ? [PLANK_SN[profil.deneyim], PLANK_SN[profil.deneyim] + 15] : VUCUT_TEKRAR[profil.deneyim].slice(); }
      if (genc && h.tur !== "vucut") tekrar = [10, 15];
      hareketler.push({ id, set, tekrar, kg: baslangicAgirlik(id, profil), dinlenme: h.ana ? hedef.dinlenme : Math.max(45, Math.round(hedef.dinlenme * .7)) });
    }
    return { ad: sablon.ad, harf: String.fromCharCode(65 + gi), haftaGunu: HAFTA_DUZENI[profil.gun][gi], hareketler };
  });
  return { olusturma: Date.now(), gunler };
}

// ---------------------------------------------------------------- ilerleme
// Çift ilerleme: bütün setlerde üst tekrara ulaşınca ağırlık artar; iki antrenman üst üste alt tekrarın altında kalınca %10 düşer.
function ilerlet(hareket, setler) {
  const h = HAREKETLER[hareket.id];
  const yapilan = setler.filter(s => s.tamam);
  if (!yapilan.length) return { degisim: null };
  const [alt, ust] = hareket.tekrar;
  const hepsiUst = yapilan.length >= hareket.set && yapilan.every(s => s.tekrar >= ust && (h.tur === "vucut" || s.kg >= hareket.kg));
  const altinda = yapilan.filter(s => s.tekrar < alt).length >= Math.ceil(hareket.set / 2);
  if (h.tur === "vucut") {
    if (hepsiUst) { hareket.tekrar = [alt + (h.sure ? 10 : 2), ust + (h.sure ? 10 : 2)]; return { degisim: "tekrar", mesaj: `${h.ad}: hedef ${hareket.tekrar[0]}–${hareket.tekrar[1]} ${h.sure ? "sn" : "tekrar"} oldu` }; }
    return { degisim: null };
  }
  if (hepsiUst) {
    const eski = hareket.kg;
    hareket.kg = yuvarla(hareket.kg + artis(h.tur) * (h.tur === "bar" && ["squat", "deadlift", "legpress"].includes(hareket.id) ? 2 : 1), h.tur);
    hareket.zorlandi = 0;
    return { degisim: "artti", mesaj: `${h.ad}: ${fmtKg(eski)} → ${fmtKg(hareket.kg)} kg` };
  }
  if (altinda) {
    hareket.zorlandi = (hareket.zorlandi || 0) + 1;
    if (hareket.zorlandi >= 2) {
      const eski = hareket.kg;
      hareket.kg = yuvarla(hareket.kg * .9, h.tur);
      hareket.zorlandi = 0;
      return { degisim: "azaldi", mesaj: `${h.ad}: biraz hafifletildi ${fmtKg(eski)} → ${fmtKg(hareket.kg)} kg` };
    }
  } else hareket.zorlandi = 0;
  return { degisim: null };
}

// Bara takılacak plakalar (bir taraf), 20 kg bar
const PLAKALAR = [25, 20, 15, 10, 5, 2.5, 1.25];
function plakaHesapla(kg) {
  let kalan = (kg - 20) / 2;
  const sonuc = [];
  for (const p of PLAKALAR) while (kalan >= p - 1e-9) { sonuc.push(p); kalan -= p; }
  return sonuc;
}

// Isınma setleri (ilk ana hareket için)
function isinma(hareket) {
  const h = HAREKETLER[hareket.id];
  if (h.tur !== "bar" || hareket.kg < 40) return [];
  const s = [{ kg: 20, tekrar: 10 }];
  for (const [o, t] of [[.5, 8], [.75, 4]]) { const kg = yuvarla(hareket.kg * o, "bar"); if (kg > s[s.length - 1].kg && kg < hareket.kg) s.push({ kg, tekrar: t }); }
  return s;
}

function fmtKg(kg) { return Number.isInteger(kg) ? String(kg) : kg.toFixed(kg * 4 % 1 ? 2 : 1).replace(".", ","); }

// Alternatif hareketler (değiştir düğmesi için): aynı kas grubu, aynı ekipmanla yapılabilen
const GRUP = { "Göğüs": "gogus", "Üst göğüs": "gogus", "Omuz": "omuz", "Yan omuz": "omuz", "Arka omuz": "omuz", "Sırt": "sirt",
  "Bacak": "bacak", "Ön bacak": "bacak", "Arka bacak": "arka", "Kalça": "arka", "Sırt · bacak": "arka", "Baldır": "bacak",
  "Ön kol": "onkol", "Arka kol": "arkakol", "Karın": "karin", "Alt karın": "karin" };
function alternatifler(id, ekip) {
  const g = GRUP[HAREKETLER[id].kas];
  return Object.entries(HAREKETLER).filter(([k, x]) => k !== id && x.ekip.includes(ekip) && GRUP[x.kas] === g).map(([k]) => k);
}

if (typeof module !== "undefined") module.exports = { HAREKETLER, SLOTLAR, GUNLER, PLANLAR, HEDEFLER, DENEYIM, programUret, ilerlet, plakaHesapla, isinma, yuvarla, bki, fmtKg, alternatifler, baslangicAgirlik };
