# Maison 50/50 — v10 · Ventilation des dépenses et design flat

## Nouveautés
- Trois indicateurs côte à côte sur l’accueil : total général, matériel, main d’œuvre.
- Saisie : nature de la dépense (Matériel / Main d’œuvre), puis catégorie ou métier dépendant du choix.
- Les dépenses antérieures à la v10 ne sont **pas reclassées automatiquement** : elles restent dans le total général et apparaissent « À classer » jusqu’à modification manuelle.
- Mise à jour de la palette sombre : surfaces unies, teintes terracotta, sauge et bleu doux, sans dégradés ni ombres lourdes.
- Conservation des données et du fonctionnement Supabase ; aucun changement SQL nécessaire.
- Préservation du correctif v9 qui évite le rechargement des formulaires pendant la saisie.

## Installation
Décompresser puis déposer tous les fichiers à la racine du dépôt GitHub Pages maison-50-50, en remplaçant les anciens. Laisser GitHub Pages terminer le déploiement.

## Important
Une sauvegarde/export JSON depuis Historique est recommandée avant la mise à jour. La v10 ne supprime ni ne transforme les anciennes dépenses.
