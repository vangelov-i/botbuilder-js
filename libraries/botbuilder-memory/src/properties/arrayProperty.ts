/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyBase } from '../propertyBase';
import { ArrayInsertEvent, ArrayRemoveEvent, PropertyEventTypes } from '../propertyEventSource';
import { PropertyAccessor } from '../propertyAccessor';
import { ArrayItemAccessor } from './arrayItemAccessor';
import { StaticIdFactory } from '../factories';

export class ArrayProperty<T = any> extends PropertyBase<T[]> {

    public item(position: number, propertyAccessor: PropertyAccessor<T>): PropertyAccessor<T> {
        propertyAccessor.idFactory = new StaticIdFactory(position.toString());
        propertyAccessor.parent = new ArrayItemAccessor(this);
        return propertyAccessor;
    }

    public async getItemValue(context: TurnContext, position: number): Promise<T> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        return array[position];
    }

    public async getLength(context: TurnContext): Promise<number> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        return Array.isArray(array) ? array.length : 0;
    }

    public async insertItem(context: TurnContext, value: T, position = -1): Promise<void> {
        this.ensureConfigured();
        await this.emitArrayInsertEvent(context, value, position, async (val) => {
            await this.onInsertItem(context, val, position);
        });
    }

    public async removeItem(context: TurnContext, position = -1): Promise<void> {
        this.ensureConfigured();
        await this.emitArrayRemoveEvent(context, position, async () => {
            await this.onRemoveItem(context, position);
        });
    }

    public async setItemValue(context: TurnContext, position: number, value: T): Promise<void> {
        this.ensureConfigured();
        const array = await this.getArray(context);
        array[position] = value;
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

    protected async onInsertItem(context: TurnContext, value: T, position: number): Promise<void> {
        const array = await this.getArray(context) || [];
        if (position >= 0) {
            array.splice(position, 0, value);
        } else {
            array.push(value);
        }
        await this.setArray(context, array);
    }

    protected async onRemoveItem(context: TurnContext, position: number): Promise<void> {
        const array = await this.getArray(context);
        if (position >= 0) {
            array.splice(position, 1);
        } else {
            array.pop();
        }
        await this.setArray(context, array);
    }

    protected async emitArrayInsertEvent(context: TurnContext, value: T, position: number, next: (value: T) => Promise<void>): Promise<void> {
        const event: ArrayInsertEvent = {
            type: PropertyEventTypes.arrayInsert,
            property: this,
            position: position,
            value: value
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next(event.value);
            });
        });
    }

    protected async emitArrayRemoveEvent(context: TurnContext, position: number, next: () => Promise<void>): Promise<void> {
        const event: ArrayRemoveEvent = {
            type: PropertyEventTypes.arrayRemove,
            property: this,
            position: position
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next();
            });
        });
    }

    private async getArray(context: TurnContext): Promise<T[]> {
        const id = await this.getId(context);
        return await this.parent.getProperty(context, id);
    }

    private async setArray(context: TurnContext, array: T[]): Promise<void> {
        const id = await this.getId(context);
        await this.parent.setProperty(context, id, array);
    }
}
