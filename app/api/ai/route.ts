import { NextRequest, NextResponse } from "next/server";
import ollama from 'ollama';

export async function POST(req: NextRequest) {
    const { userInput, type, systemPrompt } = await req.json();

    const finalPrompt = `${systemPrompt}

User request: ${userInput}

CANVAS GENERATION RULES:
- Create a professional ${type}
- Coordinate system starts from x=0, y=0
- Every element must have: unique id, type, x, y
- Add width and height whenever applicable
- Use appropriate: backgroundColor, strokeColor, strokeWidth, fillStyle, roughness, opacity, font settings
- Use hex colors
- Avoid overlapping elements
- Keep enough spacing between elements
- Connections must reference valid element IDs


  COLOR RULES:
- The diagram MUST be colorful
- Every shape/component should include backgroundColor and strokeColor
- Use valid HEX colors only
- Use soft, modern and professional colors
- Use different colors to visually distinguish different steps, sections, or categories
- Prefer light/pastel backgrounds with darker borders
- Keep text readable with sufficient contrast
- Avoid using the same color for every element
- Avoid extremely bright/neon colors
- Connections should use darker neutral or matching colors
- Standalone text should use dark readable colors

RECOMMENDED COLOR PALETTE:
- Blue: backgroundColor "#DBEAFE", strokeColor "#2563EB"
- Purple: backgroundColor "#EDE9FE", strokeColor "#7C3AED"
- Green: backgroundColor "#DCFCE7", strokeColor "#16A34A"
- Orange: backgroundColor "#FFEDD5", strokeColor "#EA580C"
- Pink: backgroundColor "#FCE7F3", strokeColor "#DB2777"
- Cyan: backgroundColor "#CFFAFE", strokeColor "#0891B2"
- Yellow: backgroundColor "#FEF3C7", strokeColor "#D97706"
- Red: backgroundColor "#fee2e2", strokeColor "dc2626"

Do not randomly assign colors.
Use the colors meaninfully based of the elemtn's role

CONNECTION RULES
- Conecctions must reference valid element IDs
- Only create connections when required
- Use a short optional label
- Connections should clearly represent the direction of the workflow
- Do not create duplicate connections

OUTPUT SIZE RULES
- Maximum model output token limit 65536
- keep the generated result well below 65536 tokens
- prefer fewer meaningful elements instead of excessive details
- do not repeat data

Return ONLY a valid JSON object with exactly this structure, no markdown, no explanation:
{
  "diagramResult": {
    "title": "short title of the diagram",
    "width": total estimated width in pixels as a number,
    "success": true,
    "elements": [ ...array of Excalidraw shape elements... ],
    "connections": [ ...array of Excalidraw arrow/line elements connecting shapes... ]
  }
}

`
;

    const response = await ollama.chat({
        model: process.env.AI_MODEL ?? 'qwen2.5-coder:7b',
        messages: [
            {
                role: 'system',
                content: finalPrompt
            },
            {
                role: 'user',
                content: userInput
            }
        ]
    });

    const content = response.message.content;
    console.log('AI Response:', content);

    try {
        // Extract the JSON object from the response
        const match = content.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match ? match[0] : content);
        return NextResponse.json(parsed);
    } catch (e) {
        return NextResponse.json({
            diagramResult: {
                title: type,
                width: 800,
                success: false,
                elements: [],
                connections: []
            }
        });
    }
}