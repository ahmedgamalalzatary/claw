import type { ChatMessage } from "../../types/chat.js";

export interface AIResponse {
  text: string;
  model: string;
}

export interface AIClient {
  complete(input: ChatMessage[], model: string): Promise<AIResponse>;
}

