# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Land-AI Setup Notes (Firebase, Maps, and Location)

This project includes starter scaffolding for:

- Firebase Email/Auth and Realtime Database (web): see src/firebaseConfig.js and src/components/AuthForm.jsx
- Real-time location streaming: see src/components/LocationTracker.jsx (writes liveLocations and userLocations in the Realtime Database)
- Google Maps integration: see src/components/MapView.jsx and index.html for where to include the Maps JS script

Local setup (development):

1. Create a Firebase project at https://console.firebase.google.com/, enable Email/Password sign-in under Authentication, and create a Realtime Database instance.
2. Create a Web app in Firebase and copy the config values.
3. Copy `.env.example` to `.env` in the project root and fill in the values (Vite requires client env names to start with `VITE_`):

   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_GOOGLE_MAPS_API_KEY=...

   Notes:
   - Add `.env` to your local `.gitignore` so secrets/config are not committed.
   - A `.env.example` file is included in this repository to show required keys and expected names.
   - Client-side `VITE_` keys are embedded in the browser bundle and are therefore public. Restrict the Google Maps API key in the Google Cloud Console by adding HTTP referrer restrictions and usage/quota limits.

4. Install dependencies: npm install
5. Start dev server: npm run dev
6. Open the app and use the AuthForm and LocationTracker components (wire into your UI in src/main.jsx or pages).

Security and Realtime Database rules (example)

It is important to deny broad unauthenticated reads and only allow authenticated users to write or read their own location entries. Example Realtime Database rules (minimal):

```json
{
  "rules": {
    "liveLocations": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "userLocations": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

- These rules allow each authenticated user to write and read their own live and historical locations while preventing broad reads. Adjust rules for project-specific sharing (for example, allow project admins or aggregated read endpoints).
- See the Firebase Realtime Database security rules docs for more: https://firebase.google.com/docs/database/security

Operational notes:

- For bulk exports, analytics, or any operation that requires access to many users' historical data, use a server-side service account (Firebase Admin SDK) and enforce authorization checks on that service.
- Client-side API keys are not secrets — always pair client restrictions (referrers, quotas) with server-side checks for sensitive operations (exports, billing-related actions, ML scoring that reveals private user data).

Next steps already added to the session todo list include provisioning Firebase, implementing mobile auth/location, researching global cadastral data sources, and prototyping a valuation model.
