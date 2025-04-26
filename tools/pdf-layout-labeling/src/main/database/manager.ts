import database from '.'
import { BrowserWindow } from 'electron'
import { Block } from '../../types'

export class DatabaseManager {
  private mainWindow: BrowserWindow
  private checkInterval: NodeJS.Timeout | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.startStatusCheck()
  }

  private startStatusCheck(): void {
    // Check status every 5 seconds (adjust as needed)
    this.checkInterval = setInterval(async () => {
      await this.checkAndSendStatus()
    }, 2000)
  }

  private async checkAndSendStatus(): Promise<void> {
    const isConnected = await database.checkConnection()
    const status = { connected: isConnected }
    this.mainWindow.webContents.send('db-status-update', status)
  }

  public stopStatusCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }

  async initialize(uri: string, dbname: string): Promise<void> {
    await database.connect(uri, dbname)
    await this.checkAndSendStatus() // Immediately check and send status after initialization
  }

  public async getBlocksByFilename(filename: string): Promise<Block[]> {
    try {
      const blocksCollection = await database.getCollection('blocks')
      // Assuming the document structure has a field named 'filename'
      const blocks = await blocksCollection.find<Block>({ filename }).toArray()
      return blocks
    } catch (error) {
      console.error(`Error fetching blocks for filename ${filename}:`, error)
      return [] // Return empty array on error
    }
  }

  public async updateBlock(
    filename: string,
    uid: string,
    update: Partial<Block>
  ): Promise<boolean> {
    try {
      const blocksCollection = await database.getCollection('blocks')
      const result = await blocksCollection.updateOne({ filename, uid: uid }, { $set: update })
      return result.matchedCount > 0 && result.modifiedCount > 0
    } catch (error) {
      console.error(`Error updating block with uid ${uid} for filename ${filename}:`, error)
      return false
    }
  }

  public async deleteBlock(filename: string, uid: string): Promise<boolean> {
    try {
      const blocksCollection = await database.getCollection('blocks')
      const result = await blocksCollection.deleteOne({ filename, uid })
      return result.deletedCount > 0
    } catch (error) {
      console.error(`Error deleting block with uid ${uid} for filename ${filename}:`, error)
      return false
    }
  }

  public async insertBlock(filename: string, block: Block): Promise<boolean> {
    try {
      const blocksCollection = await database.getCollection('blocks')
      // Ensure the block has the correct filename associated
      const blockToInsert = { ...block, filename }
      const result = await blocksCollection.insertOne(blockToInsert)
      return result.acknowledged && result.insertedId !== null
    } catch (error) {
      console.error(`Error inserting block for filename ${filename}:`, error)
      return false
    }
  }
}
