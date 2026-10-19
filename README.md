# Demir Fitness

Expo (React Native) ile yazılmış gym uygulaması. Tüm veriler cihazda (AsyncStorage) saklanır.

## Çalıştırma

```bash
cd demir-fitness
npm install
npx expo install expo@latest     # telefondaki Expo Go'nun SDK sürümüne eşitler
npx expo install --fix           # diğer paketleri o sürüme uyumlu hale getirir
npx expo start
```

Telefona **Expo Go** uygulamasını kur, terminaldeki QR kodu okut.

## Özellikler

- **SQLite veritabanı** (`expo-sqlite`): planlar, antrenmanlar, her set, ölçümler telefonda kalıcı saklanır. Eski sürümdeki veriler ilk açılışta otomatik taşınır.
- **59 hareketlik kütüphane**: 6 kas grubu, açıklama, ipuçları, hedef set/tekrar/dinlenme.
- **Hareket detayı**: kişisel rekorlar (en ağır, tahmini 1RM, en çok tekrar) ve son antrenmanlardaki gelişim grafiği.
- **Antrenman geçmişi**: aylara göre liste, her antrenmanın set set detayı, silme.
- **Rekorlar**: tüm hareketlerdeki en iyi derecen; antrenman bitince kırılan rekorlar bildirilir.
- **Dinlenme sayacı**: set tamamlanınca otomatik başlar, ±15 sn, atla, bitince titreşim.
- **Plan düzenleme**: hareket ekle/çıkar/sırala, set, tekrar ve dinlenme süresi ayarla; hazır programları kopyalayıp düzenle.
- **Yedekleme**: Profil > Verileri yedekle ile tüm veriyi JSON olarak paylaş.

## Veritabanı şeması

| Tablo | İçerik |
|---|---|
| `exercises` | Hareket kütüphanesi (yerleşik + ileride özel hareketler) |
| `plans`, `plan_items` | Planlar ve sıralı hareketleri (set, tekrar, dinlenme) |
| `workouts`, `workout_sets` | Biten antrenmanlar ve her setin kg/tekrarı |
| `measurements` | Kilo, bel, göğüs ölçümleri |
| `settings` | Kullanıcı adı, seed/migration bayrakları |

Kod: `src/data/db.js` (SQL), `src/data/store.js` (uygulama durumu), `src/data/exercises.js` (hareket listesi — yeni hareket eklemek için buraya ekleyip `SEED_VERSION`'ı artır).

APK: `main`'e her push'ta GitHub Actions derler → [son sürümü indir](https://github.com/Enskygr234/Winter-gym/releases/download/son-surum/demir-fitness.apk)
