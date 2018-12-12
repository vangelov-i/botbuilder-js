/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEventSource } from './propertyEventSource';
import { DocumentAccessor } from './documentAccessor';


export abstract class CachedDocumentCollection extends PropertyEventSource implements DocumentAccessor {
    private readonly cacheKey: Symbol = Symbol('cachedCollection');
    private readonly documents: DocumentAccessor[] = [];

    protected abstract onDeleteProperty(context: TurnContext, id: string): Promise<void>;
    protected abstract onGetProperty<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    protected abstract onSetProperty<T = any>(context: TurnContext, id: string, value: T): Promise<void>;

    public parent: undefined;

    public addDocument(document: DocumentAccessor): this {
        document.parent = this;
        this.documents.push(document);
        return this;
    }

    public forEachDocument(callbackfn: (property: DocumentAccessor, index: number) => void): void {
        this.documents.forEach(callbackfn);
    }
    public async getPath(context: TurnContext): Promise<string> {
        return '';
    }

    public async deleteProperty(context: TurnContext, id: string): Promise<void> {
        const cache = this.getCache(context);
        if (cache.has(id)) {
            cache.delete(id);
        }
        await this.onDeleteProperty(context, id);
    }
    
    public async getProperty<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    public async getProperty<T = any>(context: TurnContext, id: string, defaultValue: T): Promise<T>;
    public async getProperty<T = any>(context: TurnContext, id: string, defaultValue?: T): Promise<T> {
        const cache = this.getCache(context);
        if (cache.has(id)) {
            cache.get(id)._value;
        } else {
            let value = await this.onGetProperty(context, id);
            if (value !== undefined) {
                this.setProperty(context, id, value);
                return value;
            } else if (defaultValue !== undefined) {
                const clone = Array.isArray(defaultValue) || typeof defaultValue === 'object' ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
                this.setProperty(context, id, clone);
                return clone;
            }
        }
        return undefined;
    }

    public async setProperty(context: TurnContext, id: string, value: any): Promise<void> {
        // Simply update the cache. The changes will be flushed when saveChanges() is called.
        const cache = this.getCache(context);
        if (cache.has(id)) {
            cache.get(id)._value = value;
        } else {
            cache.set(id, {
                _hash: JSON.stringify(value),
                _value: value
            });
        }
    }

    public async saveChanges(context: TurnContext): Promise<void> {
        // Flush any changes
        const promises: Promise<void>[] = [];
        const cache = this.getCache(context);
        cache.forEach((value, id) => {
            if (value._hash !== JSON.stringify(value._value)) {
                promises.push(this.onSetProperty(context, id, value._value));
            }
        });
        await Promise.all(promises);
    }

    private getCache(context: TurnContext): Map<string, CachedCollectionValue> {
        if (!context.turnState.has(this.cacheKey)) {
            context.turnState.set(this.cacheKey, new Map());
        }
        return context.turnState.get(this.cacheKey);
    }
}

/** @private */
interface CachedCollectionValue {
    _hash: string;
    _value: any;
}