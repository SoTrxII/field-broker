import { PositionBrokerAPI } from "./position-broker-api";

export interface BrokersManagerAPI {
  getBrokerForGame(gameId: number): PositionBrokerAPI;
}
