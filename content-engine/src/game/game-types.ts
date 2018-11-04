export interface MarkerMessageData {
  ids: number[];
  marker: number[][][];
  transform: number[][];
}

export type MarkerMessage = MarkerMessageData[];

export interface MarkerInfo {
  id: number;
  position: [number, number];
  rotation: number;
  transform: number[][];
}
