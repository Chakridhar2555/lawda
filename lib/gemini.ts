import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export type AssistantContext = {
  type: 'strategy' | 'calendar' | 'call' | 'general';
  data?: any;
};

export async function getGeminiResponse(
  message: string,
  context: AssistantContext
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Build context-aware prompt
    let contextPrompt = '';
    switch (context.type) {
      case 'strategy':
        contextPrompt = `As Alex, the Get Home Realty Assistant, help with real estate strategy. `;
        break;
      case 'calendar':
        contextPrompt = `As Alex, the Get Home Realty Assistant, help with calendar and scheduling. `;
        break;
      case 'call':
        contextPrompt = `As Alex, the Get Home Realty Assistant, help with call management. `;
        break;
      default:
        contextPrompt = 'As Alex, the Get Home Realty Assistant, ';
    }

    const prompt = `${contextPrompt}User query: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again.";
  }
} 