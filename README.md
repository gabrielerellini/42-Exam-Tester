# 42 Exam Web IDE

Un'IDE web per esercitarsi agli esami di **42**, direttamente dal browser.

## ✨ Funzionalità

- **Editor basato su Ace** (lo stesso di onlineGDB) con syntax highlighting per C
- **Autocompletamento** con le parole locali del tuo codice
- **Highlight occurrences** — clicca su una variabile/funzione e vede tutte le occorrenze
- **Indentazione automatica** perfetta per C (tab reali)
- **Grademe** — test automatici con tracciamento degli errori
- **Salvataggio automatico** del codice ogni 30 secondi
- **Tracciamento progressi** — esercizi completati/falliti persistono in localStorage
- **Filtri** per esame (Exam 02, Exam 03, ...)
- **Badge colorati** per livello (0-3) e badge ⚠️ per esercizi incompleti
- **Zoom** dell'editor (pulsanti A+ / A−)
- **Tema scuro** Dracula

## 🚀 Installazione

```bash
git clone <url-della-tua-repo>
cd 42-exam-web-ide
npm install
npm start
```

Apri il browser su **http://localhost:4242**

## 🎮 Come usare

1. Seleziona un esercizio dalla sidebar sinistra
2. Leggi il subject (si apre cliccando sul nome dell'esercizio)
3. Scrivi il codice nell'editor
4. Premi **▶️ grademe** per testare
5. Se passa, l'esercizio viene segnato come completato ✅

### Scorciatoie

| Tasto | Azione |
|---|---|
| Ctrl+S | Salva il codice |
| Ctrl+R | Esegui grademe |

## 🧩 Struttura del progetto

```
42-EXAM-WEB/
├── .subjects/           # Esercizi (subject, tester, soluzione di riferimento)
│   ├── STUD_PART/       # Esercizi per studenti
│   └── PISCINE_PART/    # Esercizi per piscine
├── .system/             # Sistema di grading (compilazione, test)
├── index.html           # Frontend (Ace Editor + UI)
├── server.js            # Backend (Express)
├── package.json         # Dipendenze
└── README.md            # Questo file
```

## 🏷️ Cosa significa il badge

| Badge | Significato |
|---|---|
| L0 verde | Livello 0 — Facile |
| L1 blu | Livello 1 — Medio |
| L2 giallo | Livello 2 — Difficile |
| L3 rosso | Livello 3 — Molto difficile |
| ⚠️ grigio | Esercizio incompleto (manca subject o tester) |

## 🤝 Come contribuire

Hai un subject o un tester per un esercizio incompleto? Apri una pull request o segnalalo!

1. Trova l'esercizio in `.subjects/STUD_PART/exam_N/NOME/`
2. Se manca il subject, crea `attachment/subject.en.txt`
3. Se manca il tester, crea `tester.sh`
4. Fai una PR!

## 📜 Crediti

- **JCluzet** — Creatore del sistema di grading e tester originali (42_EXAM)
- **OnlineGDB** — Ispirazione per il comportamento dell'editor Ace
