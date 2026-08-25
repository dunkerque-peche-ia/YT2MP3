# CoTransport Alert 🚗📦 - Agrégateur Géolocalisé (Tut Tut & Shopopop)

**CoTransport Alert** est une application web PWA interactive permettant de regrouper, filtrer et géolocaliser en temps réel les notifications d'offres de cotransportage de colis issues des applications **Tut Tut** et **Shopopop** (optimisée pour **Dunkerque** et toute la France).

---

## 🌟 Fonctionnalités Principales

1. **Carte Interactive Géolocalisée (Dark Mode)** :
   - Position par défaut centrée sur **Dunkerque (Hauts-de-France)** avec recherche d'adresse interactive (OpenStreetMap / Nominatim).
   - Marqueurs distincts avec animations d'impulsion pour **Tut Tut** (Orange/Violet) et **Shopopop** (Cyan/Bleu).
   - Tracé direct d'itinéraire vers l'enseigne de retrait (Auchan Grande-Synthe, Intermarché Coudekerque-Branche, E.Leclerc Armbouts-Cappel, Leroy Merlin, etc.) et lien direct vers Google Maps / Waze.

2. **Agrégateur & Filtres Intelligents** :
   - **Filtrage multicritères** : Filtrer par plateforme, gain minimum (€) et rentabilité kilométrique minimum (€/km).
   - **Calculateur de rentabilité** : Calcul automatique du montant par kilomètre parcouru (Formule de Haversine).

3. **Système d'Alertes Sonores et Vocales** :
   - **Synthesizer Audio (Web Audio API)** : Carillon sonore distinctif à chaque nouvelle course éligible.
   - **Synthèse Vocale FR (`SpeechSynthesis`)** : Annonce automatique à voix haute de l'offre (Enseigne, Montant, Distance) pour conduire en toute sécurité.

4. **Compatibilité iPhone (iOS) & Android** :
   - Optimisation PWA Safari ("Sur l'écran d'accueil" sur iPhone).
   - Support d'Apple Raccourcis / Shortcuts et parsing manuel ultra-rapide.

---

## 📱 Utilisation sur iPhone (iOS)

Sur iPhone (iOS), Apple protège la vie privée en empêchant les applications d'accéder directement aux notifications en arrière-plan. Voici les 3 meilleures méthodes d'utilisation sur iPhone :

### 1. Installation PWA sur l'Écran d'Accueil iPhone
1. Ouvrez l'application dans **Safari** sur votre iPhone.
2. Touchez le bouton **Partager** (<i class="fa-solid fa-arrow-up-from-bracket"></i>).
3. Sélectionnez **"Sur l'écran d'accueil"**.
4. L'application se lancera désormais en plein écran comme une application native iOS avec le GPS et le son actifs !

### 2. Apple Raccourcis (Shortcuts iOS)
1. Ouvrez l'application **Raccourcis** sur votre iPhone.
2. Créez un raccourci intitulé *"Ajouter à CoTransport"*.
3. Définissez une action : *Prendre le texte en entrée* et envoyer une requête HTTP vers le serveur local ou parser le texte dans le presse-papier.

---

## 📱 Connexion avec un Téléphone Android (Vraies Notifications)

Sur Android, l'application **MacroDroid** (gratuite sur le Play Store) permet d'intercepter automatiquement les notifications de Tut Tut et Shopopop via `NotificationListenerService` et de les transférer instantanément au dashboard.

---

## 🚀 Lancement Local

Ouvrez simplement `index.html` dans Safari ou n'importe quel navigateur web moderne.
