/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { RecognizerResult, TurnContext, StatePropertyAccessor } from 'botbuilder-core';
import { Dialog, DialogContext, DialogTurnResult, DialogTurnStatus, DialogSet, DialogState } from 'botbuilder-dialogs';

const MAIN_DIALOG_ID: string = 'main';

export interface Recognizer {
    recognize(context: TurnContext): Promise<RecognizerResult>;
}

export interface Planner {
    plan(context: TurnContext, recognized: RecognizerResult): Promise<PlanProposal>;
}

export interface PlanProposal {

}

export interface PlanState extends DialogState {

}

export class PlanManager extends Dialog {
    private readonly mainDialogSet: DialogSet;
    protected readonly planningState: StatePropertyAccessor<PlanState>;
    protected readonly dialogs: DialogSet;
    protected readonly planners: Planner[] = [];
    protected readonly recognizers: Recognizer[] = [];

    constructor(planState: StatePropertyAccessor<PlanState>, dialogId = MAIN_DIALOG_ID) {
        super(dialogId);
        this.mainDialogSet = new DialogSet(planState);
        this.planningState = planState;
        this.dialogs = new DialogSet();
    }

    public addDialog(dialog: Dialog): this {
        this.dialogs.add(dialog);
        if (typeof (dialog as any).plan === 'function') {
            this.addPlanner(dialog as any);
        }
        if (typeof (dialog as any).recognize === 'function') {
            this.addRecognizer(dialog as any);
        }
        return this;
    }

    public addPlanner(planner: Planner): this {
        this.planners.push(planner);
        return this;
    }

    public addRecognizer(recognizer: Recognizer): this {
        this.recognizers.push(recognizer);
        return this;
    }

    public async run(context: TurnContext): Promise<DialogTurnResult> {
        // Create a dialog context and try to continue running the current dialog
        const dc = await this.mainDialogSet.createContext(context);
        let result = await dc.continueDialog();


        // Start the main dialog if there wasn't a running one
        if (result.status === DialogTurnStatus.empty) {
            result = await dc.beginDialog(this.id);
        }
        return result;
    }

    public beginDialog(outerDC: DialogContext, options?: any): Promise<DialogTurnResult> {
        return this.onRunTurn(outerDC, options);
    }

    public continueDialog(outerDC: DialogContext): Promise<DialogTurnResult> {
        return this.onRunTurn(outerDC);
    }

    protected async onRunTurn(outerDC: DialogContext, options?: any): Promise<DialogTurnResult> {
        // Recognize and filter new commands
        const commands = await this.recognize(innerDC.context);
        const prerequisites = this.getPrequisites(commands);
        const tangents = this.getTangents(commands);
        const tasks = this.getTasks(commands);

        // Update command queue
        const queued = await this.getCommandQueue(innerDC.context);

        // Identify new prerequisites 

    }

    protected async onRecognize(context: TurnContext): Promise<RecognizerResult> {

        return await this.onFilterCommands(context, await super.onRecognize(context));
    }
}