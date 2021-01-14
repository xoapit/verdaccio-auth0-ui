import { intersection } from "lodash"
import { stringify } from "querystring"

import { logger } from "../../logger"
import { User, Verdaccio } from "../verdaccio"
import { Config, getConfig } from "./Config"

export class AuthCore {

  private readonly requiredGroup = getConfig(this.config, "org")

  constructor(
    private readonly verdaccio: Verdaccio,
    private readonly config: Config,
  ) { }

  createUser(username: string, groups: string[]) {
    return {
      name: username,
      groups,
      real_groups: groups,
    }
  }

  async createUiCallbackUrl(username: string, groups: string[], token: string) {
    const user: User = this.createUser(username, groups)

    const uiToken = await this.verdaccio.issueUiToken(user)
    const npmToken = await this.verdaccio.issueNpmToken(username, token)

    const query = { username, uiToken, npmToken }
    const url = "/?" + stringify(query)

    return url
  }

  canAuthenticate(username: string, groups: string[]) {
    const allow = groups.includes(this.requiredGroup)
    if (!allow) {
      logger.error(this.getDeniedMessage(username))
    }
    return allow
  }

  canAccess(username: string, groups: string[], requiredGroups: string[]) {
    const grantedAccess = intersection(groups, requiredGroups)

    const allow = grantedAccess.length === requiredGroups.length
    if (!allow) {
      logger.error(this.getDeniedMessage(username))
    }
    return allow
  }

  getDeniedMessage(username: string) {
    return `Access denied: User "${username}" is not a member of "${this.requiredGroup}"`
  }

}
