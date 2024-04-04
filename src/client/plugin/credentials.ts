//
// After a successful login we are redirected to the UI with our username
// and a JWT token. We need to save these in local storage so Verdaccio
// thinks we are logged in.
//

export interface Credentials {
  username: string;
  uiToken: string;
  npmToken: string;
}

export function saveCredentials(credentials: Credentials & { defaultScope?: string }) {
  localStorage.setItem("username", credentials.username);
  localStorage.setItem("token", credentials.uiToken);
  localStorage.setItem("npm", credentials.npmToken);
  localStorage.setItem("defaultScope", credentials.defaultScope || '');
}

export function clearCredentials() {
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("npm");
  localStorage.removeItem("defaultScope");
}

export function isLoggedIn() {
  return true && !!localStorage.getItem("username") && !!localStorage.getItem("token") && !!localStorage.getItem("npm");
}

export function validateCredentials(credentials: Credentials) {
  return true && credentials.username && credentials.uiToken && credentials.npmToken;
}
