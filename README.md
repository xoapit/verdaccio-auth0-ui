<h1 align="center">
  📦🔐 Verdaccio OpenID Connect - With UI Support
</h1>

<h2 align="center">
  Fork of <a href="https://github.com/n4bb12/verdaccio-oidc-ui">n4bb12/verdaccio-oidc-ui</a>
</h2>

<p align="center">
  An OpenID Connect Plugin for Verdaccio – <a href="https://www.verdaccio.org">https://www.verdaccio.org</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/verdaccio-oidc-ui">
    <img alt="Version" src="https://flat.badgen.net/npm/v/verdaccio-oidc-ui?icon=npm">
  </a>
  <a href="https://raw.githubusercontent.com/TuneZilla-Development/verdaccio-oidc-ui/master/LICENSE">
    <img alt="License" src="https://flat.badgen.net/github/license/TuneZilla-Development/verdaccio-oidc-ui?icon=github">
  </a>
  <a href="https://github.com/TuneZilla-Development/verdaccio-oidc-ui/issues/new/choose">
    <img alt="Issues" src="https://flat.badgen.net/badge/github/create issue/pink?icon=github">
  </a>
  <a href="https://circleci.com/gh/n4bb12/workflows/verdaccio-oidc-ui">
    <img alt="CircleCI" src="https://flat.badgen.net/circleci/github/TuneZilla-Development/verdaccio-oidc-ui/master?icon=circleci">
  </a>
  <a href="https://codecov.io/github/TuneZilla-Development/verdaccio-oidc-ui">
    <img alt="Coverage" src="https://flat.badgen.net/codecov/c/github/TuneZilla-Development/verdaccio-oidc-ui?icon=codecov">
  </a>
  <a href="https://lgtm.com/projects/g/TuneZilla-Development/verdaccio-oidc-ui/alerts">
    <img alt="LGTM" src="https://flat.badgen.net/lgtm/alerts/g/TuneZilla-Development/verdaccio-oidc-ui?icon=lgtm">
  </a>
  <a href="https://david-dm.org/TuneZilla-Development/verdaccio-oidc-ui">
    <img alt="Dependencies" src="https://flat.badgen.net/david/dep/TuneZilla-Development/verdaccio-oidc-ui?icon=npm">
  </a>
</p>

## About

<img src="screenshots/authorize.png" align="right" width="270"/>

This is a Verdaccio plugin that offers OpenID Connect integration for both the browser and the command line.

### Features

- UI integration with fully functional login and logout. When clicking the login button the user is redirected to identity provider and returns with a working session.
- Updated usage info and working copy-to-clipboard for setup commands.
- A small CLI for quick-and-easy configuration.

### Compatibility

- Verdaccio 3 and 4
- Node >=10
- Chrome, Firefox, Firefox ESR, Edge, Safari, IE 11

## Setup

### Install

```
$ npm install verdaccio-oidc-ui
```

### GitHub Config

- Create an OpenID Connect app at your provider of choice, like https://docs.gitlab.com/ee/integration/openid_connect_provider.html
- The callback URL should be `YOUR_REGISTRY_URL/-/oauth/callback`

![](screenshots/github-app.png)

### Verdaccio Config

Merge the below options with your existing Verdaccio config:

```yml
middlewares:
  oidc-ui:
    enabled: true

auth:
  oidc-ui:
    org: REQUIRED_GROUP
    client-id: OIDC_CLIENT_ID
    client-secret: OIDC_CLIENT_SECRET
    oidc-issuer-url: https://gitlab.com
    oidc-username-property: nickname
    oidc-groups-property: groups

url_prefix: YOUR_REGISTRY_URL
```

- The configured values can either be the actual value or the name of an environment variable that contains the value.
- The config props can be specified under either the `middlewares` or the `auth` node. Just make sure, the addon is included under both nodes.

#### `org`

Users within this group will be able to authenticate.

#### `client-id` and `client-secret`

These values can be obtained from GitHub OAuth app page at https://github.com/settings/developers.

### `oidc-issuer-url`

The URL of your identity provider. If using gitlab.com, it would be https://gitlab.com

### `oidc-username-property` (optional)

The userinfo key that represents a username with your identity provider. Defaults to `nickname`

See https://docs.gitlab.com/ee/integration/openid_connect_provider.html#shared-information

### `oidc-groups-property` (optional)

The userinfo key that represents groups with your identity provider. Defaults to `groups`

See https://docs.gitlab.com/ee/integration/openid_connect_provider.html#shared-information

#### `url_prefix` (optional)

If configured, it must match `YOUR_REGISTRY_URL`. See [GitHub Config](#GitHub-Config).


### Proxy Config

If you are behind a proxy server, the plugin needs to know the proxy server in order to make GitHub requests.

Configure the below environment variable.

```
$ export GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:8080
```

See the [global-agent](https://github.com/gajus/global-agent#environment-variables) docs for detailed configuration instrcutions.

## Login

### Verdaccio UI

- Click the login button and get redirected to GitHub.
- Authorize the registry for your user and the configured GitHub org - this only needs to be done once.
- When completed, you'll be redirected back to the Verdaccio registry.

You are now logged in.

**Important**: Make sure to click the <kbd>Request</kbd> or <kbd>Grant</kbd> button for `read:org` access when prompted to authorize.
If you accidentally skipped this step, go to https://github.com/settings/applications, find the Verdaccio registry and grant `read:org` access from there.

### Command Line

#### Option A) Use the built-in CLI

The easiest way to configure npm is to use this short command:

```
$ npx verdaccio-oidc-ui --registry http://localhost:4873
```

#### Option B) Copy commands from the UI

- Verdaccio 4:

Open the "Register Info" dialog and klick "Copy to clipboard":

![](screenshots/register-info.png)

- Verdaccio 3:

Select the text in the header and copy it. In case the text is too long, you can double-click it. The invisible part will still be selected and copied.

![](screenshots/header.png)

- Run the copied commands on your terminal:

```
$ npm config set //localhost:4873:_authToken "SECRET_TOKEN"
$ npm config set //localhost:4873:always-auth true
```

- Verify npm is set up correctly by running the `whoami` command. Example:

```
$ npm whoami --registry http://localhost:4873
n4bb12
```

If you see your GitHub username, you are ready to start installing and publishing packages.

## Logout

### Verdaccio UI

Click the <kbd>Logout</kbd> button as per usual.

### Command Line

Unless OAuth access is revoked in the GitHub settings, the token is valid indefinitely.

## Revoke Tokens

To invalidate your active login tokens you need to revoke access on the GitHub OAuth app:

- Go to https://github.com/settings/applications
- Find your Verdaccio app
- Click the <kbd>Revoke</kbd> button as shown below

![](screenshots/revoke.png)

If you have created the GitHub OAuth app, you can also revoke access for all users:

- Go to https://github.com/settings/applications
- Find your Verdaccio app
- Click the app name
- On the app detail page click the <kbd>Revoke all user tokens</kbd> button
