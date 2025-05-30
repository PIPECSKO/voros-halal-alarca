# Male5, Male6, Female5 és Female6 Karakter Implementáció

## Összefoglaló

A Male5, Male6, Female5 és Female6 karakterek sikeresen hozzáadva a "Vörös halál álarca" játékhoz.

## Implementált módosítások

### 1. UI.js frissítés
- **Fájl:** `src/ui.js`
- **Módosítás:** `setupLobbyCharacterSelection()` függvényben a karakterek listájához hozzáadva:
  ```javascript
  // Male karakterek:
  { key: 'male5', img: 'assets/images/characters/males/male5/idle/male5_idle_facing_right1.png' }
  { key: 'male6', img: 'assets/images/characters/males/male6/idle/male6_idle_facing_right1.png' }
  
  // Female karakterek:
  { key: 'female5', img: 'assets/images/characters/females/female5/idle/female5_idle_facing_right1.png' }
  { key: 'female6', img: 'assets/images/characters/females/female6/idle/female6_idle_facing_right1.png' }
  ```

### 2. Game.js frissítés
- **Fájl:** `src/game.js`
- **Módosítás:** `showCharacters()` függvényben a karakterek tömbhöz hozzáadva:
  ```javascript
  male: ['male1', 'male2', 'male3', 'male4', 'male5', 'male6']
  female: ['female1', 'female2', 'female3', 'female4', 'female5', 'female6']
  ```

## Karakter Assets Ellenőrzés

### Male5 sprite fájlok:

#### Idle animáció (2 frame):
- `male5_idle_facing_left1.png`
- `male5_idle_facing_left2.png`
- `male5_idle_facing_right1.png`
- `male5_idle_facing_right2.png`

#### Walk animáció (9 frame):
- `male5_walk_facing_left1.png` - `male5_walk_facing_left9.png`
- `male5_walk_facing_right1.png` - `male5_walk_facing_right9.png`

### Male6 sprite fájlok:

#### Idle animáció (2 frame):
- `male6_idle_facing_left1.png`
- `male6_idle_facing_left2.png`
- `male6_idle_facing_right1.png`
- `male6_idle_facing_right2.png`

#### Walk animáció (9 frame):
- `male6_walk_facing_left1.png` - `male6_walk_facing_left9.png`
- `male6_walk_facing_right1.png` - `male6_walk_facing_right9.png`

### Female5 sprite fájlok:

#### Idle animáció (2 frame):
- `female5_idle_facing_left1.png`
- `female5_idle_facing_left2.png`
- `female5_idle_facing_right1.png`
- `female5_idle_facing_right2.png`

#### Walk animáció (9 frame):
- `female5_walk_facing_left1.png` - `female5_walk_facing_left9.png`
- `female5_walk_facing_right1.png` - `female5_walk_facing_right9.png`

### Female6 sprite fájlok:

#### Idle animáció (2 frame):
- `female6_idle_facing_left1.png`
- `female6_idle_facing_left2.png`
- `female6_idle_facing_right1.png`
- `female6_idle_facing_right2.png`

#### Walk animáció (9 frame):
- `female6_walk_facing_left1.png` - `female6_walk_facing_left9.png`
- `female6_walk_facing_right1.png` - `female6_walk_facing_right9.png`

### Fájl struktúra:
```
assets/images/characters/
├── males/
│   ├── male5/
│   │   ├── idle/
│   │   │   ├── male5_idle_facing_left1.png
│   │   │   ├── male5_idle_facing_left2.png
│   │   │   ├── male5_idle_facing_right1.png
│   │   │   └── male5_idle_facing_right2.png
│   │   └── walk/
│   │       ├── male5_walk_facing_left1.png - male5_walk_facing_left9.png
│   │       └── male5_walk_facing_right1.png - male5_walk_facing_right9.png
│   └── male6/
│       ├── idle/
│       │   ├── male6_idle_facing_left1.png
│       │   ├── male6_idle_facing_left2.png
│       │   ├── male6_idle_facing_right1.png
│       │   └── male6_idle_facing_right2.png
│       └── walk/
│           ├── male6_walk_facing_left1.png - male6_walk_facing_left9.png
│           └── male6_walk_facing_right1.png - male6_walk_facing_right9.png
└── females/
    ├── female5/
    │   ├── idle/
    │   │   ├── female5_idle_facing_left1.png
    │   │   ├── female5_idle_facing_left2.png
    │   │   ├── female5_idle_facing_right1.png
    │   │   └── female5_idle_facing_right2.png
    │   └── walk/
    │       ├── female5_walk_facing_left1.png - female5_walk_facing_left9.png
    │       └── female5_walk_facing_right1.png - female5_walk_facing_right9.png
    └── female6/
        ├── idle/
        │   ├── female6_idle_facing_left1.png
        │   ├── female6_idle_facing_left2.png
        │   ├── female6_idle_facing_right1.png
        │   └── female6_idle_facing_right2.png
        └── walk/
            ├── female6_walk_facing_left1.png - female6_walk_facing_left9.png
            └── female6_walk_facing_right1.png - female6_walk_facing_right9.png
```

## Funkcionalitás

### Karakterválasztás
- A male5, male6, female5 és female6 karakterek most megjelennek a karakterválasztó felületen
- Elérhetők mind a lobby képernyőn, mind a játékbeli karakterválasztásban
- Kattintással kiválaszthatók

### Animációk
- Idle animáció: 2 frame-es loopolt animáció (balra és jobbra nézés)
- Walk animáció: 9 frame-es sétálási animáció (balra és jobbra nézés)
- Az animációs rendszer automatikusan felismeri és betölti a sprite-okat

## Státusz

✅ **BEFEJEZVE** - A male5, male6, female5 és female6 karakterek teljesen integrálva a játékba és használatra készek.

## Jövőbeli fejlesztések

Ha további karaktereket szeretnél hozzáadni (male7, female7, stb.), ugyanezt a mintát kell követni:
1. Sprite fájlok elhelyezése: `assets/images/characters/males/maleX/` vagy `assets/images/characters/females/femaleX/`
2. Hozzáadás a karakterlistákhoz UI.js és Game.js fájlokban
3. Tesztelés 