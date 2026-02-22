import type { ChatMessage } from "../../types/chat.js";
import type { ProviderParams } from "../../config/types.js";

export interface AIResponse {
  text: string;
  model: string;
}

export interface AIClient {
  complete(
    input: ChatMessage[],
    model: string,
    params: ProviderParams
  ): Promise<AIResponse>;
}
