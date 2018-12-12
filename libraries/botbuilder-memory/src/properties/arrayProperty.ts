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
import { ArrayItemAccessor } from './arrayItemAccessor';
import { StaticIdFactory } from '../factories';
import { DocumentAccessor } from '../documentAccessor';
import { IdFactory } from '../idFactory';

export class ArrayProperty<T = any> extends PropertyBase<T[]> {

    public createAccessor(idOrFactory: string|IdFactory, parent: DocumentAccessor): PropertyAccessor<T[]> {
        // Clone property with new ID and parent.
        return this.copyTo(new ArrayProperty(idOrFactory, parent)); 
    }

    public createItemAccessor(index: number, propertyAccessor: PropertyAccessor<T>): PropertyAccessor<T> {
        const parent = new ArrayItemAccessor(this);
        return propertyAccessor.createAccessor(new StaticIdFactory(index.toString()), parent);
    }

    public async getItemValue(context: TurnContext, index: number): Promise<T> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        return array[index];
    }

    public async getLength(context: TurnContext): Promise<number> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        return Array.isArray(array) ? array.length : 0;
    }

    public async insertItem(context: TurnContext, valueOrAccessor: T|PropertyAccessor<T>, position = -1): Promise<void> {
        this.ensureConfigured();
        let val: T;
        if (typeof valueOrAccessor === 'object' && typeof (valueOrAccessor as PropertyAccessor<T>).get === 'function') {
            val = await (valueOrAccessor as PropertyAccessor<T>).get(context);
        } else {
            val = valueOrAccessor as T;
        }
        await this.emitCollectionInsertEvent(context, position, val, async (val) => {
            await this.onInsertItem(context, position, val);
        });
    }

    public async deleteItem(context: TurnContext, position = -1): Promise<void> {
        this.ensureConfigured();
        await this.emitCollectionDeleteEvent(context, position, async () => {
            await this.onDeleteItem(context, position);
        });
    }

    public async setItemValue(context: TurnContext, index: number, value: T): Promise<void> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        array[index] = value;
        await this.setArray(context, array);
    }

    protected async onHasChanged(context: TurnContext, value: T[]): Promise<boolean> {
        const curValue = await this.getArray(context);
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

    protected async onSet(context: TurnContext, value: T[]): Promise<void> {
        // Validate type being assigned
        if (value !== undefined && !Array.isArray(value)) { throw new Error(`ArrayProperty: invalid value assigned to property '${await this.getId(context)}'.`) }
        return super.onSet(context, value);
    }

    protected async onInsertItem(context: TurnContext, position: number, value: T): Promise<void> {
        const array = await this.getArray(context) || [];
        if (position >= 0) {
            array.splice(position, 0, value);
        } else {
            array.push(value);
        }
        await this.setArray(context, array);
    }

    protected async onDeleteItem(context: TurnContext, position: number): Promise<void> {
        const array = await this.getArray(context);
        if (position >= 0) {
            array.splice(position, 1);
        } else {
            array.pop();
        }
        await this.setArray(context, array);
    }

    protected async emitCollectionInsertEvent(context: TurnContext, position: number, value: T, next: (value: T) => Promise<void>): Promise<void> {
        const event: CollectionInsertEvent = {
            type: PropertyEventTypes.collectionInsert,
            property: this,
            key: position,
            value: value
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next(event.value);
            });
        });
    }

    protected async emitCollectionDeleteEvent(context: TurnContext, position: number, next: () => Promise<void>): Promise<void> {
        const event: CollectionDeleteEvent = {
            type: PropertyEventTypes.collectionDelete,
            property: this,
            key: position
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next();
            });
        });
    }

    private async getArray(context: TurnContext): Promise<T[]> {
        const id = await this.getId(context);
        return await this.parent.getPropertyValue(context, id);
    }

    private async setArray(context: TurnContext, array: T[]): Promise<void> {
        const id = await this.getId(context);
        await this.parent.setPropertyValue(context, id, array);
    }
}
