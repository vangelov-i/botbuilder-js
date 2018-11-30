/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StatePropertyAccessor } from 'botbuilder-core';
import { CompositePropertyAccessor } from './compositePropertyAccessor';

export interface PropertyAccessor<T = any> extends StatePropertyAccessor<T> {
    /**
     * The name of the property.
     */
    readonly name: string;

    /**
     * The properties parent.
     */
    parent: CompositePropertyAccessor|undefined;
}