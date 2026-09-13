import { useState, useCallback } from 'react';

export interface Adapter {
  domain: string;
  gate: number;
  loaded: boolean;
  sizeMB: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  gateVector?: Record<string, number>;
  ttft?: number;
  tokensPerSec?: number;
}

export interface ProbeResult {
  id: string;
  prompt: string;
  greedyResponse: string;
  robustSamples: string[];
  robustnessScore: number;
  robustnessPass: boolean;
  ttft: number;
  tokensPerSec: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  ttft: number;
  tokensPerSec: number;
  activeAdapters: number;
  memoryUsage: {
    base: number;
    adapters: number;
    total: number;
    system: number;
  };
}

// Mock adapters
const INITIAL_ADAPTERS: Adapter[] = [
  { domain: 'sql-query', gate: 0.6, loaded: true, sizeMB: 42 },
  { domain: 'code-review', gate: 0.4, loaded: true, sizeMB: 42 },
  { domain: 'math-reasoning', gate: 0.0, loaded: false, sizeMB: 42 },
];

export function usePlayground() {
  const [adapters, setAdapters] = useState<Adapter[]>(INITIAL_ADAPTERS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant with specialized skills.');
  const [routerMode, setRouterMode] = useState<'keyword_v3' | 'v3q_diagnostic' | 'oracle'>('keyword_v3');
  const [probeResults, setProbeResults] = useState<ProbeResult[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ttft: 0,
    tokensPerSec: 0,
    activeAdapters: 2,
    memoryUsage: {
      base: 6.2,
      adapters: 0.084,
      total: 6.284,
      system: 64.0,
    },
  });

  // Route prompt through router
  const routePrompt = useCallback((prompt: string): Record<string, number> => {
    const gates: Record<string, number> = {};
    const promptLower = prompt.toLowerCase();

    if (routerMode === 'keyword_v3') {
      // Simple keyword matching
      if (promptLower.includes('select') || promptLower.includes('sql') || promptLower.includes('query')) {
        gates['sql-query'] = 1.0;
      } else if (promptLower.includes('code') || promptLower.includes('function') || promptLower.includes('debug')) {
        gates['code-review'] = 1.0;
      } else if (promptLower.includes('solve') || promptLower.includes('equation') || promptLower.includes('math')) {
        gates['math-reasoning'] = 1.0;
      } else {
        // Default: distribute among loaded adapters
        const loaded = adapters.filter(a => a.loaded);
        if (loaded.length > 0) {
          const share = 1.0 / loaded.length;
          loaded.forEach(a => { gates[a.domain] = share; });
        }
      }
    } else if (routerMode === 'v3q_diagnostic') {
      // Confidence-based routing
      if (promptLower.includes('sql') || promptLower.includes('query')) {
        gates['sql-query'] = 0.9;
        gates['code-review'] = 0.1;
      } else if (promptLower.includes('code') || promptLower.includes('function')) {
        gates['code-review'] = 0.85;
        gates['sql-query'] = 0.15;
      } else {
        gates['sql-query'] = 0.5;
        gates['code-review'] = 0.5;
      }
    } else if (routerMode === 'oracle') {
      // Perfect routing
      if (promptLower.includes('sql')) {
        gates['sql-query'] = 1.0;
      } else if (promptLower.includes('code')) {
        gates['code-review'] = 1.0;
      } else if (promptLower.includes('math') || promptLower.includes('solve')) {
        gates['math-reasoning'] = 1.0;
      }
    }

    return gates;
  }, [routerMode, adapters]);

  // Generate mock response
  const generateResponse = useCallback((prompt: string, gateVector: Record<string, number>, temperature: number): string => {
    const activeDomain = Object.entries(gateVector).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0])[0];

    const responses: Record<string, string[]> = {
      'sql-query': [
        'SELECT * FROM users WHERE age > 25 ORDER BY name;',
        'To optimize this query, add an index on the created_at column.',
        'The JOIN operation is causing a cartesian product. Use INNER JOIN with proper conditions.',
      ],
      'code-review': [
        'The function has a time complexity of O(n²). Consider using a hash map for O(n).',
        'This code has a potential null pointer exception on line 15.',
        'Refactor this into smaller functions for better testability.',
      ],
      'math-reasoning': [
        '<think>Using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a.</think>\n<answer>x = 2 or x = -3</answer>',
        '<think>The derivative of x³ is 3x² by the power rule.</think>\n<answer>3x²</answer>',
      ],
    };

    const domainResponses = responses[activeDomain] || ['I can help with that.'];
    
    if (temperature > 0) {
      return domainResponses[Math.floor(Math.random() * domainResponses.length)];
    } else {
      return domainResponses[0];
    }
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (prompt: string) => {
    if (isStreaming) return;

    setIsStreaming(true);
    const startTime = Date.now();

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Route prompt
    const gateVector = routePrompt(prompt);

    // Update adapters with current gates
    setAdapters(prev => prev.map(a => ({
      ...a,
      gate: gateVector[a.domain] || 0,
    })));

    // Generate response
    const fullResponse = generateResponse(prompt, gateVector, 0.7);
    const words = fullResponse.split(' ');

    // Add assistant message (empty initially)
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      gateVector,
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Stream tokens
    let currentContent = '';
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      currentContent += words[i] + ' ';
      
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: currentContent }
          : msg
      ));
    }

    // Calculate metrics
    const ttft = Date.now() - startTime;
    const tokensPerSec = (words.length / (ttft / 1000));

    // Update message with metrics
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessage.id
        ? { ...msg, ttft, tokensPerSec }
        : msg
    ));

    // Update global metrics
    setMetrics(prev => ({
      ...prev,
      ttft,
      tokensPerSec,
    }));

    setIsStreaming(false);
  }, [isStreaming, routePrompt, generateResponse]);

  // Run robustness probe
  const runProbe = useCallback(async (prompt: string) => {
    if (isProbing) return;

    setIsProbing(true);
    const startTime = Date.now();

    // Route prompt
    const gateVector = routePrompt(prompt);

    // Generate greedy response (temp 0.0)
    const greedyResponse = generateResponse(prompt, gateVector, 0.0);

    // Generate 6 robust samples (temp 0.3)
    const robustSamples: string[] = [];
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      robustSamples.push(generateResponse(prompt, gateVector, 0.3));
    }

    // Calculate robustness score
    const matches = robustSamples.filter(s => s === greedyResponse).length;
    const robustnessPass = matches >= 5;

    const ttft = Date.now() - startTime;
    const tokensPerSec = 45 + Math.random() * 10;

    const probeResult: ProbeResult = {
      id: `probe-${Date.now()}`,
      prompt,
      greedyResponse,
      robustSamples,
      robustnessScore: matches,
      robustnessPass,
      ttft,
      tokensPerSec,
      timestamp: Date.now(),
    };

    setProbeResults(prev => [probeResult, ...prev].slice(0, 10)); // Keep last 10
    setIsProbing(false);
  }, [isProbing, routePrompt, generateResponse]);

  // Update adapter gate
  const updateAdapterGate = useCallback((domain: string, gate: number) => {
    setAdapters(prev => {
      const updated = prev.map(a =>
        a.domain === domain ? { ...a, gate, loaded: gate > 0 } : a
      );

      // Enforce Σ ≤ 1.0
      const total = updated.reduce((sum, a) => sum + a.gate, 0);
      if (total > 1.0) {
        // Scale down proportionally
        const scale = 1.0 / total;
        return updated.map(a => ({ ...a, gate: a.gate * scale }));
      }

      // Update memory
      const loadedAdapters = updated.filter(a => a.loaded);
      const adapterMemory = loadedAdapters.reduce((sum, a) => sum + a.sizeMB, 0) / 1024;
      setMetrics(prev => ({
        ...prev,
        activeAdapters: loadedAdapters.length,
        memoryUsage: {
          ...prev.memoryUsage,
          adapters: adapterMemory,
          total: prev.memoryUsage.base + adapterMemory,
        },
      }));

      return updated;
    });
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear probe results
  const clearProbeResults = useCallback(() => {
    setProbeResults([]);
  }, []);

  return {
    adapters,
    messages,
    isStreaming,
    systemPrompt,
    routerMode,
    probeResults,
    isProbing,
    metrics,
    setSystemPrompt,
    setRouterMode,
    sendMessage,
    runProbe,
    updateAdapterGate,
    clearChat,
    clearProbeResults,
  };
}
