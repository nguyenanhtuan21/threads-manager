import { AutomationEngine } from './engine'

/**
 * Chạy một chiến dịch đăng bài tự động.
 * Luồng:
 * 1. Lấy dữ liệu Campaign và danh sách Account từ DB.
 * 2. Lặp qua từng account, xử lý delay ngẫu nhiên giữa mỗi lần đăng.
 * 3. Với mỗi account: mở browser, đảm bảo đã login, click "New thread",
 *    điền nội dung, upload ảnh/video, bấm Post.
 * 4. Cập nhật trạng thái SUCCESS/FAILED vào bảng CampaignAccount.
 */
export async function runCampaign(campaignId: string): Promise<void> {
    // Sử dụng Prisma qua import () để bundle nhận diện
    const { prisma: db } = await import('../db')

    const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
            post: true,
            accounts: {
                where: { status: 'PENDING' },
                include: { account: { include: { proxy: true } } }
            }
        }
    })

    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)

    await db.campaign.update({
        where: { id: campaignId },
        data: { status: 'RUNNING' }
    })

    console.log(`\n[Auto Post] 🚀 Khởi chạy chiến dịch: "${campaign.name}" | ${campaign.accounts.length} tài khoản cần chạy`)

    for (let i = 0; i < campaign.accounts.length; i++) {
        const campAcc = campaign.accounts[i]
        const { account } = campAcc

        if (i > 0) {
            const delay = Math.floor(Math.random() * (campaign.delayMax - campaign.delayMin + 1) + campaign.delayMin)
            console.log(`[Auto Post] ⏳ Chờ ${delay}s trước khi chạy tài khoản tiếp theo...`)
            await AutomationEngine.delay(delay * 1000)
        }

        console.log(`\n[Auto Post] 👤 Account ${i + 1}/${campaign.accounts.length}: ${account.username}`)

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

        const context = await AutomationEngine.getBrowserContext({
            headless: false,
            proxy: proxySettings,
            storageState: storageState
        })

        try {
            const page = context.pages()[0] || await context.newPage()
            await page.goto('https://www.threads.net/', { waitUntil: 'networkidle', timeout: 30000 })
            await AutomationEngine.delay(2000)

            // === XÁC NHẬN ĐÃ ĐĂNG NHẬP ===
            const isLoggedIn = await page.locator('[aria-label="New thread"]').first().isVisible().catch(() => false)
                || (await page.url()).includes('/home')

            if (!isLoggedIn) {
                console.log(`[Auto Post] ⚠️ Chưa đăng nhập, thử tự động login...`)
                // Thực hiện login tối giản (giống checkLive)
                const loginWithIGBtn = page.getByRole('link', { name: /log in with instagram/i })
                if (await loginWithIGBtn.isVisible().catch(() => false)) {
                    await loginWithIGBtn.click()
                    await page.waitForLoadState('networkidle')
                    await AutomationEngine.delay(2000)
                }

                // Click "Log in with username instead" nếu Threads hiện tuỳ chọn đăng nhập mới
                const loginUsernameLink = page.locator('a[href*="/login?show_choice_screen=false"]').first()
                    .or(page.getByRole('link', { name: /Log in with username instead|Đăng nhập bằng tên người dùng/i }).first())

                if (await loginUsernameLink.isVisible().catch(() => false)) {
                    console.log(`[Auto Post] Phát hiện trang bắt cầu chọn tài khoản, đang click Log in with username instead...`)
                    await loginUsernameLink.click()
                    await page.waitForURL(/threads\.net\/login/i, { timeout: 15000 }).catch(() => { })
                    await page.waitForLoadState('networkidle')
                    await AutomationEngine.delay(2000)
                }

                const usernameInput = page.locator('input[autocomplete="username"]').first()
                    .or(page.getByPlaceholder(/username, phone or email/i).first())
                    .or(page.locator('input[name="username"]'))
                await usernameInput.waitFor({ state: 'visible', timeout: 15000 })
                await usernameInput.fill(account.username)
                await AutomationEngine.delay(400)

                const passwordInput = page.locator('input[autocomplete="current-password"]').first()
                    .or(page.getByPlaceholder(/password/i).first())
                    .or(page.locator('input[name="password"]'))
                await passwordInput.fill(account.password || '')
                await AutomationEngine.delay(400)

                const loginBtn = page.locator('input[type="submit"], button[type="submit"], div[role="button"]:has-text("Log in")').first()
                await loginBtn.click()
                await page.waitForURL(/threads\.net\/(home|\?)/i, { timeout: 15000 }).catch(() => { })
                await AutomationEngine.delay(2000)

                // Kiểm tra nếu url vẫn ở trang login hoặc có lỗi
                if (!(await page.url()).includes('/home') && !(await page.locator('[aria-label="New thread"]').first().isVisible().catch(() => false))) {
                    const errorSelector = page.locator('ul.x78zum5.xdt5ytf.x3ct3a4.x193iq5w').first()
                    let errorMsg = ''
                    if (await errorSelector.isVisible().catch(() => false)) {
                        errorMsg = await errorSelector.innerText().catch(() => '')
                    }
                    throw new Error(errorMsg.trim() || 'Đăng nhập thất bại hoặc sai mật khẩu.')
                }
            }

            // === MỞ MODAL TẠO BÀI VIẾT ===
            // Các selector có thể dùng cho nút "New thread" / "Create"
            const createBtnSelectors = [
                '[aria-label="New thread"]',
                '[aria-label="Create"]',
                '[data-testid="create-post-btn"]',
                'svg[aria-label="New thread"]',
            ]
            let clicked = false
            for (const selector of createBtnSelectors) {
                const btn = page.locator(selector).first()
                if (await btn.isVisible().catch(() => false)) {
                    await btn.click()
                    clicked = true
                    console.log(`[Auto Post] ✅ Đã click nút tạo bài (selector: ${selector})`)
                    break
                }
            }

            if (!clicked) {
                throw new Error('Không tìm thấy nút tạo bài viết trên trang Threads.')
            }

            await AutomationEngine.delay(1500)

            // === NHẬP NỘI DUNG ===
            if (campaign.post.content) {
                // Vùng nhập nội dung thường là contenteditable div hoặc textarea
                const contentArea = page.locator('[contenteditable="true"]').first()
                    .or(page.getByPlaceholder(/start a thread|what's new|what's on your mind/i).first())
                await contentArea.waitFor({ state: 'visible', timeout: 10000 })
                await contentArea.click()
                await contentArea.fill(campaign.post.content)
                await AutomationEngine.delay(800)
                console.log(`[Auto Post] 📝 Đã điền nội dung bài viết.`)
            }

            // === UPLOAD MEDIA ===
            if (campaign.post.mediaUrls) {
                const mediaPaths = JSON.parse(campaign.post.mediaUrls) as string[]
                const validPaths = mediaPaths
                    .map(p => p.startsWith('file://') ? p.replace('file://', '') : p)
                    .filter(p => {
                        try { require('fs').accessSync(p); return true } catch { return false }
                    })

                if (validPaths.length > 0) {
                    // Tìm input[type="file"] ẩn trong modal
                    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="video"]').first()
                        .or(page.locator('input[type="file"]').first())
                    await fileInput.waitFor({ state: 'attached', timeout: 8000 })
                    await fileInput.setInputFiles(validPaths)
                    await AutomationEngine.delay(2000)
                    console.log(`[Auto Post] 🖼️ Đã upload ${validPaths.length} file media.`)
                }
            }

            // === BẤM ĐĂNG BÀI ===
            const postBtn = page.getByRole('button', { name: /^post$|^đăng$|^thread it$/i }).first()
                .or(page.locator('[data-testid="post-btn"]').first())
            await postBtn.waitFor({ state: 'visible', timeout: 10000 })
            await postBtn.click()
            console.log(`[Auto Post] 🎯 Đã bấm Đăng bài!`)

            // Chờ xác nhận đăng thành công (URL thay đổi hoặc toast hiện ra)
            await AutomationEngine.delay(4000)

            // Lưu Cookie mới
            const freshCookies = await context.cookies()
            await db.account.update({
                where: { id: account.id },
                data: { cookies: JSON.stringify(freshCookies) }
            })

            // Cập nhật trạng thái
            await db.campaignAccount.update({
                where: { id: campAcc.id },
                data: { status: 'SUCCESS' }
            })

            console.log(`[Auto Post] ✅ Đăng bài thành công cho tài khoản ${account.username}`)

        } catch (error: any) {
            console.error(`[Auto Post] ❌ Lỗi tài khoản ${account.username}: ${error.message}`)
            await db.campaignAccount.update({
                where: { id: campAcc.id },
                data: { status: 'FAILED', errorLog: error.message }
            })
        } finally {
            await context.close()
        }
    }

    // Tổng kết chiến dịch
    const results = await db.campaignAccount.findMany({ where: { campaignId } })
    const hasPending = results.some((r: any) => r.status === 'PENDING')
    await db.campaign.update({
        where: { id: campaignId },
        data: { status: hasPending ? 'STOPPED' : 'COMPLETED' }
    })

    console.log(`\n[Auto Post] 🏁 Chiến dịch "${campaign.name}" kết thúc.`)
}
