export interface MarkerMessageData {
  ids: number[];
  marker: number[][][];
  transform: number[][];
  position2d: number[];
  rotation2d: number;
}

export type MarkerMessage = MarkerMessageData[];

export interface MarkerInfo {
  id: number;
  position: [number, number];
  rotation: number;
  transform: number[][];
}
