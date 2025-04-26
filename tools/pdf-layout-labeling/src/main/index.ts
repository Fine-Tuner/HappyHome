import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './database/manager'
import fs from 'fs/promises'
import { imageSize } from 'image-size'
import { Block } from '../types'

const dbUri = 'mongodb://localhost:27017'
const dbName = 'pdf_layout'
let dbManager
let currentDirectoryPath: string | null = null

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

  dbManager = new DatabaseManager(mainWindow)
  dbManager.initialize(dbUri, dbName)

  ipcMain.handle('get-blocks', async (_event, filename: string) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      return []
    }
    return await dbManager.getBlocksByFilename(filename)
  })

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
      return imageFiles.map((dirent, index) => ({
        id: index,
        filename: dirent.name
      }))
    } catch (error) {
      console.error('Error reading directory:', error)
      return []
    }
  })

  ipcMain.handle('get-image-data', async (_, filename: string) => {
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
      // Fetch blocks associated with the filename
      const blocks = await dbManager.getBlocksByFilename(filename)

      return {
        data: data.toString('base64'),
        width: dimensions.width,
        height: dimensions.height,
        blocks // Include blocks in the response
      }
    } catch (error) {
      console.error(`Error reading image file ${imagePath}:`, error)
      return null
    }
  })

  ipcMain.handle(
    'update-block',
    async (_, filename: string, uid: string, update: Partial<Block>) => {
      if (!dbManager) {
        console.error('Database manager not initialized')
        return { success: false, error: 'Database manager not initialized' }
      }
      try {
        await dbManager.updateBlock(filename, uid, update)
        return { success: true }
      } catch (error) {
        console.error('Failed to update block:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  // Handler to delete a block
  ipcMain.handle('delete-block', async (_, filename: string, uid: string) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      throw new Error('Database manager not initialized')
    }
    try {
      await dbManager.deleteBlock(filename, uid)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete block:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler to insert a new block
  ipcMain.handle('insert-block', async (_, filename: string, block: Block) => {
    if (!dbManager) {
      console.error('Database manager not initialized')
      throw new Error('Database manager not initialized')
    }
    try {
      await dbManager.insertBlock(filename, block)
      return { success: true }
    } catch (error) {
      console.error('Failed to insert block:', error)
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
