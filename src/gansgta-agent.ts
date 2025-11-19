/**
 * Research Gangsta Agent.
 *
 * This agent is responsible for simulating an "Original Gangster" when reading the research paper.
 *
 * @author Aditya Patange <contact.adityapatange@gmail.com>
 * @date October 2025
 * @version 1.0.0
 */
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';

export const GangstaAgentSupportedModels = [
  'gpt-4.1',
  'gpt-4.1-nano',
  'gpt-4.1-mini',
  'gpt-5-nano',
  'gpt-5-mini',
  'gpt-5',
];

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-large';

interface GangstaAgentInitializationOptions {
  name: string;
  description: string;
  principles: string[];
  model: string;
}

const GangstaAgentInitializationOptionsSchema = z.object({
  name: z.string(),
  description: z.string(),
  principles: z.array(z.string()),
  model: z.string(),
});

export class GangstaAgentInitializationOptionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GangstaAgentInitializationOptionsError';
  }
}

export class GangstaAgent {
  private options: GangstaAgentInitializationOptions;

  /**
   * Constructs an instance of the GangstaAgent.
   * @param options - The options to initialize the GangstaAgent.
   * @throws GangstaAgentInitializationOptionsError if the options are invalid.
   */
  constructor(options: GangstaAgentInitializationOptions) {
    const validationResult = this.validateOptions(options);
    if (!validationResult.status) {
      throw new GangstaAgentInitializationOptionsError(validationResult.error || 'Invalid options');
    }

    this.options = options;
  }

  private validateModel(model: string): {
    status: boolean;
    error?: string;
  } {
    if (!model) {
      return { status: false, error: 'model is required and must be a string' };
    }

    if (!GangstaAgentSupportedModels.includes(model)) {
      return {
        status: false,
        error: `Invalid model. Supported models: ${GangstaAgentSupportedModels.join(', ')}`,
      };
    }

    return { status: true, error: undefined };
  }

  /**
   * Validates the options for the GangstaAgent.
   * @param options - The options to validate.
   * @returns The validation status and error message if any.
   */
  private validateOptions(options: GangstaAgentInitializationOptions): {
    status: boolean;
    error?: string;
  } {
    const modelValidation = this.validateModel(options.model);

    if (!modelValidation.status) {
      return {
        status: false,
        error: modelValidation.error,
      };
    }

    const result = GangstaAgentInitializationOptionsSchema.safeParse(options);
    if (result.success) {
      return { status: true };
    } else {
      // Custom error messages for each field
      const fieldErrors: { [key: string]: string } = {
        name: 'name is required and must be a string',
        description: 'description is required and must be a string',
        principles: 'principles is required and must be an array of strings',
        model: 'model is required and must be a string',
      };

      // Find the first relevant error and map to custom message, else fallback to zod message
      for (const err of result.error.errors) {
        if (err.path && err.path.length > 0 && fieldErrors[err.path[0]]) {
          let custom = fieldErrors[err.path[0]];
          // Optionally, add the Zod message if type or shape mismatch
          if (typeof err.message === 'string' && !custom.includes(err.message)) {
            custom += ` (${err.message})`;
          }
          return { status: false, error: custom };
        }
      }

      // Otherwise, combine all messages as fallback
      const errorMessages = result.error.errors.map(err => err.message).join('; ');
      return { status: false, error: errorMessages };
    }
  }

  /**
   * Loads a file from the file system.
   * @param filePath - The path to the file to load.
   * @returns The content of the file.
   * @throws Error if the file type is not supported.
   */
  // @ts-ignore - TODO: This method will be used in future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async loadFile(filePath: string): Promise<string> {
    const file = await readFile(filePath);

    if (filePath.endsWith('.pdf')) {
      const parser = new PDFParse({
        data: file,
      });
      const pdfTextNode = await parser.getText();
      return pdfTextNode.text;
    } else {
      throw new Error(`Unsupported file type: ${filePath}. Only PDF files are supported.`);
    }
  }

  // @ts-ignore - TODO: This method will be used in future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getVectorStore(paperText: string): Promise<any> {
    // TODO: Implement vector store
  }

  // @ts-ignore - TODO: This method will be used in future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async generateResponse(prompt: string, paperFilePath: string): Promise<string> {
    const agentNumber = Math.floor(Math.random() * 1000000);

    const name = `Gangsta Agent#${agentNumber}: ${this.options.name}`;

    const instructions = `
    You are a Gangsta Agent.
    Your task is to read the research paper and respond to the prompt.
    You are to follow the following principles:
    ${this.options.principles.join('\n')}
    `;

    // const paperText = await this.loadFile(paperFilePath);
    // const relevantDocuments = await this.getVectorStore(paperText);

    const agent = new Agent({
      name: name,
      instructions: instructions,
    });

    const result = await run(agent, prompt);

    return result.finalOutput || '';
  }
}
