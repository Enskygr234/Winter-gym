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

## Ekranlar

| Ekran | Dosya | Ne yapıyor |
|---|---|---|
| Ana Sayfa | `src/screens/HomeScreen.js` | Seri, günün planı, haftalık hacim/antrenman/kalori, hızlı erişim |
| Planlar | `src/screens/PlansScreen.js` | Hazır + kendi planların. Kendi planını silmek için basılı tut |
| Plan oluştur | `src/screens/CreatePlanScreen.js` | İsim + hareket seçimi, süre/kalori otomatik hesaplanır |
| Aktif antrenman | `src/screens/WorkoutScreen.js` | Sayaç, kg/rep girişi, set tamamla (✓), set ekle, ilerleme çubuğu. Ağırlıklar son antrenmandan gelir |
| İlerleme | `src/screens/ProgressScreen.js` | Kilo grafiği, ölçümler (kilo/bel/göğüs), haftalık hacim grafiği, yeni ölçüm ekleme |
| Hareketler | `src/screens/ExercisesScreen.js` | Arama + kas grubu filtresi |
| Profil | `src/screens/ProfileScreen.js` | İsim değiştirme, toplam istatistikler, son antrenmanlar, verileri sıfırla |

## Yapı

- `App.js` — sekmeler ve ekran geçişleri (ek navigation kütüphanesi yok, Android geri tuşu destekli)
- `src/data/defaults.js` — hareket listesi ve hazır planlar (yeni hareket eklemek için buraya ekle)
- `src/data/store.js` — tüm veri: planlar, antrenmanlar, ölçümler, seri ve haftalık özet hesabı
- `src/theme.js` — renkler ve yazı stilleri
- `src/components/` — ortak buton, kart, başlık ve alt sekme çubuğu

İlerleme ekranındaki kilo ölçümleri örnek veridir; Profil > "Verileri sıfırla" ile temizlenir.
