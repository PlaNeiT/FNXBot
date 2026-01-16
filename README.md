# PHÉNIX Discord Bot

Bot Discord pour la gestion des rôles du serveur PHÉNIX.

## Fonctionnalités

- `/changerole` - Changer les rôles en masse (retirer jusqu'à 5 rôles et ajouter jusqu'à 5 rôles)
- `/setupreactivation` - Créer l'embed de réactivation avec menu de sélection de jeux

## Déploiement sur Dokploy

### Étape 1 : Préparer le repository Git

1. Initialisez un repository Git (si pas déjà fait) :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Créez un repository sur GitHub/GitLab et poussez le code :
   ```bash
   git remote add origin https://github.com/VOTRE_USERNAME/phenix-bot.git
   git push -u origin main
   ```

### Étape 2 : Configurer Dokploy

1. Connectez-vous à votre panel Dokploy sur Hostinger
2. Créez une nouvelle application
3. Sélectionnez "Git Repository"
4. Collez l'URL de votre repository GitHub/GitLab
5. Configurez les variables d'environnement :
   - `DISCORD_TOKEN` : Votre token Discord
   - `CLIENT_ID` : L'ID de votre application Discord

### Étape 3 : Déployer

1. Dokploy détectera automatiquement le Dockerfile
2. Cliquez sur "Deploy"
3. Le bot se lancera automatiquement et restera actif 24/7

### Étape 4 : Vérifier les logs

Dans Dokploy, allez dans l'onglet "Logs" pour voir si le bot est bien connecté.
Vous devriez voir :
```
Loaded command: changerole
Loaded command: setupreactivation
Ready!
```

## Variables d'environnement requises

- `DISCORD_TOKEN` - Token du bot Discord
- `CLIENT_ID` - ID de l'application Discord

## Développement local

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Créez un fichier `.env` avec vos credentials :
   ```
   DISCORD_TOKEN=votre_token
   CLIENT_ID=votre_client_id
   ```

3. Lancez le bot :
   ```bash
   npm start
   ```
