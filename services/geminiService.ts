import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import type { EdidParams, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const chatModel = 'gemini-2.5-flash';

const updateEdidFormDeclaration: FunctionDeclaration = {
  name: 'updateEdidForm',
  description: 'Updates the EDID parameter form with the provided values. Use this when the user provides specific timing or color information to populate the form.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      displayName: { type: Type.STRING, description: "The name of the display monitor." },
      pixelClock: { type: Type.NUMBER, description: "Pixel clock in kHz." },
      hAddressable: { type: Type.NUMBER, description: "Horizontal addressable pixels." },
      hBlanking: { type: Type.NUMBER, description: "Horizontal blanking pixels." },
      vAddressable: { type: Type.NUMBER, description: "Vertical addressable lines." },
      vBlanking: { type: Type.NUMBER, description: "Vertical blanking lines." },
      refreshRate: { type: Type.NUMBER, description: "The vertical refresh rate in Hz." },
      hFrontPorch: { type: Type.NUMBER, description: "Horizontal front porch pixels." },
      hSyncWidth: { type: Type.NUMBER, description: "Horizontal sync width pixels." },
      vFrontPorch: { type: Type.NUMBER, description: "Vertical front porch lines." },
      vSyncWidth: { type: Type.NUMBER, description: "Vertical sync width lines." },
      hImageSize: { type: Type.NUMBER, description: "Horizontal image size in mm." },
      vImageSize: { type: Type.NUMBER, description: "Vertical image size in mm." },
      hBorder: { type: Type.NUMBER, description: "Horizontal border pixels." },
      vBorder: { type: Type.NUMBER, description: "Vertical border lines." },
      colorimetry: {
        type: Type.OBJECT,
        description: "CIE 1931 color characteristics.",
        properties: {
            redX: { type: Type.NUMBER, description: "CIE 1931 'x' coordinate for the red primary color." },
            redY: { type: Type.NUMBER, description: "CIE 1931 'y' coordinate for the red primary color." },
            greenX: { type: Type.NUMBER, description: "CIE 1931 'x' coordinate for the green primary color." },
            greenY: { type: Type.NUMBER, description: "CIE 1931 'y' coordinate for the green primary color." },
            blueX: { type: Type.NUMBER, description: "CIE 1931 'x' coordinate for the blue primary color." },
            blueY: { type: Type.NUMBER, description: "CIE 1931 'y' coordinate for the blue primary color." },
            whiteX: { type: Type.NUMBER, description: "CIE 1931 'x' coordinate for the display's white point." },
            whiteY: { type: Type.NUMBER, description: "CIE 1931 'y' coordinate for the display's white point." },
        }
      }
    },
    // No required fields, as user might provide partial info
  },
};

let chat: Chat | null = null;

const getChat = (): Chat => {
  if (!chat) {
    chat = ai.chats.create({
      model: chatModel,
      config: {
        systemInstruction: "You are an expert assistant for embedded systems engineers, specializing in display timings and the EDID specification. Your name is 'Eddy'. Answer questions clearly, concisely, and accurately to help users understand the complexities of display standards. When a user provides EDID, timing, or colorimetry information, use the `updateEdidForm` tool to populate the form fields. Inform the user that you have updated the form.",
        tools: [{ functionDeclarations: [updateEdidFormDeclaration] }],
      },
    });
  }
  return chat;
};

export interface AssistantResponse {
    text: string;
    functionCall?: {
        name: string;
        args: Partial<EdidParams>;
    }
}

export const askAssistant = async (history: ChatMessage[], newQuestion: string): Promise<AssistantResponse> => {
  try {
    const chatInstance = getChat();
    const result = await chatInstance.sendMessage({ message: newQuestion });

    const response: AssistantResponse = { text: result.text };

    if (result.functionCalls && result.functionCalls.length > 0) {
        const fc = result.functionCalls[0];
        response.functionCall = {
            name: fc.name,
            args: fc.args,
        };
    }
    
    return response;

  } catch (error) {
    console.error("Error asking assistant:", error);
    return { text: "Sorry, I encountered an error. Please try again." };
  }
};
