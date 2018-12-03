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

export class ListProperty<T = any> extends SimpleProperty {


    protected onCreateItemAccessor(context: TurnContext): PropertyAccessor {

    }
}