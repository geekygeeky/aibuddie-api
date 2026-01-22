import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';

export type ModelTier = 'low' | 'medium' | 'high';

interface RouterResult {
  tier: ModelTier;
  reasoning: string;
}

const routerPrompt = PromptTemplate.fromTemplate(`Analyze this user input and determine the appropriate AI model tier needed.

User Input: {input}

Classify as:
- low: Simple queries, basic questions, casual chat, simple text generation
- medium: Creative writing, code generation, analysis, moderate complexity
- high: Complex reasoning, research, advanced coding, multi-step tasks, image generation

Respond with JSON only: {{"tier": "low|medium|high", "reasoning": "brief explanation"}}`);

export class AIRouter {
  private routerModel: ChatOpenAI;

  constructor() {
    this.routerModel = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  async routeRequest(input: string): Promise<RouterResult> {
    try {
      const prompt = await routerPrompt.format({ input });
      const response = await this.routerModel.invoke(prompt);
      const content = response.content.toString();
      const jsonMatch = content.match(/\{.*\}/s);
      
      if (!jsonMatch) {
        return { tier: 'medium', reasoning: 'Default routing due to parse error' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Parsed", parsed);
      return {
        tier: parsed.tier || 'medium',
        reasoning: parsed.reasoning || 'Auto-routed'
      };
    } catch (error) {
      console.error('Router error:', error);
      return { tier: 'medium', reasoning: 'Default routing due to error' };
    }
  }

  getModelForTier(tier: ModelTier, buddyPrompt: string) {
    const modelConfigs = {
      low: {
        model: new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
          openAIApiKey: process.env.OPENAI_API_KEY
        }),
        cost: 1
      },
      medium: {
        model: new ChatOpenAI({
          modelName: 'gpt-4o',
          temperature: 0.7,
          openAIApiKey: process.env.OPENAI_API_KEY
        }),
        cost: 5
      },
      high: {
        model: new ChatAnthropic({
          modelName: 'claude-opus-4-20250514',
          temperature: 0.7,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY
        }),
        cost: 15
      }
    };

    return modelConfigs[tier];
  }
}