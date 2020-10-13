import { PositionBrokerAPI } from "../@types/position-broker-api";
import { inject, injectable, interfaces } from "inversify";
import { TYPES } from "../types";
import Newable = interfaces.Newable;
import { BrokersManagerAPI } from "../@types/brokers-manager-API";

/**
 * Using the Object Pool pattern, this class map a game to it's position broker
 */
@injectable()
export class BrokersManager implements BrokersManagerAPI {
  private brokers: Map<number, PositionBrokerAPI> = new Map();
  private brokersUpdated: Map<number, number> = new Map();
  //Any broker older than 1 day old without any update should be deleted
  private static DAYS_BEFORE_DELETION = 1;
  // Check for unused broker every 10h;
  private static CLEAN_UP_INTERVAL = 1000 * 60 * 60 * 10;

  constructor(
    @inject(TYPES.PositionBroker)
    private brokerConstructor: Newable<PositionBrokerAPI>
  ) {
    setInterval(this.cleanUpRoutine, BrokersManager.CLEAN_UP_INTERVAL);
  }

  getBrokerForGame(gameId: number): PositionBrokerAPI {
    if (!this.brokers.has(gameId)) {
      this.brokers.set(gameId, new this.brokerConstructor());
    }
    this.brokersUpdated.set(gameId, Date.now());
    return this.brokers.get(gameId);
  }

  /**
   * Periodically clean the unused brokers
   */
  private cleanUpRoutine() {
    const today = new Date();
    const threshold = today.setDate(
      today.getDate() - BrokersManager.DAYS_BEFORE_DELETION
    );
    this.brokersUpdated.forEach((lastUpdate, gameId) => {
      if (lastUpdate < threshold) {
        this.brokers.delete(gameId);
        this.brokersUpdated.delete(gameId);
      }
    });
  }
}
