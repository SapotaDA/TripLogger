# TODO: Fix Index Page Authentication Connection

## Tasks
- [x] Enable redirect to signin.html for unauthenticated users in main.js
- [x] Add signin/signup buttons to header in index.html for unauthenticated users
- [x] Update main.js to toggle visibility of auth buttons vs user info based on auth state
- [x] Hide main app content when not authenticated to prevent confusion
- [x] Test the authentication flow

## Notes
- Current issue: Unauthenticated users stay on index.html without being redirected
- No visible links to signin/signup from index.html
- After auth, users should be redirected to index.html and see the app
