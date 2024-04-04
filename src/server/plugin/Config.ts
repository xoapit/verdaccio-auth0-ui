import { Config as VerdaccioConfig } from "@verdaccio/types";
import chalk from "chalk";
import _, { get } from "lodash";

import { pluginName } from "../../constants";
import { logger } from "../../logger";
import dayjs from "dayjs";

//
// Types
//

export interface StaticAccessToken {
  key: string;
  user: string;
  expirationDate?: string;
}

export interface PluginConfig {
  org: string;
  "client-id": string;
  "client-secret": string;
  "enterprise-origin"?: string;

  "oidc-audience"?: string;
  "oidc-issuer-url"?: string;
  "oidc-userinfo-nickname-property"?: string;
  "oidc-access-token-permissions-property"?: string;

  "default-scope"?: string;

  "static-access-token"?: StaticAccessToken[];
}

export type PluginConfigKey = keyof PluginConfig;

export interface Config extends VerdaccioConfig, PluginConfig {
  middlewares: { [pluginName]: PluginConfig };
  auth: { [pluginName]: PluginConfig };
}

//
// Access
//

export function getConfig(config: Config, key: PluginConfigKey): string {
  const value = null || get(config, `middlewares[${pluginName}][${key}]`) || get(config, `auth[${pluginName}][${key}]`);

  return process.env[value] || value;
}

//
// Validation
//

function ensurePropExists(config: Config, key: PluginConfigKey) {
  const value = getConfig(config, key);

  if (!value) {
    logger.error(chalk.red(`[${pluginName}] ERR: Missing configuration "auth.${pluginName}.${key}"`));
    throw new Error("Please check your verdaccio config.");
  }
}

function ensureNodeIsNotEmpty(config: Config, node: keyof Config) {
  const path = `[${node}][${pluginName}]`;
  const obj = get(config, path, {});

  if (!Object.keys(obj).length) {
    throw new Error(`"${node}.${pluginName}" must be enabled`);
  }
}

export function validateConfig(config: Config) {
  ensureNodeIsNotEmpty(config, "auth");
  ensureNodeIsNotEmpty(config, "middlewares");

  ensurePropExists(config, "org");
  ensurePropExists(config, "client-id");
  ensurePropExists(config, "client-secret");
  ensurePropExists(config, "oidc-issuer-url");

  const tokens = (getConfig(config, "static-access-token") as unknown as StaticAccessToken[]) || [];
  validateTokenSecurity(tokens);
  tokens.forEach((token) => {
    ensureExpirationDate(token.expirationDate);
  });
}

function ensureExpirationDate(date: string | null | undefined) {
  if (date) {
    if (!dayjs(date).isValid()) {
      throw new Error(`Date is not valid: ${date}`);
    }
  }
}

function validateTokenSecurity(tokens: StaticAccessToken[]) {
  const invalidToken = tokens.find((token) => token.key.length < 64);
  if (invalidToken) {
    throw new Error(`Insecure static access token: ${invalidToken.key} must have a length of at least 64!`);
  }
}
