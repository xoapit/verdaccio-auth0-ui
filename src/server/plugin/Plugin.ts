import {
  AuthAccessCallback,
  AuthCallback,
  IPluginAuth,
  IPluginMiddleware,
  PackageAccess,
  RemoteUser,
} from "@verdaccio/types";
import { Application, Request } from "express";

import { WebFlow } from "../flows";
import { OpenIDConnectAuthProvider } from "../oidc";
import { Auth, Verdaccio } from "../verdaccio";
import { AuthCore } from "./AuthCore";
import { AuthProvider } from "./AuthProvider";
import { Cache } from "./Cache";
import { Config, getConfig, StaticAccessToken, validateConfig } from "./Config";
import { PatchHtml } from "./PatchHtml";
import { registerGlobalProxyAgent } from "./ProxyAgent";
import { ServeStatic } from "./ServeStatic";
import dayjs from "dayjs";

const createAuthProvider = (config: Config): AuthProvider => {
  return new OpenIDConnectAuthProvider(config);
};

/**
 * Implements the verdaccio plugin interfaces.
 */
export class Plugin implements IPluginMiddleware<any>, IPluginAuth<any> {
  private readonly provider = createAuthProvider(this.config);
  private readonly cache = new Cache(this.provider);
  private readonly verdaccio = new Verdaccio(this.config);
  private readonly core = new AuthCore(this.verdaccio, this.config);

  constructor(private readonly config: Config) {
    validateConfig(config);
    registerGlobalProxyAgent();
  }

  /**
   * IPluginMiddleware
   */
  register_middlewares(app: Application, auth: Auth) {
    this.verdaccio.setAuth(auth);

    const children = [
      new ServeStatic(),
      new PatchHtml(this.verdaccio),
      new WebFlow(this.verdaccio, this.core, this.provider),
    ];

    const tokens = (getConfig(this.config, "static-access-token") as unknown as StaticAccessToken[]) || [];

    app.use(async (req: Request, res, next) => {
      const token = tokens.find((x) => `Bearer ${x.key}` === req.headers.authorization);
      if (req.headers && req.headers.authorization && token) {
        if (token.expirationDate) {
          if (dayjs(token.expirationDate).isBefore(dayjs())) {
            console.warn(`Token ${token.key} expired.`);
            return next();
          }
        }
        const overwrite = token;
        console.warn("Applying custom token");
        console.debug(`User ${overwrite.user} authenticated via static access token.`);
        req["remote_user"] = this.verdaccio.createRemoteUser(overwrite.user, [overwrite.user]);
        return next();
      }

      next();
    });

    for (const child of children) {
      child.register_middlewares(app);
    }
  }

  /**
   * IPluginAuth
   */
  async authenticate(username: string, token: string, callback: AuthCallback) {
    const groups = await this.cache.getGroups(token);

    if (this.core.canAuthenticate(username, groups)) {
      callback(null, groups);
    } else {
      callback(null, false);
    }
  }

  /**
   * IPluginAuth
   */
  allow_access(user: RemoteUser, pkg: PackageAccess, callback: AuthAccessCallback): void {
    const requiredGroups = [...(pkg.access || [])];

    if (this.core.canAccess(user.name || "anonymous", user.groups, requiredGroups)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
}
