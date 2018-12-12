/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { IdFactory } from '../idFactory';

export class StaticIdFactory implements IdFactory {
    public id: string;

    constructor(id?: string) {
        this.id = id;
    }

    public async getId(context: TurnContext): Promise<string> {
        return this.id;
    }
}