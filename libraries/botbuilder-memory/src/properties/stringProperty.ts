/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyBase } from '../propertyBase';

export class StringProperty extends PropertyBase<string> {

    protected async onHasChanged(context: TurnContext, value: string): Promise<boolean> {
        const id = await this.getId(context);
        const curValue = await this.parent.getProperty(context, id);
        const hasValue = typeof curValue === 'string';
        if (typeof value === 'string') {
            if (hasValue) {
                return curValue !== value;
            } else {
                // We don't have anything assigned so return true
                return true;
            }
        } else {
            // We're being deleted so just return hasValue
            return hasValue;
        }
    }

    protected async onSet(context: TurnContext, value: string): Promise<void> {
        // Validate type being assigned
        const type = typeof value;
        if (type !== 'string' && type !== 'undefined') { throw new Error(`StringProperty: invalid value assigned to property '${await this.getId(context)}'.`) }
        return super.onSet(context, value);
    }
}