/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StatePropertyAccessor, TurnContext } from 'botbuilder-core';
import { CompositePropertyAccessor } from './compositePropertyAccessor';
import { PropertyEventHandler } from './propertyEventSource';

export interface PropertyAccessor<T = any> extends StatePropertyAccessor<T> {
    /**
     * The name of the property.
     */
    readonly name: string;

    /**
     * The properties 
     */
    readonly typeName: string;

    /**
     * The properties parent.
     */
    parent: CompositePropertyAccessor|undefined;

    hasChanged(context: TurnContext, value: T): Promise<boolean>;

    onEvent(handler: PropertyEventHandler): this;
}