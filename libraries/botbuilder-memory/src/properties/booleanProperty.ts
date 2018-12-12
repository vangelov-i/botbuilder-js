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

export class BooleanProperty extends PropertyBase<boolean> {

    public createAccessor(parent: DocumentAccessor, idOrFactory: string|IdFactory): PropertyAccessor<boolean> {
        // Clone property
        const accessor = new BooleanProperty(idOrFactory);
        accessor.parent = parent;
        return accessor;
    }

    protected async onHasChanged(context: TurnContext, value: boolean): Promise<boolean> {
        const id = await this.getId(context);
        const curValue = await this.parent.getPropertyValue(context, id);
        const hasValue = typeof curValue === 'boolean';
        if (typeof value === 'boolean') {
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

    protected async onSet(context: TurnContext, value: number): Promise<void> {
        // Validate type being assigned
        const type = typeof value;
        if (type !== 'boolean' && type !== 'undefined') { throw new Error(`BooleanProperty: invalid value assigned to property '${await this.getId(context)}'.`) }
        return super.onSet(context, value);
    }
}