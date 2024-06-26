import { Request } from "express"

export interface AuthProvider {
  getId(): string
  getCookieDomain(): string | undefined
  getLoginUrl(callbackUrl: string): string
  getCode(req: Request): string
  getToken(code: string, callbackUrl?: string): Promise<string>
  getUsername(token: string): Promise<string>
  getGroups(token: string): Promise<string[]>
}
