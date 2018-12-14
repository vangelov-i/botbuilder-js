/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyEvent, PropertyEventHandler } from './propertyEventSource';
import { DocumentContainer } from './documentContainer';

export interface DocumentAccessor {
    parent: DocumentAccessor|undefined;
    readonly container: DocumentContainer|undefined;

    getPath(context: TurnContext): Promise<string>;

    deletePropertyValue(context: TurnContext, id: string): Promise<void>;
    
    getPropertyValue<T = any>(context: TurnContext, id: string): Promise<T | undefined>;
    getPropertyValue<T = any>(context: TurnContext, id: string, defaultValue: T): Promise<T>;

    setPropertyValue(context: TurnContext, id: string, value: any): Promise<void>;

    emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void>;
    onEvent(handler: PropertyEventHandler): this;
}