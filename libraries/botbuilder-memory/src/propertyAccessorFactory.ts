/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { PropertyAccessor } from './propertyAccessor';
import { DocumentAccessor } from './documentAccessor';
import { IdFactory } from './idFactory';

export interface PropertyAccessorFactory<T = any> {
    createAccessor(parent: DocumentAccessor, idOrFactory: string|IdFactory): PropertyAccessor<T>;
}
