/**
 * @module botbuilder-planning
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TurnContext } from 'botbuilder-core';
import { DialogState } from 'botbuilder-dialogs';

export interface SessionState {
    /** Timestamp of when the session was started. */
    created: string;

    /** Timestamp of when the session was last accessed. */
    lastAccess: string;

    /** Number of turns with the user. */
    turns: number;

    /** Stack of active plans. */
    plans: PlanState[];

    /** Persisted properties for the session. */
    properties: object;
}

export interface PlanState extends DialogState {

}

export interface SlotValue {
    /** Timestamp of when the slot value was created. */
    created: string;

    /** Name of the slot. */
    name: string;

    /** Value assigned to slot. */
    value: any;

    /** (Optional) tags assigned to slot. */
    tags?: string[];
}

export interface SessionPolicy {
    /** 
     * Number of milliseconds between turns before the session expires. 
     * 
     * @remarks
     * Defaults to a value of 30 minutes.
     */
    sessionTimeout: number;

    /** 
     * Maximum number of plans that will be remembered.
     * 
     * @remarks
     * Defaults to a value of 5.
     */
    maxPlans: number;

    /**
     * Maximum number of historical slot assignments that will be remembered.
     * 
     * @remarks
     * Defaults to a value of 100.
     */
    maxSlots: number;
}

export class SessionManager {
    private readonly session: SessionState;
    private readonly policy: SessionPolicy;

    constructor(session: SessionState, policy: SessionPolicy) {
        this.session = session;
        this.policy = policy;
    }

    public get properties(): object {
        return this.session.properties;
    }

    public set properties(value: object) {
        this.session.properties = value;
    }

    static push(context: TurnContext, session: SessionState|undefined, policy?: Partial<SessionPolicy>): SessionManager {
        // Ensure policy populated
        const p: SessionPolicy = Object.assign({
            sessionTimeout: 1800000,    // Timeout after 30 minutes
            maxPlans: 5,
            maxSlots: 100
        }, policy);

        // Check for new or expired session
        const now = new Date();
        if (!session || (new Date(session.lastAccess).getTime() + p.sessionTimeout) <= now.getTime()) {
            session = {
                created: now.toISOString(),
                lastAccess: now.toISOString(),
                turns: 0,
                plans: [],
                properties: {}
            };
        } else {
            session.lastAccess = now.toISOString();
            session.turns++;
        }

        // Create new session manager and push onto turn state
        const mgr = new SessionManager(session, p);
        if (context.turnState.has(sessionKey)) {
            context.turnState.get(sessionKey).push(mgr);
        } else {
            context.turnState.set(sessionKey, [mgr]);
        }

        return mgr;
    }

    static get(context: TurnContext): SessionManager {
        if (!context.turnState.has(sessionKey)) { throw new Error(`SessionManager.get(): No session found to get.`) }

        // Return session manager from turn state 
        const list: SessionManager[] = context.turnState.get(sessionKey);
        
        return list[list.length - 1];
    }

    static pop(context: TurnContext): SessionState {
        if (!context.turnState.has(sessionKey)) { throw new Error(`SessionManager.pop(): No session found to remove.`) }

        // Remove session manager from turn state
        const list: SessionManager[] = context.turnState.get(sessionKey);
        const mgr = list.pop();
        if (list.length == 0) {
            context.turnState.delete(sessionKey);
        }

        return mgr.session;
    }
}

const sessionKey: symbol = Symbol('session');