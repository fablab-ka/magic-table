import { createStandardAction } from 'typesafe-actions';
import { StatementInstance } from '../../types';
import { Command } from '../interpreter/types';

export const updateStatement = createStandardAction('UPDATE_STATEMENT')<StatementInstance>();
export const removeStatement = createStandardAction('REMOVE_STATEMENT')<StatementInstance>();
export const executeCodeCommand = createStandardAction('EXEC_CODE_COMMAND')<Command>();
