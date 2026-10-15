/*! Winter Gym — arayüz. MIT © Enskygr234 */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const H = HAREKETLER;
  const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const PLAKA_RENK = { 25: "var(--p25)", 20: "var(--p20)", 15: "var(--p15)", 10: "var(--p10)", 5: "var(--p5)", 2.5: "var(--p2)", 1.25: "#9aa3ad" };

  // ================================================================ veri
  const ANAHTAR = "winter-gym.v1";
  let V = oku() || { profil: null, program: null, gecmis: [], siradaki: 0, kilolar: [], ayar: { ses: true, titresim: true, ekran: true }, aktif: null };
  function oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR)); } catch { return null; } }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch { /* gizli sekme */ } }

  // ================================================================ yardımcı
  function bildir(m, ms = 2400) { const b = $("#bildirim"); b.textContent = m; b.classList.add("goster"); clearTimeout(bildir.t); bildir.t = setTimeout(() => b.classList.remove("goster"), ms); }
  const bugun = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const haftaGunu = d => (d.getDay() + 6) % 7; // 0 = Pazartesi
  const haftaBasi = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - haftaGunu(x)); return x; };
  const tarihYaz = t => { const d = new Date(t); return `${d.getDate()} ${AYLAR[d.getMonth()]}`; };
  const sureYaz = sn => { sn = Math.max(0, Math.round(sn)); const d = Math.floor(sn / 60), s = sn % 60; return d >= 60 ? `${Math.floor(d / 60)} sa ${d % 60} dk` : `${d}:${String(s).padStart(2, "0")}`; };
  const hedefYaz = hr => { const h = H[hr.id]; return h.sure ? `${hr.set} × ${hr.tekrar[0]}–${hr.tekrar[1]} sn` : `${hr.set} × ${hr.tekrar[0]}–${hr.tekrar[1]}`; };
  const kgYaz = (hr) => H[hr.id].tur === "vucut" ? "vücut ağırlığı" : `${fmtKg(hr.kg)} kg${H[hr.id].tur === "dambil" ? " (tek el)" : ""}`;
  function plakaRengi(kg) { const p = kg >= 25 ? 25 : kg >= 20 ? 20 : kg >= 15 ? 15 : kg >= 10 ? 10 : 5; return PLAKA_RENK[p]; }

  // ================================================================ ses ve titreşim
  let ses = null;
  function bip(frek = 880, sure = .15, gecikme = 0) {
    if (!V.ayar.ses) return;
    try {
      ses = ses || new (window.AudioContext || window.webkitAudioContext)();
      const t = ses.currentTime + gecikme, o = ses.createOscillator(), g = ses.createGain();
      o.frequency.value = frek; o.type = "triangle";
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + sure);
      o.connect(g).connect(ses.destination); o.start(t); o.stop(t + sure + .05);
    } catch { }
  }
  function titret(d) { if (V.ayar.titresim && navigator.vibrate) navigator.vibrate(d); }
  let kilit = null;
  async function ekranAcik(ac) {
    try {
      if (ac && V.ayar.ekran && "wakeLock" in navigator) kilit = await navigator.wakeLock.request("screen");
      else if (!ac && kilit) { await kilit.release(); kilit = null; }
    } catch { }
  }

  // ================================================================ alt tabaka
  function tabakaAc(html, bagla) {
    $("#tabakaIcerik").innerHTML = html;
    $("#perde").hidden = false; $("#tabaka").hidden = false;
    bagla && bagla($("#tabakaIcerik"));
  }
  function tabakaKapat() { $("#perde").hidden = true; $("#tabaka").hidden = true; }
  $("#perde").addEventListener("click", tabakaKapat);
  function onayla(baslik, metin, evet, fn) {
    tabakaAc(`<h2>${esc(baslik)}</h2><p>${esc(metin)}</p><div class="tabaka-btn"><button class="ana-btn" data-e>${esc(evet)}</button><button class="ikinci-btn" data-h>Vazgeç</button></div>`, k => {
      k.querySelector("[data-e]").onclick = () => { tabakaKapat(); fn(); };
      k.querySelector("[data-h]").onclick = tabakaKapat;
    });
  }

  // ================================================================ kurulum
  const ADIMLAR = ["temel", "olcu", "deneyim", "hedef", "gun", "ekip"];
  let taslak = null, adim = 0;

  function kurulumAc(duzenle = false) {
    taslak = Object.assign({ cinsiyet: null, yas: 20, boy: 175, kilo: 70, deneyim: null, hedef: null, gun: 3, ekip: null }, duzenle && V.profil ? V.profil : {});
    adim = 0; kurulumDuzenle = duzenle;
    $("#uyg").hidden = true; $("#kurulum").hidden = false;
    kurulumCiz();
  }
  let kurulumDuzenle = false;

  function secenekler(anahtar, liste, sinif = "") {
    return `<div class="secenekler ${sinif}">${liste.map(([d, ad, acik, emoji]) => `<button class="secenek" data-k="${anahtar}" data-d="${d}" aria-pressed="${taslak[anahtar] == d}">${emoji ? `<span class="emoji">${emoji}</span>` : ""}<b>${ad}</b>${acik ? `<span>${acik}</span>` : ""}</button>`).join("")}</div>`;
  }
  function sayiAlani(anahtar, etiket, birim, min, max, adimD = 1) {
    return `<div class="alan"><label for="g-${anahtar}">${etiket}</label><div class="sayi-giris">
      <button class="yuvarlak" data-az="${anahtar}" data-m="${-adimD}" aria-label="Azalt">−</button>
      <input id="g-${anahtar}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${adimD}" value="${taslak[anahtar]}" data-g="${anahtar}">
      <span class="birim">${birim}</span>
      <button class="yuvarlak" data-az="${anahtar}" data-m="${adimD}" aria-label="Artır">+</button></div></div>`;
  }

  function kurulumCiz() {
    const a = ADIMLAR[adim];
    $("#kurIlerleme").style.width = `${(adim + 1) / ADIMLAR.length * 100}%`;
    $("#kurAdim").textContent = `${adim + 1}/${ADIMLAR.length}`;
    $("#kurGeri").hidden = adim === 0 && !kurulumDuzenle;
    let h = "";
    if (a === "temel") h = `<h1>Merhaba!</h1><p class="alt">Sana uygun bir program çıkarmak için birkaç şey soracağım. Önce cinsiyetin?</p>
      ${secenekler("cinsiyet", [["erkek", "Erkek", "", "🙋‍♂️"], ["kadin", "Kadın", "", "🙋‍♀️"]], "iki")}
      <div class="alanlar" style="margin-top:16px">${sayiAlani("yas", "Yaşın", "yaş", 12, 90)}</div>`;
    if (a === "olcu") h = `<h1>Boy ve kilo</h1><p class="alt">Başlangıç ağırlıkları vücut ağırlığına göre hesaplanır.</p>
      <div class="alanlar">${sayiAlani("boy", "Boyun", "cm", 120, 230)}${sayiAlani("kilo", "Kilon", "kg", 30, 250, .5)}</div>`;
    if (a === "deneyim") h = `<h1>Ne kadar süredir?</h1><p class="alt">Düzenli ağırlık antrenmanı yaptığın süre.</p>
      ${secenekler("deneyim", [["yeni", "Yeni başlıyorum", "Hiç yapmadım ya da 6 aydan az", "🌱"], ["orta", "6 ay – 2 yıl", "Hareketleri biliyorum", "💪"], ["ileri", "2 yıldan fazla", "Düzenli ve ağır çalışıyorum", "🏔️"]])}`;
    if (a === "hedef") h = `<h1>Hedefin ne?</h1><p class="alt">Set, tekrar ve dinlenme süreleri buna göre ayarlanır.</p>
      ${secenekler("hedef", [["kas", "Kas yapmak", "3 set · 8–12 tekrar · 90 sn dinlenme", "🏋️"], ["guc", "Güçlenmek", "4 set · 4–6 tekrar · 3 dk dinlenme", "🔩"], ["yag", "Yağ yakmak", "3 set · 12–15 tekrar · 60 sn dinlenme", "🔥"], ["form", "Genel form", "3 set · 10–12 tekrar · 75 sn dinlenme", "❄️"]])}`;
    if (a === "gun") h = `<h1>Haftada kaç gün?</h1><p class="alt">Gerçekten gidebileceğin gün sayısını seç; az ama düzenli, çok ama aksayandan iyidir.</p>
      <div class="gun-sec">${[2, 3, 4, 5, 6].map(g => `<button class="secenek" data-k="gun" data-d="${g}" aria-pressed="${taslak.gun == g}"><b>${g}</b><span>gün</span></button>`).join("")}</div>
      <p class="not" id="gunNot"></p>`;
    if (a === "ekip") h = `<h1>Nerede çalışıyorsun?</h1><p class="alt">Hareketler elindeki ekipmana göre seçilir.</p>
      ${secenekler("ekip", [["salon", "Spor salonu", "Bar, makineler, dambıllar", "🏢"], ["ev", "Evde dambılla", "Bir çift ayarlı dambıl ve bir sehpa", "🏠"], ["vucut", "Sadece vücut ağırlığı", "Ekipman yok; şınav, squat, barfiks", "🤸"]])}
      <p class="not">Bu program genel bir öneridir. Bir hareket ağrı yaparsa dur; sağlık sorunun varsa başlamadan önce doktoruna danış.${taslak.yas < 16 ? " 16 yaşından küçük olduğun için ağırlıklar hafif ve tekrarlar yüksek tutuldu; bir büyüğünle birlikte çalış." : ""}</p>`;
    $("#kurIcerik").innerHTML = h;
    $("#kurIleri").textContent = adim === ADIMLAR.length - 1 ? (kurulumDuzenle ? "Programı güncelle" : "Programımı oluştur") : "Devam";
    const gn = $("#gunNot");
    if (gn) gn.textContent = { 2: "2 gün: iki farklı tüm vücut antrenmanı.", 3: "3 gün: üç farklı tüm vücut antrenmanı. Yeni başlayanlar için en iyisi.", 4: "4 gün: üst vücut ve alt vücut, ikişer kez.", 5: "5 gün: itiş, çekiş, bacak, üst ve alt vücut.", 6: "6 gün: itiş, çekiş, bacak; haftada iki tur." }[taslak.gun];
    $("#kurIcerik").querySelectorAll(".secenek").forEach(b => b.onclick = () => {
      taslak[b.dataset.k] = b.dataset.k === "gun" ? +b.dataset.d : b.dataset.d;
      kurulumCiz();
    });
    $("#kurIcerik").querySelectorAll("[data-az]").forEach(b => b.onclick = () => {
      const k = b.dataset.az, i = $(`#g-${k}`);
      taslak[k] = Math.round((+i.value + +b.dataset.m) * 2) / 2; i.value = taslak[k]; dogrula();
    });
    $("#kurIcerik").querySelectorAll("[data-g]").forEach(i => i.oninput = () => { taslak[i.dataset.g] = +i.value; dogrula(); });
    dogrula();
  }
  function dogrula() {
    const a = ADIMLAR[adim];
    const tamam = a === "temel" ? taslak.cinsiyet && taslak.yas >= 12 && taslak.yas <= 90
      : a === "olcu" ? taslak.boy >= 120 && taslak.boy <= 230 && taslak.kilo >= 30 && taslak.kilo <= 250
      : a === "deneyim" ? !!taslak.deneyim : a === "hedef" ? !!taslak.hedef : a === "gun" ? !!taslak.gun : !!taslak.ekip;
    $("#kurIleri").disabled = !tamam;
  }
  $("#kurIleri").onclick = () => {
    if (adim < ADIMLAR.length - 1) { adim++; kurulumCiz(); return; }
    const eskiEkip = V.profil && V.profil.ekip;
    V.profil = { ...taslak };
    const yeniProgram = programUret(V.profil);
    // aynı hareketlerdeki ilerlemeyi koru
    if (V.program && kurulumDuzenle && eskiEkip === V.profil.ekip) {
      const eski = {}; V.program.gunler.forEach(g => g.hareketler.forEach(h => { eski[h.id] = h; }));
      yeniProgram.gunler.forEach(g => g.hareketler.forEach(h => { if (eski[h.id] && H[h.id].tur !== "vucut") h.kg = eski[h.id].kg; }));
    }
    V.program = yeniProgram; V.siradaki = 0;
    if (!V.kilolar.length || V.kilolar[V.kilolar.length - 1].kg !== V.profil.kilo) V.kilolar.push({ t: Date.now(), kg: V.profil.kilo });
    kaydet();
    $("#kurulum").hidden = true; $("#uyg").hidden = false;
    git("bugun");
    bildir(kurulumDuzenle ? "Programın güncellendi" : "Programın hazır 💪");
  };
  $("#kurGeri").onclick = () => { if (adim > 0) { adim--; kurulumCiz(); } else { $("#kurulum").hidden = true; $("#uyg").hidden = false; } };

  // ================================================================ sekmeler
  let sekme = "bugun";
  document.querySelectorAll(".sekmeler button").forEach(b => b.onclick = () => git(b.dataset.s));
  function git(s) {
    sekme = s;
    document.querySelectorAll(".sekmeler button").forEach(b => b.classList.toggle("on", b.dataset.s === s));
    ({ bugun: bugunCiz, program: programCiz, ilerleme: ilerlemeCiz, profil: profilCiz })[s]();
    scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- bugün
  function buHaftaYapilan() { const b = haftaBasi().getTime(); return V.gecmis.filter(g => g.t >= b); }
  function seri() {
    // art arda en az bir antrenman yapılan hafta sayısı
    let n = 0, h = haftaBasi();
    const varMi = (bas) => V.gecmis.some(g => g.t >= bas.getTime() && g.t < bas.getTime() + 7 * 864e5);
    if (!varMi(h)) h = new Date(h.getTime() - 7 * 864e5);
    while (varMi(h)) { n++; h = new Date(h.getTime() - 7 * 864e5); }
    return n;
  }
  function bugunCiz() {
    const P = V.program, g = P.gunler[V.siradaki % P.gunler.length];
    const yapilan = buHaftaYapilan(), bugunNo = haftaGunu(new Date());
    const planli = new Set(P.gunler.map(x => x.haftaGunu));
    const yapildi = new Set(yapilan.map(x => haftaGunu(new Date(x.t))));
    const saat = new Date().getHours();
    const selam = saat < 6 ? "Gece kuşu" : saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar";
    const dakika = Math.round(g.hareketler.reduce((t, h) => t + h.set * (45 + h.dinlenme), 0) / 60);
    $("#sayfa").innerHTML = `
      <div class="sayfa-bas"><h1><small>${selam}</small>Bugün</h1><span class="logo">❄ WINTER GYM</span></div>
      ${V.aktif ? `<div class="kart" style="border-color:rgba(111,219,160,.4)"><h3>YARIM KALAN ANTRENMAN</h3><h2>${esc(V.aktif.gunAd)}</h2><p class="etiket-kucuk" style="margin:6px 0 14px">${sureYaz((Date.now() - V.aktif.basla) / 1000)} önce başladın</p><button class="ana-btn" id="devam">Kaldığın yerden devam et</button></div>` : ""}
      <div class="kart siradaki">
        <span class="gun-harf" aria-hidden="true">${g.harf}</span>
        <div class="ust">Sıradaki · Gün ${g.harf}</div>
        <h2>${esc(g.ad)}</h2>
        <p class="etiket-kucuk" style="margin-top:6px">${g.hareketler.length} hareket · yaklaşık ${dakika} dakika</p>
        <ul class="hareket-listesi">${g.hareketler.map(h => `<li>
          <span class="plaka-nokta" style="background:${H[h.id].tur === "vucut" ? "var(--yuzey2)" : plakaRengi(h.kg)}"></span>
          <span class="ad">${esc(H[h.id].ad)}<small>${esc(H[h.id].kas)}</small></span>
          <span class="hedef">${hedefYaz(h)}<small>${kgYaz(h)}</small></span></li>`).join("")}</ul>
        <button class="ana-btn" id="basla" ${V.aktif ? "disabled" : ""}>Antrenmana başla</button>
      </div>
      <div class="kart"><h3>BU HAFTA · ${yapilan.length}/${P.gunler.length} ANTRENMAN</h3>
        <div class="hafta">${GUN_KISA.map((d, i) => `<div><i class="${yapildi.has(i) ? "yapildi" : planli.has(i) ? "plan" : ""} ${i === bugunNo ? "bugun" : ""}">${yapildi.has(i) ? "✓" : planli.has(i) ? "·" : ""}</i>${d}</div>`).join("")}</div>
      </div>
      <div class="sayilar">
        <div><b>${V.gecmis.length}</b><span>antrenman</span></div>
        <div><b>${seri()}</b><span>hafta seri</span></div>
        <div><b>${V.gecmis.length ? tarihYaz(V.gecmis[V.gecmis.length - 1].t).split(" ")[0] : "–"}</b><span>${V.gecmis.length ? tarihYaz(V.gecmis[V.gecmis.length - 1].t).split(" ")[1] : "son antrenman"}</span></div>
      </div>`;
    const b = $("#basla"); if (b) b.onclick = () => antrenmanBasla();
    const d = $("#devam"); if (d) d.onclick = () => antrenmanAc();
  }

  // ---------------------------------------------------------------- program
  let secGun = 0;
  function programCiz() {
    const P = V.program;
    secGun = Math.min(secGun, P.gunler.length - 1);
    const g = P.gunler[secGun];
    $("#sayfa").innerHTML = `
      <div class="sayfa-bas"><h1><small>Haftada ${P.gunler.length} gün · ${esc(HEDEFLER[V.profil.hedef].ad.toLowerCase())}</small>Program</h1></div>
      <div class="gun-sekme" role="tablist">${P.gunler.map((x, i) => `<button role="tab" aria-selected="${i === secGun}" data-i="${i}"><b>${x.harf}</b><span>${GUN_KISA[x.haftaGunu]}</span></button>`).join("")}</div>
      <div class="kart" style="padding:14px 16px"><h2>${esc(g.ad)}</h2><p class="etiket-kucuk" style="margin-top:4px">Bir harekete dokunup ağırlığını, set ve tekrarını değiştirebilir ya da başka bir hareketle değiştirebilirsin.</p></div>
      ${g.hareketler.map((h, i) => `<button class="hareket-satir" data-h="${i}"><span class="no">${i + 1}</span><span class="ad">${esc(H[h.id].ad)}<small>${esc(H[h.id].kas)} · ${h.dinlenme} sn dinlenme</small></span><span class="hedef">${hedefYaz(h)}<small>${kgYaz(h)}</small></span></button>`).join("")}
      <div class="ant-araclar"><button class="metin-btn" id="yeniden">Programı baştan oluştur</button></div>`;
    $("#sayfa").querySelectorAll(".gun-sekme button").forEach(b => b.onclick = () => { secGun = +b.dataset.i; programCiz(); });
    $("#sayfa").querySelectorAll(".hareket-satir").forEach(b => b.onclick = () => hareketDuzenle(secGun, +b.dataset.h, programCiz));
    $("#yeniden").onclick = () => onayla("Baştan oluşturulsun mu?", "Hareketler ve ağırlıklar profiline göre yeniden hesaplanır. Antrenman geçmişin silinmez.", "Baştan oluştur", () => {
      V.program = programUret(V.profil); V.siradaki = 0; kaydet(); programCiz(); bildir("Program yeniden oluşturuldu");
    });
  }

  function hareketDuzenle(gi, hi, sonra) {
    const h = V.program.gunler[gi].hareketler[hi], x = H[h.id];
    const vucut = x.tur === "vucut";
    const ciz = () => tabakaAc(`<h2>${esc(x.ad)}</h2><p>${esc(x.ipucu)}</p>
      <div class="alanlar">
        ${vucut ? "" : `<div class="alan"><label>Ağırlık${x.tur === "dambil" ? " (tek el)" : ""}</label><div class="sayi-giris"><button class="yuvarlak" data-d="kg" data-m="-1">−</button><input readonly value="${fmtKg(h.kg)}"><span class="birim">kg</span><button class="yuvarlak" data-d="kg" data-m="1">+</button></div></div>`}
        <div class="alan"><label>Set sayısı</label><div class="sayi-giris"><button class="yuvarlak" data-d="set" data-m="-1">−</button><input readonly value="${h.set}"><span class="birim">set</span><button class="yuvarlak" data-d="set" data-m="1">+</button></div></div>
        <div class="alan"><label>Hedef ${x.sure ? "süre" : "tekrar"} (alt – üst)</label><div class="sayi-giris"><button class="yuvarlak" data-d="tekrar" data-m="-1">−</button><input readonly value="${h.tekrar[0]}–${h.tekrar[1]}"><span class="birim">${x.sure ? "sn" : "tkr"}</span><button class="yuvarlak" data-d="tekrar" data-m="1">+</button></div></div>
      </div>
      <div class="tabaka-btn"><button class="ikinci-btn" id="degistir">Başka bir hareketle değiştir</button><button class="ana-btn" id="tamam">Tamam</button></div>`, k => {
        k.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
          const m = +b.dataset.m;
          if (b.dataset.d === "kg") h.kg = Math.max(0, yuvarla(h.kg + m * (x.tur === "dambil" ? 1 : 2.5), x.tur));
          if (b.dataset.d === "set") h.set = Math.min(8, Math.max(1, h.set + m));
          if (b.dataset.d === "tekrar") { const a = x.sure ? 5 : 1; h.tekrar = [Math.max(1, h.tekrar[0] + m * a), Math.max(2, h.tekrar[1] + m * a)]; }
          kaydet(); ciz();
        });
        k.querySelector("#tamam").onclick = () => { tabakaKapat(); sonra && sonra(); };
        k.querySelector("#degistir").onclick = () => degistirAc(gi, hi, sonra);
      });
    ciz();
  }

  function degistirAc(gi, hi, sonra) {
    const h = V.program.gunler[gi].hareketler[hi];
    const alt = alternatifler(h.id, V.profil.ekip).concat(V.profil.ekip !== "vucut" ? alternatifler(h.id, "vucut").filter(k => H[k].ekip.includes(V.profil.ekip)) : []);
    const benzersiz = [...new Set(alt)];
    tabakaAc(`<h2>Hareketi değiştir</h2><p>${esc(H[h.id].ad)} yerine aynı kas grubunu çalıştıran bir hareket seç.</p>
      ${benzersiz.length ? benzersiz.map(k => `<button class="liste-btn" data-k="${k}">${esc(H[k].ad)}<small>${esc(H[k].kas)}</small></button>`).join("") : `<p>Bu ekipmanla başka bir seçenek yok.</p>`}
      <div class="tabaka-btn"><button class="ikinci-btn" id="vazgec">Vazgeç</button></div>`, k => {
      k.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        h.id = b.dataset.k; h.kg = baslangicAgirlik(h.id, V.profil);
        if (H[h.id].tur === "vucut") h.tekrar = H[h.id].sure ? [30, 45] : [8, 12];
        kaydet(); tabakaKapat(); bildir(`${H[h.id].ad} eklendi`); sonra && sonra();
      });
      k.querySelector("#vazgec").onclick = tabakaKapat;
    });
  }

  // ================================================================ antrenman modu
  function antrenmanBasla() {
    const gi = V.siradaki % V.program.gunler.length, g = V.program.gunler[gi];
    V.aktif = {
      gi, gunAd: g.ad, basla: Date.now(), simdi: 0,
      hareketler: g.hareketler.map(h => ({ id: h.id, setler: Array.from({ length: h.set }, () => ({ kg: h.kg, tekrar: h.tekrar[1], tamam: false })) })),
    };
    kaydet(); antrenmanAc();
  }

  let saatT = null;
  function antrenmanAc() {
    $("#antrenman").hidden = false; ekranAcik(true);
    antrenmanCiz();
    clearInterval(saatT);
    saatT = setInterval(() => { const e = $("#gecen"); if (e && V.aktif) e.textContent = sureYaz((Date.now() - V.aktif.basla) / 1000); }, 1000);
  }
  function antrenmanKapat() { $("#antrenman").hidden = true; clearInterval(saatT); ekranAcik(false); dinlenmeBitir(true); git("bugun"); }

  function programHareketi(i) { return V.program.gunler[V.aktif.gi].hareketler[i]; }

  function barCizimi(kg) {
    const plakalar = plakaHesapla(kg);
    let x = 168, s = "";
    const w = { 25: 12, 20: 11, 15: 10, 10: 9, 5: 7, 2.5: 6, 1.25: 5 }, hh = { 25: 60, 20: 58, 15: 52, 10: 44, 5: 34, 2.5: 26, 1.25: 22 };
    plakalar.forEach(p => { s += `<rect x="${x}" y="${32 - hh[p] / 2}" width="${w[p]}" height="${hh[p]}" rx="2" fill="${PLAKA_RENK[p]}"/>`; x += w[p] + 1.5; });
    let sol = "", xs = 132;
    plakalar.forEach(p => { xs -= w[p] + 1.5; sol += `<rect x="${xs + 1.5}" y="${32 - hh[p] / 2}" width="${w[p]}" height="${hh[p]}" rx="2" fill="${PLAKA_RENK[p]}"/>`; });
    const bar = `<rect x="4" y="29.5" width="292" height="5" rx="2" fill="#9aa6b2"/><rect x="132" y="27" width="6" height="10" rx="1" fill="#c3ccd5"/><rect x="162" y="27" width="6" height="10" rx="1" fill="#c3ccd5"/>`;
    const taraf = plakalar.length ? plakalar.map(p => fmtKg(p)).join(" + ") : "plaka yok";
    return `<div class="bar-cizim"><svg viewBox="0 0 300 64" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Bara takılacak plakalar">${bar}${sol}${s}</svg>
      <div class="aciklama"><span>Her tarafa: <b>${taraf}</b></span><span>20 kg bar</span></div></div>`;
  }

  function antrenmanCiz() {
    const A = V.aktif, i = A.simdi, ah = A.hareketler[i], ph = programHareketi(i), x = H[ah.id];
    const vucut = x.tur === "vucut";
    const ilkEksik = ah.setler.findIndex(s => !s.tamam);
    const isn = i === 0 || x.ana ? isinma(ph) : [];
    const hareketBitti = h => h.setler.every(s => s.tamam);
    $("#antrenman").innerHTML = `
      <div class="ant-ust">
        <button class="kapat" id="aKapat">Kapat</button>
        <div class="gecen" id="gecen">${sureYaz((Date.now() - A.basla) / 1000)}</div>
        <button class="bitir" id="aBitir">Bitir</button>
      </div>
      <div class="ant-seritler">${A.hareketler.map((h, j) => `<i class="${hareketBitti(h) ? "tamam" : j === i ? "simdi" : ""}"></i>`).join("")}</div>
      <div class="ant-govde">
        <div class="ant-sira">Hareket ${i + 1}/${A.hareketler.length} · ${esc(x.kas)}</div>
        <div class="ant-ad">${esc(x.ad)}</div>
        <div class="ant-hedef"><span><b>${ph.set}</b> set</span><span><b>${ph.tekrar[0]}–${ph.tekrar[1]}</b> ${x.sure ? "saniye" : "tekrar"}</span>${vucut ? "" : `<span><b>${fmtKg(ph.kg)}</b> kg${x.tur === "dambil" ? " / el" : ""}</span>`}<span><b>${ph.dinlenme}</b> sn dinlen</span></div>
        ${x.tur === "bar" ? barCizimi(ah.setler[Math.max(0, ilkEksik)].kg || ph.kg) : ""}
        <div class="ipucu"><span aria-hidden="true">💡</span><span>${esc(x.ipucu)}</span></div>
        ${isn.length ? `<div class="isinma">Isınma: ${isn.map(s => `<b>${fmtKg(s.kg)} kg × ${s.tekrar}</b>`).join(" · ")}</div>` : ""}
        <div class="setler">${ah.setler.map((s, j) => `<div class="set ${s.tamam ? "tamam" : j === ilkEksik ? "siradaki-set" : ""}" data-s="${j}">
          <span class="no">${j + 1}</span>
          ${vucut ? `<div class="ayar" style="grid-column:span 1;opacity:.5"><span class="deger" style="flex:1"><b>–</b><small>vücut</small></span></div>` : `<div class="ayar"><button data-a="kg" data-m="-1" aria-label="Ağırlığı azalt">−</button><span class="deger"><b>${fmtKg(s.kg)}</b><small>kg</small></span><button data-a="kg" data-m="1" aria-label="Ağırlığı artır">+</button></div>`}
          <div class="ayar"><button data-a="tekrar" data-m="-1" aria-label="Azalt">−</button><span class="deger"><b>${s.tekrar}</b><small>${x.sure ? "sn" : "tekrar"}</small></span><button data-a="tekrar" data-m="1" aria-label="Artır">+</button></div>
          <button class="tik" data-a="tik" aria-label="${j + 1}. set tamam"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>
        </div>`).join("")}</div>
        <div class="ant-araclar"><button class="metin-btn" id="aSetEkle">+ Set ekle</button><button class="metin-btn" id="aDegistir">Hareketi değiştir</button></div>
      </div>
      <div class="ant-alt">
        <button class="ikinci-btn" id="aOnceki" ${i === 0 ? "disabled style='opacity:.4'" : ""}>← Önceki</button>
        <button class="ikinci-btn" id="aSonraki" ${i === A.hareketler.length - 1 ? "style='background:var(--buz);color:#06202f'" : ""}>${i === A.hareketler.length - 1 ? "Bitir ✓" : "Sonraki →"}</button>
      </div>`;
    $("#aKapat").onclick = antrenmanKapat;
    $("#aBitir").onclick = antrenmanBitirSor;
    $("#aOnceki").onclick = () => { if (A.simdi > 0) { A.simdi--; kaydet(); antrenmanCiz(); } };
    $("#aSonraki").onclick = () => { if (A.simdi < A.hareketler.length - 1) { A.simdi++; kaydet(); antrenmanCiz(); } else antrenmanBitirSor(); };
    $("#aSetEkle").onclick = () => { const son = ah.setler[ah.setler.length - 1]; ah.setler.push({ kg: son.kg, tekrar: son.tekrar, tamam: false }); kaydet(); antrenmanCiz(); };
    $("#aDegistir").onclick = () => degistirAc(V.aktif.gi, i, () => {
      const yeni = programHareketi(i);
      ah.id = yeni.id; ah.setler = ah.setler.map(s => ({ kg: yeni.kg, tekrar: yeni.tekrar[1], tamam: false }));
      kaydet(); antrenmanCiz();
    });
    $("#antrenman").querySelectorAll(".set").forEach(el => {
      const s = ah.setler[+el.dataset.s];
      el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
        const a = b.dataset.a, m = +b.dataset.m;
        if (a === "kg") { s.kg = Math.max(0, yuvarla(s.kg + m * (x.tur === "dambil" ? 1 : 2.5), x.tur)); ah.setler.forEach((t, k) => { if (k > +el.dataset.s && !t.tamam) t.kg = s.kg; }); }
        if (a === "tekrar") s.tekrar = Math.max(0, s.tekrar + m * (x.sure ? 5 : 1));
        if (a === "tik") {
          s.tamam = !s.tamam;
          if (s.tamam) {
            titret(40); bip(660, .08);
            const kalan = ah.setler.some(t => !t.tamam);
            if (kalan) dinlenmeBasla(ph.dinlenme, `Sıradaki: <b>${ah.setler.findIndex(t => !t.tamam) + 1}. set</b> · ${vucut ? "" : fmtKg(s.kg) + " kg × "}${s.tekrar} ${x.sure ? "sn" : ""}`);
            else if (A.simdi < A.hareketler.length - 1) {
              const sn = A.hareketler[A.simdi + 1];
              dinlenmeBasla(ph.dinlenme, `Sıradaki hareket: <b>${esc(H[sn.id].ad)}</b>`, () => { A.simdi++; kaydet(); antrenmanCiz(); });
            } else bildir("Son hareket de bitti! Bitir'e dokun 🎉", 3000);
          }
        }
        kaydet(); antrenmanCiz();
      });
    });
  }

  // ---------------------------------------------------------------- dinlenme sayacı
  let dinT = null, dinBitis = 0, dinToplam = 0, dinSonra = null;
  function dinlenmeBasla(sn, metin, sonra) {
    dinToplam = sn; dinBitis = Date.now() + sn * 1000; dinSonra = sonra || null;
    $("#dinSonraki").innerHTML = metin; $("#dinlenme").hidden = false;
    clearInterval(dinT); dinT = setInterval(dinlenmeTik, 250); dinlenmeTik();
  }
  function dinlenmeTik() {
    const kalan = (dinBitis - Date.now()) / 1000;
    $("#dinSure").textContent = sureYaz(Math.ceil(kalan));
    $("#dinHalka").style.strokeDashoffset = String(326.7 * (1 - Math.max(0, kalan) / dinToplam));
    if (kalan <= 3 && kalan > 0 && Math.ceil(kalan) !== dinlenmeTik.son) { dinlenmeTik.son = Math.ceil(kalan); bip(520, .08); }
    if (kalan <= 0) { titret([300, 120, 300]); bip(880, .18); bip(1180, .25, .2); dinlenmeBitir(); }
  }
  function dinlenmeBitir(sessiz) {
    clearInterval(dinT); dinlenmeTik.son = null; $("#dinlenme").hidden = true;
    if (!sessiz && dinSonra) { const f = dinSonra; dinSonra = null; f(); }
  }
  $("#dinAtla").onclick = () => dinlenmeBitir();
  $("#dinArti").onclick = () => { dinBitis += 15000; dinToplam += 15; dinlenmeTik(); };
  $("#dinEksi").onclick = () => { dinBitis -= 15000; dinlenmeTik(); };

  // ---------------------------------------------------------------- bitir ve özet
  function antrenmanBitirSor() {
    const yapilan = V.aktif.hareketler.reduce((t, h) => t + h.setler.filter(s => s.tamam).length, 0);
    const toplam = V.aktif.hareketler.reduce((t, h) => t + h.setler.length, 0);
    if (!yapilan) return onayla("Antrenman iptal edilsin mi?", "Hiç set işaretlemedin. Bu antrenman kaydedilmeyecek.", "İptal et", () => { V.aktif = null; kaydet(); antrenmanKapat(); });
    if (yapilan < toplam) return onayla("Bitirmek istiyor musun?", `${toplam} setin ${yapilan} tanesini yaptın. Yapılanlar kaydedilir.`, "Bitir ve kaydet", antrenmanBitir);
    antrenmanBitir();
  }
  function antrenmanBitir() {
    const A = V.aktif, sure = (Date.now() - A.basla) / 1000;
    const degisimler = [];
    let hacim = 0, setSay = 0;
    const onceMax = {};
    V.gecmis.forEach(g => g.hareketler.forEach(h => h.setler.forEach(s => { if (s.tamam) onceMax[h.id] = Math.max(onceMax[h.id] || 0, s.kg); })));
    const rekorlar = [];
    A.hareketler.forEach((h, i) => {
      const ph = programHareketi(i);
      h.setler.filter(s => s.tamam).forEach(s => { hacim += s.kg * s.tekrar * (H[h.id].tur === "dambil" ? 2 : 1); setSay++; });
      const enAgir = Math.max(0, ...h.setler.filter(s => s.tamam).map(s => s.kg));
      if (H[h.id].tur !== "vucut" && enAgir > 0 && onceMax[h.id] !== undefined && enAgir > onceMax[h.id]) rekorlar.push(`${H[h.id].ad}: ${fmtKg(enAgir)} kg`);
      if (ph.id === h.id) { const d = ilerlet(ph, h.setler); if (d.degisim) degisimler.push(d); }
    });
    V.gecmis.push({ t: Date.now(), gi: A.gi, gunAd: A.gunAd, sure, hacim: Math.round(hacim), hareketler: A.hareketler });
    V.siradaki = (A.gi + 1) % V.program.gunler.length;
    V.aktif = null; kaydet();
    $("#antrenman").hidden = true; clearInterval(saatT); ekranAcik(false);
    git("bugun");
    bip(660, .12); bip(880, .12, .12); bip(1320, .3, .24); titret([80, 60, 80]);
    tabakaAc(`<div class="ozet-ust"><div class="buyuk">Tamamlandı</div><p>${esc(A.gunAd)}</p></div>
      <div class="sayilar" style="margin-bottom:14px"><div><b>${Math.round(sure / 60)}</b><span>dakika</span></div><div><b>${setSay}</b><span>set</span></div><div><b>${hacim >= 1000 ? (hacim / 1000).toFixed(1).replace(".", ",") : Math.round(hacim)}</b><span>${hacim >= 1000 ? "ton kaldırdın" : "kg kaldırdın"}</span></div></div>
      ${rekorlar.map(r => `<div class="artis">🏆 Yeni rekor · ${esc(r)}</div>`).join("")}
      ${degisimler.map(d => `<div class="artis ${d.degisim === "azaldi" ? "azaldi" : ""}">${d.degisim === "azaldi" ? "↘" : "↗"} ${esc(d.mesaj)}</div>`).join("")}
      ${!degisimler.length ? `<p style="margin-top:6px">Bütün setlerde üst tekrar sayısına ulaştığında, o hareketin ağırlığı bir sonraki antrenmanda kendiliğinden artar.</p>` : ""}
      <div class="tabaka-btn"><button class="ana-btn" id="ozetTamam">Harika</button></div>`, k => k.querySelector("#ozetTamam").onclick = tabakaKapat);
  }

  // ================================================================ ilerleme
  let secHareket = null;
  function ilerlemeCiz() {
    const yapilanlar = {};
    V.gecmis.forEach(g => g.hareketler.forEach(h => { if (H[h.id].tur !== "vucut" && h.setler.some(s => s.tamam)) yapilanlar[h.id] = (yapilanlar[h.id] || 0) + 1; }));
    const ids = Object.keys(yapilanlar).sort((a, b) => yapilanlar[b] - yapilanlar[a]);
    if (!secHareket || !ids.includes(secHareket)) secHareket = ids[0] || null;
    // son 12 hafta ısı haritası
    const hb = haftaBasi().getTime(), isi = [];
    for (let w = 11; w >= 0; w--) { const bas = hb - w * 7 * 864e5; const n = V.gecmis.filter(g => g.t >= bas && g.t < bas + 7 * 864e5).length; isi.push(n); }
    const toplamHacim = V.gecmis.reduce((t, g) => t + (g.hacim || 0), 0);
    const b = bki(V.profil);
    const bkiAd = b < 18.5 ? "zayıf aralıkta" : b < 25 ? "normal aralıkta" : b < 30 ? "fazla kilolu aralıkta" : "obez aralıkta";
    $("#sayfa").innerHTML = `
      <div class="sayfa-bas"><h1><small>Emeğinin karşılığı</small>İlerleme</h1></div>
      <div class="sayilar" style="margin-bottom:14px">
        <div><b>${V.gecmis.length}</b><span>antrenman</span></div>
        <div><b>${toplamHacim >= 1000 ? (toplamHacim / 1000).toFixed(1).replace(".", ",") : toplamHacim}</b><span>${toplamHacim >= 1000 ? "ton toplam" : "kg toplam"}</span></div>
        <div><b>${Math.round(V.gecmis.reduce((t, g) => t + g.sure, 0) / 3600 * 10) / 10}</b><span>saat</span></div>
      </div>
      <div class="kart"><h3>SON 12 HAFTA</h3><div class="isi">${isi.map(n => `<i class="${n ? "d" + Math.min(3, n) : ""}" title="${n} antrenman"></i>`).join("")}</div>
        <p class="etiket-kucuk" style="margin-top:8px">Her kare bir hafta. Ne kadar açık, o kadar çok antrenman.</p></div>
      <div class="kart"><h3>AĞIRLIK GELİŞİMİ</h3>
        ${ids.length ? `<div class="cip-satir">${ids.map(id => `<button class="cip" data-id="${id}" aria-pressed="${id === secHareket}">${esc(H[id].ad)}</button>`).join("")}</div>` : ""}
        <div class="grafik">${secHareket ? cizgiGrafik(V.gecmis.filter(g => g.hareketler.some(h => h.id === secHareket)).map(g => ({ t: g.t, y: Math.max(...g.hareketler.filter(h => h.id === secHareket).flatMap(h => h.setler.filter(s => s.tamam).map(s => s.kg)), 0) })).filter(n => n.y > 0), "kg") : `<div class="bos">İlk antrenmanını bitirince her hareketin ağırlık grafiği burada çıkacak.</div>`}</div>
      </div>
      <div class="kart"><h3>VÜCUT AĞIRLIĞI</h3>
        <div style="display:flex;align-items:baseline;gap:8px"><span class="buyuk-sayi">${fmtKg(V.profil.kilo)}</span><span class="etiket-kucuk">kg · ${V.profil.boy} cm</span></div>
        <div class="grafik">${V.kilolar.length > 1 ? cizgiGrafik(V.kilolar.map(k => ({ t: k.t, y: k.kg })), "kg") : ""}</div>
        <div class="kilo-giris"><input id="yeniKilo" type="number" inputmode="decimal" step=".1" placeholder="Bugünkü kilon"><button class="ikinci-btn" id="kiloEkle">Kaydet</button></div>
      </div>
      <div class="kart"><h3>BOY-KİLO ENDEKSİ</h3>
        <div style="display:flex;align-items:baseline;gap:8px"><span class="buyuk-sayi">${b.toFixed(1).replace(".", ",")}</span><span class="etiket-kucuk">${bkiAd}</span></div>
        <div class="bki-cubuk"><i style="left:${Math.min(98, Math.max(0, (b - 15) / 25 * 100))}%"></i></div>
        <p class="etiket-kucuk">Endeks sadece boy ve kiloya bakar; kaslı vücutlarda yüksek çıkabilir. Bir sağlık ölçüsü değil, kaba bir rehberdir.</p>
      </div>
      ${V.gecmis.length ? `<div class="kart"><h3>SON ANTRENMANLAR</h3>${V.gecmis.slice(-8).reverse().map(g => `<div class="gecmis-satir"><div><b>${esc(g.gunAd)}</b><small>${tarihYaz(g.t)} · ${sureYaz(g.sure).replace(/:\d\d$/, "")} dk</small></div><span class="etiket-kucuk">${g.hacim} kg</span></div>`).join("")}</div>` : ""}`;
    $("#sayfa").querySelectorAll(".cip").forEach(c => c.onclick = () => { secHareket = c.dataset.id; ilerlemeCiz(); });
    $("#kiloEkle").onclick = () => {
      const v = parseFloat(String($("#yeniKilo").value).replace(",", "."));
      if (!(v >= 30 && v <= 250)) return bildir("30 ile 250 arasında bir kilo yaz");
      V.kilolar.push({ t: Date.now(), kg: v }); V.profil.kilo = v; kaydet(); ilerlemeCiz(); bildir("Kilon kaydedildi");
    };
  }

  function cizgiGrafik(n, birim) {
    if (n.length < 2) return n.length ? `<div class="bos">Şimdilik tek kayıt var: <b>${fmtKg(n[0].y)} ${birim}</b>. Birkaç antrenman sonra çizgi oluşacak.</div>` : "";
    const W = 320, Hh = 170, sol = 34, alt = 22, ust = 12;
    const ys = n.map(p => p.y), mn = Math.min(...ys), mx = Math.max(...ys), ara = (mx - mn) || 1;
    const lo = mn - ara * .15, hi = mx + ara * .15;
    const X = i => sol + (W - sol - 8) * (i / (n.length - 1)), Y = v => ust + (Hh - ust - alt) * (1 - (v - lo) / (hi - lo));
    const yol = n.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(" ");
    const alan = `${yol} L${X(n.length - 1).toFixed(1)} ${Hh - alt} L${X(0).toFixed(1)} ${Hh - alt} Z`;
    const cizgiler = [lo + (hi - lo) * .2, lo + (hi - lo) * .8].map(v => `<line x1="${sol}" x2="${W - 8}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(196,222,245,.1)"/><text x="${sol - 6}" y="${Y(v) + 4}" text-anchor="end" fill="#8c99a6" font-size="10" font-family="Barlow">${fmtKg(Math.round(v * 2) / 2)}</text>`).join("");
    const son = n[n.length - 1];
    return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Gelişim grafiği">
      <defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff" stop-opacity=".35"/><stop offset="1" stop-color="#8fd3ff" stop-opacity="0"/></linearGradient></defs>
      ${cizgiler}<path d="${alan}" fill="url(#gd)" stroke="none"/><path d="${yol}" fill="none" stroke="#8fd3ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${n.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="${i === n.length - 1 ? 4.5 : 2.5}" fill="${i === n.length - 1 ? "#eef3f7" : "#8fd3ff"}" stroke="none"/>`).join("")}
      <text x="${X(0)}" y="${Hh - 6}" fill="#8c99a6" font-size="10" font-family="Barlow">${tarihYaz(n[0].t)}</text>
      <text x="${W - 8}" y="${Hh - 6}" text-anchor="end" fill="#8c99a6" font-size="10" font-family="Barlow">${tarihYaz(son.t)}</text>
    </svg>`;
  }

  // ================================================================ profil
  function profilCiz() {
    const p = V.profil;
    const anahtar = (k, ad, acik) => `<button class="anahtar" role="switch" aria-checked="${!!V.ayar[k]}" data-k="${k}"><span><b>${ad}</b><br><span class="etiket-kucuk">${acik}</span></span><span class="dugme"></span></button>`;
    $("#sayfa").innerHTML = `
      <div class="sayfa-bas"><h1><small>Bilgilerin ve ayarlar</small>Profil</h1></div>
      <div class="kart"><h3>PROFİLİN</h3>
        <div class="profil-ozet">
          <div><small>Cinsiyet · yaş</small><b>${p.cinsiyet === "kadin" ? "Kadın" : "Erkek"} · ${p.yas}</b></div>
          <div><small>Boy · kilo</small><b>${p.boy} cm · ${fmtKg(p.kilo)} kg</b></div>
          <div><small>Deneyim</small><b>${DENEYIM[p.deneyim].ad}</b></div>
          <div><small>Hedef</small><b>${HEDEFLER[p.hedef].ad}</b></div>
          <div><small>Gün</small><b>Haftada ${p.gun} gün</b></div>
          <div><small>Ekipman</small><b>${{ salon: "Spor salonu", ev: "Evde dambıl", vucut: "Vücut ağırlığı" }[p.ekip]}</b></div>
        </div>
        <div class="tabaka-btn"><button class="ikinci-btn" id="duzenle">Profili düzenle</button></div>
      </div>
      <div class="kart"><h3>AYARLAR</h3>
        ${anahtar("ses", "Ses", "Set ve dinlenme bitince kısa bir bip")}
        ${anahtar("titresim", "Titreşim", "Dinlenme bitince telefon titrer")}
        ${anahtar("ekran", "Ekran açık kalsın", "Antrenman sırasında ekran kararmasın")}
      </div>
      <div class="kart"><h3>VERİLER</h3>
        <p class="etiket-kucuk" style="margin-bottom:12px">Her şey sadece bu telefonda saklanır; hesap yok, internet gerekmez.</p>
        <div class="tabaka-btn" style="margin-top:0"><button class="ikinci-btn" id="disa">Yedeği indir</button><button class="ikinci-btn" id="sifirla" style="color:#ff8a8a">Her şeyi sıfırla</button></div>
      </div>
      <p class="not">Winter Gym'in önerdiği ağırlıklar genel bir başlangıç noktasıdır. Formu bozmadan yapabileceğin ağırlıkla çalış; bir hareket ağrı yaparsa dur. Sağlık sorunun varsa doktoruna danış.</p>
      <p class="etiket-kucuk" style="text-align:center;margin-top:22px">❄ Winter Gym · ENS Developer · Kış gelir, kod yazılır</p>`;
    $("#duzenle").onclick = () => kurulumAc(true);
    $("#sayfa").querySelectorAll(".anahtar").forEach(b => b.onclick = () => { V.ayar[b.dataset.k] = !V.ayar[b.dataset.k]; kaydet(); profilCiz(); });
    $("#disa").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(V, null, 2)], { type: "application/json" }));
      a.download = `winter-gym-yedek-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    };
    $("#sifirla").onclick = () => onayla("Her şey silinsin mi?", "Profilin, programın ve bütün antrenman geçmişin silinir. Bu geri alınamaz.", "Evet, sıfırla", () => {
      try { localStorage.removeItem(ANAHTAR); } catch { }
      V = { profil: null, program: null, gecmis: [], siradaki: 0, kilolar: [], ayar: { ses: true, titresim: true, ekran: true }, aktif: null };
      kurulumAc();
    });
  }

  // ================================================================ kar (marka imzası, hafif)
  (function () {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("#kar"), x = c.getContext("2d");
    let w, h, t;
    const boyut = () => { const r = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w * r; c.height = h * r; x.setTransform(r, 0, 0, r, 0, 0); t = Array.from({ length: Math.round(w * h / 22000) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .5 + Math.random() * 1.4, s: .2 + Math.random() * .5, f: Math.random() * 6 })); };
    addEventListener("resize", boyut); boyut();
    (function ciz() {
      x.clearRect(0, 0, w, h); x.fillStyle = "#fff";
      for (const k of t) { k.y += k.s; k.f += .01; k.x += Math.sin(k.f) * .2; if (k.y > h) { k.y = -4; k.x = Math.random() * w; } x.globalAlpha = .25 + k.r / 4; x.beginPath(); x.arc(k.x, k.y, k.r, 0, 7); x.fill(); }
      requestAnimationFrame(ciz);
    })();
  })();

  // Android geri tuşu: önce tabakayı / dinlenmeyi kapat
  addEventListener("popstate", () => {
    if (!$("#tabaka").hidden) { tabakaKapat(); history.pushState(null, ""); }
    else if (!$("#dinlenme").hidden) { dinlenmeBitir(true); history.pushState(null, ""); }
  });
  history.pushState(null, "");
  document.addEventListener("visibilitychange", () => { if (!document.hidden && V.aktif && !$("#antrenman").hidden) ekranAcik(true); });

  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

  // ================================================================ başlat
  if (!V.profil || !V.program) kurulumAc();
  else { $("#uyg").hidden = false; git("bugun"); if (V.aktif) antrenmanAc(); }

  // Testler ve tanıtım videosu için
  window.WinterGym = { veri: () => V, yaz: v => { V = v; kaydet(); }, git, antrenmanBasla, dinlenmeBitir };
})();
