/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DialogContext } from '../dialogContext';
import { StateMap } from '../stateMap';
import { SequenceStepResult } from './sequenceStepResult';

export abstract class SequenceStep {
    public readonly id: string;

    constructor(stepId: string) {
        this.id = stepId;
    }

    public abstract execute(dc: DialogContext, options: object, stepState: StateMap): Promise<SequenceStepResult>;

    public reprompt(context: TurnContext, options: object, stepState: StateMap): Promise<void> {
        // Perform no action
        return Promise.resolve();
    }
}