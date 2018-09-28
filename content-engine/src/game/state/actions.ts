import { createStandardAction } from 'typesafe-actions';
import { StatementInstance } from '../../types';

export const updateStatement = createStandardAction('UPDATE_STATEMENT')<StatementInstance>();
export const removeStatement = createStandardAction('REMOVE_STATEMENT')<StatementInstance>();
