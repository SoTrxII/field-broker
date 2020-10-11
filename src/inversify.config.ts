import { Container } from "inversify";
import { TYPES } from "./types";
import { RedisService } from "./services/redis-service";
import { RedisAPI } from "./@types/redis-service";
import { FieldManagerAPI } from "./@types/field-manager-api";
import { FieldManager } from "./services/field-manager";
import { env } from "process";

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

container.bind<FieldManagerAPI>(TYPES.FieldManager).to(FieldManager);
