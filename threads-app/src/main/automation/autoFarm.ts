import { chromium, BrowserContext, Page } from 'playwright-core'
import { prisma } from '../db'
import path from 'path'
import fs from 'fs'

const LOG_DIR = path.join(process.cwd(), 'logs')
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR)
}

function log(accountId: string, message: string) {
    const time = new Date().toISOString()
    const logMsg = `[${time}] [Account ${accountId}] ${message}`
    console.log(logMsg)
    fs.appendFileSync(path.join(LOG_DIR, `farm_${accountId}.log`), logMsg + '\n')
}

// Hàm random delay
const randomDelay = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Hàm delay bằng Promise
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runFarmCampaignAccount(farmCampaignAccountId: string) {
    log(farmCampaignAccountId, `Starting farm session...`)

    // 1. Fetch data
    const campaignAcc = await prisma.farmCampaignAccount.findUnique({
        where: { id: farmCampaignAccountId },
        include: {
            account: {
                include: { proxy: true }
            },
            farmCampaign: {
                include: { config: true }
            }
        }
    })

    if (!campaignAcc) {
        throw new Error('FarmCampaignAccount not found')
    }

    const { account, farmCampaign } = campaignAcc
    const config = farmCampaign.config

    // Update status to RUNNING
    await prisma.farmCampaignAccount.update({
        where: { id: farmCampaignAccountId },
        data: { status: 'RUNNING', errorLog: null }
    })

    let context: BrowserContext | null = null
    let page: Page | null = null

    try {
        // 2. Setup Proxy
        let proxyConfig: { server: string; username?: string; password?: string } | undefined
        if (account.proxy) {
            proxyConfig = {
                server: `${account.proxy.protocol}://${account.proxy.host}:${account.proxy.port}`
            }
            if (account.proxy.username && account.proxy.password) {
                proxyConfig.username = account.proxy.username
                proxyConfig.password = account.proxy.password
            }
        }

        // 3. Setup Cookies & Browser
        const storageState = account.cookies ? JSON.parse(account.cookies) : undefined

        log(account.id, 'Launch browser...')
        const browser = await chromium.launch({
            headless: true, // Chạy headless trên server
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        context = await browser.newContext({
            userAgent: account.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            proxy: proxyConfig,
            storageState: storageState
        })

        page = await context.newPage()

        log(account.id, 'Navigating to threads.net...')
        await page.goto('https://www.threads.net/', { waitUntil: 'load', timeout: 30000 })

        // Check login state
        const isLoginPage = await page.locator('input[autocomplete="username"]').count() > 0 || await page.locator('input[name="username"]').count() > 0
        if (isLoginPage) {
            throw new Error('NOT_LOGGED_IN')
        }

        // --- BẮT ĐẦU LUỒNG FARM ---

        const startTime = Date.now()
        const targetTimeMs = randomDelay(config.scrollTimeMin, config.scrollTimeMax) * 1000

        let likedCount = 0
        let followCount = 0

        const targetLikeCount = randomDelay(config.likeCountMin, config.likeCountMax)
        const targetFollowCount = randomDelay(config.followCountMin, config.followCountMax)

        log(account.id, `Goal: Scroll ${Math.floor(targetTimeMs / 1000)}s | Like: ${targetLikeCount} | Follow: ${targetFollowCount}`)

        // Vòng lặp cuộn và tương tác
        while (Date.now() - startTime < targetTimeMs) {
            // Cuộn xuống
            await page.mouse.wheel(0, randomDelay(300, 800))
            await sleep(randomDelay(1000, 3000))

            // 1. Tương tác: Like
            if (config.enableLike && likedCount < targetLikeCount) {
                // Tìm các nút tim chưa bấm (dựa theo d (path) hoặc svg attributes)
                // Cách nhanh: tìm các SVG icon tim rỗng
                const unboundHeartButtons = page.locator('svg[aria-label="Like"]').locator('..').locator('..')
                const count = await unboundHeartButtons.count()
                if (count > 0) {
                    // Chọn ngẫu nhiên 1 cái trong view
                    const rIndex = Math.floor(Math.random() * count)
                    try {
                        // Click ngẫu nhiên nếu xác suất 30% khi lướt qua
                        if (Math.random() > 0.7) {
                            await unboundHeartButtons.nth(rIndex).scrollIntoViewIfNeeded()
                            await sleep(500)
                            await unboundHeartButtons.nth(rIndex).click()
                            likedCount++
                            log(account.id, `Liked a post. Total: ${likedCount}/${targetLikeCount}`)
                            await sleep(randomDelay(1000, 2000))
                        }
                    } catch (e) {
                        // ignore click error
                    }
                }
            }

            // 2. Tương tác: Follow
            if (config.enableFollow && followCount < targetFollowCount) {
                // Thường nút follow có text 'Follow' nằm gần tên user. (Phụ thuộc DOM thật)
                const followButtons = page.locator('div[role="button"]:has-text("Follow")').filter({ hasNotText: 'Following' })
                const countF = await followButtons.count()
                if (countF > 0) {
                    const rIndex = Math.floor(Math.random() * countF)
                    try {
                        if (Math.random() > 0.8) {
                            await followButtons.nth(rIndex).scrollIntoViewIfNeeded()
                            await sleep(500)
                            await followButtons.nth(rIndex).click()
                            followCount++
                            log(account.id, `Followed a user. Total: ${followCount}/${targetFollowCount}`)
                            await sleep(randomDelay(1000, 2000))
                        }
                    } catch (e) {
                        // ignore error
                    }
                }
            }
        }

        log(account.id, `Farm session completed successfully.`)

        await prisma.farmCampaignAccount.update({
            where: { id: farmCampaignAccountId },
            data: { status: 'SUCCESS' }
        })

    } catch (error: any) {
        log(account.id, `Farm failed: ${error.message}`)
        await prisma.farmCampaignAccount.update({
            where: { id: farmCampaignAccountId },
            data: {
                status: 'FAILED',
                errorLog: error.message
            }
        })
    } finally {
        if (context) await context.close()
        // Không đóng browser nếu dùng chung connect, ở đây launch mới nên tự đóng
    }
}
