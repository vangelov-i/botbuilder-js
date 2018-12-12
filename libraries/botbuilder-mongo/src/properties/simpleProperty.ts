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

export abstract class SimpleProperty<T = any> extends PropertyEventSource implements PropertyAccessor<T> {
    public name: string;
    public typeName: string;
    public parent: CompositePropertyAccessor|undefined;

    constructor(name?: string) {
        super();
        this.name = name;
        this.typeName = name;
    }

    public async delete(context: TurnContext): Promise<void> {
        this.ensureConfigured();
        const exists = this.onHasChanged(context, undefined);
        if (exists) {
            await this.emitDeleteEvent(context, async () => {
                await this.onDelete(context);
            });
        }
    }

    public get(context: TurnContext): Promise<T | undefined>;
    public get(context: TurnContext, defaultValue: T): Promise<T>;
    public async get(context: TurnContext, defaultValue?: T): Promise<T | undefined> {
        this.ensureConfigured();
        return await this.onGet(context, defaultValue);
    }

    public async hasChanged(context: TurnContext, value: T): Promise<boolean> {
        this.ensureConfigured();
        return await this.onHasChanged(context, value);
    }

    public async set(context: TurnContext, value: T, force?: boolean): Promise<void> {
        this.ensureConfigured();
        const changed = force || await this.onHasChanged(context, value);
        if (changed) {
            await this.emitSetEvent(context, value, async (val) => {
                await this.onSet(context, val);
            });
        }
    }

    public clone(obj?: this): this {
        obj.name = this.name;
        obj.typeName = this.typeName;
        obj.parent = this.parent;
        return super.clone(obj);
    }

    protected abstract onHasChanged(context: TurnContext, value: T): Promise<boolean>;

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

    protected async emitSetEvent(context: TurnContext, value: T, next: (value: T) => Promise<void>): Promise<void> {
        const event: SetPropertyEvent = {
            type: PropertyEventTypes.setProperty,
            property: this,
            value: value
        };
        await this.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next(event.value);
            });
        });

    }

    protected ensureConfigured() {
        if (!this.parent) { throw new Error(`The property doesn't have a 'parent' assigned.`) }
        if (!this.name) { throw new Error(`The property doesn't have a 'name' assigned.`) }
    }
}
