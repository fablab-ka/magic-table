import { Command } from '../../interpreter/types';
import { executeCodeCommand } from '../actions';
import { turtlePositionReducer, TurtleState } from '../reducers';

describe('The Reducers', () => {
    describe('turtlePositionReducer', () => {
        const initialState: TurtleState = {
            direction: 0,
            position: {
                x: 0,
                y: 0,
            },
        };

        it('rotates +90° on action right', () => {
            const newState = turtlePositionReducer(initialState, executeCodeCommand(Command.Right));
            expect(newState.direction * (180 / Math.PI)).toBeCloseTo(90);
        });

        it('rotates -90° on action left', () => {
            const newState = turtlePositionReducer(initialState, executeCodeCommand(Command.Left));
            expect(newState.direction * (180 / Math.PI)).toBeCloseTo(-90);
        });

        it('moves 1 in Y on action forward and not turned', () => {
            const newState = turtlePositionReducer(initialState, executeCodeCommand(Command.Forward));
            expect(newState.position.y).toBe(1);
            expect(newState.position.x).toBe(0);
        });

        it('moves 1 in X on action forward and turned right', () => {
            const newState1 = turtlePositionReducer(initialState, executeCodeCommand(Command.Right));
            const newState2 = turtlePositionReducer(newState1, executeCodeCommand(Command.Forward));
            expect(newState2.direction * 180 / Math.PI).toBe(90);
            expect(newState2.position.x).toBe(1);
            expect(newState2.position.y).toBe(0);
        });

        it('moves -1 in X on action forward and turned left', () => {
            const newState1 = turtlePositionReducer(initialState, executeCodeCommand(Command.Left));
            const newState2 = turtlePositionReducer(newState1, executeCodeCommand(Command.Forward));
            expect(newState2.direction * 180 / Math.PI).toBe(-90);
            expect(newState2.position.x).toBe(-1);
            expect(newState2.position.y).toBe(0);
        });

        it('moves -1 in Y on action forward and turned left twice', () => {
            const newState1 = turtlePositionReducer(initialState, executeCodeCommand(Command.Left));
            const newState2 = turtlePositionReducer(newState1, executeCodeCommand(Command.Left));
            const newState3 = turtlePositionReducer(newState2, executeCodeCommand(Command.Forward));
            expect(newState3.direction * 180 / Math.PI).toBe(-90);
            expect(newState3.position.x).toBe(0);
            expect(newState3.position.y).toBe(-1);
        });
    });
});
