import { chromium, BrowserContext } from 'playwright-core'
import path from 'path'
import { app } from 'electron'

interface LaunchBrowserArgs {
    proxy?: {
        server: string
        bypass?: string
        username?: string
        password?: string
    }
    headless?: boolean
    storageState?: any // JSON object containing cookies
}

export class AutomationEngine {

    static async getBrowserContext(args?: LaunchBrowserArgs): Promise<BrowserContext> {
        // Trong Electron, Playwright không đọc được browser bundle đúng cách tuỳ môi trường
        // Chúng ta nên dùng userData để chứa chromium đã được tải
        const context = await chromium.launchPersistentContext(
            path.join(app.getPath('userData'), 'automation-profile'),
            {
                headless: args?.headless ?? true,
                proxy: args?.proxy,
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-position=0,0'
                ]
            }
        )

        // Phục hồi cookie nếu có
        if (args?.storageState?.cookies) {
            await context.addCookies(args.storageState.cookies)
        }

        return context
    }

    static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
