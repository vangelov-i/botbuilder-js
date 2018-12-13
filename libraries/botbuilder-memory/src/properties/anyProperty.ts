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

export class AnyProperty<T = any> extends PropertyBase<T> {

    public createAccessor(idOrFactory: string|IdFactory, parent: DocumentAccessor): PropertyAccessor<T> {
        // Clone property with new ID and parent.
        return this.copyTo(new AnyProperty(idOrFactory, parent));
    }
    
    protected async onHasChanged(context: TurnContext, value: unknown): Promise<boolean> {
        const id = await this.getId(context);
        const curValue = await this.parent.getPropertyValue(context, id);
        const curType = getType(curValue);
        const valueType = getType(value);
        
        // Are values different types?
        if (curType !== valueType) {
            return true;
        }

        // Are values different?
        switch (curType) {
            case 'date':
                return (curValue as Date).getTime() !== (value as Date).getTime();
            case 'array':
            case 'object':
                return JSON.stringify(curValue) !== JSON.stringify(value);
            default:
                return curValue != value;             
        }
    }
}

/** @private */
function getType(value: unknown): string {
    if (Array.isArray(value)) {
        return 'array';
    } else if (Object.prototype.toString.call(value) === '[object Date]') {
        return 'date';
    } else {
        return typeof value;
    }
}