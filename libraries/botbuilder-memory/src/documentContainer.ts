/**
 * @module botbuilder-memory
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface DocumentContainer {
    readonly client: any;
    readonly containerType: string;

    create<T = object>(body: T, options?: any): Promise<T>;
    delete(id: string, options?: any): Promise<boolean>;
    read<T = object>(id: string, options?: any): Promise<T|undefined>;
    replace<T = object>(body: T, options?: any): Promise<T>;
    upsert<T = object>(body: T, options?: any): Promise<T>;
}
