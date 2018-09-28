export interface MarkerMessageData {
    ids: number[];
    marker: number[][][];
    transform: number[][];
}

export type MarkerMessage = MarkerMessageData[];
