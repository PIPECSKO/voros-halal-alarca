# 🎭 Vörös Halál Álarca (The Red Death's Mask)

Magyar többjátékos társasjáték Edgar Allan Poe "A vörös halál álarca" novellája alapján.

## 🎮 Játék Leírása

Egy kastélyban tartott bálon a játékosok különböző szerepeket játszanak:
- **👑 Herceg**: Megölheti a Pestist, ha megtalálja
- **🏰 Nemesek**: Irányítják a népet és feladatokat adnak
- **👥 Nép**: Teljesítik a feladatokat és túlélésért küzdenek  
- **☠️ Pestis**: Titokban fertőz és megöl másokat

## 🚀 Online Játék Indítása

### Glitch.com (Ajánlott - Ingyenes)

1. **Menj ide:** https://glitch.com
2. **Kattints:** "New Project" → "Import from GitHub"
3. **Add meg:** a GitHub repo URL-t
4. **Várj 1-2 percet** - automatikusan elindul!
5. **Kapsz egy URL-t:** `https://your-project.glitch.me`

**Részletes útmutató:** [GLITCH_SETUP.md](GLITCH_SETUP.md)

## 🏠 Helyi Fejlesztés

```bash
# Függőségek telepítése
npm install

# Szerver indítása
npm start

# Játék megnyitása
http://localhost:3001
```

## 📁 Projekt Struktúra

```
├── client/           # Kliens oldali fájlok
│   ├── index.html   # Főoldal
│   ├── styles.css   # Stílusok
│   └── src/         # JavaScript modulok
├── server/          # Szerver oldali kód
│   └── index.js     # Express + Socket.io szerver
├── package.json     # Függőségek
└── glitch.json      # Glitch.com konfiguráció
```

## 🎯 Játékszabályok

### Szerepek:
- **Herceg (1)**: Megölheti a Pestist
- **Nemesek (2-5)**: Irányítják a csoportokat
- **Nép**: Teljesítik a feladatokat
- **Pestis (1)**: Titokban fertőz

### Cél:
- **Nép + Herceg**: Túlélni éjfélig vagy megölni a Pestist
- **Pestis**: Megfertőzni mindenkit

### Játékmenet:
1. **Körök**: 18:00-tól 24:00-ig (6 kör)
2. **Feladatok**: Minden körben teljesíteni kell
3. **Megbeszélés**: Minden kör után
4. **Akciók**: Pestis fertőz, Herceg öl

## 🛠️ Technológiák

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Kommunikáció**: Socket.io (WebSocket)
- **Hosting**: Glitch.com (ingyenes)

## 📝 Licenc

MIT License - Lásd [LICENSE](LICENSE) fájlt.

## 🎨 Grafikai Elemek

A játék a Universal LPC Spritesheet-et használja (CC-BY-SA 3.0).

---

**🎮 Játssz online:** https://glitch.com → Import this project! 