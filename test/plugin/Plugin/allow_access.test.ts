import { PackageAccess, RemoteUser } from "@verdaccio/types"
import { PluginConfig } from "src/server/plugin/Config"
import { Plugin } from "src/server/plugin/Plugin"

import { createTestConfig, createTestPlugin } from "../test-utils"

const authenticated = "$authenticated"

describe("Plugin", () => {
  describe("allow_access", () => {

    let config: PluginConfig
    let plugin: Plugin

    beforeEach(() => {
      config = createTestConfig()
      plugin = createTestPlugin()
    })

    it("unauthenticated user does not have access", (done) => {
      const user: RemoteUser = {
        real_groups: [],
        groups: [],
        name: "test-package",
      }
      const pkg: PackageAccess = {
        access: [authenticated],
      }

      plugin.allow_access(user, pkg, (err, groups) => {
        expect(err).toBeNull()
        expect(groups).toBe(false)
        done()
      })
    })

    it("authenticated user outside org does not have access", (done) => {
      const userGroups = [authenticated]
      const user: RemoteUser = {
        real_groups: userGroups,
        groups: userGroups,
        name: "test-package",
      }
      const pkg: PackageAccess = {
        access: [authenticated],
      }

      plugin.allow_access(user, pkg, (err, groups) => {
        expect(err).toBeNull()
        expect(groups).toBe(false)
        done()
      })
    })

    it("authenticated user in org has access", (done) => {
      const userGroups = [authenticated, config.org]
      const user: RemoteUser = {
        real_groups: userGroups,
        groups: userGroups,
        name: "test-package",
      }
      const pkg: PackageAccess = {
        access: [authenticated],
      }

      plugin.allow_access(user, pkg, (err, groups) => {
        expect(err).toBeNull()
        expect(groups).toEqual(userGroups)
        done()
      })
    })

    it("authenticated user has access if authentication is not required", (done) => {
      const user: RemoteUser = {
        real_groups: [],
        groups: [],
        name: "test-package",
      }
      const pkg: PackageAccess = {
        access: [],
      }

      plugin.allow_access(user, pkg, (err, groups) => {
        expect(err).toBeNull()
        expect(groups).toEqual([])
        done()
      })
    })

  })
})