/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { CachedDocumentCollection } from './cachedDocumentCollection';

export class InMemoryDocumentCollection extends CachedDocumentCollection {
    private readonly docs: Map<string, InMemoryValue> = new Map();

    public async onDeleteProperty(context: TurnContext, id: string): Promise<void> {
        if (this.docs.has(id)) {
            this.docs.delete(id);
        }        
    }
    
    public async onGetProperty<T = any>(context: TurnContext, id: string): Promise<T | undefined> {
        if (this.docs.has(id)) {
            const val = this.docs.get(id);
            return val._typeof === 'object' || val._typeof === 'array' ? JSON.parse(val._value) : val._value;
        }
        return undefined;
    }

    public async onSetProperty(context: TurnContext, id: string, value: any): Promise<void> {
        const val = { _typeof: Array.isArray(value) ? 'array' : typeof value } as InMemoryValue;
        val._value = val._typeof === 'object' || val._typeof === 'array' ? JSON.stringify(value) : value;
        this.docs.set(id, val);
    }
}

/** @private */
interface InMemoryValue {
    _typeof: string;
    _value: any;
}