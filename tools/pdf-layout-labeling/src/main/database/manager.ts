import database from '.'
import { BrowserWindow } from 'electron'
import { Block, Condition } from '../../types'

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
      console.error(`Error inserting block:`, block, error)
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

  // --- Condition methods ---
  public async getConditions(announcement_id: string, page: number): Promise<Condition[]> {
    try {
      console.log(`[DB] getConditions called for announcement_id=${announcement_id}, page=${page}`)
      const conditionCollection = await database.getCollection('condition')
      const conditions = await conditionCollection
        .find<Condition>({ announcement_id, page })
        .toArray()
      console.log(`[DB] getConditions success: found ${conditions.length} conditions`)
      return conditions
    } catch (error) {
      console.error(
        `[DB] Error fetching conditions for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return []
    }
  }

  public async updateCondition(
    announcement_id: string,
    page: number,
    _id: string,
    update: Partial<Omit<Condition, '_id' | 'announcement_id' | 'page'>>
  ): Promise<boolean> {
    try {
      console.log(`[DB] updateCondition called for _id=${_id}, update=`, update)
      const conditionCollection = await database.getCollection('condition')
      const result = await conditionCollection.updateOne(
        { announcement_id, page, _id },
        { $set: update }
      )
      if (result.matchedCount > 0 && result.modifiedCount > 0) {
        console.log('[DB] updateCondition success', result)
        return true
      } else {
        console.error('[DB] updateCondition failed', result)
        return false
      }
    } catch (error) {
      console.error(
        `[DB] Error updating condition with id ${_id} for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false
    }
  }

  public async deleteCondition(
    announcement_id: string,
    page: number,
    _id: string
  ): Promise<boolean> {
    try {
      console.log(`[DB] deleteCondition called for _id=${_id}`)
      const conditionCollection = await database.getCollection('condition')
      const result = await conditionCollection.deleteOne({ announcement_id, page, _id })
      if (result.deletedCount > 0) {
        console.log('[DB] deleteCondition success', result)
        return true
      } else {
        console.error('[DB] deleteCondition failed', result)
        return false
      }
    } catch (error) {
      console.error(
        `[DB] Error deleting condition with id ${_id} for announcement ${announcement_id}, page ${page}:`,
        error
      )
      return false
    }
  }

  public async insertCondition(condition: Condition): Promise<boolean> {
    try {
      console.log('[DB] insertCondition called', condition)
      const conditionCollection = await database.getCollection('condition')
      const result = await conditionCollection.insertOne(condition)
      if (result.acknowledged && result.insertedId !== null) {
        console.log('[DB] insertCondition success', result.insertedId)
        return true
      } else {
        console.error('[DB] insertCondition failed', result)
        return false
      }
    } catch (error) {
      console.error('[DB] Error inserting condition:', condition, error)
      return false
    }
  }
}
