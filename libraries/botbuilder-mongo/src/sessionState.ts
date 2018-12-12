/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyStorage, PropertyEventSource } from './properties';
import { SessionManager } from './sessionManager';

export class SessionState implements PropertyStorage, PropertyEventSource {
    private handlers: { [name: string]: ((event: any) => Promise<void>)[]; }

    public async load(context: TurnContext): Promise<any> {
        const mgr = SessionManager.get(context);
        return mgr.properties;
    }

    public saveChanges(context: TurnContext): Promise<void> {
        // Calling save changes for a session has no effect.
        return Promise.resolve();
    }

    public async emit(name: string, event: any): Promise<void> {
        const list = this.handlers[name];
        if (Array.isArray(list)) {
            for (let i = 0; i < list.length; i++) {
                await list[0](event);
            }
        }
    }

    public on<T>(name: string, handler: (event: T) => Promise<void>): this {
        let list = this.handlers[name];
        if (!Array.isArray(list)) {
            this.handlers[name] = list = [];
        }
        list.push(handler);
        return this;
    }
}