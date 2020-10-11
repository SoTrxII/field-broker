import { Bbox } from "../@types/api";
import { FieldManagerAPI } from "../@types/field-manager-api";
import { injectable } from "inversify";

export class UnknownPlayerError extends Error {}

@injectable()
export class FieldManager implements FieldManagerAPI {
  private lastRecordedFields = new Map<string, Bbox>();
  private currentPlayerRecorded: string;

  updateFieldOf(playerId: string, field: Bbox): void {
    this.lastRecordedFields.set(playerId, field);
    this.currentPlayerRecorded ??= playerId;
  }

  isRecordedPlayer(playerId: string): boolean {
    return this.currentPlayerRecorded === playerId;
  }

  takeOverRecording(playerId: string): void {
    if (!this.lastRecordedFields.has(playerId)) {
      throw new UnknownPlayerError(`${playerId} has no registered field !`);
    }
    this.currentPlayerRecorded = playerId;
  }

  get recordedField(): Bbox {
    return this.lastRecordedFields.get(this.currentPlayerRecorded);
  }
}
