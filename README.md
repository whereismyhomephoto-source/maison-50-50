# Maison 50/50 — v14 · Mouvements premium

## Nouveautés
- Cartes Mouvements et Historique avec icônes vectorielles, typographie plus nette, couleur contextuelle et montant à droite.
- Bouton Options circulaire et discret sur chaque mouvement ; ouverture d’un panneau d’actions depuis le bas de l’écran avec Modifier et Supprimer (confirmation de suppression conservée).
- Balayage facultatif de droite à gauche sur une dépense ou un remboursement pour ouvrir le même panneau. Le bouton reste disponible à la souris et au clavier.
- Animations d’apparition légères et interactions tactiles ; réglage « réduire les animations » respecté.
- Compatibilité avec thème clair ou sombre, montants 50/50 et classements de la v13.
- Aucun changement de schéma Supabase ; protection des formulaires et synchronisation existantes préservées.

## Installation
1. Exporter la sauvegarde JSON depuis l’Historique avant mise à jour.
2. Remplacer les fichiers à la racine du dépôt GitHub Pages par ceux de cette archive.
3. Attendre la fin du déploiement puis ouvrir Safari. En cas d’ancienne version dans la PWA, la retirer de l’écran d’accueil et la réajouter depuis Safari.

Le CSS et le JavaScript sont également intégrés à index.html pour éviter le mélange des versions sur iOS. Le cache service worker est nommé v14.
