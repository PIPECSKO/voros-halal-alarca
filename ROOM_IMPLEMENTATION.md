# Orange és Green Szoba Implementáció

## Összefoglaló

Az Orange (Narancssárga) és Green (Zöld) szobák sikeresen aktiválva a "Vörös halál álarca" játékban.

## Implementált módosítások

### 1. Map.js frissítés
- **Fájl:** `src/map.js`
- **Módosítások:**
  - Hozzáadva az orange és green szoba képek a `roomImages` objektumhoz
  - Implementálva a képek betöltése az `init()` függvényben
  - Hozzáadva a képek megjelenítése a `draw()` függvényben
  - Implementálva a `getRoomFromPosition()` függvény a szoba detektáláshoz

### 2. Szoba képek
- **Orange szoba:** `assets/images/map/orange_room.png` (19KB)
- **Green szoba:** `assets/images/map/green_room.png` (21KB)

## Technikai részletek

### Szoba rendszer:
```javascript
rooms: [
  { id: 'black', name: 'Fekete', color: '#000000', x: 0 },
  { id: 'purple', name: 'Lila', color: '#800080', x: 1 },
  { id: 'white', name: 'Fehér', color: '#F5F5F5', x: 2 },
  { id: 'orange', name: 'Narancssárga', color: '#FF8C00', x: 3 },  ✅
  { id: 'green', name: 'Zöld', color: '#228B22', x: 4 },            ✅
  { id: 'red', name: 'Piros', color: '#DC143C', x: 5 },
  { id: 'blue', name: 'Kék', color: '#4169E1', x: 6 }
]
```

### Szoba képek betöltése:
```javascript
// Orange szoba
this.roomImages.orange = new Image();
this.roomImages.orange.src = 'assets/images/map/orange_room.png';

// Green szoba
this.roomImages.green = new Image();
this.roomImages.green.src = 'assets/images/map/green_room.png';
```

### Megjelenítés logika:
```javascript
// Orange szoba megjelenítése
if (room.id === 'orange' && this.roomImages.orange && this.roomImages.orange.complete) {
  this.ctx.drawImage(this.roomImages.orange, roomX, roomY, this.roomWidth, this.roomHeight);
}

// Green szoba megjelenítése
if (room.id === 'green' && this.roomImages.green && this.roomImages.green.complete) {
  this.ctx.drawImage(this.roomImages.green, roomX, roomY, this.roomWidth, this.roomHeight);
}
```

## Funkcionalitás

### Szoba átmenetek
- A játékosok szabadon mozoghatnak az orange és green szobák között
- A kamera simán követi a játékost a szobák között
- A minimap megfelelően jelzi az aktuális szobát

### Feladatok
- A feladatok rendszer már támogatja az orange és green szobákat
- A UI megfelelően fordítja a szoba neveket:
  - `orange` → "Narancssárga"
  - `green` → "Zöld"

### Név címkék
- A játékos név címkék megfelelően működnek az orange és green szobákban
- A csoport színek megfelelően megjelennek

## Teljes szoba lista

### Képes szobák (PNG háttérrel):
1. **Blue (Kék)** - `blue_room.png` ✅
2. **Red (Piros)** - `red_room.png` ✅
3. **Orange (Narancssárga)** - `orange_room.png` ✅ *(ÚJ)*
4. **Green (Zöld)** - `green_room.png` ✅ *(ÚJ)*

### Színes szobák (CSS háttérrel + padló):
5. **Black (Fekete)** - `#000000` + barna padló
6. **Purple (Lila)** - `#800080` + barna padló  
7. **White (Fehér)** - `#F5F5F5` + barna padló

## Státusz

✅ **BEFEJEZVE** - Az orange és green szobák teljesen integrálva és használatra készek.

## Jövőbeli fejlesztések

Ha a fennmaradó szobákhoz is készülnek képek:
1. Új PNG fájlok elhelyezése: `assets/images/map/` mappában
2. Hozzáadás a `roomImages` objektumhoz
3. Betöltés implementálása az `init()` függvényben
4. Megjelenítés hozzáadása a `draw()` függvényben 