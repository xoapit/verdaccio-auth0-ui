import { Request } from "express"
import { Issuer, Client, CallbackParamsType } from 'openid-client'

import { AuthProvider } from "../plugin/AuthProvider"
import { Config, getConfig } from "../plugin/Config";

export class OpenIDConnectAuthProvider implements AuthProvider {
  private readonly issuerUrl = getConfig(this.config, "oidc-issuer-url") || ""
  private readonly usernameProperty = getConfig(this.config, "oidc-username-property") || "nickname"
  private readonly groupsProperty = getConfig(this.config, "oidc-groups-property") || "groups"
  private readonly clientId = getConfig(this.config, "client-id")
  private readonly clientSecret = getConfig(this.config, "client-secret")

  private client?: Client;

  constructor(
    private readonly config: Config,
  ) {
    // not sure of a better way to do this:
    this.discoverClient()
  }

  private get discoveredClient(): Client {
    if (!this.client) {
      throw new Error('Client has not yet been discovered')
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
    return "oidc"
  }

  getLoginUrl(callbackUrl: string): string {
    return this.discoveredClient.authorizationUrl({
      scope: "openid",
      redirect_uri: callbackUrl,
    });
  }

  getCode(req: Request): string {
    return JSON.stringify(this.discoveredClient.callbackParams(req.url))
  }

  async getToken(code: string, callbackUrl?: string): Promise<string> {
    const params = JSON.parse(code) as CallbackParamsType;
    const tokenSet = await this.discoveredClient.callback(callbackUrl, params);

    if (tokenSet.access_token !== undefined) {
      return tokenSet.access_token
    }

    throw new Error("No access_token received in getToken callback")
  }

  async getUsername(token: string): Promise<string> {
    const userinfo = await this.discoveredClient.userinfo(token)
    const username = userinfo[this.usernameProperty] as string|undefined

    if (username !== undefined) {
      return username
    }

    throw new Error(`Could not grab username using the ${this.usernameProperty} property`)
  }

  async getGroups(token: string): Promise<string[]> {
    const userinfo = await this.discoveredClient.userinfo(token)
    const groups = userinfo[this.groupsProperty] as string[]|undefined

    if (groups !== undefined) {
      return groups
    }

    throw new Error(`Could not grab groups using the ${this.groupsProperty} property`)
  }
}