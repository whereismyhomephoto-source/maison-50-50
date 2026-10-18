# Maison 50/50 — v12 · Design bancaire

Nouvelle interface d’accueil inspirée des codes graphiques des applications bancaires, sans reprendre la marque Revolut : bleu profond, solde principal, raccourcis circulaires, ventilation des dépenses, cartes Guillaume/Claire, solde et historique.

## Données et installation
Les quatre totaux restent présents : total général, matériel, main d’œuvre, apport frais et notaire. Les formulaires et la synchronisation Supabase sont inchangés. Les anciennes dépenses non classées restent dans le total général.

Remplacer les fichiers à la racine du dépôt GitHub Pages puis attendre la publication. Ne pas modifier les tables Supabase. Faire une sauvegarde JSON avant déploiement.

L’application inclut le CSS et le JavaScript directement dans index.html pour éviter les versions mixtes sur iPhone. Cache PWA v12.
