/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEvent } from './propertyEventSource';

export interface CompositePropertyAccessor {
    /**
     * The name of the composite property.
     */
    readonly name: string;

    /**
     * The properties parent.
     */
    parent: CompositePropertyAccessor|undefined;

    deletePropertyValue(context: TurnContext, name: string): Promise<void>;
    
    getPropertyValue<T = any>(context: TurnContext, name: string): Promise<T | undefined>;
    getPropertyValue<T = any>(context: TurnContext, name: string, defaultValue: T): Promise<T>;

    setPropertyValue(context: TurnContext, name: string, value: any): Promise<void>;

    emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void>
}