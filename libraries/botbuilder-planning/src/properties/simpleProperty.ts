/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEventSource, PropertyEvent, SetPropertyEvent, PropertyEventTypes } from './propertyEventSource';
import { PropertyAccessor } from './propertyAccessor';
import { CompositePropertyAccessor } from './compositePropertyAccessor';

export class SimpleProperty<T = any> extends PropertyEventSource implements PropertyAccessor<T> {
    public name: string;
    public parent: CompositePropertyAccessor|undefined;

    constructor(name?: string) {
        super();
        this.name = name;
    }

    public async delete(context: TurnContext): Promise<void> {
        this.ensureConfigured();
        await this.emitDeleteEvent(context, async () => {
            await this.onDelete(context);
        });
    }

    public get(context: TurnContext): Promise<T | undefined>;
    public get(context: TurnContext, defaultValue: T): Promise<T>;
    public async get(context: TurnContext, defaultValue?: T): Promise<T | undefined> {
        this.ensureConfigured();
        return await this.onGet(context, defaultValue);
    }

    public async set(context: TurnContext, value: T): Promise<void> {
        this.ensureConfigured();
        await this.emitSetEvent(context, value, async () => {
            await this.onSet(context, value);
        });
    }

    protected async onDelete(context: TurnContext): Promise<void> {
        await this.parent.deletePropertyValue(context, this.name);
    }

    protected async onGet(context: TurnContext, defaultValue?: T): Promise<T|undefined> {
        let value = await this.parent.getPropertyValue(context, this.name);
        if (value === undefined && defaultValue !== undefined) {
            value = typeof defaultValue === 'object' || Array.isArray(defaultValue) ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
            await this.emitSetEvent(context, value, async () => {
                await this.parent.setPropertyValue(context, this.name, value);
            });
        }
        return value;
    }

    protected async onSet(context: TurnContext, value: T): Promise<void> {
        await this.parent.setPropertyValue(context, this.name, value);
    }

    protected async emitDeleteEvent(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const event: PropertyEvent = {
            type: PropertyEventTypes.deleteProperty,
            property: this
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, next);
        });
    }

    protected async emitSetEvent(context: TurnContext, value: T, next: () => Promise<void>): Promise<void> {
        const event: SetPropertyEvent = {
            type: PropertyEventTypes.setProperty,
            property: this,
            value: value
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, next);
        });

    }

    protected ensureConfigured() {
        if (!this.parent) { throw new Error(`The property doesn't have a 'parent' assigned.`) }
        if (!this.name) { throw new Error(`The property doesn't have a 'name' assigned.`) }
    }
}
