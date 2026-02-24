import { AutomationEngine } from './engine'
import path from 'path'
import fs from 'fs'

const LOG_DIR = path.join(process.cwd(), 'logs')
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR)
}

function log(accountId: string, message: string) {
    const time = new Date().toISOString()
    const logMsg = `[${time}] [Scraper Account ${accountId}] ${message}`
    console.log(logMsg)
    fs.appendFileSync(path.join(LOG_DIR, `scraper_${accountId}.log`), logMsg + '\n')
}

/**
 * Hàm hỗ trợ lấy số từ chuỗi định dạng (ví dụ: "10.5K", "1,234", "10M")
 */
function parseAbbreviatedNumber(str: string): number {
    if (!str) return 0;

    let sanitized = str.replace(/,/g, '').trim().toUpperCase();
    let multiplier = 1;

    if (sanitized.endsWith('K')) {
        multiplier = 1000;
        sanitized = sanitized.slice(0, -1);
    } else if (sanitized.endsWith('M')) {
        multiplier = 1000000;
        sanitized = sanitized.slice(0, -1);
    } else if (sanitized.endsWith('B')) {
        multiplier = 1000000000;
        sanitized = sanitized.slice(0, -1);
    }

    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : Math.floor(parsed * multiplier);
}

export async function runScraper(accountIds: string[]): Promise<void> {
    const { prisma: db } = await import('../db');

    for (const id of accountIds) {
        const account = await db.account.findUnique({
            where: { id },
            include: { proxy: true }
        });

        if (!account) {
            log(id, `Account not found.`);
            continue;
        }

        log(account.id, `Starting scraper for account: ${account.username}`);

        let proxySettings: any = undefined
        if (account.proxy) {
            proxySettings = {
                server: `${account.proxy.protocol}://${account.proxy.host}:${account.proxy.port}`,
                username: account.proxy.username || undefined,
                password: account.proxy.password || undefined
            }
        }

        let storageState: any = undefined
        if (account.cookies) {
            try {
                storageState = { cookies: JSON.parse(account.cookies) }
            } catch (e) { /* ignore */ }
        }

        let context;
        try {
            context = await AutomationEngine.getBrowserContext({
                headless: true, // Scraper nên ẩn danh
                proxy: proxySettings,
                storageState: storageState
            });
            const page = context.pages()[0] || await context.newPage();

            // Vào thẳng profile page
            const profileUrl = `https://www.threads.net/@${account.username}`;
            log(account.id, `Navigating to ${profileUrl}`);
            await page.goto(profileUrl, { waitUntil: 'load', timeout: 30000 });
            await AutomationEngine.delay(3000);

            // Threads thường cấu trúc <span title="X Followers">X Followers</span> 
            // Hoặc có thể tìm text có "followers" / "following"

            let followerCount = 0;
            let followingCount = 0;
            let postCount = 0; // Số bài viết đôi khi không dễ thấy, gán tạm 0 hoặc đếm số lượng node

            // Lấy Follower (tìm theo text 'followers' hoặc 'người theo dõi')
            const followerLocator = page.locator('span:has-text("followers"), span:has-text("người theo dõi"), a[href$="/followers/"]').first();
            if (await followerLocator.isVisible().catch(() => false)) {
                // Thường DOM là "1.2K followers"
                const text = await followerLocator.innerText();
                const match = text.match(/([\d\.,KM]+)/); // lấy số
                if (match) {
                    followerCount = parseAbbreviatedNumber(match[1]);
                }
            }

            // Thỉnh thoảng trên cá nhân không phơi "following" trực tiếp, tạm set 0 và cập nhật DOM selector nếu cần

            log(account.id, `Scraped Data -> Followers: ${followerCount} | Following: ${followingCount} | Posts: ${postCount}`);

            // Cập nhật Database
            await db.account.update({
                where: { id: account.id },
                data: {
                    followerCount,
                    followingCount,
                    postCount
                }
            });

            log(account.id, `Finished scraper successfully.`);
        } catch (error: any) {
            log(account.id, `Failed to scrape - error: ${error.message}`);
        } finally {
            if (context) await context.close();
        }
    }
}
