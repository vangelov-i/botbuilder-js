/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DocumentAccessor } from './documentAccessor';
import { PropertyEventSource } from './propertyEventSource';

export class TemporaryDocument extends PropertyEventSource implements DocumentAccessor {
    private value: object;

    public parent: DocumentAccessor = undefined;

    constructor(value?: object) {
        super();
        this.value = value;
    }

    public async getPath(context: TurnContext): Promise<string> {
        return '';
    }

    public async deletePropertyValue(context: TurnContext, id: string): Promise<void> {
        this.value = undefined;
    }
    
    public async getPropertyValue<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    public async getPropertyValue<T = any>(context: TurnContext, id: string, defaultValue: T): Promise<T>;
    public async getPropertyValue<T = any>(context: TurnContext, id: string, defaultValue?: T): Promise<T | undefined> {
        if (!this.value) { this.value = defaultValue || {} }
        if (id) { this.value['_id'] = id }
        return this.value as any;
    }

    public async setPropertyValue(context: TurnContext, id: string, value: any): Promise<void> {
        this.value = value;
        if (id && this.value) { this.value['_id'] = id }
    }
}
