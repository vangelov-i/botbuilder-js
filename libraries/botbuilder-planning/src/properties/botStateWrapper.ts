/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext, BotState } from 'botbuilder-core';
import { CompositePropertyAccessor } from './compositePropertyAccessor';
import { PropertyEventSource, PropertyEvent, PropertyEventTypes } from './propertyEventSource';
import { PropertyAccessor } from './propertyAccessor';

export class BotStateWrapper extends PropertyEventSource implements CompositePropertyAccessor {
    private readonly botState: BotState;
    private properties: { [name: string]: PropertyAccessor; } = {};

    public name: string;

    public parent: CompositePropertyAccessor|undefined;

    constructor(botState: BotState, name?: string) {
        super();
        this.botState = botState;
        this.name = name;
    }

    public addProperty(property: PropertyAccessor): this {
        if (this.properties.hasOwnProperty(property.name)) { throw new Error(`A property named '${property.name}' already added.`) }
        property.parent = this;
        this.properties[property.name] = property;
        return this;
    }

    public getProperty(name: string): PropertyAccessor {
        if (!this.properties.hasOwnProperty(name)) { throw new Error(`A property named '${name}' couldn't be found.`) }
        return this.properties[name];
    }

    public async deletePropertyValue(context: TurnContext, name: string): Promise<void> {
        const container = await this.botState.load(context);
        if (container.hasOwnProperty(name)) {
            delete container[name];
        }
    }
    
    public async getPropertyValue<T = any>(context: TurnContext, name: string): Promise<T | undefined>;
    public async getPropertyValue<T = any>(context: TurnContext, name: string, defaultValue: T): Promise<T>;
    public async getPropertyValue<T = any>(context: TurnContext, name: string, defaultValue?: T): Promise<T | undefined> {
        const container = await this.botState.load(context);
        let value = container[name];
        if (value === undefined && defaultValue !== undefined) {
            value = typeof defaultValue === 'object' || Array.isArray(defaultValue) ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
            container[name] = value;
        }
        return value;
    }

    public async setPropertyValue(context: TurnContext, name: string, value: any): Promise<void> {
        const container = await this.botState.load(context);
        container[name] = value;
    }

    public async emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
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
