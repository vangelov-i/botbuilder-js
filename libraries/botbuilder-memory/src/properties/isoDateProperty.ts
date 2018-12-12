/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyBase } from '../propertyBase';

export class ISODateProperty extends PropertyBase<Date> {

    protected async onHasChanged(context: TurnContext, value: Date): Promise<boolean> {
        const id = await this.getId(context);
        const curValue = await this.parent.getProperty(context, id);
        const hasValue = typeof curValue === 'string';
        if (Object.prototype.toString.call(value) === '[object Date]') {
            if (hasValue) {
                return curValue !== value.toISOString();
            } else {
                // We don't have anything assigned so return true
                return true;
            }
        } else {
            // We're being deleted so just return hasValue
            return hasValue;
        }
    }

    protected async onGet(context: TurnContext, defaultValue?: Date): Promise<any> {
        // Convert default value to string before calling base
        const defaultVal = dateToString(defaultValue);
        const val = await super.onGet(context, defaultVal);

        // Convert return value to date
        return typeof val === 'string' ? new Date(val) : undefined;
    }

    protected async onSet(context: TurnContext, value: Date): Promise<void> {
        // Convert value to string before calling base
        const val = dateToString(value);
        return super.onSet(context, val);
    }
}


function dateToString(value: Date|undefined): string|undefined {
    let val: string;
    if (value !== undefined) {
        if (Object.prototype.toString.call(value) !== '[object Date]') { throw new Error(`DateProperty: invalid value assigned to property.`) }
        val = value.toISOString();
    }

    return val;
}
