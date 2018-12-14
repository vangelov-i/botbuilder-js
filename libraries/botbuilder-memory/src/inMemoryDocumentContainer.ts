/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { CachedDocumentContainer } from './cachedDocumentContainer';
import { DocumentContainer } from './documentContainer';

export class InMemoryDocumentContainer extends CachedDocumentContainer implements DocumentContainer {
    private readonly docs: Map<string, string> = new Map();
    private lastId = 0;

    public get client(): any {
        return undefined;
    }

    public get container(): DocumentContainer {
        return this;
    }

    public get containerType(): string {
        return 'memory';
    }

    public async create<T = object>(body: T, options?: any): Promise<T> {
        // Validate body object
        if (typeof body !== 'object') { throw new Error(`InMemoryDocumentContainer.create(): invalid type of '${typeof body}' passed for body.`) }

        // Assign ID
        if (!body['id']) { body['id'] = (++this.lastId).toString() }

        // Ensure object unique in container
        const id = body['id'];
        if (this.docs.has(id)) { throw new Error(`InMemoryDocumentContainer.create(): a document with an ID of '${id}' already exists.`) }

        // Store serialized document
        this.docs.set(id, JSON.stringify(body));
        return body;
    }

    public async delete(id: string, options?: any): Promise<boolean> {
        if (this.docs.has(id)) {
            this.docs.delete(id);
            return true;
        }
        return false;
    }

    public async read<T = object>(id: string, options?: any): Promise<T|undefined> {
        if (this.docs.has(id)) {
            return JSON.parse(this.docs.get(id));
        }
        return undefined;
    }

    public async replace<T = object>(body: T, options?: any): Promise<T> {
        // Validate body object
        if (typeof body !== 'object') { throw new Error(`InMemoryDocumentContainer.replace(): invalid type of '${typeof body}' passed for body.`) }
        if (typeof body['id'] !== 'string') { throw new Error(`InMemoryDocumentContainer.replace(): invalid or missing body.id.`) }

        // Ensure object exists in container
        const id = body['id'];
        if (!this.docs.has(id)) { throw new Error(`InMemoryDocumentContainer.replace(): a document with an ID of '${id}' could not be found.`) }

        // Store serialized document
        this.docs.set(id, JSON.stringify(body));
        return body;
    }

    public async upsert<T = object>(body: T, options?: any): Promise<T> {
        // Validate body object
        if (typeof body !== 'object') { throw new Error(`InMemoryDocumentContainer.upsert(): invalid type of '${typeof body}' passed for body.`) }

        // Assign ID
        if (!body['id']) { body['id'] = (++this.lastId).toString() }

        // Store serialized document
        const id = body['id'];
        this.docs.set(id, JSON.stringify(body));
        return body;
    }

    public async onDeleteProperty(context: TurnContext, id: string): Promise<void> {
        await this.delete(id);
    }
    
    public async onGetProperty<T = any>(context: TurnContext, id: string): Promise<T | undefined> {
        return await this.read<T>(id);
    }

    public async onSetProperty(context: TurnContext, id: string, value: any): Promise<void> {
        if (id) { value['id'] = id }
        return await this.upsert(value);
    }
}
