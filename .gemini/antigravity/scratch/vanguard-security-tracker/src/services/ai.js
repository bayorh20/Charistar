const SYSTEM_PROMPT = `
You are Lumina AI, a world-class AI frontend developer.
Your task is to generate beautiful, modern, and highly interactive React components styled with Tailwind CSS.

### Constraints & Coding Guidelines:
1. Return ONLY a valid JSON object with this EXACT structure (no markdown, no backticks, no extra explanation):
{
  "explanation": "Brief simple description of what you built/modified.",
  "files": {
    "App.jsx": "full complete code of App.jsx here",
    "styles.css": "optional extra styles"
  }
}
2. CSS Styling: Rely 100% on Tailwind CSS classes. Use beautiful gradients, modern layout (flex/grid), glassmorphism, responsive sizes, animations, and shadows.
3. React Version: Write standard React (hooks-based). Do NOT use import statements like 'import React from "react"' or 'import { useState } from "react"'. All React hooks (useState, useEffect, useRef, useMemo, useCallback) are already globally available in the sandbox.
4. Icons: Use Lucide React icons directly as components (e.g. <Search />, <Plus />, <Heart />) without any import statements. They are automatically injected into the global scope.
5. All code must be self-contained in App.jsx. Avoid external assets or custom npm packages. Use clean inline SVG or emoji if graphics are needed.
6. The app MUST look premium, modern, and alive: include hover micro-animations, transitions, interactive tabs, active states, and beautiful slate/violet/emerald color palettes.
7. IMPORTANT: The "App.jsx" value must be a complete, working React component. The function must be named "App" and must NOT use export statements.
`;

// Strip markdown fences and extract the JSON object from an AI response
function extractJSON(text) {
  if (!text) throw new Error("Empty response from AI.");

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {}
  }

  // Find the first { and last } and try to parse that substring
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch (_) {}
  }

  throw new Error("AI returned a response that could not be parsed. Please try again.");
}

export async function generateWithAI({ prompt, files, apiKey, selectedModel, isMobile = false, onProgress }) {
  if (!apiKey) {
    // Return mock demo response based on prompt matching
    return runMockAgent(prompt, files, isMobile, onProgress);
  }

  onProgress("Starting AI...", 10);
  await delay(600);
  
  onProgress("Planning layout...", 30);
  await delay(800);

  onProgress("Writing app files...", 50);
  await delay(800);

  const isClaude = selectedModel.startsWith('claude');
  onProgress(`Connecting to ${isClaude ? 'Claude' : 'Gemini'}...`, 70);

  const payloadText = `Current Files:\nApp.jsx:\n${files["App.jsx"] || ""}\n\nstyles.css:\n${files["styles.css"] || ""}\n\nUser Request: ${prompt}\n\nPlease generate/modify the code based on the instructions. Remember: return ONLY the JSON object, no markdown fences or extra text.`;

  try {
    let responseText = "";
    
    if (isClaude) {
      // Determine the right Claude model slug
      let claudeModel = "claude-3-5-sonnet-20241022";
      if (selectedModel.includes("claude-3-7") || selectedModel.includes("claude-3.7")) {
        claudeModel = "claude-3-7-sonnet-20250219";
      } else if (selectedModel.includes("claude-3-5-haiku") || selectedModel.includes("haiku")) {
        claudeModel = "claude-3-5-haiku-20241022";
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: payloadText
            }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Claude API Error ${response.status}: ${errData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      responseText = data.content?.[0]?.text;

    } else {
      // Determine the right Gemini model slug
      let geminiModel = "gemini-2.0-flash";
      if (selectedModel.includes("pro") || selectedModel.includes("2.5")) {
        geminiModel = "gemini-2.5-pro";
      } else if (selectedModel.includes("flash-lite") || selectedModel.includes("flash-8b")) {
        geminiModel = "gemini-2.0-flash-lite";
      } else if (selectedModel.includes("1.5-pro")) {
        geminiModel = "gemini-1.5-pro";
      } else if (selectedModel.includes("1.5-flash")) {
        geminiModel = "gemini-1.5-flash";
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: payloadText }]
              }
            ],
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 1.0,
              maxOutputTokens: 8192
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error ${response.status}: ${errData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      // Gemini sometimes returns promptFeedback with a BLOCK_REASON
      if (!responseText && data.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
      }
    }

    onProgress("Parsing code...", 88);
    await delay(400);

    const parsed = extractJSON(responseText);

    if (!parsed.files?.["App.jsx"]) {
      throw new Error("AI returned a response but no App.jsx code was found inside it.");
    }

    onProgress("Updating screen...", 100);
    await delay(300);

    return {
      explanation: parsed.explanation || "App updated successfully.",
      files: {
        ...files,
        "App.jsx": parsed.files["App.jsx"],
        "styles.css": parsed.files["styles.css"] || files["styles.css"] || ""
      }
    };

  } catch (error) {
    console.error("AI API invocation failed:", error);
    throw error;
  }
}

// Mock Agent Simulation (runs when no API key is set)
async function runMockAgent(prompt, currentFiles, isMobile, onProgress) {
  const normPrompt = prompt.toLowerCase();
  
  onProgress("Starting AI...", 15);
  await delay(900);

  onProgress("Reading layout...", 40);
  await delay(1200);

  onProgress("Updating states...", 70);
  await delay(1500);

  onProgress("Compiling files...", 90);
  await delay(800);

  let selectedTemplate = "dashboard";
  let explanation = "Generated a premium SaaS Analytics dashboard showing real-time stats and metrics.";

  if (normPrompt.includes("music") || normPrompt.includes("song") || normPrompt.includes("audio") || normPrompt.includes("player")) {
    selectedTemplate = "musicPlayer";
    explanation = "Created AeroBeat Music Player, featuring a rotating vinyl animation, dynamic volume slider, track selection, and a glassmorphic bottom sheet.";
  } else if (normPrompt.includes("fit") || normPrompt.includes("health") || normPrompt.includes("step") || normPrompt.includes("heart") || normPrompt.includes("water") || normPrompt.includes("workout")) {
    selectedTemplate = "fitnessTracker";
    explanation = "Assembled FitPulse Health Tracker with a SVG live heart-rate oscilloscope, animated goals step ring, and an interactive hydration logger.";
  } else {
    if (isMobile) {
      selectedTemplate = "musicPlayer";
      explanation = "Generated AeroBeat Mobile Music Player containing responsive touch elements and high-fidelity gradients.";
    }
  }

  const { TEMPLATES } = await import('./templates');
  const template = TEMPLATES[selectedTemplate];

  onProgress("Reloading preview...", 100);
  await delay(400);

  return {
    explanation,
    files: {
      ...currentFiles,
      "App.jsx": template.files["App.jsx"],
      "styles.css": template.files["styles.css"],
      "index.html": template.files["index.html"]
    }
  };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
