/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ComponentDialog, Dialog } from 'botbuilder-dialogs';
import { CompositeProperty } from './properties';

export class ComponentDialogEx<O extends object = {}> extends ComponentDialog<O> {
    public readonly properties: CompositeProperty;

    constructor(dialogId: string) {
        super(dialogId);
        this.properties = new CompositeProperty(dialogId);
    }

    public addDialog(dialog: Dialog): this {
        // Automatically add child dialog properties
        if (dialog instanceof ComponentDialogEx) {
            const properties = (dialog as ComponentDialogEx).properties;
            this.properties.addProperty(properties);
        }

        return super.addDialog(dialog);
    }
}