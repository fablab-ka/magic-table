import { createStore, Store } from 'redux';

import { gameReducer, GameState } from './reducers';

export function configureStore(initialState?: GameState): Store<GameState> {
    const result = createStore(
        gameReducer,
    );

    return result;
}

const store = configureStore();

export default store;
