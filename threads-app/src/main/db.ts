import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'node:path'
import fs from 'node:fs'

const dbPath = is.dev
    ? path.join(process.cwd(), 'database.db')
    : path.join(app.getPath('userData'), 'database.db')

if (!is.dev && !fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, 'database.db')
    if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, dbPath)
    }
}

process.env.DATABASE_URL = `file:${dbPath}`

export const prisma = new PrismaClient()

