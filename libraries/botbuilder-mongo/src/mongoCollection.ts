/**
 * @module botbuilder-mongo
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { MongoClient, MongoClientOptions, Collection, Db } from 'mongodb';

export class MongoCollection<TSchema = any> {
    public client: MongoClient;
    public dbName: string;
    public collectionName: string;

    constructor(uriOrClient?: string|MongoClient, clientOptions?: MongoClientOptions, dbName?:string, collectionName?: string) {
        if (uriOrClient !== undefined) {
            this.client = typeof uriOrClient === 'string' ? new MongoClient(uriOrClient, clientOptions) : uriOrClient;
        }
        this.dbName = dbName;
        this.collectionName = collectionName;
    }

    public async collection(): Promise<Collection<TSchema>> {
        const db = await this.db();
        return db.collection(this.collectionName);
    }

    public async db(): Promise<Db> {
        await this.ensureConnected();
        return this.client.db(this.dbName);
    }

    protected async ensureConnected(): Promise<void> {
        if (!this.client) { throw new Error(`MongoCollection: no 'client' has been set.`) }
        if (!this.dbName) { throw new Error(`MongoCollection: no 'dbName' has been set.`) }
        if (!this.collectionName) { throw new Error(`MongoCollection: no 'collectionName' has been set.`) }
        if (!this.client.isConnected()) {
            await this.client.connect();
        }
    }
}
