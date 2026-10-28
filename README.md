# LabyrintLab

**Testa, jämför och förstå sökalgoritmer**

LabyrintLab är ett pedagogiskt verktyg för gymnasiekursen *Artificiell intelligens nivå 1*. Eleverna förutsäger, kör steg för steg och jämför fem sökmetoder i samma labyrint:

- **Slump** – slumpmässig sökning (lista med slumpvis uttag, oinformerad). Fungerar som referenspunkt: hur mycket bättre än slumpen är de andra?
- **BFS** – bredden först-sökning (kö, oinformerad)
- **DFS** – djupet först-sökning (stack, oinformerad)
- **Greedy Best-First Search** (prioritetskö på h, informerad)
- **A\*** (prioritetskö på f = g + h, informerad)

Appen är inget spel där eleven styr en figur. Eleven väljer en algoritm och följer hur den arbetar: vilken nod som tas ut, vilka grannar som läggs till och hur kön, stacken eller prioritetskön förändras.

## Pedagogisk idé

Varje övning följer sekvensen **förutsäg → testa → observera → jämför → reflektera**:

1. **Förutsäg** – Vilken algoritm tror du fungerar bäst på denna bana?
2. **Testa** – Välj algoritm och kör med *Steg*, *Auto* eller *Snabbkör*.
3. **Observera** – Följ rutnätet, datastrukturen och texten "Vad händer nu?".
4. **Jämför** – Kör samma bana med en annan algoritm. Resultaten samlas i en tabell.
5. **Reflektera** – Diskutera frågorna som visas när minst två algoritmer körts.

Stegen i raden högst upp fungerar som flikar: panelen till höger visar ett steg i taget, så att labyrinten och det aktuella steget ryms på skärmen utan att man behöver scrolla. Appen går vidare till nästa steg av sig själv vid naturliga tillfällen (t.ex. Starta → Observera), men man kan alltid klicka sig fram och tillbaka.

Ingen algoritm markeras som "vinnare" – eleverna ska resonera om vad som är bäst beroende på vad man värderar.

### Banorna

Det finns medvetet bara tre fasta banor, så att fokus ligger på jämförelsen mellan algoritmer. Siffrorna är besökta noder / väglängd.

| Bana | Syfte | BFS | DFS | Greedy | A\* |
|---|---|---|---|---|---|
| **1. Grundbanan** | Alla hittar fram. BFS:s bredd och DFS:s djupa sökning syns tydligt; Greedy och A\* går en intuitiv väg. | 121 besökta / väg 20 | 27 / 26 | 23 / 20 | 23 / 20 |
| **2. Fallgropen** | En korridor pekar rakt mot målet men blir en lång omväg. Greedy och DFS går i fällan, A\* vänder i tid. | 79 / 18 | 50 / 32 | 33 / 32 | 35 / 18 |
| **3. Återvändsgränden** | En korridor pekar rakt mot målet men är stängd. DFS, Greedy och även A\* går in och måste backa – heuristiken "ser" inte väggar. | 70 / 18 | 85 / 24 | 27 / 18 | 27 / 18 |

**Bana 4: Egen bana.** Eleven ritar väggar (klicka eller dra), flyttar start och mål (dra S eller flaggan, eller använd verktygen Start/Mål) och kan börja från en tom bana eller en kopia av en fast bana. Panelen visar hela tiden om det finns en väg och hur lång den kortaste är. Banan körs med exakt samma algoritmer, stegning och jämförelse som de fasta banorna. Ritläget är aktivt i steget Förutsäg; när banan ändras rensas tidigare resultat för den, eftersom de inte längre gäller. Finns ingen väg söker algoritmerna igenom allt de når och ger sedan upp, vilket också går att diskutera. Den egna banan finns bara i minnet under sessionen.

**Slump** ger olika resultat varje gång. På Grundbanan besöker den typiskt 75–125 noder (median 115) med en väg på 20–28 steg, och på Fallgropen och Återvändsgränden blir vägen oftast runt 22 steg. Kör den gärna flera gånger och jämför – resultattabellen visar den senaste körningen.

Det pedagogiska syftet med varje bana är dokumenterat i [lib/mazes.ts](lib/mazes.ts), och banornas viktigaste egenskaper (t.ex. att Greedy luras i Fallgropen och att A\* går in i återvändsgränden) kontrolleras av testerna.

### Viktiga definitioner

- **Grannordning:** upp, höger, ned, vänster. Ordningen påverkar särskilt DFS, som därför alltid försöker gå uppåt först.
- **Manhattanavstånd:** `h = |x1 - x2| + |y1 - y2|` (x = kolumn, y = rad). Inga diagonala steg.
- **Besökta noder:** antal noder som tagits ut ur frontier och undersökts.
- **Väglängd:** antal förflyttningar från start till mål.
- **Max frontier:** största antal noder i kön/stacken/prioritetskön samtidigt – en förenklad proxy för minnesbehov.
- **Kortaste väg: Ja/Nej:** "Den väg som algoritmen hittade har samma längd som den kortaste möjliga vägen i denna bana." Den optimala längden beräknas internt med BFS.
- **Slump:** nästa nod lottas fram i det ögonblick man klickar på Steg, därför visas ingen "Nästa" i listan. Testerna använder en slumptalsgenerator med fast frö så att de blir reproducerbara.
- **Lika prioritet:** Greedy tar ut den nod som lades in först. A\* väljer lägst h vid lika f, därefter den som lades in först.
- Exekveringstid visas medvetet inte – den beror på dator och implementation.

### Projektor och tangentbord

- **Fokusläge** döljer rubrikrad och arbetsgång så att labyrinten och panelen blir så stora som möjligt. `Esc` lämnar fokusläget.
- Tangenten **→** kör ett steg (i Observera).
- Start och mål har symboler (S och flagga), och besökta/frontier/aktuell nod har både färg och mönster, så färg är inte den enda informationsbäraren.

## Kom igång

Kräver Node.js 20.9 eller senare (Node 24 rekommenderas).

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # algoritmtester (Vitest)
npm run lint
npm run build
```

## Arkitektur

Next.js (App Router) + TypeScript + React med vanlig CSS. Ingen backend, ingen databas, ingen inloggning och ingen insamling av elevdata. Allt körs i webbläsaren, och resultaten finns bara i minnet under den aktuella sessionen.

```
app/
  page.tsx              Startsida
  lab/page.tsx          Själva labbet
  layout.tsx, globals.css
components/
  Lab.tsx               Tillstånd och layout: aktivt steg, bana, algoritm, gissning, resultat
  MazeGrid.tsx          Rutnätet, inklusive ritläget för den egna banan (ingen algoritmlogik)
  DataStructureView.tsx Kö / stack / prioritetskö med g, h, f
  Panels.tsx            Arbetsgång (flikar), algoritminfo, mätvärden, jämförelse, reflektion
  HowItWorks.tsx        "Så fungerar det"-dialogen
hooks/
  useSearchRunner.ts    Driver en algoritm: Steg, Auto, Pausa, Snabbkör, Återställ
lib/
  mazes.ts              De tre fasta banorna och hjälpfunktioner för den egna banan
  describe.ts           Svensk förklaring av varje steg
  search/
    types.ts            Maze, SearchStep, FrontierEntry …
    common.ts           Grannar, Manhattanavstånd, prioritetskö, vägrekonstruktion
    random.ts  bfs.ts  dfs.ts  greedy.ts  astar.ts
    index.ts            Algoritmregister, resultatmått
tests/
  search.test.ts
```

### Stegvis sökning

Varje algoritm är en **generator** som levererar ett `SearchStep` per iteration:

1. ta nästa nod ur frontier
2. markera den som aktuell/besökt
3. undersök dess grannar
4. lägg relevanta grannar i frontier

Inget räknas ut i förväg: varje klick på **Steg** anropar `generator.next()` en gång. **Auto** gör samma sak med jämna mellanrum (långsam/normal/snabb) och **Snabbkör** kör generatorn till slut. Visualiseringen läser bara `SearchStep` (aktuell nod, besökta, frontier, tillagda noder, föräldrapekare, g/h/f, väg) och innehåller ingen algoritmlogik.

## Deployment till Vercel

Projektet behöver ingen konfiguration utöver standard för Next.js.

1. Pusha repositoryt till GitHub.
2. På [vercel.com](https://vercel.com): **Add New → Project** och importera repositoryt.
3. Vercel känner igen Next.js automatiskt (build: `npm run build`). Inga miljövariabler behövs.
4. Varje push till `main` deployas automatiskt till produktion; andra brancher och pull requests får förhandsversioner.

Alternativt med Vercel CLI:

```bash
npm i -g vercel
vercel        # förhandsversion
vercel --prod # produktion
```
