import {
  controller,
  httpGet, httpPost,
  request,
  response,
} from "inversify-express-utils";
import { inject } from "inversify";
import * as express from "express";
import { TYPES } from "../types";
import { RedisAPI } from "../@types/redis-service";
import { Bbox } from "../@types/api";
import { PositionBrokerAPI } from "../@types/position-broker-api";
import {BrokersManager} from "../services/brokers-manager";
import {BrokersManagerAPI} from "../@types/brokers-manager-API";

export interface FieldPayload {
  playerId: string;
  field: Bbox;
  gameId: number;
}
export enum CUSTOM_HTTP_CODES {
  OK_STANDBY = 215,
  OK_RECORDING = 216,
}
export enum PubChannels {
  MovePlayingField = "MoveRoll20RecordedFieldArea",
}

@controller("/")
export class FieldController {
  constructor(
    @inject(TYPES.RedisService) private redisService: RedisAPI,
    @inject(TYPES.BrokersManager) private brokersManager: BrokersManagerAPI
  ) {}

  @httpPost("/")
  public async processField(
      @request() req: express.Request,
      @response() res: express.Response
  ): Promise<void> {
    //console.log(req)
    const body = req.body as FieldPayload;
    if (body.playerId === undefined || body.field === undefined || body.gameId === undefined) {
      console.warn(`Request ignored :(game ${body.gameId}) ${body.playerId} -> ${body.field}`);
      return;
    }
    this.getPositionBroker(body.gameId).updateFieldOf(body.playerId, body.field);
    res.statusCode = this.publishField(body.playerId, body.gameId);
    res.end("Ok");
  }

  @httpPost("code")
  public async getCode(
      @request() req: express.Request,
      @response() res: express.Response
  ): Promise<void> {
    //console.log(req)
    const body = req.body as FieldPayload;
    if (body.playerId === undefined || body.gameId === undefined) {
      console.warn(`Request ignored :(game ${body.gameId}) ${body.playerId} -> ${body.field}`);
      return;
    }
    const isRecorded = this.getPositionBroker(body.gameId).isRecordedPlayer(body.playerId);
    res.statusCode = isRecorded ? CUSTOM_HTTP_CODES.OK_RECORDING : CUSTOM_HTTP_CODES.OK_STANDBY;
    res.end("Ok");
  }

  @httpPost("takeOver")
  public async takeOver(
    @request() req: express.Request,
    @response() res: express.Response
  ): Promise<void> {
    const body = req.body as FieldPayload;
    if (body.playerId === undefined || body.gameId === undefined) {
      console.warn(`Request ignored :(game ${body.gameId}) ${body.playerId} -> ${body.field}`);
      return;
    }
    try {
      this.getPositionBroker(body.gameId).takeOverRecording(body.playerId);
      res.statusCode = this.publishField(body.playerId, body.gameId);
    } catch (e) {
      res.statusCode = 422;
    }
    res.end();
  }

  @httpPost("disconnect")
  public async disconnect(
      @request() req: express.Request,
      @response() res: express.Response
  ): Promise<void> {
    try {
      const body = req.body as FieldPayload;
      if (body.gameId === undefined) {
        console.warn(`Request ignored :(game ${body.gameId}) ${body.playerId} -> ${body.field}`);
        return;
      }
      const hasChanged = this.getPositionBroker(body.gameId).shiftRecordedPlayer()
      console.log(`Trying to change recorded player: ` + hasChanged);
    } catch (e) {
      res.statusCode = 422;
    }
    res.end();
  }

  private publishField(candidate: string, gameId: number): CUSTOM_HTTP_CODES{
    const positionBroker = this.getPositionBroker(gameId);
    if (!positionBroker.isRecordedPlayer(candidate)) {
      return CUSTOM_HTTP_CODES.OK_STANDBY;
    }
    this.redisService.publish(PubChannels.MovePlayingField, {
      data: {
        bbox: positionBroker.recordedField,
      },
    });
    return CUSTOM_HTTP_CODES.OK_RECORDING;
  }

  private getPositionBroker(gameId: number): PositionBrokerAPI{
    return this.brokersManager.getBrokerForGame(gameId);
  }
}
