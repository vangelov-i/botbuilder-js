/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { SimpleProperty } from './simpleProperty';
import { PropertyAccessor } from './propertyAccessor';
import { CompositePropertyAccessor } from './compositePropertyAccessor';
import { PropertyEvent } from './propertyEventSource';

export class CompositeProperty<T extends object = {}> extends SimpleProperty<T> implements CompositePropertyAccessor {
    private properties: { [name: string]: PropertyAccessor; } = {};

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
        this.ensureConfigured();
        const container = await this.parent.getPropertyValue(context, this.name, {});
        if (container.hasOwnProperty(name)) {
            delete container[name];
            await this.parent.setPropertyValue(context, this.name, container);
        }
    }
    
    public async getPropertyValue<V = any>(context: TurnContext, name: string): Promise<V | undefined>;
    public async getPropertyValue<V = any>(context: TurnContext, name: string, defaultValue: V): Promise<V>;
    public async getPropertyValue<V = any>(context: TurnContext, name: string, defaultValue?: V): Promise<V | undefined> {
        const container = await this.parent.getPropertyValue(context, this.name, {});
        if (!container.hasOwnProperty(name) && defaultValue !== undefined) {
            container[name] = defaultValue;
            await this.parent.setPropertyValue(context, this.name, container);
        }

        return container[name];
    }

    public async setPropertyValue(context: TurnContext, name: string, value: any): Promise<void> {
        const container = await this.parent.getPropertyValue(context, this.name, {});
        container[name] = value;
        await this.parent.setPropertyValue(context, this.name, container);
    }

    public async emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
        await super.emitEvent(context, event, async () => {
            await this.parent.emitEvent(context, event, async () => {
                await next();
            });
        });
    }

    public clone(obj?: this): this {
        if (!obj) { obj = new CompositeProperty() as this }
        Object.assign(obj.properties, this.properties);
        return super.clone(obj);
    }

    protected async onHasChanged(context: TurnContext, value: T): Promise<boolean> {
        const hasValue = await this.parent.getPropertyValue(context, this.name) !== undefined;
        if (typeof value === 'object') {
            if (hasValue) {
                // Check for any changes to individual properties
                for (const name in value) {
                    if (this.properties.hasOwnProperty(name)) {
                        const changed = await this.properties[name].hasChanged(context, value[name]);
                        if (changed) {
                            return true;
                        }
                    }
                }
            } else {
                // We don't have anything assigned so return true
                return true;
            }
        } else {
            // We're being deleted so just return hasValue
            return hasValue;
        }
    }

    protected async onGet(context: TurnContext, defaultValue?: T): Promise<T | undefined> {
        const hasValue = await this.parent.getPropertyValue(context, this.name) !== undefined;
        if (hasValue || defaultValue !== undefined) {
            // Enumerate properties to assemble return value
            const value: T = {} as T;
            if (defaultValue === undefined) { defaultValue = {} as T }
            for (const name in this.properties) {
                value[name] = await this.properties[name].get(context, defaultValue[name]);
            }
            return value;
        }

        return undefined;
    }

    protected async onSet(context: TurnContext, value: T): Promise<void> {
        // Enumerate properties and set individual value members 
        if (typeof value !== 'object') { value = {} as T }
        for (const name in this.properties) {
            await this.properties[name].set(context, value[name]);
        }
    }
}
