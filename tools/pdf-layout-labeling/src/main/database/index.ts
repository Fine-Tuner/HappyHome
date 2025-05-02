import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb'
import { EventEmitter } from 'events'

export class Database extends EventEmitter {
  private client: MongoClient | null
  private db: Db | null
  private readonly maxRetries = 1
  private readonly retryDelay = 1000 // 1 second
  private uri: string
  private dbname: string
  private connectionPromise: Promise<boolean> | null
  private isConnected: boolean = false
  private readonly connectTimeoutMS = 3000

  constructor() {
    super()
    this.client = null
    this.db = null
    this.uri = ''
    this.dbname = ''
    this.connectionPromise = null
  }

  get connected(): boolean {
    return this.isConnected
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client || !this.db) {
      this.isConnected = false
      return false
    }

    try {
      await this.db.command({ ping: 1 })
      this.isConnected = true
      return true
    } catch (error) {
      console.error('Database connection check failed:', error)
      this.isConnected = false
      return false
    }
  }

  async connect(uri: string, dbname: string): Promise<boolean> {
    this.uri = uri
    this.dbname = dbname

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.reconnect()
    const result = await this.connectionPromise
    this.connectionPromise = null
    return result
  }

  async getCollection(collectionName: string): Promise<Collection> {
    const db = await this.getDb()
    return db.collection(collectionName)
  }

  async closeConnection(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close()
        this.client = null
        this.db = null
        console.log('Disconnected from MongoDB')
        this.emit('disconnected')
      } catch (error) {
        console.error('Error closing MongoDB connection:', error)
        throw error
      }
    }
  }

  private async getDb(): Promise<Db> {
    if (!this.db || !this.connected) {
      await this.reconnect()
    }
    if (!this.db) {
      throw new Error('Failed to establish database connection')
    }
    return this.db
  }

  private async reconnect(): Promise<boolean> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const options: MongoClientOptions = {
          connectTimeoutMS: this.connectTimeoutMS
        }
        this.client = await MongoClient.connect(this.uri, options)
        this.db = this.client.db(this.dbname)
        console.log('Connected to MongoDB')
        this.isConnected = true
        this.emit('connected')

        // Set up listeners for disconnection
        this.client.on('close', () => {
          console.log('MongoDB connection closed')
          this.isConnected = false
          this.emit('disconnected')
        })

        this.client.on('timeout', () => {
          console.log('MongoDB connection timeout')
          this.isConnected = false
          this.emit('disconnected')
        })

        return true
      } catch (error) {
        console.error(`Attempt ${attempt} to connect failed:`, error)
        this.emit('connectionFailed', error)
        if (attempt === this.maxRetries) {
          console.error('Max retries exceeded')
          this.isConnected = false
          return false
        }
        await this.delay(this.retryDelay)
      }
    }
    return false
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

const database = new Database()
export default database
