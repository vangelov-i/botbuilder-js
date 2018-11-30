/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotState } from 'botbuilder-core';
import { CompositePropertyAccessor } from './compositePropertyAccessor';

export class BotStateAdapter implements CompositePropertyAccessor {

    public name: string;

    public parent = undefined;


    deletePropertyValue(context: TurnContext, name: string): Promise<void>;
    
    getPropertyValue<T = any>(context: TurnContext, name: string): Promise<T | undefined>;
    getPropertyValue<T = any>(context: TurnContext, name: string, defaultValue: T): Promise<T>;

    setPropertyValue(context: TurnContext, name: string, value: any): Promise<void>;

    emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void>

}