# Musikspelare

En enkel webbapplikation som automatiskt visar och spelar MP3-filer från en "Songs"-mapp.

## Funktioner

- Visar alla MP3-filer från "Songs"-mappen
- Automatisk uppdatering när nya låtar läggs till eller tas bort
- Spelar låtar med en inbyggd musikspelare
- Enkel navigering mellan låtar

## Installation

1. Se till att du har [Node.js](https://nodejs.org/) installerat på din dator
2. Klona eller ladda ner detta repository
3. Öppna en terminal i projektmappen
4. Installera beroenden:

```
npm install
```

## Användning

1. Lägg dina MP3-filer i "Songs"-mappen
2. Starta servern:

```
npm start
```

3. Öppna webbläsaren och gå till: http://localhost:3000

## Automatisk uppdatering

Servern övervakar "Songs"-mappen och uppdaterar automatiskt webbsidan när nya låtar läggs till eller tas bort. Webbsidan kontrollerar också om det finns nya låtar varje minut.

## Teknologier

- Node.js med Express - backend
- Chokidar - för mappövervakning
- Vanilla JavaScript, HTML och CSS - frontend 