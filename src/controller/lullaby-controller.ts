import {
  controller,
  httpGet,
  request,
  response,
} from "inversify-express-utils";
import { inject } from "inversify";
import * as express from "express";
import { TYPES } from "../types";
import { RedisAPI } from "../@types/redis-service";
import { Bbox } from "../@types/api";
import { FieldManagerAPI } from "../@types/field-manager-api";

export interface FieldPayload {
  player: string;
  field: Bbox;
}
export enum CUSTOM_HTTP_CODES {
  OK_STANDBY = 215,
  OK_RECORDING = 216,
}
export enum PubChannels {
  MovePlayingField = "MoveRoll20RecordedFieldArea",
}

@controller("/")
export class LullabyController {
  constructor(
    @inject(TYPES.RedisService) private redisService: RedisAPI,
    @inject(TYPES.FieldManager) private fieldManager: FieldManagerAPI
  ) {}

  @httpGet("/")
  public async processField(
    @request() req: express.Request,
    @response() res: express.Response
  ): Promise<void> {
    const body = req.body as FieldPayload;
    if (!body.player || !body.field) {
      console.warn(`Request ignored : ${body.player} -> ${body.field}`);
      return;
    }
    this.fieldManager.updateFieldOf(body.player, body.field);
    res.statusCode = this.publishField(body.player);
    res.end("Ok");
  }

  @httpGet("/takeOver")
  public async takeOver(
    @request() req: express.Request,
    @response() res: express.Response
  ): Promise<void> {
    const body = req.body as FieldPayload;
    if (!body.player || !body.field) {
      console.warn(`Request ignored : ${body.player} -> ${body.field}`);
      return;
    }
    try {
      this.fieldManager.takeOverRecording(body.player);
      res.statusCode = this.publishField(body.player);
    } catch (e) {
      res.statusCode = 422;
    }
    res.end();
  }

  private publishField(candidate: string): CUSTOM_HTTP_CODES{
    if (!this.fieldManager.isRecordedPlayer(candidate)) {
      return CUSTOM_HTTP_CODES.OK_STANDBY;
    }
    this.redisService.publish(PubChannels.MovePlayingField, {
      data: {
        bbox: this.fieldManager.recordedField,
      },
    });
    return CUSTOM_HTTP_CODES.OK_RECORDING;
  }
}
