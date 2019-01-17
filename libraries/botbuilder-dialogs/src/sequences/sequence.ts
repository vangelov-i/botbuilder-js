/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { Dialog, DialogReason, DialogTurnResult, DialogTurnStatus, DialogInstance } from '../dialog';
import { DialogContext, DialogState } from '../dialogContext';
import { DialogSet } from '../dialogSet';
import { StateMap } from '../stateMap';
import { SequenceStep } from './sequenceStep';
import { SequenceStepResult, SequenceAction } from './sequenceStepResult';

export class Sequence<O extends object = {}> extends Dialog<O> {
    private readonly steps: (Dialog|SequenceStep)[];
    private readonly stepsById: { [id:string]: number; }

    public addStep(step: Dialog|SequenceStep): this {
        if (this.stepsById.hasOwnProperty(step.id)) { throw new Error(`Sequence.addStep(): a step with an ID of '${step.id}' has already been added to the '${this.id}' sequence.`); }
        this.steps.push(step);
        this.stepsById[step.id] = this.steps.length - 1;

        return this;
    }

    public async beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult> {
        // Initialize state
        const state = dc.dialogState;
        state.set(PERSISTED_OPTIONS, options || {});

        // Run the first step
        return await this.runStep(dc, this.steps[0].id);
    }

    public async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Continue execution of current step
        const state = dc.dialogState;
        const stepId = state.get(PERSISTED_STEP_ID);

        return await this.runStep(dc, stepId);
    }

    public async resumeDialog(dc: DialogContext, reason: DialogReason, result?: any): Promise<DialogTurnResult> {
        // Containers are typically leaf nodes on the stack but the dev is free to push other dialogs
        // on top of the stack which will result in the container receiving an unexpected call to
        // resumeDialog() when the pushed on dialog ends.
        // To avoid the container prematurely ending we need to implement this method and simply
        // ask our inner dialog stack to re-prompt.
        await this.repromptDialog(dc.context, dc.activeDialog);

        return Dialog.EndOfTurn;
    }

    public async repromptDialog(context: TurnContext, instance: DialogInstance): Promise<void> {
        // Forward to current step
        const options = instance.state[PERSISTED_OPTIONS];
        const stepId = instance.state[PERSISTED_STEP_ID];
        const stepState = instance.state[PERSISTED_STEP_STATE];
        if (this.stepsById.hasOwnProperty(stepId)) {
            const stepIndex = this.stepsById[stepId];
            const step = this.steps[stepIndex];
            if (step instanceof SequenceStep) {
                // Step is a SequenceStep so call its reprompt() method
                await step.reprompt(context, options, new StateMap(stepState));
            } else {
                // Spin up a DialogSet to host the Dialog based step
                const dialogs = new DialogSet();
                dialogs.add(step);

                // Create DialogContext and call repromptDialog()
                const stepDC = new DialogContext(dialogs, context, stepState as DialogState, new StateMap({}), new StateMap({}));
                await stepDC.repromptDialog();
            }
        }
    }

    private async runStep(dc: DialogContext, id: string): Promise<DialogTurnResult> {
        if (!this.stepsById.hasOwnProperty(id)) { throw new Error(`Sequence.runStep(): a step with an ID of '${id}' couldn't be found for sequence '${this.id}'.`); }

        // Check for new step
        const state = dc.dialogState;
        const options = state.get(PERSISTED_OPTIONS);
        let stepId: string = state.get(PERSISTED_STEP_ID) || '';
        let stepState: object = state.get(PERSISTED_STEP_STATE);
        if (stepId !== id) {
            stepId = id;
            stepState = {};
            state.set(PERSISTED_STEP_ID, stepId);
            state.set(PERSISTED_STEP_STATE, stepState);
        }

        // Execute step
        let stepResult: SequenceStepResult;
        let stepIndex = this.stepsById[stepId];
        const step = this.steps[stepIndex];
        if (step instanceof SequenceStep) {
            // Step is a SequenceStep so operates within the current DialogContext
            stepResult = await step.execute(dc, options, new StateMap(stepState));
        } else {
            // Spin up a DialogSet to host the Dialog based step
            const dialogs = new DialogSet();
            dialogs.add(step);
            dialogs.parent = dc.dialogs;

            // Create DialogContext for step and attempt to continue execution
            const stepDC = new DialogContext(dialogs, dc.context, stepState as DialogState, dc.conversationState, dc.userState);
            let result = await stepDC.continueDialog();

            // Begin step if nothing was continued
            if (result.result === DialogTurnStatus.empty) {
                result = await stepDC.beginDialog(step.id, options);
            }

            // Map result to step result
            switch (result.status) {
                case DialogTurnStatus.waiting:
                    stepResult = SequenceStepResult.continueStep();
                    break;
                case DialogTurnStatus.complete:
                    stepResult = result.result instanceof SequenceStepResult ? result.result : SequenceStepResult.nextStep(result.result);
                    break;
                default:
                    stepResult = SequenceStepResult.nextStep();
                    break;
            }
        }

        // Process step result
        switch (stepResult.action) {
            case SequenceAction.continueStep:
                return Dialog.EndOfTurn;
            case SequenceAction.endSequence:
                return await dc.endDialog(stepResult.stepResult);
            case SequenceAction.gotoStep:
                if (this.stepsById.hasOwnProperty(stepResult.stepId)) {
                    return await this.runStep(dc, stepResult.stepId);
                } else {
                    return await dc.endDialog(stepResult);
                }
            case SequenceAction.nextStep:
                stepIndex++;
                if (stepIndex < this.steps.length) {
                    return await this.runStep(dc, this.steps[stepIndex].id);
                } else {
                    return await dc.endDialog(stepResult.stepResult);
                }
        }
    }
}

/**
 * @private
 */
const PERSISTED_OPTIONS = 'options';

/**
 * @private
 */
const PERSISTED_STEP_ID = 'stepId';

/**
 * @private
 */
const PERSISTED_STEP_STATE = 'stepState';

