import { GoogleGenAI } from "@google/genai";
import type { AIClient, AIResponse } from "./client.js";
import type { ChatMessage } from "../../types/chat.js";
import type { ProviderParams } from "../../config/types.js";

export class GoogleAIClient implements AIClient {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete(
    input: ChatMessage[],
    model: string,
    params: ProviderParams
  ): Promise<AIResponse> {
    const prompt = input
      .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
      .join("\n\n");

    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: params.temperature,
        topP: params.topP,
        maxOutputTokens: params.maxOutputTokens
      }
    });

    const text = response.text?.trim() ?? "";
    if (!text) {
      throw new Error("Model returned an empty response.");
    }

    return {
      text,
      model: response.modelVersion ?? model
    };
  }
}
