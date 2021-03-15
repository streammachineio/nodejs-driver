import { Type } from "avsc";
import { Client, ClientConfig } from "./client";
import { AxiosResponse } from "axios";
import { ApiStreamEvent, ClientStreamEvent } from "./models/event";

/**
 * Supported events and their handlers.
 * @todo: Add/remove events based on requirements
 */
export interface SenderConfig extends ClientConfig {
  gatewayUrl: string;
  schemaId: string;
  type: Type;
}

/**
 * Note that Sender has not added any supported events to the client (yet)
 */
export class Sender extends Client {
  private readonly gatewayUrl: string;
  private readonly schemaId: string;
  private readonly type: Type;

  constructor(config: SenderConfig) {
    /**
     * Passes ClientConfig and urls that require authentication to the base class.
     */
    super(config);
    this.gatewayUrl = config.gatewayUrl;
    this.schemaId = config.schemaId;
    this.type = config.type;
  }

  /**
   * Sends an event
   */
  async send<T extends ClientStreamEvent>(event: T): Promise<AxiosResponse> {
    /**
     * Merges ClientStreamEvent with missing fields of ApiStreamEvent to create an ApiStreamEvent
     */
    const apiStreamEvent: ApiStreamEvent = {
      ...event,
      strmMeta: {
        ...event.strmMeta,
        schemaId: this.schemaId,
        nonce: 0,
        timestamp: 0,
      },
    };

    /**
     * Note that the Client interceptor will add the Authorization header because this.gatewayUrl is configured as an api url.
     */
    return this.axiosInstance.post(this.gatewayUrl, this.type.toBuffer(apiStreamEvent), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Strm-Serialization-Type": "application/x-avro-binary",
        "Strm-Schema-Id": this.schemaId,
        ...this.getBearerHeader(),
      },
    });
    /**
     * @todo: Could throw an error if the status is not 204.
     */
    /**
     * @todo: Could introduce an event for a successful 'send'
     */
  }
}
