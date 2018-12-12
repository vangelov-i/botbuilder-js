/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { PropertyBase } from '../propertyBase';
import { DocumentAccessor } from '../documentAccessor';
import { IdFactory } from '../idFactory';
import { PropertyAccessor } from '../propertyAccessor';

export class StringProperty extends PropertyBase<string> {

    public createAccessor(parent: DocumentAccessor, idOrFactory: string|IdFactory): PropertyAccessor<string> {
        // Clone property
        const accessor = new StringProperty(idOrFactory);
        accessor.parent = parent;
        return accessor;
    }

    protected async onHasChanged(context: TurnContext, value: string): Promise<boolean> {
        const id = await this.getId(context);
        const curValue = await this.parent.getPropertyValue(context, id);
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