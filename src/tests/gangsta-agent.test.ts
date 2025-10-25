import { describe, it, expect } from 'vitest';
import { GangstaAgent, GangstaAgentInitializationOptionsError } from '../gansgta-agent';

describe('Gangsta Agent', () => {
  it('should construct successfully with valid options', () => {
    const options = {
      name: 'OG Researcher',
      description: 'The original gangster in research analysis',
      principles: ['realness', 'rigor'],
      model: 'gpt-4.1',
    };
    const agent = new GangstaAgent(options);
    expect(agent).toBeInstanceOf(GangstaAgent);
  });

  it('should throw error when options are missing required model', () => {
    const badOptions = {
      name: 'OG',
      description: 'desc',
      principles: ['keep it real'],
    } as any;

    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/model is required/i);
      expect(e.message).toMatch(/string/i);
    }
  });

  it('should throw error when options are missing required name', () => {
    const badOptions = {
      description: 'desc',
      principles: ['keep it real'],
      model: 'gpt-4.1',
    } as any;
    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/name is required/i);
      expect(e.message).toMatch(/string/i);
    }
  });

  it('should throw error when options are missing required description', () => {
    const badOptions = {
      name: 'OG',
      principles: ['keep it real'],
      model: 'gpt-4.1',
    } as any;
    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/description is required/i);
      expect(e.message).toMatch(/string/i);
    }
  });

  it('should throw error when options are missing required principles', () => {
    const badOptions = {
      name: 'OG',
      description: 'desc',
      model: 'gpt-4.1',
    } as any;
    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/principles is required/i);
      expect(e.message).toMatch(/array/i);
    }
  });

  it('should throw error when principles is not an array', () => {
    const badOptions = {
      name: 'OG',
      description: 'desc',
      principles: 'not-an-array' as any,
      model: 'gpt-4.1',
    };

    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/principles is required and must be an array of strings/i);
      expect(e.message).toMatch(/must be an array/i);
    }
  });

  it('should throw error for unsupported model', () => {
    const badOptions = {
      name: 'OG',
      description: 'desc',
      principles: ['keep it real'],
      model: 'gpt-4.1-micro',
    };
    try {
      new GangstaAgent(badOptions);
    } catch (e: any) {
      expect(e).toBeInstanceOf(GangstaAgentInitializationOptionsError);
      expect(e.message).toMatch(/Invalid model/i);
      expect(e.message).toMatch(
        /Supported models: gpt-4.1, gpt-4.1-nano, gpt-4.1-mini, gpt-5-nano, gpt-5-mini, gpt-5/i
      );
    }
  });
});
