import { Bbox } from "./api";

export interface FieldManagerAPI {
  updateFieldOf(playerId: string, field: Bbox): void;
  isRecordedPlayer(playerId: string): boolean;
  takeOverRecording(playerId: string): void;
  recordedField: Bbox;
}
