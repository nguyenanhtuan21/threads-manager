import { AutomationEngine } from './engine'
import { prisma } from '../db'

/**
 * Kiểm tra trạng thái tài khoản Threads bằng cách đăng nhập tự động.
 * Luồng:
 * 1. Nạp lại cookies cũ nếu có.
 * 2. Truy cập threads.net, kiểm tra xem đã đăng nhập chưa.
 * 3. Nếu chưa, thực hiện quy trình đăng nhập Instagram.
 * 4. Cập nhật status và lưu cookies mới vào DB.
 */
export async function checkAccountLive(accountId: string): Promise<boolean> {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { proxy: true }
    })

    if (!account) throw new Error('Account not found')

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
        } catch (e) {
            console.error('[Check Live] Cookie không hợp lệ, sẽ thử đăng nhập lại.')
        }
    }

    console.log(`[Check Live] Bắt đầu kiểm tra: ${account.username}`)

    const context = await AutomationEngine.getBrowserContext({
        headless: false,
        proxy: proxySettings,
        storageState: storageState
    })

    const page = context.pages()[0] || await context.newPage()

    try {
        await page.goto('https://www.threads.net/', { waitUntil: 'networkidle', timeout: 30000 })
        await AutomationEngine.delay(2000)

        // === KIỂM TRA ĐÃ ĐĂNG NHẬP CHƯA ===
        // Nếu có nút "New thread" hoặc icon tạo bài viết -> đã login
        const isLoggedIn = await page.locator('[aria-label="New thread"]').first().isVisible().catch(() => false)
            || await page.locator('[data-testid="create-post-btn"]').first().isVisible().catch(() => false)
            // Fallback: trang /home thường không hiển thị nút Login
            || (await page.url()).includes('/home')

        if (isLoggedIn) {
            console.log(`[Check Live] ✅ Tài khoản ${account.username} đang LIVE (cookie hợp lệ).`)
        } else {
            // === CHƯA ĐĂNG NHẬP: Thực hiện Login ===
            console.log(`[Check Live] 🔑 Chưa đăng nhập, bắt đầu quy trình Login...`)

            // Threads sử dụng hệ thống login của Instagram
            // Bấm nút "Log in with Instagram" nếu có
            const loginWithIGBtn = page.getByRole('link', { name: /log in with instagram/i })
            if (await loginWithIGBtn.isVisible().catch(() => false)) {
                await loginWithIGBtn.click()
                await page.waitForLoadState('networkidle')
                await AutomationEngine.delay(2000)
            }

            // Điền username
            const usernameInput = page.getByLabel(/username|phone number|email/i).first()
                .or(page.locator('input[name="username"]'))
                .or(page.getByPlaceholder(/phone number, username, or email/i))
            await usernameInput.waitFor({ state: 'visible', timeout: 15000 })
            await usernameInput.fill(account.username)
            await AutomationEngine.delay(500)

            // Điền password
            const passwordInput = page.getByLabel(/password/i).first()
                .or(page.locator('input[name="password"]'))
                .or(page.getByPlaceholder(/password/i))
            await passwordInput.fill(account.password || '')
            await AutomationEngine.delay(500)

            // Bấm nút đăng nhập
            const loginBtn = page.getByRole('button', { name: /log in|sign in|đăng nhập/i }).first()
            await loginBtn.click()
            console.log(`[Check Live] Đã bấm đăng nhập, đợi phản hồi...`)

            // Chờ chuyển trang hoặc báo lỗi (tối đa 15 giây)
            await Promise.race([
                page.waitForURL(/threads\.net\/(home|\?)/i, { timeout: 15000 }),
                page.waitForSelector('[aria-label="New thread"]', { timeout: 15000 }),
                page.waitForSelector('[data-testid="create-post-btn"]', { timeout: 15000 })
            ]).catch(() => { /* Không sao, sẽ xử lý lỗi bên dưới */ })

            await AutomationEngine.delay(2000)

            // Kiểm tra lại sau khi login
            const postLoginUrl = page.url()
            const loginSuccess = postLoginUrl.includes('/home')
                || await page.locator('[aria-label="New thread"]').isVisible().catch(() => false)
                || await page.locator('[data-testid="create-post-btn"]').isVisible().catch(() => false)

            if (!loginSuccess) {
                // Kiểm tra xem có thông báo lỗi không
                const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => '')
                    || await page.locator('.coreSpriteLoginWarning').textContent().catch(() => '')
                console.error(`[Check Live] ❌ Đăng nhập thất bại. URL: ${postLoginUrl} | Lỗi: ${errorMsg}`)

                await prisma.account.update({
                    where: { id: accountId },
                    data: { status: 'ERROR' }
                })
                return false
            }
        }

        // === THÀNH CÔNG: Lưu Cookie mới ===
        const freshCookies = await context.cookies()
        await prisma.account.update({
            where: { id: accountId },
            data: {
                cookies: JSON.stringify(freshCookies),
                status: 'LIVE'
            }
        })
        console.log(`[Check Live] ✅ Đã cập nhật LIVE & Cookie mới cho ${account.username}`)
        return true

    } catch (error: any) {
        console.error(`[Check Live] ❌ Lỗi không mong muốn: ${error.message}`)
        await prisma.account.update({
            where: { id: accountId },
            data: { status: 'ERROR' }
        })
        return false
    } finally {
        await context.close()
    }
}
