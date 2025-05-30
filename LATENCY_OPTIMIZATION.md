# Késleltetés optimalizálás / Latency Optimization

## Probléma / Problem

A játék lassú volt iskolai internetről Glitch.me szerveren keresztül, míg otthonról ugyanarról az URL-ről normális sebességgel működött.
The game was slow from school internet via Glitch.me server, while it worked at normal speed from home using the same URL.

## Okok / Causes

1. **Földrajzi távolság**: Glitch.me szerverek az USA-ban vannak, Magyarországtól 150-300ms ping
2. **Iskolai internet**: Lassabb/korlátozottabb sávszélesség
3. **Socket.io alapértelmezett beállítások**: Nem optimalizáltak nagy késleltetésre

## Megvalósított optimalizációk / Implemented Optimizations

### 1. Szerver oldali Socket.io konfiguráció / Server-side Socket.io Configuration

**Fájl**: `server/index.js` (21-38. sor)

```javascript
const io = socketIO(server, {
  // Optimalizált beállítások nagy késleltetés esetére
  connectTimeout: 30000,        // 15000 -> 30000 (több idő a csatlakozásra)
  pingTimeout: 20000,           // 10000 -> 20000 (türelmesebb ping timeout)
  pingInterval: 5000,           // 3000 -> 5000 (ritkább ping)
  upgradeTimeout: 20000,        // Új: websocket upgrade timeout
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 512              // 1024 -> 512 (kisebb fájlok tömörítése is)
  },
  maxHttpBufferSize: 5e5,       // 1e6 -> 5e5 (kisebb buffer a gyorsaságért)
  // Új optimalizációk
  compression: true,            // Üzenet tömörítés bekapcsolása
  httpCompression: true,        // HTTP tömörítés
  cookie: false,                // Cookie kikapcsolása a sebesség érdekében
  serveClient: false           // Socket.io kliens kiszolgálás letiltása
});
```

### 2. Heartbeat optimalizálás / Heartbeat Optimization

**Szerver** (`server/index.js`, 374-386. sor):
- Heartbeat intervallum: 10s -> 15s (ritkább)
- Latency mérés hozzáadása
- Részletes ping információ

**Kliens** (`src/socket_connector.js`, 97-119. sor):
- Latency számítás és megjelenítés
- Kapcsolat státusz színes jelzése ping alapján

### 3. Kliens oldali Socket.io konfiguráció / Client-side Socket.io Configuration

**Fájl**: `src/socket_connector.js` (69-82. sor)

```javascript
this.socket = io(serverUrl, {
  reconnectionAttempts: this.maxReconnectAttempts,
  reconnectionDelay: 2000,        // 1000 -> 2000 (lassabb újracsatlakozás)
  reconnectionDelayMax: 10000,    // 5000 -> 10000 (nagyobb max delay)
  timeout: 30000,                 // 20000 -> 30000 (több idő a kapcsolatra)
  transports: ['websocket', 'polling'],
  // Új optimalizációk nagy késleltetéshez
  upgrade: true,
  upgradeTimeout: 20000,
  forceNew: false,
  multiplex: true
});
```

### 4. Mozgás optimalizálás / Movement Optimization

**Fájl**: `src/game.js` (1708-1737. sor)

- **Throttling**: 200ms -> 500ms (ritkább pozíció küldés)
- **Threshold**: 10px -> 15px (nagyobb változás kell az küldéshez)
- **Tracking**: Csak jelentős változáskor küld adatot

```javascript
// Throttle position updates for high-latency connections
if (this.lastPositionUpdate && now - this.lastPositionUpdate < 500) {
  return;
}

// Only send if position changed significantly
const deltaX = Math.abs(this.position.x - this.lastSentPosition.x);
const deltaY = Math.abs(this.position.y - this.lastSentPosition.y);

if (deltaX < 15 && deltaY < 15 && this.lastSentMoving === Player.isMoving) {
  return; // Not enough change to warrant an update
}
```

### 5. CSS optimalizációk / CSS Optimizations

**Fájl**: `css/style.css` (új részek)

- Kapcsolat státusz színkódolás (zöld/narancs/piros)
- Lassú kapcsolatra optimalizált animációk
- Csökkentett mozgás hatások (`prefers-reduced-motion`)

```css
.status-connected { color: #4CAF50; } /* Zöld - jó ping */
.status-slow { color: #FF9800; }      /* Narancs - lassú ping */
.status-disconnected { color: #F44336; } /* Piros - nincs kapcsolat */

/* Lassú kapcsolatra optimalizált animációk */
.slow-connection {
  animation-duration: 2s !important;
  transition-duration: 0.5s !important;
}
```

### 6. Hálózati forgalom csökkentése / Network Traffic Reduction

- **Heartbeat ritkítása**: 10s -> 15s
- **Pozíció küldés ritkítása**: 200ms -> 500ms
- **Tömörítés bekapcsolása**: üzenetek és HTTP
- **Buffer méret csökkentése**: gyorsabb feldolgozás
- **Cookie kikapcsolása**: kevesebb overhead

## Ping megjelenítés / Ping Display

A játék most már megjeleníti a ping értéket:
- `Kapcsolódva (150ms ping)` - zöld, ha < 200ms
- `Kapcsolódva (300ms ping)` - narancs, ha > 200ms

## Eredmény / Result

Ezek az optimalizációk jelentősen javítják a játék teljesítményét nagy késleltetésű kapcsolatokon:

1. **Kevesebb hálózati forgalom** - ritkább küldés, tömörítés
2. **Türelmesebb timeouts** - nem szakad meg a kapcsolat
3. **Látható ping info** - felhasználó tudja mi a helyzet
4. **Optimalizált animációk** - simább élmény lassú neten

## Alternatív megoldások / Alternative Solutions

Ha a Glitch.me továbbra is túl lassú, fontold meg:

1. **Európai hosztolás**: 
   - Railway.app (EU szerverek)
   - Render.com (Frankfurt)
   - Vercel (Edge locations)

2. **Local network játék**:
   - `http://192.168.1.247:3001` (helyi hálózat)
   - `npm run dev` - fejlesztői szerver

3. **CDN használata**:
   - Statikus fájlok CDN-ről
   - Csak Socket.io a távoli szerverről

## Tesztelés / Testing

1. Nyisd meg: https://voros-halal-alarca.glitch.me/
2. Figyeld a kapcsolat státuszt (ping érték)
3. Teszteld a karaktermozgást
4. Ellenőrizd a gombresponzivitást

A ping értéknek most már láthatónak kell lennie a kapcsolat státusznál. 