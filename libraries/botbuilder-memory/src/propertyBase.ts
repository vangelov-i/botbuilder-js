/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEventSource, PropertyEvent, SetPropertyEvent, PropertyEventTypes } from './propertyEventSource';
import { PropertyAccessor } from './propertyAccessor';
import { DocumentAccessor } from './documentAccessor';
import { IdFactory } from './idFactory';
import { StaticIdFactory } from './factories';

export abstract class PropertyBase<T = any> extends PropertyEventSource implements PropertyAccessor<T> {
    private _tags: string[];

    public idFactory: IdFactory;
    public parent: DocumentAccessor|undefined;

    constructor(idOrFactory?: string|IdFactory) {
        super();
        this.idFactory = typeof idOrFactory === 'string' ? new StaticIdFactory(idOrFactory) : idOrFactory;
    }

    public get tags(): string[] {
        if (!Array.isArray(this._tags)) { this._tags = [] }
        return this._tags;
    }

    public set tags(value: string[]) {
        this._tags = value;
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

    public async get(context: TurnContext): Promise<T | undefined>;
    public async get(context: TurnContext, defaultValue: T): Promise<T>;
    public async get(context: TurnContext, defaultValue?: T): Promise<T | undefined> {
        this.ensureConfigured();
        return await this.onGet(context, defaultValue);
    }

    public async getId(context: TurnContext): Promise<string> {
        this.ensureConfigured();
        return await this.idFactory.getId(context);
    }

    public async getPath(context: TurnContext): Promise<string> {
        this.ensureConfigured();
        const id = await this.getId(context);
        const parentPath = await this.parent.getPath(context);
        return parentPath.length > 0 ? parentPath + '.' + id : id;
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

    protected abstract onHasChanged(context: TurnContext, value: T): Promise<boolean>;

    protected async onDelete(context: TurnContext): Promise<void> {
        const id = await this.getId(context);
        await this.parent.deleteProperty(context, id);
    }

    protected async onGet(context: TurnContext, defaultValue?: any): Promise<any> {
        const id = await this.getId(context);
        let value = await this.parent.getProperty(context, id);
        if (value === undefined && defaultValue !== undefined) {
            value = typeof defaultValue === 'object' || Array.isArray(defaultValue) ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
            await this.emitSetEvent(context, value, async () => {
                await this.parent.setProperty(context, id, value);
            });
        }
        return value;
    }

    protected async onSet(context: TurnContext, value: any): Promise<void> {
        const id = await this.getId(context);
        await this.parent.setProperty(context, id, value);
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
        if (!this.idFactory) { throw new Error(`The property doesn't have a 'idFactory' assigned.`) }
    }
} 