import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { prisma } from './db'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-accounts', async () => {
    return await prisma.account.findMany({ include: { group: true, proxy: true } })
  })

  ipcMain.handle('create-account', async (_, data) => {
    return await prisma.account.create({ data })
  })

  ipcMain.handle('delete-account', async (_, id) => {
    return await prisma.account.delete({ where: { id } })
  })

  // ---- PROXY IPC HANDLERS ----
  ipcMain.handle('get-proxies', async () => {
    return await prisma.proxy.findMany({ include: { accounts: true } })
  })

  ipcMain.handle('create-proxy', async (_, data) => {
    return await prisma.proxy.create({ data })
  })

  ipcMain.handle('delete-proxy', async (_, id) => {
    return await prisma.proxy.delete({ where: { id } })
  })

  ipcMain.handle('import-accounts', async (event) => {
    const { dialog } = require('electron')
    const fs = require('node:fs')

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return { success: false, error: 'No window found' }

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Import Accounts',
      filters: [{ name: 'Text Files', extensions: ['txt', 'csv'] }],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) return { success: false, message: 'Canceled' }

    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      const lines = content.split('\n').map(l => l.trim()).filter(l => l)

      let imported = 0
      for (const line of lines) {
        // Hỗ trợ định dạng username|password hoặc username:password
        const parts = line.includes('|') ? line.split('|') : line.split(':')
        if (parts.length >= 2) {
          const username = parts[0].trim()
          const password = parts[1].trim()

          // Upsert account
          await prisma.account.upsert({
            where: { username },
            update: { password },
            create: { username, password, status: 'LIVE' }
          })
          imported++
        }
      }
      return { success: true, count: imported }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('export-accounts', async (event) => {
    const { dialog } = require('electron')
    const fs = require('node:fs')

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return false

    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      title: 'Export Accounts',
      defaultPath: 'accounts_export.txt',
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    })

    if (canceled || !filePath) return false

    try {
      const accounts = await prisma.account.findMany()
      const content = accounts.map(acc => `${acc.username}|${acc.password}|${acc.status}`).join('\n')
      fs.writeFileSync(filePath, content, 'utf-8')
      return true
    } catch (e) {
      console.error('Export error:', e)
      return false
    }
  })

  // ---- POST & CAMPAIGN IPC HANDLERS ----
  ipcMain.handle('get-posts', async () => {
    return await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    })
  })

  ipcMain.handle('create-post', async (_, data) => {
    return await prisma.post.create({ data })
  })

  ipcMain.handle('delete-post', async (_, id) => {
    return await prisma.post.delete({ where: { id } })
  })

  ipcMain.handle('get-campaigns', async () => {
    return await prisma.campaign.findMany({
      include: { post: true, accounts: { include: { account: true } } },
      orderBy: { createdAt: 'desc' }
    })
  })

  ipcMain.handle('create-campaign', async (_, data) => {
    // data có dạng { name, postId, accounts: string[], delayMin, delayMax, scheduleAt }
    const { accounts, ...campaignData } = data
    return await prisma.campaign.create({
      data: {
        ...campaignData,
        accounts: {
          create: accounts.map((accountId: string) => ({ accountId }))
        }
      }
    })
  })

  ipcMain.handle('delete-campaign', async (_, id) => {
    return await prisma.campaign.delete({ where: { id } })
  })

  // Media upload copy handler
  ipcMain.handle('upload-media', async (event) => {
    const { dialog, app } = require('electron')
    const fs = require('node:fs')
    const path = require('node:path')

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return []

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Chọn ảnh/video đính kèm',
      filters: [
        { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'mp4', 'mov'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (canceled || filePaths.length === 0) return []

    const userDataPath = app.getPath('userData')
    const mediaDir = path.join(userDataPath, 'media')
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true })
    }

    const savedPaths: string[] = []
    for (const file of filePaths) {
      const fileName = `${Date.now()}_${path.basename(file)}`
      const destPath = path.join(mediaDir, fileName)
      fs.copyFileSync(file, destPath)
      savedPaths.push(`file://${destPath}`) // Đưa ra định dạng file:// để Web có thể xài hoặc đường dẫn tuyệt đối
    }

    return savedPaths
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
