# OutfitScore

PWA (iPhone + Android) care scoreaza tinuta dintr-un selfie, in functie de ocazie si de cat de mult vrei sa iesi in evidenta, si propune maxim 3 variante de imbunatatire cu magazin si scor estimat.

- Frontend: `public/` (HTML/CSS/JS, manifest, service worker)
- Server: `netlify/functions/analyze.mts` -> `/api/analyze` (Claude prin Netlify AI Gateway, raspuns in streaming, rate limit 5/minut/IP)
- Modelul se poate schimba cu variabila de mediu `OUTFIT_MODEL` (implicit `claude-sonnet-5-5`).
- Pozele nu sunt salvate.

Scor total = medie ponderata a criteriilor vizibile: colorit 25%, ocazie 25%, accesorii 15%, incaltaminte 15%, croiala 10%, obiectiv 10%.
