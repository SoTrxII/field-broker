import { app, PORT } from "./server";
import { Bbox } from "./@types/api";
import { RedisService } from "./services/redis-service";
import { container } from "./inversify.config";
import { RedisAPI } from "./@types/redis-service";
import { TYPES } from "./types";
import {
  CUSTOM_HTTP_CODES,
  PubChannels,
} from "./controller/lullaby-controller";
import fetch, { ResponseType } from "node-fetch";
// Full fledged fake client, testing "in real conditions"
class Client {
  private static readonly SERVER_URL = `http://localhost:${PORT}`;
  private static readonly ENDPOINTS = {
    sendPosition: `${Client.SERVER_URL}/`,
    takeOver: `${Client.SERVER_URL}/takeOver`,
    disconnect: `${Client.SERVER_URL}/disconnect`,
  };
  public currentField: Bbox;
  constructor(private playerId: string, private gameId: number) {}
  private getRandomCoord() {
    return Math.random() * 100000;
  }

  private getRandomBbox() {
    return {
      x: this.getRandomCoord(),
      y: this.getRandomCoord(),
      width: this.getRandomCoord(),
      height: this.getRandomCoord(),
    };
  }

  async sendPosition(): Promise<any> {
    this.currentField = this.getRandomBbox();
    const res = await fetch(Client.ENDPOINTS.sendPosition, {
      method: "POST",
      body: JSON.stringify({
        playerId: this.playerId,
        gameId: this.gameId,
        field: this.currentField,
      }),
      headers: { "Content-Type": "application/json" },
    });
    return res;
  }

  async takeOver(): Promise<any> {
    const res = await fetch(Client.ENDPOINTS.takeOver, {
      method: "POST",
      body: JSON.stringify({
        playerId: this.playerId,
        gameId: this.gameId,
      }),
      headers: { "Content-Type": "application/json" },
    });
    return res;
  }

  async disconnect(): Promise<any> {
    const res = await fetch(Client.ENDPOINTS.disconnect, {
      method: "POST",
      body: JSON.stringify({
        playerId: this.playerId,
      }),
      headers: { "Content-Type": "application/json" },
    });
    return res;
  }
}
describe("Integration tests", () => {
  container.rebind<RedisAPI>(TYPES.RedisService).toConstantValue(
    new RedisService({
      host: "localhost",
      port: 6379,
    })
  );
  const redis = container.get<RedisAPI>(TYPES.RedisService);
  function waitForMessage(): Promise<[string, string]> {
    return new Promise((res, rej) => {
      redis.on("message", (payload) => res(payload));
      setTimeout(() => rej("Timeout"), 5000);
    });
  }
  const messages = [];
  beforeAll(() => {
    redis.subscribe(PubChannels.MovePlayingField);
    redis.on("message", (payload) => messages.push(payload));
  });
  describe("Only one GM in a game", () => {
    let client1: Client;
    beforeAll(() => {
      client1 = new Client("1", 0);
    });
    it("Should keep the field updated", async () => {
      const res = await client1.sendPosition();
      expect(res.status).toEqual(CUSTOM_HTTP_CODES.OK_RECORDING);
      const [channel, message] = await waitForMessage();
      expect(channel).toEqual(PubChannels.MovePlayingField);
      expect(JSON.parse(message).data.bbox).toEqual(client1.currentField);
      //Field update
      const res2 = await client1.sendPosition();
      expect(res2.status).toEqual(CUSTOM_HTTP_CODES.OK_RECORDING);
      const [channel2, message2] = await waitForMessage();
      expect(channel2).toEqual(PubChannels.MovePlayingField);
      expect(JSON.parse(message2).data.bbox).toEqual(client1.currentField);
    });
  });

  describe("Multiple GM in a game", () => {
    let client1: Client;
    let client2: Client;
    beforeAll(() => {
      client1 = new Client("1", 0);
      client2 = new Client("2", 0);
    });
    it("Should answer standy to the second GM", async () => {
      const res = await client1.sendPosition();
      expect(res.status).toEqual(CUSTOM_HTTP_CODES.OK_RECORDING);
      const [channel, message] = await waitForMessage();
      expect(channel).toEqual(PubChannels.MovePlayingField);
      expect(JSON.parse(message).data.bbox).toEqual(client1.currentField);
      //Second GM, stand by.
      const res2 = await client2.sendPosition();
      expect(res2.status).toEqual(CUSTOM_HTTP_CODES.OK_STANDBY);
      //Field is nt updated on redis
      await expect(waitForMessage()).rejects.toEqual("Timeout");
    }, 15000);
  });

  describe("Multiple games at the same time", () => {
    let client1: Client;
    let client2: Client;
    beforeAll(() => {
      client1 = new Client("1", 0);
      client2 = new Client("2", 1);
    });
    it("Should answer standy to the second GM", async () => {
      const res = await client1.sendPosition();
      expect(res.status).toEqual(CUSTOM_HTTP_CODES.OK_RECORDING);
      const [channel, message] = await waitForMessage();
      expect(channel).toEqual(PubChannels.MovePlayingField);
      expect(JSON.parse(message).data.bbox).toEqual(client1.currentField);
      // Second game
      const res2 = await client2.sendPosition();
      expect(res2.status).toEqual(CUSTOM_HTTP_CODES.OK_RECORDING);
      const [channel2, message2] = await waitForMessage();
      expect(channel2).toEqual(PubChannels.MovePlayingField);
      expect(JSON.parse(message2).data.bbox).toEqual(client2.currentField);
    }, 15000);
  });
});
