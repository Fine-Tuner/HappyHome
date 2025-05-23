import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join, extname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './database/manager'
import fs from 'fs/promises'
import { imageSize } from 'image-size'
import { Block, Condition } from '../types'
import { parseFilename } from '../common/utils'

const isMac = process.platform === 'darwin'
const dbUri = 'mongodb://localhost:27017'
const dbName = 'happyhome'
let dbManager
let currentDirectoryPath: string | null = null

function createMenu(window: BrowserWindow): void {
  const pageMenu = {
    label: 'Pages',
    submenu: [
      {
        label: 'Block',
        click: async () => window.webContents.send('navigate', { name: 'block' })
      },
      {
        label: 'Condition',
        click: async () => window.webContents.send('navigate', { name: 'condition' })
      }
    ]
  }
  const menu = Menu.buildFromTemplate([
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    pageMenu,
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { role: 'togglefullscreen' as const }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

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
  mainWindow.maximize()
  createMenu(mainWindow)

  dbManager = new DatabaseManager(mainWindow)
  dbManager.initialize(dbUri, dbName)

  mainWindow.on('ready-to-show', () => {
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
    mainWindow.webContents.openDevTools()
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

  // Handler for opening directory dialog and listing image files
  ipcMain.handle('get-table-data', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) {
      currentDirectoryPath = null
      return []
    }

    currentDirectoryPath = filePaths[0]
    try {
      const dirents = await fs.readdir(currentDirectoryPath, { withFileTypes: true })
      const imageFiles = dirents.filter((dirent) => {
        if (!dirent.isFile()) {
          return false
        }
        const ext = extname(dirent.name).toLowerCase()
        return ['.png', '.jpg', '.jpeg'].includes(ext)
      })

      // Fetch status for each image file
      const fileDataPromises = imageFiles.map(async (dirent, index) => {
        const filename = dirent.name
        const parsed = parseFilename(filename)
        if (!parsed) {
          throw new Error(`Invalid filename format received: ${filename}`)
        }
        const { announcement_id, page } = parsed
        const completed = await dbManager.getFileStatus(announcement_id, page) // Fetch status from DB
        return {
          id: index,
          filename,
          completed // Include status
        }
      })

      return await Promise.all(fileDataPromises) // Wait for all statuses to be fetched
    } catch (error) {
      console.error('Error reading directory or fetching file statuses:', error)
      return []
    }
  })

  // Handler for getting only image data
  ipcMain.handle('get-image', async (_, filename: string) => {
    if (!currentDirectoryPath) {
      console.error('No directory selected')
      return null
    }
    const imagePath = join(currentDirectoryPath, filename)
    try {
      const data = await fs.readFile(imagePath)
      const dimensions = imageSize(data)
      if (!dimensions || !dimensions.width || !dimensions.height) {
        console.error(`Could not get dimensions for image ${imagePath}`)
        return null
      }
      return {
        data: data.toString('base64'),
        width: dimensions.width,
        height: dimensions.height
      }
    } catch (error) {
      console.error(`Error reading image file ${imagePath}:`, error)
      return null
    }
  })

  // Handler for getting blocks by announcement_id and page
  ipcMain.handle('get-blocks', async (_, announcement_id: string, page: number) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      return []
    }
    return await dbManager.getBlocks(announcement_id, page)
  })

  // Handler for getting conditions by announcement_id and page
  ipcMain.handle('get-conditions', async (_, announcement_id: string, page: number) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      return []
    }
    return await dbManager.getConditions(announcement_id, page)
  })

  ipcMain.handle(
    'update-block',
    async (_, announcement_id: string, page: number, _id: string, update: Partial<Block>) => {
      if (!dbManager) {
        console.error('Database manager not initialized')
        return { success: false, error: 'Database manager not initialized' }
      }
      try {
        await dbManager.updateBlock(announcement_id, page, _id, update)
        return { success: true }
      } catch (error) {
        console.error('Failed to update block:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  // Handler to delete a block
  ipcMain.handle('delete-block', async (_, announcement_id: string, page: number, _id: string) => {
    console.log(
      `[Main Process] delete-block called with announcement_id: ${announcement_id}, page: ${page}, _id: ${_id}`
    )
    if (!dbManager) {
      console.error('Database manager not initialized')
      throw new Error('Database manager not initialized')
    }
    try {
      await dbManager.deleteBlock(announcement_id, page, _id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete block:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler to insert a new block
  ipcMain.handle('insert-block', async (_, announcement_id: string, page: number, block: Block) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      throw new Error('Database manager not initialized')
    }
    try {
      await dbManager.insertBlock(announcement_id, page, block)
      return { success: true }
    } catch (error) {
      console.error('Failed to insert block:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler to update file completion status
  ipcMain.handle(
    'update-file-status',
    async (_, announcement_id: string, page: number, completed: boolean) => {
      if (!dbManager) {
        console.error('Database manager not initialized')
        return { success: false, error: 'Database manager not initialized' }
      }
      try {
        const success = await dbManager.updateFileStatus(announcement_id, page, completed)
        if (success) {
          return { success: true }
        } else {
          return { success: false, error: 'Failed to update status in database' }
        }
      } catch (error) {
        console.error(`Failed to update status for ${announcement_id}, page: ${page}:`, error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  // --- Condition IPC handlers ---
  ipcMain.handle(
    'update-condition',
    async (
      _event,
      announcement_id: string,
      page: number,
      _id: string,
      update: Partial<Condition>
    ) => {
      if (!dbManager) {
        console.error('Database manager not initialized')
        return { success: false, error: 'Database manager not initialized' }
      }
      try {
        await dbManager.updateCondition(announcement_id, page, _id, update)
        return { success: true }
      } catch (error) {
        console.error('Failed to update condition:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  ipcMain.handle(
    'delete-condition',
    async (_event, announcement_id: string, page: number, _id: string) => {
      if (!dbManager) {
        console.error('Database manager not initialized')
        return { success: false, error: 'Database manager not initialized' }
      }
      try {
        await dbManager.deleteCondition(announcement_id, page, _id)
        return { success: true }
      } catch (error) {
        console.error('Failed to delete condition:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  ipcMain.handle('insert-condition', async (_event, condition: Condition) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      return { success: false, error: 'Database manager not initialized' }
    }
    try {
      await dbManager.insertCondition(condition)
      return { success: true }
    } catch (error) {
      console.error('Failed to insert condition:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
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
