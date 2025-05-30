# Lépéshang Implementáció - Footstep Audio Implementation

## Bevezetés / Introduction

A "Vörös halál álarca" játékhoz implementált lépéshang rendszer, amely automatikusan lejátssza a lépéshangokat a karakterek mozgásakor.

Footstep sound system implemented for "The Red Death's Mask" game that automatically plays footstep sounds when characters move.

## Implementált fájlok / Implemented Files

### 1. `src/audio.js` (ÚJ / NEW)
**Funkció / Function:** Hangkezelő rendszer
- Kezeli a step1.mp3 és step2.mp3 fájlokat
- Automatikus felváltott lejátszás (nem monoton)
- Hangszint beállítása (30%)
- Hibaellenőrzés és fallback

**Főbb metódusok / Main methods:**
- `init()` - Audio rendszer inicializálása
- `loadSounds()` - Hangfájlok betöltése
- `playFootstep()` - Lépéshang lejátszása (felváltva)
- `playSound(soundName)` - Egyedi hang lejátszása

### 2. `src/player.js` (MÓDOSÍTOTT / MODIFIED)
**Változások / Changes:**
- Import Audio modul
- `previousAnimationFrame` változó hozzáadása
- `updateAnimation()` függvény bővítése lépéshang logikával
- Lépéshangok lejátszása az 1. és 4. frame-nél (gyors ritmus)
- Animáció sebesség: 10 tick (gyorsabb)
- `drawOtherPlayer()` és `drawBody()` függvények hozzáadása

### 3. `src/main.js` (MÓDOSÍTOTT / MODIFIED)
**Változások / Changes:**
- Import Audio modul
- Audio.init() hozzáadása az inicializálási sorrendhez
- window.Audio globális hozzáférhetőség

### 4. `src/game.js` (MÓDOSÍTOTT / MODIFIED)
**Változások / Changes:**
- `render()` függvény bővítése többjátékos támogatással
- Más játékosok és testek kirajzolása

## Hangfájlok / Sound Files

### Elhelyezés / Location
```
assets/sounds/
├── step1.mp3 (8.6KB)
└── step2.mp3 (7.6KB)
```

### Beállítások / Settings
- **Hangerő / Volume:** 30% (nem túl hangos)
- **Felváltás / Alternation:** step1 → step2 → step1 → step2...
- **Timing:** Walk animáció 1. és 4. frame-jénél (gyors ritmus)
- **Animáció sebesség:** 10 tick/frame (optimalizált)

## Működés / How It Works

### 1. Inicializálás / Initialization
```javascript
// main.js-ben
Audio.init(); // Hangfájlok betöltése
window.Audio = Audio; // Globális hozzáférés
```

### 2. Animáció és hanglejátszás / Animation and Sound Playback
```javascript
// player.js updateAnimation() függvényben
if (this.animationFrame === 1 || this.animationFrame === 4) {
    if (window.Audio && window.Audio.playFootstep) {
        window.Audio.playFootstep();
    }
}
```

### 3. Felváltott lejátszás / Alternating Playback
```javascript
// audio.js playFootstep() függvényben
const stepSound = this.currentFootstepIndex === 0 ? this.sounds.step1 : this.sounds.step2;
this.currentFootstepIndex = (this.currentFootstepIndex + 1) % 2;
```

## Többjátékos támogatás / Multiplayer Support

### Más játékosok / Other Players
- `Player.drawOtherPlayer(player)` - Más játékosok kirajzolása
- Karakterspecifikus animációk
- Pozíció szinkronizálás

### Testek / Bodies
- `Player.drawBody(body)` - Halott játékosok kirajzolása
- Időzítő indikátor
- Cleanup mechanizmus

## Hibaellenőrzés / Error Handling

### Browser Compatibility
- Modern Audio API használata
- Try-catch blokkok minden hang műveletnél
- Felhasználói interakció követelmény kezelése

### Fallback Logic
```javascript
stepSound.play().catch(err => {
    console.log("Audio play failed (user interaction required):", err.message);
});
```

## Teljesítmény / Performance

### Optimalizálás / Optimization
- Hangfájlok preload-olása
- currentTime = 0 reset újralejátszáshoz
- Memória hatékony implementáció

### Timing
- Walk animáció: 10 frame/tick (gyorsabb, optimalizált hangokhoz)
- Lépéshang: 1. és 4. frame (gyors ritmus, 3-6 frame távolság)

## Jövőbeli fejlesztések / Future Improvements

### Lehetséges bővítések / Possible Extensions
1. **Felületspecifikus hangok** - Különböző padlók (kő, fa, szőnyeg)
2. **Távolságalapú hangerő** - Más játékosok távolsága alapján
3. **Irányalapú hangorodás** - Stereo pozicionálás
4. **Sebességfüggő hangok** - Futás vs. séta

### Új hangok / New Sounds
- Ajtók nyitása/zárása
- Feladatok teljesítése
- UI hangeffektek
- Környezeti hangok

## Fájlstruktúra összefoglaló / File Structure Summary

```
src/
├── audio.js          (ÚJ - Audio rendszer)
├── player.js         (MÓDOSÍTOTT - Lépéshang logika)
├── main.js          (MÓDOSÍTOTT - Audio init)
├── game.js          (MÓDOSÍTOTT - Multiplayer render)
└── ...

assets/sounds/
├── step1.mp3
└── step2.mp3
```

## Tesztelés / Testing

### Funkcionális tesztek / Functional Tests
1. ✅ Lépéshangok lejátszódnak mozgáskor
2. ✅ Felváltott lejátszás működik
3. ✅ Hangok nem játszódnak idle állapotban
4. ✅ Hangerő megfelelő (30%)
5. ✅ Hibaellenőrzés működik

### Böngésző kompatibilitás / Browser Compatibility
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ⚠️  Felhasználói interakció szükséges (autoplay policy)

---

**Implementáció befejezve:** ✅  
**Tesztelve:** ✅  
**Dokumentálva:** ✅ 