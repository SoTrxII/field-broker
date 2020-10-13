import { Container } from "inversify";
import { TYPES } from "./types";
import { RedisService } from "./services/redis-service";
import { RedisAPI } from "./@types/redis-service";
import { PositionBrokerAPI } from "./@types/position-broker-api";
import { PositionBroker } from "./services/position-broker";
import { env } from "process";
import { BrokersManager } from "./services/brokers-manager";
import { BrokersManagerAPI } from "./@types/brokers-manager-API";

export const container = new Container();

container.bind<RedisAPI>(TYPES.RedisService).toConstantValue(
  new RedisService({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    lazyConnect: true,
  })
);

container
  .bind<PositionBrokerAPI>(TYPES.PositionBroker)
  .toConstructor(PositionBroker);

container
  .bind<BrokersManagerAPI>(TYPES.BrokersManager)
  .to(BrokersManager)
  .inSingletonScope();
