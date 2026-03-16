import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

interface NovaLiteResponse {
  response: string;
  tokens_used: number;
  finish_reason: string;
}

export class NovaLiteService {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId = 'amazon.nova-lite-v1:0';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly defaultMaxTokens = 500;
  private readonly defaultTemperature = 0.7;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Generate AI response using Amazon Nova Lite via Bedrock
   * Target latency: < 3 seconds
   */
  async generateResponse(
    prompt: string,
    context: string[] = [],
    maxTokens: number = this.defaultMaxTokens,
    temperature: number = this.defaultTemperature
  ): Promise<string> {
    const startTime = Date.now();

    try {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // Build messages array with context
          const messages: Array<{ role: string; content: Array<{ text: string }> }> = [];

          if (context.length > 0) {
            for (const ctx of context) {
              messages.push({
                role: 'user',
                content: [{ text: ctx }],
              });
              messages.push({
                role: 'assistant',
                content: [{ text: 'Understood.' }],
              });
            }
          }

          messages.push({
            role: 'user',
            content: [{ text: prompt }],
          });

          const body = JSON.stringify({
            messages,
            inferenceConfig: {
              maxTokens,
              temperature,
              topP: 0.9,
            },
          });

          const command = new InvokeModelCommand({
            modelId: this.modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: new TextEncoder().encode(body),
          });

          const response = await this.client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));

          const duration = Date.now() - startTime;
          console.log(`Nova Lite response generated in ${duration}ms (attempt ${attempt})`);

          // Extract text from Bedrock Converse-style response
          const outputText =
            responseBody?.output?.message?.content?.[0]?.text ||
            responseBody?.content?.[0]?.text ||
            '';

          return outputText;
        } catch (error: any) {
          lastError = error;

          if (attempt < this.maxRetries) {
            console.warn(`Nova Lite attempt ${attempt} failed: ${error.message}, retrying...`);
            await this.sleep(this.retryDelay * attempt);
          }
        }
      }

      throw new Error(`Nova Lite failed after ${this.maxRetries} attempts: ${lastError?.message}`);
    } catch (error: any) {
      console.error('Nova Lite generation error:', error.message);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Generate next question based on conversation context
   */
  async generateNextQuestion(
    collectedData: any,
    conversationHistory: string[]
  ): Promise<string> {
    const prompt = this.buildQuestionPrompt(collectedData, conversationHistory);

    try {
      const response = await this.generateResponse(prompt, conversationHistory, 200, 0.7);
      return response.trim();
    } catch (error) {
      // Fallback to template-based question
      return this.getFallbackQuestion(collectedData);
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionPrompt(collectedData: any, conversationHistory: string[]): string {
    const dataStr = JSON.stringify(collectedData, null, 2);

    return `You are a professional nutritionist conducting a health consultation.
Based on the information collected so far:
${dataStr}

And the conversation history, generate the next appropriate question to ask the user.
The question should be:
- Clear and concise
- Relevant to creating a personalized diet plan
- Adaptive based on the user's profile (age, activity level, etc.)
- Professional and friendly in tone

Generate only the question, without any additional explanation.`;
  }

  /**
   * Fallback question templates
   */
  private getFallbackQuestion(collectedData: any): string {
    if (!collectedData.age) return 'What is your age?';
    if (!collectedData.gender) return 'What is your gender?';
    if (!collectedData.height_cm) return 'What is your height in centimeters?';
    if (!collectedData.weight_kg) return 'What is your weight in kilograms?';
    if (!collectedData.diet_preference) return 'What is your diet preference?';
    if (!collectedData.activity_level) return 'What is your daily activity level?';
    if (!collectedData.sleep_hours) return 'How many hours do you sleep per day?';
    if (!collectedData.stress_level) return 'What is your stress level?';

    return 'Do you have any medical conditions I should know about?';
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
