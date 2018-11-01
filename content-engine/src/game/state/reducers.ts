import { combineReducers } from 'redux';
import { ActionType, getType, StateType } from 'typesafe-actions';

import { StatementInstance } from '../../types';

export interface TurtleState {
    position: {
        x: number,
        y: number,
    };
    direction: number;
}

const initialTurtleState = {
    direction: 0,
    position: { x: 0, y: 0 },
};

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

export const turtlePositionReducer = (
    state: TurtleState = initialTurtleState,
    action: GameAction,
): TurtleState => {
    switch (action.type) {
        case getType(actions.executeCodeCommand):
            let direction = state.direction;
            let position = state.position;

            switch (action.payload) {
                case Command.Forward:
                    position = {
                        x: position.x,
                        y: position.y,
                    };
                    break;
                case Command.Left:
                    direction -= 90;
                    break;
                case Command.Right:
                    direction += 90;
                    break;
            }
            direction = (direction + 360) % 360;
            return {
                direction,
                position,
            };

        default:
            return state;
    }
};

export const gameReducer = combineReducers({
    activeStatements,
});

import * as actions from './actions';
import { Command } from '../interpreter/types';
export type GameAction = ActionType<typeof actions>;
export type GameState = StateType<typeof gameReducer>;
