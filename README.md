# OutfitScore

PWA (iPhone + Android) care evalueaza, la alegere, machiajul si coafura, tinuta sau ambele, in functie de ocazie si de cat de mult vrei sa iesi in evidenta. Fiecare evaluare are chestionarul ei; se propun maxim 3 variante de imbunatatire cu magazin si scor estimat.

- Frontend: `public/` (HTML/CSS/JS, manifest, service worker)
- Server: `netlify/functions/analyze.mts` -> `/api/analyze` (Claude cu cheia proprie din variabila `CLAUDE_API_KEY`; rezerva: Netlify AI Gateway, raspuns in streaming, rate limit 5/minut/IP)
- Modelul se poate schimba cu variabila de mediu `OUTFIT_MODEL` (implicit `claude-sonnet-5-5`).
- Pozele nu sunt salvate.

Scor tinuta: colorit 25%, ocazie 25%, accesorii 15%, incaltaminte 15%, croiala 10%, obiectiv 10%. Scor machiaj si coafura: baza 20%, ochi 15%, buze si obraji 10%, armonie 15%, coafura 25%, ocazie 15%. Criteriile nevizibile se exclud si ponderile se renormalizeaza; la "Ambele", scorul general = media celor doua.

## Functii noi
- Recomandari: pana la 5, fiecare produs cu cate un magazin pe nivel de pret (accesibil / mediu / premium); nivelul de buget ales apare primul. Clasificarea magazinelor pe niveluri e orientativa.
- Raport PDF generat pe telefon (jsPDF, `public/vendor/jspdf.umd.min.js`), cu optiune de partajare pe mobil.
