import type { AIClient, AIResponse } from "./client.js";
import type { ChatMessage } from "../../types/chat.js";

export class GoogleAIClient implements AIClient {
  async complete(input: ChatMessage[], model: string): Promise<AIResponse> {
    void input;
    return {
      text: "TODO: implement Google provider call",
      model
    };
  }
}

