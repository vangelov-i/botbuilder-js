/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEvent, PropertyEventHandler } from './propertyEventSource';

export interface DocumentAccessor {
    parent: DocumentAccessor|undefined;

    getPath(context: TurnContext): Promise<string>;

    deleteProperty(context: TurnContext, id: string): Promise<void>;
    
    getProperty<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    getProperty<T = any>(context: TurnContext, id: string, defaultValue: T): Promise<T>;

    setProperty(context: TurnContext, id: string, value: any): Promise<void>;

    emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void>;
    onEvent(handler: PropertyEventHandler): this;
}