/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DocumentAccessor } from '../documentAccessor';
import { DocumentContainer } from '../documentContainer';
import { MapProperty } from './mapProperty';
import { PropertyEvent, PropertyEventHandler } from '../propertyEventSource';

/** @private */
export class MapItemAccessor<T = any> implements DocumentAccessor {
    private _parent: MapProperty<T>;

    constructor(parent: MapProperty<T>) {
        this._parent = parent;
    }

    public get container(): DocumentContainer|undefined {
        return this.parent ? this.parent.container : undefined;
    }

    public get parent(): DocumentAccessor {
        return this._parent.parent;
    }

    public getPath(context: TurnContext): Promise<string> {
        return this._parent.getPath(context);
    }

    public async deletePropertyValue(context: TurnContext, id: string): Promise<void> {
        await this._parent.deleteItem(context, id); 
    }
    
    public async getPropertyValue(context: TurnContext, id: string): Promise<T | undefined>;
    public async getPropertyValue(context: TurnContext, id: string, defaultValue: T): Promise<T>;
    public async getPropertyValue(context: TurnContext, id: string, defaultValue?: T): Promise<T | undefined> {
        return await this._parent.getItemValue(context, id);
    }

    public async setPropertyValue(context: TurnContext, id: string, value: any): Promise<void> {
        return await this._parent.setItemValue(context, id, value);
    }

    public emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
        return this._parent.emitEvent(context, event, next);
    }

    public onEvent(handler: PropertyEventHandler): this {
        this._parent.onEvent(handler);
        return this;
    }
}