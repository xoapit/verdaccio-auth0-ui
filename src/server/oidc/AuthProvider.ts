import { Request } from "express"
import { Issuer, Client, CallbackParamsType, TokenSet } from "openid-client"

import { AuthProvider } from "../plugin/AuthProvider"
import { Config, getConfig } from "../plugin/Config"
import _ from "lodash"

export class OpenIDConnectAuthProvider implements AuthProvider {
  private readonly issuerUrl = getConfig(this.config, "oidc-issuer-url") || ""
  private readonly userinfoUsernameProperty = getConfig(this.config, "oidc-userinfo-nickname-property") || "nickname"
  private readonly accessTokenPermissionsProperty = getConfig(this.config, "oidc-access-token-permissions-property") || "permissions"
  private readonly clientId = getConfig(this.config, "client-id")
  private readonly clientSecret = getConfig(this.config, "client-secret")
  private readonly audience = getConfig(this.config, "oidc-audience")

  private client?: Client

  constructor(
    private readonly config: Config,
  ) {
    // not sure of a better way to do this:
    this.discoverClient()
  }

  private get discoveredClient(): Client {
    if (!this.client) {
      throw new Error("Client has not yet been discovered")
    }

    return this.client
  }

  private async discoverClient() {
    const issuer = await Issuer.discover(this.issuerUrl)
    const client = new issuer.Client({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      response_types: ["code"],
    })
    this.client = client
  }

  getId(): string {
    return "auth0"
  }

  getLoginUrl(callbackUrl: string): string {
    return this.discoveredClient.authorizationUrl({
      scope: "openid profile",
      redirect_uri: callbackUrl,
      audience: this.audience,
      nonce: '',
    })
  }

  getCode(req: Request): string {
    return JSON.stringify(this.discoveredClient.callbackParams(req.url))
  }

  async getToken(code: string, callbackUrl?: string): Promise<string> {
    const params = JSON.parse(code) as CallbackParamsType
    const tokenSet = await this.discoveredClient.callback(callbackUrl, params)

    if (tokenSet.access_token !== undefined) {
      return tokenSet.access_token
    }

    throw new Error("No access_token received in getToken callback")
  }

  async getUsername(token: string): Promise<string> {
    const userinfo = await this.discoveredClient.userinfo(token)
    const username = userinfo[this.userinfoUsernameProperty] as string|undefined

    if (username !== undefined) {
      return username.split('@')[0].toLocaleLowerCase()
    }

    throw Object.assign(
      new Error(`Could not grab username using the ${this.userinfoUsernameProperty} property`),
      {userinfo, token},
    )
  }

  async getGroups(token: string): Promise<string[]> {
    // Bounce token to check that it's valid.
    await this.discoveredClient.userinfo(token)

    const tokenSet = new TokenSet({
      id_token: token,
    })
    const claims = tokenSet.claims()
    const groups = claims[this.accessTokenPermissionsProperty] as string[]|undefined|string

    if (groups !== undefined) {
      if(_.isString(groups)) {
        return ['$authenticated', '$all', groups]
      } else {
        return ['$authenticated', '$all', ...groups]
      }
    }

    throw Object.assign(
      new Error(`Could not grab groups using the ${this.accessTokenPermissionsProperty} property`),
      {claims, token},
    )
  }
}
