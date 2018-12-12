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
    public prefix: string;
    public options: CurrentUserIdFactoryOptions;

    constructor(prefix = 'user', options?: Partial<CurrentUserIdFactoryOptions>) {
        this.prefix = prefix;
        this.options = Object.assign({
            includeChannelId: false,
            separator: '-'
        } as CurrentUserIdFactoryOptions, options);
    }

    public async getId(context: TurnContext): Promise<string> {
        let id = this.prefix;
        if (this.options.separator) { id += this.options.separator }
        if (this.options.includeChannelId) {
            id += context.activity.channelId;
            if (this.options.separator) { id += this.options.separator }
        }
        id += context.activity.from.id;
        return id;
    }
}