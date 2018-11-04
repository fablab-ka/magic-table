import { createStandardAction } from "typesafe-actions";

import { StatementInstance } from "../../types";
import { MarkerMessage } from "../game-types";
import { Command } from "../interpreter/types";

export const updateStatement = createStandardAction("UPDATE_STATEMENT")<
  StatementInstance
>();
export const removeStatement = createStandardAction("REMOVE_STATEMENT")<
  StatementInstance
>();
export const updateMarkers = createStandardAction("UPDATE_MARKER")<
  MarkerMessage
>();
export const executeCodeCommand = createStandardAction("EXEC_CODE_COMMAND")<
  Command
>();
