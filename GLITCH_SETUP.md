# 🚀 Glitch.com Telepítési Útmutató

## 🎯 Miért Glitch.com?
- ✅ **Teljesen ingyenes**
- ✅ **Azonnali deployment** 
- ✅ **Nincs regisztráció szükséges**
- ✅ **Automatikus HTTPS**
- ✅ **Egyszerű használat**

## 📦 1. Projekt Előkészítése

A projekt már készen áll a Glitch.com-ra! Minden szükséges fájl megvan:
- ✅ `package.json` - függőségek
- ✅ `glitch.json` - Glitch konfiguráció
- ✅ `server/index.js` - szerver
- ✅ `client/` - játék fájlok

## 🌐 2. Glitch.com Telepítés

### Módszer A: GitHub-ról (Ajánlott)
1. **Töltsd fel GitHub-ra:**
   - Hozz létre új repository-t GitHub-on
   - Push-old fel a projektet

2. **Import Glitch-re:**
   - Menj ide: https://glitch.com
   - Kattints **"New Project"**
   - Válaszd **"Import from GitHub"**
   - Add meg a GitHub repo URL-t
   - Várj 1-2 percet

### Módszer B: Zip Upload
1. **Zip készítése:**
   - Tömörítsd be a teljes projektet
   - **NE** add hozzá: `node_modules`, `ngrok.exe`, `node_js`

2. **Upload Glitch-re:**
   - Menj ide: https://glitch.com
   - Kattints **"New Project"**
   - Húzd be a zip fájlt
   - Várj 1-2 percet

## 🎮 3. Játék Tesztelése

1. **Automatikus URL:**
   - Glitch automatikusan ad egy URL-t: `https://your-project-name.glitch.me`

2. **Tesztelés:**
   - Nyisd meg az URL-t
   - Ellenőrizd: "Kapcsolódva" státusz
   - Hozz létre szobát
   - Másik böngészőben csatlakozz

## 🔧 4. Beállítások

### Projekt Név Változtatása:
1. Glitch-ben kattints a projekt nevére
2. Írj be új nevet
3. Az URL automatikusan frissül

### Egyéni Domain (Opcionális):
- Glitch Pro-val saját domain használható
- Ingyenes verzióban: `your-name.glitch.me`

## 🆘 5. Hibaelhárítás

### "Kapcsolat megszakítva" hiba:
- **Várj 1-2 percet** (cold start)
- Frissítsd az oldalt
- Ellenőrizd a browser console-t

### Lassú betöltés:
- **Első indítás:** 10-30 másodperc (cold start)
- **Utána:** Gyors lesz
- **5 perc inaktivitás után:** Újra alszik

### Szerver hibák:
1. Glitch-ben nyisd meg a **"Logs"** fület
2. Nézd meg a hibaüzeneteket
3. Ellenőrizd a `package.json` függőségeket

## 💡 6. Tippek

### Automatikus Ébresztés:
- Használj **UptimeRobot** vagy hasonló szolgáltatást
- Pingeli az URL-t 5 percenként
- Így mindig ébren marad

### Teljesítmény:
- **Ingyenes:** 1000 óra/hó
- **Korlátlan:** Glitch Pro ($8/hó)
- **Memória:** 512MB (ingyenes)

### Frissítés:
- **GitHub-ról:** Automatikus sync
- **Manuálisan:** Szerkeszd a fájlokat Glitch-ben

## 🎉 7. Kész!

Most már van egy stabil, ingyenes online játékod!

**URL példa:** `https://voros-halal-alarca.glitch.me`

Oszd meg a linket barátaiddal és játsszatok! 🎮

---

**🔗 Hasznos linkek:**
- Glitch.com: https://glitch.com
- Glitch Docs: https://help.glitch.com
- UptimeRobot: https://uptimerobot.com 