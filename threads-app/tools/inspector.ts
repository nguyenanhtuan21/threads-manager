import { chromium } from 'playwright-core'

    ; (async () => {
        // Chỉ tạo script chạy tạm thời trên Node.js để tương tác xem Source Code Threads.net
        console.log("Khởi động Playwright để trích xuất Selector Threads...")
        const browser = await chromium.launch({ headless: false })
        const page = await browser.newPage()

        await page.goto('https://www.threads.net/', { waitUntil: 'domcontentloaded' })

        console.log("Đang mở trang, vui lòng thao tác trên browser...")
        // Giữ cho browser mở
        await new Promise(() => { })
    })()
