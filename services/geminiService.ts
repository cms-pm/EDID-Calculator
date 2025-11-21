import type { EdidParams, ChatMessage } from '../types';

// Backend API endpoint
const API_BASE_URL = '/api';

export interface AssistantResponse {
    text: string;
    functionCall?: {
        name: string;
        args: Partial<EdidParams>;
    }
}

export const askAssistant = async (history: ChatMessage[], newQuestion: string): Promise<AssistantResponse> => {
  try {
    // Call backend proxy endpoint
    const response = await fetch(`${API_BASE_URL}/gemini/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: newQuestion,
        history: history,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Transform backend response to match expected format
    const result: AssistantResponse = {
      text: data.text || data.response || "Sorry, I didn't receive a response.",
    };

    // Check for function calls in the response
    if (data.functionCall) {
      result.functionCall = {
        name: data.functionCall.name,
        args: data.functionCall.args,
      };
    }

    return result;

  } catch (error) {
    console.error("Error asking assistant:", error);
    return {
      text: "Sorry, I encountered an error communicating with the AI assistant. Please try again."
    };
  }
};
