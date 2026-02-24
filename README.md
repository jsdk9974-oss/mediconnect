# MediConnect 🏥

Application médicale intelligente — Analyse de symptômes par IA + Orientation spécialiste.

## Installation locale

1. Installe les dépendances :
```
npm install
```

2. Crée un fichier `.env.local` à la racine du projet et ajoute ta clé API :
```
ANTHROPIC_API_KEY=sk-ant-api03-XXXX-ta-clé-ici
```

3. Lance le serveur de développement :
```
npm run dev
```

4. Ouvre http://localhost:3000 dans ton navigateur.

## Déploiement sur Vercel

1. Mets le code sur GitHub (voir instructions séparées)
2. Connecte le repo GitHub à Vercel
3. Dans Vercel → Settings → Environment Variables, ajoute :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : ta clé API Claude
4. Clique sur "Deploy"

## Structure du projet

```
mediconnect/
├── app/
│   ├── page.js          → Page d'accueil
│   ├── analyse/page.js  → Page d'analyse des symptômes
│   ├── api/analyser/    → API Claude (backend)
│   ├── globals.css      → Styles globaux
│   └── layout.js        → Layout principal
├── .env.local           → Tes clés API (JAMAIS sur GitHub)
└── package.json
```

## Mention légale

MediConnect est un outil d'orientation médicale uniquement.
Il ne pose pas de diagnostic et ne remplace pas l'avis d'un professionnel de santé.
