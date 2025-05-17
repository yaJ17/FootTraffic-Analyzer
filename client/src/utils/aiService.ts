const OPENROUTER_API_URL = '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';

interface AIResponse {
  success: boolean;
  interpretation: string;
  error?: string;
}

export async function generateForecastInterpretation(locationData: {
  name: string;
  avgFootTraffic: number;
  totalFootTraffic: number;
  avgDwellTime: string;
  population: number;
}, apiKey: string): Promise<AIResponse> {
  try {
    const prompt = `As a foot traffic analysis expert, provide a concise interpretation of the following location data:
    Location: ${locationData.name}
    Average Foot Traffic: ${locationData.avgFootTraffic} people
    Total Foot Traffic: ${locationData.totalFootTraffic} people
    Average Dwell Time: ${locationData.avgDwellTime}
    Population: ${locationData.population}
    
    Focus on:
    1. Current traffic patterns
    2. Predictions for near future
    3. Notable insights about dwell time
    4. Suggestions for optimization
    
    Keep the response under 100 words.`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct', // You can change this to other models
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate interpretation');
    }

    const data = await response.json();
    return {
      success: true,
      interpretation: data.choices[0].message.content.trim()
    };
  } catch (error) {
    return {
      success: false,
      interpretation: '',
      error: error instanceof Error ? error.message : 'Failed to generate interpretation'
    };
  }
}
