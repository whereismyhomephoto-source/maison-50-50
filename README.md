# Maison 50/50 — v15 · Mouvements modernes + correction bouton +

## Changements visibles
- Les cartes **Mouvements** sont réellement renouvelées : design bleu profond comme le total des dépenses, icône vectorielle par type de dépense, montant clairement à droite, métadonnées et répartition 50/50 repliable.
- Les actions **Modifier** / **Supprimer** ne prennent plus de place sur chaque carte. Touche le bouton **•••** pour ouvrir un panneau d’actions animé depuis le bas.
- Le bouton **+** du dock est corrigé : le libellé « Ajouter » ne déborde plus sur les autres onglets. Il ouvre immédiatement le formulaire.
- Les anciennes dépenses et catégories restent intactes ; aucune migration Supabase n’est nécessaire.
- Cache PWA : v15. CSS et JavaScript du rendu embarqués dans `index.html` afin d’éviter le mélange de versions.

## Installation sur GitHub Pages
1. Fais une sauvegarde JSON depuis l’application avant publication.
2. Décompresse l’archive, puis téléverse **les fichiers à l’intérieur du ZIP à la racine du dépôt** `maison-50-50`, en remplaçant notamment `index.html`, `sw.js`, `app.js` et `styles.css` (sans créer de sous-dossier).
3. Valide **Commit changes**, puis attends la fin du déploiement dans GitHub **Actions**.
4. Ouvre `https://whereismyhomephoto-source.github.io/maison-50-50/?v=15` dans Safari. Si l’app installée affiche encore une ancienne version, retire l’icône de l’écran d’accueil, puis ajoute-la de nouveau depuis Safari.

La première vérification : sous **Mouvements**, les montants apparaissent à droite de chaque carte et `•••` ouvre une feuille d’actions en bas.
