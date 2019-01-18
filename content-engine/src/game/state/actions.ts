import { createStandardAction } from "typesafe-actions";

import { MarkerMessage } from "../game-types";
import { Command } from "../interpreter/types";

export const updateMarkers = createStandardAction("UPDATE_MARKER")<
  MarkerMessage
>();
export const executeCodeCommand = createStandardAction("EXEC_CODE_COMMAND")<
  Command
>();
