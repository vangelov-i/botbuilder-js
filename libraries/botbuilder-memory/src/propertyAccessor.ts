/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StatePropertyAccessor, TurnContext } from 'botbuilder-core';
import { DocumentAccessor } from './documentAccessor';
import { PropertyEventHandler } from './propertyEventSource';
import { IdFactory } from './idFactory';

export interface PropertyAccessor<T = any> extends StatePropertyAccessor<T> {
    idFactory: IdFactory;
    parent: DocumentAccessor|undefined;
    tags: string[];

    getId(context: TurnContext): Promise<string>;
    
    getPath(context: TurnContext): Promise<string>;

    hasChanged(context: TurnContext, value: T): Promise<boolean>;

    onEvent(handler: PropertyEventHandler): this;
}