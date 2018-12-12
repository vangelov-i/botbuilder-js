/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyAccessor } from './propertyAccessor';

export enum PropertyEventTypes {
    setProperty = 'setProperty',
    deleteProperty = 'deleteProperty',
    collectionInsert = 'collectionInsert',
    collectionDelete = 'collectionDelete'
}

export type PropertyEventHandler = (context: TurnContext, event: PropertyEvent, next: () => Promise<void>) => Promise<void>;

export interface PropertyEvent {
    type: string;
    property: PropertyAccessor;
}

export interface SetPropertyEvent extends PropertyEvent {
    value: any;
}

export interface CollectionInsertEvent extends PropertyEvent {
    key: any;
    value: any;
}

export interface CollectionDeleteEvent extends PropertyEvent {
    key: any;
}

export class PropertyEventSource {
    private handlers: PropertyEventHandler[] = [];

    public async emitEvent(context: TurnContext, event: PropertyEvent, next: () => Promise<void>): Promise<void> {
        const list: PropertyEventHandler[] = this.handlers.slice(0);
        async function emit(i: number) {
            if (i < list.length) {
                await list[i](context, event, async () => {
                    await emit(i + 1);
                });
            } else {
                await next();
            }
        }
        await emit(0);
    }

    public onEvent(handler: PropertyEventHandler): this {
        this.handlers.push(handler);
        return this;
    }
}
