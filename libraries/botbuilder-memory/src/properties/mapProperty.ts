/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyBase } from '../propertyBase';
import { CollectionInsertEvent, CollectionDeleteEvent, PropertyEventTypes } from '../propertyEventSource';
import { PropertyAccessor } from '../propertyAccessor';
import { MapItemAccessor } from './mapItemAccessor';
import { StaticIdFactory } from '../factories';
import { DocumentAccessor } from '../documentAccessor';
import { IdFactory } from '../idFactory';

export interface MapOf<T = any> {
    [key: string]: T;
}

export class MapProperty<T = any> extends PropertyBase<MapOf<T>> {

    public createAccessor(idOrFactory: string|IdFactory, parent: DocumentAccessor): PropertyAccessor<MapOf<T>> {
        // Clone property with new ID and parent.
        return this.copyTo(new MapProperty(idOrFactory, parent)); 
    }

    public createItemAccessor(key: string, propertyAccessor: PropertyAccessor<T>): PropertyAccessor<T> {
        const parent = new MapItemAccessor(this);
        return propertyAccessor.createAccessor(new StaticIdFactory(key), parent);
    }

    public async getItemValue(context: TurnContext, key: string): Promise<T> {
        this.ensureConfigured();
        const map = await this.getMap(context);
        return map[key];
    }

    public async insertItem(context: TurnContext, key: string, valueOrAccessor: T|PropertyAccessor<T>): Promise<void> {
        this.ensureConfigured();
        let val: T;
        if (typeof valueOrAccessor === 'object' && typeof (valueOrAccessor as PropertyAccessor<T>).get === 'function') {
            val = await (valueOrAccessor as PropertyAccessor<T>).get(context);
        } else {
            val = valueOrAccessor as T;
        }
        await this.emitCollectionInsertEvent(context, key, val, async (val) => {
            await this.onInsertItem(context, key, val);
        });
    }

    public async deleteItem(context: TurnContext, key: string): Promise<void> {
        this.ensureConfigured();
        await this.emitCollectionDeleteEvent(context, key, async () => {
            await this.onDeleteItem(context, key);
        });
    }

    public async setItemValue(context: TurnContext, key: string, value: T): Promise<void> {
        this.ensureConfigured();
        const map = await this.getMap(context);
        map[key] = value;
        await this.setMap(context, map);
    }

    protected async onHasChanged(context: TurnContext, value: MapOf<T>): Promise<boolean> {
        const curValue = await this.getMap(context);
        const hasValue = Array.isArray(curValue);
        if (Array.isArray(value)) {
            if (hasValue) {
                return JSON.stringify(curValue) !== JSON.stringify(value);
            } else {
                // We don't have anything assigned so return true
                return true;
            }
        } else {
            // We're being deleted so just return hasValue
            return hasValue;
        }
    }

    protected async onSet(context: TurnContext, value: MapOf<T>): Promise<void> {
        // Validate type being assigned
        if (value !== undefined && typeof value !== 'object') { throw new Error(`MapProperty: invalid value assigned to property '${await this.getId(context)}'.`) }
        return super.onSet(context, value);
    }

    protected async onInsertItem(context: TurnContext, key: string, value: T): Promise<void> {
        const map = await this.getMap(context) || {};
        map[key] = value;
        await this.setMap(context, map);
    }

    protected async onDeleteItem(context: TurnContext, key: string): Promise<void> {
        const map = await this.getMap(context);
        if (map.hasOwnProperty(key)) { delete map[key] }
        await this.setMap(context, map);
    }

    protected async emitCollectionInsertEvent(context: TurnContext, key: string, value: T, next: (value: T) => Promise<void>): Promise<void> {
        const event: CollectionInsertEvent = {
            type: PropertyEventTypes.collectionInsert,
            property: this,
            key: key,
            value: value
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next(event.value);
            });
        });
    }

    protected async emitCollectionDeleteEvent(context: TurnContext, key: string, next: () => Promise<void>): Promise<void> {
        const event: CollectionDeleteEvent = {
            type: PropertyEventTypes.collectionDelete,
            property: this,
            key: key
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next();
            });
        });
    }

    private async getMap(context: TurnContext): Promise<MapOf<T>> {
        const id = await this.getId(context);
        return await this.parent.getPropertyValue(context, id);
    }

    private async setMap(context: TurnContext, map: MapOf<T>): Promise<void> {
        const id = await this.getId(context);
        await this.parent.setPropertyValue(context, id, map);
    }
}
