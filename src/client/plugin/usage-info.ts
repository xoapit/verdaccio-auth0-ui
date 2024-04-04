//
// Replace the default npm usage info and displays the authToken that needs
// to be configured.
//

export function getUsageInfo() {
  const username = localStorage.getItem("username");
  if (!username) {
    return "Click the login button to authenticate.";
  }

  const configBase = (window as any).VERDACCIO_API_URL
    ? (window as any).VERDACCIO_API_URL.replace(/^https?:/, "").replace(/-\/verdaccio\/$/, "")
    : `//${location.host}${location.pathname}`;
  const npmToken = localStorage.getItem("npm");
  const token = localStorage.getItem("token");
  const defaultScope = localStorage.getItem("defaultScope");

  return [
    `yarn config set 'npmScopes.${defaultScope}.npmAuthToken' "${token}" -H`,
    `npm config set ${configBase}:_authToken "${token}" -g`,
    `pnpm config set ${configBase}:_authToken "${token}" -g`,
    `Username and password:`,
    username,
    npmToken,
  ].join("\n");
}
