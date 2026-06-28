const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const ZHIPU_API_KEYS = (process.env.ZHIPU_API_KEYS || process.env.ZHIPU_API_KEY || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

if (ZHIPU_API_KEYS.length === 0) {
  console.warn("No ZHIPU API keys found in environment variables!");
}

export async function callGLM(
  messages: { role: string; content: string }[], 
  temperature = 0.3, 
  maxRetries = 3
) {
  let lastError;
  
  // Try each API key
  for (const apiKey of ZHIPU_API_KEYS) {
    // For each key, try up to maxRetries times
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "GLM-4.7-Flash",
            messages,
            temperature,
            thinking: { type: "disabled" },
          }),
        });
        
        if (res.ok) {
          return res.json();
        }
        
        const err = await res.text();
        lastError = new Error(`GLM API error ${res.status}: ${err}`);
        
        // If it's a 429 (Too Many Requests) OR 401 (Unauthorized - maybe bad key?), try next key or retry
        if (res.status === 429 || res.status === 401) {
          const waitTime = attempt * 2000; // Exponential backoff
          console.log(`API key ${ZHIPU_API_KEYS.indexOf(apiKey) + 1} failed (${res.status}), waiting ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw lastError;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000;
          console.log(`Request failed, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }
  
  throw lastError;
}
