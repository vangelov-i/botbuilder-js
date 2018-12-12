/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DocumentAccessor } from '../documentAccessor';
import { ArrayProperty } from './arrayProperty';
import { PropertyEvent, PropertyEventHandler } from '../propertyEventSource';

/** @private */
export class ArrayItemAccessor<T = any> implements DocumentAccessor {
    private _parent: ArrayProperty<T>;

    constructor(parent: ArrayProperty<T>) {
        this._parent = parent;
    }

    public get parent(): DocumentAccessor {
        return this._parent.parent;
    }

    public getPath(context: TurnContext): Promise<string> {
        return this._parent.getPath(context);
    }

    public async deletePropertyValue(context: TurnContext, id: string): Promise<void> {
        const position = parseInt(id);
        await this._parent.deleteItem(context, position); 
    }
    
    public async getPropertyValue(context: TurnContext, id: string): Promise<T | undefined>;
    public async getPropertyValue(context: TurnContext, id: string, defaultValue: T): Promise<T>;
    public async getPropertyValue(context: TurnContext, id: string, defaultValue?: T): Promise<T | undefined> {
        const position = parseInt(id);
        return await this._parent.getItemValue(context, position);
    }

    public async setPropertyValue(context: TurnContext, id: string, value: any): Promise<void> {
        const position = parseInt(id);
        return await this._parent.setItemValue(context, position, value);
    }

    public emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
        return this._parent.emitEvent(context, event, next);
    }

    public onEvent(handler: PropertyEventHandler): this {
        this._parent.onEvent(handler);
        return this;
    }
}