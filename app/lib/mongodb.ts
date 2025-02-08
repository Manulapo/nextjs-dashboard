import { Db, MongoClient, MongoClientOptions } from 'mongodb';

class MongoConnection {
    private static instance: MongoConnection;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnected = false;

    private constructor() { }

    // avoid multiple connections returning the same instance
    static getInstance(): MongoConnection {
        if (!MongoConnection.instance) {
            MongoConnection.instance = new MongoConnection();
        }
        return MongoConnection.instance;
    }

    // Connect to MongoDB
    async connect(): Promise<Db> {
        if (this.db && this.isConnected) {
            return this.db;
        }

        const uri = process.env.MONGODB_URI;
        const dbName = process.env.MONGODB_DB;

        if (!uri || !dbName) {
            throw new Error('Missing MongoDB connection details');
        }

        const options: MongoClientOptions = {
            // Maximum number of connections in the connection pool
            // Higher values allow more concurrent operations but use more system resources
            maxPoolSize: 10,

            // Minimum number of connections that must be maintained in the pool
            // Keeps connections ready for sudden traffic spikes
            minPoolSize: 5,

            // Maximum time (in milliseconds) to wait for initial connection
            // If exceeded, connection attempt fails
            connectTimeoutMS: 10000,

            // Maximum time (in milliseconds) for operations to complete
            // If exceeded, operation fails with timeout error
            socketTimeoutMS: 45000,

            // IP version to use
            // 4 = IPv4 only, 6 = IPv6 only, 0 = try both
            family: 4,

            // Automatically retry write operations if they fail
            // Helps with temporary network issues or primary node failures
            retryWrites: true,

            // Automatically retry read operations if they fail
            // Helps with temporary network issues or secondary node failures
            retryReads: true,
        };

        try {
            this.client = new MongoClient(uri, options);
            await this.client.connect();
            this.db = this.client.db(dbName);
            this.isConnected = true;

            // Monitor connection
            this.client.on('close', () => {
                this.isConnected = false;
            });

            return this.db;
        } catch (error) {
            console.error('MongoDB connection failed:', error);
            this.isConnected = false;
            throw new Error('Failed to connect to database');
        }
    }

    // Close MongoDB connection
    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            this.db = null;
        }
    }

    // Check if connected to MongoDB
    isConnectedToDb(): boolean {
        return this.isConnected;
    }
}

export async function connectToDatabase(): Promise<Db> {
    const mongo = MongoConnection.getInstance();
    return mongo.connect();
}

export async function closeDatabaseConnection(): Promise<void> {
    const mongo = MongoConnection.getInstance();
    return mongo.close();
}