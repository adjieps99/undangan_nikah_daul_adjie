# Run Adjie & Daulika locally (Windows + Anaconda)

This project is a Node.js/Express application. The Anaconda environment is used as the terminal environment; Node.js and npm must be available inside that terminal.

## 1. Open Anaconda Prompt

```bat
conda activate undangan
node --version
npm --version
```

If either version command is not recognized, install Node.js LTS and reopen Anaconda Prompt. Do not install Python packages for this project.

## 2. Extract the project ZIP

Extract `undangan_nikah_daul_adjie-head-refinement.zip` to a normal writable folder, for example:

```text
D:\Projects\undangan_nikah_daul_adjie
```

Then enter the extracted project directory (the folder that contains `package.json`):

```bat
cd /d D:\Projects\undangan_nikah_daul_adjie
```

## 3. Install project dependencies

Run once after extraction, or again whenever `package.json` changes:

```bat
npm install
```

The app loads Three.js in the browser through the import map in `index.html`. The `three` npm dependency is also included so the automated Node.js tests can import the same geometry code.

## 4. Start the local server

```bat
npm run dev
```

Wait until the terminal reports that the server is listening on port `3000`. Keep this terminal open while using the site.

Open the live wedding hall:

```text
http://localhost:3000/?phase=hall&debug=1
```

Open the character inspection studio (V3):

```text
http://localhost:3000/?phase=adjie_prototype&debug=1&avatar=v3&angle=closeup&gender=female&hairStyle=hijab&outfit=kebaya_putih&accessory=none
```

Useful inspection variants:

```text
http://localhost:3000/?phase=adjie_prototype&debug=1&avatar=v3&angle=closeup&gender=male&hairStyle=short&outfit=beskap_hitam&accessory=none
http://localhost:3000/?phase=adjie_prototype&debug=1&avatar=v3&angle=closeup&gender=female&hairStyle=long&outfit=kebaya_putih&accessory=none
http://localhost:3000/?phase=adjie_prototype&debug=1&avatar=v3&angle=closeup&gender=female&hairStyle=wavy&outfit=dress&accessory=none
```

## 5. Run checks

In a second Anaconda Prompt, activate the same environment and enter the project folder:

```bat
conda activate undangan
cd /d D:\Projects\undangan_nikah_daul_adjie
npm test
npm run lint
npm run build
```

`npm test` runs the core regression tests. `npm run lint` runs TypeScript checking without emitting files. `npm run build` runs the project's configured TypeScript build check.

## 6. Stop the server

Return to the terminal running `npm run dev` and press `Ctrl + C`.

## Notes

- The live Main Hall player, groom, bride, and seated guest avatars now explicitly use procedural V3.
- The prototype page still supports V1/V2/V3 comparisons through its model controls.
- Body geometry below the neck, movement, sitting alignment, wedding environment, invitation content, and existing UI were not redesigned in this head-refinement update.
- The audio directory is intentionally left as supplied in the compact source archive. Add your audio files back into `static/audio/tracks/` when ready.
- Do not copy `node_modules` into the ZIP. `npm install` recreates it locally.
