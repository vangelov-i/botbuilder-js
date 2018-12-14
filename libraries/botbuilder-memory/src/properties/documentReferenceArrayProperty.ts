/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { ArrayProperty } from './arrayProperty';
import { DocumentAccessor } from '../documentAccessor';
import { DocumentContainer } from '../documentContainer';
import { IdFactory } from '../idFactory';
import { PropertyAccessor } from '../propertyAccessor';
import { TemporaryDocument } from '../temporaryDocument';

export class DocumentReferenceArrayProperty extends ArrayProperty<string> {

    public createAccessor(idOrFactory: string|IdFactory, parent: DocumentAccessor): PropertyAccessor<string[]> {
        // Clone property with new ID and parent.
        return this.copyTo(new DocumentReferenceArrayProperty(idOrFactory, parent));
    }

    public async deleteDocument(context: TurnContext, position = -1, options?: any): Promise<boolean> {
        const container = this.getContainer();

        // Validate index
        const array = await this.get(context);
        if (position >= array.length) { throw new Error(`DocumentReferenceArrayProperty.deleteDocument(): index out of range.`) }

        // Get ID of document to delete
        const id = position >= 0 ? array[position] : array[array.length - 1];
        if (id) {
            // Remove document from container
            const deleted = await container.delete(id, options);

            // Remove ID from array
            await this.deleteItem(context, position);
            return deleted;
        }
        return false;
    }

    public async readDocument(context: TurnContext, index: number, accessor: PropertyAccessor, options?: any): Promise<PropertyAccessor|undefined> {
        const container = this.getContainer();

        // Validate index
        const array = await this.get(context);
        if (index < 0 || index >= array.length) { throw new Error(`DocumentReferenceArrayProperty.readDocument(): index out of range.`) }

        // Get ID of document to read
        const id = array[index];
        if (id) {
            // Read document from container
            const body = await container.read(id, options);
            if (body) {
                // Create and return property accessor
                // - wired to properties parent for notification purposes.
                const parent = new TemporaryDocument(body, this.parent);
                return accessor.createAccessor(id, parent);
            }
        }

        return undefined;
    }

    public async replaceDocument(context: TurnContext, bodyOrAccessor: object|PropertyAccessor, options?: any): Promise<void> {
        const container = this.getContainer();

        // Get JSON to write out
        let body: object;
        if (typeof (bodyOrAccessor as PropertyAccessor).get === 'function') {
            body = await (bodyOrAccessor as PropertyAccessor).get(context);
        } else {
            body = bodyOrAccessor;
        }

        // Replace document in container
        await container.replace(body, options);
    }

    public async upsertDocument(context: TurnContext, bodyOrAccessor: object|PropertyAccessor, position = -1, options?: any): Promise<void> {
        const container = this.getContainer();

        // Validate position
        const array = await this.get(context);
        if (position >= array.length) { throw new Error(`DocumentReferenceArrayProperty.upsertDocument(): position out of range.`) }

        // Get JSON to write out
        let body: object;
        if (typeof (bodyOrAccessor as PropertyAccessor).get === 'function') {
            body = await (bodyOrAccessor as PropertyAccessor).get(context);
        } else {
            body = bodyOrAccessor;
        }

        // Upsert document in container
        const response = await container.upsert(body, options);

        // Update array
        const id = response['id'];
        await this.insertItem(context, id, position);
        if (typeof (bodyOrAccessor as PropertyAccessor).set === 'function') {
            // Update accessors ID to trigger any change notifications
            await (bodyOrAccessor as PropertyAccessor).set(context, { id: id });
        }
    }

    private getContainer(): DocumentContainer {
        const container = this.parent ? this.parent.container : undefined;
        if (!container) { throw new Error(`DocumentReferenceProperty: unable to perform operation because container isn't accessible.`) }
        return container;
    }
}