/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DocumentAccessor } from './documentAccessor';
import { DocumentContainer } from './documentContainer';
import { PropertyEventSource, PropertyEvent } from './propertyEventSource';

export class TemporaryDocument extends PropertyEventSource implements DocumentAccessor {
    private body: object;

    public parent: DocumentAccessor;

    constructor(body?: object, parent?: DocumentAccessor) {
        super();
        this.body = body;
        this.parent = parent;
    }

    public get container(): DocumentContainer|undefined {
        return this.parent ? this.parent.container : undefined;
    } 

    public async getPath(context: TurnContext): Promise<string> {
        return '';
    }

    public async deletePropertyValue(context: TurnContext, id: string): Promise<void> {
        this.body = undefined;
    }
    
    public async getPropertyValue<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    public async getPropertyValue<T = any>(context: TurnContext, id: string, defaultValue: T): Promise<T>;
    public async getPropertyValue<T = any>(context: TurnContext, id: string, defaultValue?: T): Promise<T | undefined> {
        if (!this.body) { this.body = defaultValue || {} }
        if (id) { this.body['id'] = id }
        return this.body as any;
    }

    public async setPropertyValue(context: TurnContext, id: string, value: any): Promise<void> {
        this.body = value;
        if (id && this.body) { this.body['id'] = id }
    }

    public async emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
        // We want to bubble event to our parent after they've been dispatched locally. 
        await super.emitEvent(context, event, async () => {
            if (this.parent) {
                await this.parent.emitEvent(context, event, async () => {
                    await next();
                });
            } else {
                await next();
            }
        });
    }
}
