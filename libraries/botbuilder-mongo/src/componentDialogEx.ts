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
    public readonly userProperties: CompositeProperty;
    public readonly conversationProperties: CompositeProperty;

    constructor(dialogId: string) {
        super(dialogId);
        this.userProperties = new CompositeProperty(dialogId);
        this.conversationProperties = new CompositeProperty(dialogId);
    }

    public addDialog(dialog: Dialog): this {
        // Automatically add child dialog properties
        if (dialog instanceof ComponentDialogEx) {
            this.userProperties.addProperty((dialog as ComponentDialogEx).userProperties);
            this.conversationProperties.addProperty((dialog as ComponentDialogEx).conversationProperties);
        }

        return super.addDialog(dialog);
    }
}