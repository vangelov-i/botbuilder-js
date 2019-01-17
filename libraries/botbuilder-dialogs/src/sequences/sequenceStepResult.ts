/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum SequenceAction {
    continueStep = 'continueStep',
    nextStep = 'nextStep',
    gotoStep = 'gotoStep',
    endSequence = 'endSequence'
}

export class SequenceStepResult {
    public action: SequenceAction;
    public stepId: string;
    public stepResult: any;

    static continueStep(): SequenceStepResult {
        const result = new SequenceStepResult();
        result.action = SequenceAction.continueStep;
        return result;
    }

    static nextStep(stepResult?: any): SequenceStepResult {
        const result = new SequenceStepResult();
        result.action = SequenceAction.nextStep;
        result.stepResult = stepResult;
        return result;
    }

    static gotoStep(stepId: string): SequenceStepResult {
        const result = new SequenceStepResult();
        result.action = SequenceAction.gotoStep;
        result.stepId = stepId;
        return result;
    }

    static endSequence(stepResult?: any): SequenceStepResult {
        const result = new SequenceStepResult();
        result.action = SequenceAction.endSequence;
        result.stepResult = stepResult;
        return result;
    }
}