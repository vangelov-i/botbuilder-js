/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { IdFactory } from '../idFactory';

export interface CurrentUserIdFactoryOptions {
    includeChannelId: boolean;
    separator: string;
}

export class CurrentUserIdFactory implements IdFactory {
    public options: CurrentUserIdFactoryOptions;

    constructor(options?: Partial<CurrentUserIdFactoryOptions>) {
        this.options = Object.assign({
            includeChannelId: false,
            separator: '-'
        } as CurrentUserIdFactoryOptions, options);
    }

    public async getId(context: TurnContext): Promise<string> {
        let id = '';
        if (this.options.includeChannelId) {
            id += context.activity.channelId;
            if (this.options.separator) { id += this.options.separator }
        }
        id += context.activity.from.id;
        return id;
    }
}