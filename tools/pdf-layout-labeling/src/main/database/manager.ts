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

  public async getBlocks(announcement_id: string, page: number): Promise<Block[]> {
    try {
      const blocksCollection = await database.getCollection('block')
      const blocks = await blocksCollection.find<Block>({ announcement_id, page }).toArray()
      return blocks
    } catch (error) {
      console.error(
        `Error fetching blocks for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return [] // Return empty array on error
    }
  }

  // Updated parameters and query filter
  public async updateBlock(
    announcement_id: string,
    page: number,
    _id: string,
    update: Partial<Omit<Block, 'id' | 'announcement_id' | 'page'>> // Ensure update doesn't include immutable fields
  ): Promise<boolean> {
    console.log(
      `[DatabaseManager] updateBlock called with announcement_id: ${announcement_id}, page: ${page}, _id: ${_id}, update: ${JSON.stringify(update)}`
    )
    try {
      const blocksCollection = await database.getCollection('block')
      // Query by announcement_id, page, and id
      const result = await blocksCollection.updateOne(
        { announcement_id, page, _id },
        { $set: update }
      )
      return result.matchedCount > 0 && result.modifiedCount > 0
    } catch (error) {
      console.error(
        `Error updating block with id ${_id} for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false
    }
  }

  // Updated parameters and query filter
  public async deleteBlock(announcement_id: string, page: number, _id: string): Promise<boolean> {
    console.log(
      `[DatabaseManager] deleteBlock called with announcement_id: ${announcement_id}, page: ${page}, _id: ${_id}`
    )
    try {
      const blocksCollection = await database.getCollection('block')
      const result = await blocksCollection.deleteOne({ announcement_id, page, _id })
      return result.deletedCount > 0
    } catch (error) {
      console.error(
        `Error deleting block with id ${_id} for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false
    }
  }

  public async insertBlock(block: Block): Promise<boolean> {
    try {
      const blocksCollection = await database.getCollection('block')
      const result = await blocksCollection.insertOne(block)
      return result.acknowledged && result.insertedId !== null
    } catch (error) {
      console.error(
        `Error inserting block for announcement ${block.announcement_id}, page ${block.page}:`,
        error
      )
      return false
    }
  }

  public async getFileStatus(announcement_id: string, page: number): Promise<boolean> {
    try {
      const statusCollection = await database.getCollection('file_status')
      const statusDoc = await statusCollection.findOne<{ completed: boolean }>({
        announcement_id,
        page
      })
      return statusDoc?.completed ?? false // Default to false if not found
    } catch (error) {
      console.error(
        `Error fetching status for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false // Return false on error
    }
  }

  public async updateFileStatus(
    announcement_id: string,
    page: number,
    completed: boolean
  ): Promise<boolean> {
    try {
      const statusCollection = await database.getCollection('file_status')
      const result = await statusCollection.updateOne(
        { announcement_id, page },
        { $set: { completed } },
        { upsert: true } // Create the document if it doesn't exist
      )
      return result.acknowledged && (result.matchedCount > 0 || result.upsertedCount > 0)
    } catch (error) {
      console.error(
        `Error updating status for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false
    }
  }
}
