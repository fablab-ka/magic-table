export type Vector = [number, number];

export type MarkerMessage = MarkerInfo[];

export interface MarkerInfo {
  id: number;
  corners: Vector[];
  position: Vector;
  direction: Vector;
  rotation: number;
}
