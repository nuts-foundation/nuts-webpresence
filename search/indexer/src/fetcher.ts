import robotsParserModule from "robots-parser"

import { Settings } from "./config.ts"

// robots-parser is CommonJS (module.exports = function) but its typings declare an ES default export.
const robotsParser = robotsParserModule as unknown as typeof robotsParserModule.default
type Robots = ReturnType<typeof robotsParser>

export interface FetchResult {
  url: string
  status: number
  contentType: string
  body: string
}

export class RobotsDisallowedError extends Error {}

// Fetches pages politely: robots.txt is respected and requests to the same host are spaced out.
export class Fetcher {
  private robots = new Map<string, Promise<Robots>>()
  private nextSlot = new Map<string, number>()

  constructor(private settings: Settings) {}

  async get(url: string): Promise<FetchResult> {
    const robots = await this.robotsFor(url)
    if (robots.isAllowed(url, this.settings.userAgent) === false) {
      throw new RobotsDisallowedError(`disallowed by robots.txt`)
    }
    const delay = Math.max(this.settings.rateLimitMs, (robots.getCrawlDelay(this.settings.userAgent) ?? 0) * 1000)
    return this.request(url, delay)
  }

  private async request(url: string, delayMs: number): Promise<FetchResult> {
    await this.waitForSlot(new URL(url).host, delayMs)
    const response = await fetch(url, {
      headers: { "User-Agent": this.settings.userAgent, "Accept": "text/html,application/xml,application/yaml,*/*;q=0.5" },
      redirect: "follow",
      signal: AbortSignal.timeout(this.settings.timeoutMs),
    })
    return {
      url: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      body: await response.text(),
    }
  }

  // Reserves the next free request slot for a host, so concurrent callers queue up instead of bursting.
  private async waitForSlot(host: string, delayMs: number) {
    const now = Date.now()
    const slot = Math.max(now, this.nextSlot.get(host) ?? 0)
    this.nextSlot.set(host, slot + delayMs)
    if (slot > now) await new Promise(resolve => setTimeout(resolve, slot - now))
  }

  private robotsFor(url: string): Promise<Robots> {
    const robotsUrl = new URL("/robots.txt", url).toString()
    let robots = this.robots.get(robotsUrl)
    if (!robots) {
      robots = this.request(robotsUrl, this.settings.rateLimitMs)
        .then(r => robotsParser(robotsUrl, r.status === 200 ? r.body : ""))
        .catch(() => robotsParser(robotsUrl, ""))
      this.robots.set(robotsUrl, robots)
    }
    return robots
  }
}
