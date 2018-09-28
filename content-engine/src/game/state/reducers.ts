import { combineReducers } from 'redux';
import { ActionType, getType, StateType } from 'typesafe-actions';

import { StatementInstance } from '../../types';

export const activeStatements = (state: StatementInstance[] = [], action: GameAction): StatementInstance[] => {
    switch (action.type) {
        case getType(actions.updateStatement):
            return [...state, action.payload];

        case getType(actions.removeStatement):
            return state.filter((statement) => statement.id === action.payload.id);

        default:
            return state;
    }
};

export const gameReducer = combineReducers({
    activeStatements,
});

import * as actions from './actions';
export type GameAction = ActionType<typeof actions>;
export type GameState = StateType<typeof gameReducer>;
