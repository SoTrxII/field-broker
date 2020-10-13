import { Bbox } from "../@types/api";
import { PositionBrokerAPI } from "../@types/position-broker-api";
import { injectable } from "inversify";

export class UnknownPlayerError extends Error {}

@injectable()
export class PositionBroker implements PositionBrokerAPI {
  private lastRecordedFields = new Map<string, Bbox>();
  private currentPlayerRecorded: string;

  updateFieldOf(playerId: string, field: Bbox): void {
    this.lastRecordedFields.set(playerId, field);
    this.currentPlayerRecorded ??= playerId;
  }

  isRecordedPlayer(playerId: string): boolean {
    return this.currentPlayerRecorded === playerId;
  }

  /**
   * Attempt to change the currently recorded player by any other player.
   * This is used when a GM is disconnecting from the game
   * @return True if the recorded player has changed
   */
  shiftRecordedPlayer(): boolean {
    //If there is only one player in the Map, do not try to change the
    // recorded player
    if (this.lastRecordedFields.size < 2) return false;
    const keys = Array.from(this.lastRecordedFields.keys()).filter(
      (id) => id !== this.currentPlayerRecorded
    );
    const randomOtherPlayer = keys[Math.floor(Math.random() * keys.length)];
    this.takeOverRecording(randomOtherPlayer);
    return true;
  }

  /**
   * Force the recording to watch a player's field.
   * @param playerId
   */
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
