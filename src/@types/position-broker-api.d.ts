import { Bbox } from "./api";

export interface PositionBrokerAPI {
  updateFieldOf(playerId: string, field: Bbox): void;
  isRecordedPlayer(playerId: string): boolean;
  takeOverRecording(playerId: string): void;
  shiftRecordedPlayer(): boolean
  recordedField: Bbox;
}
