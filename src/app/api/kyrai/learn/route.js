import { NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


async function evaluate_responses(input, resources) {
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
You are part of an adaptive tutor, which follows this pipeline:

1) analyze_input: Extract subject, topics, and core concepts from the user's input.
2) generate_mcqs: Create 3–7 multiple-choice questions tied to the identified concepts and target level.
   - 4–5 choices each, one correct answer, no "all/none of the above".
   - Plausible distractors based on common misconceptions.
   - Include explanations and concept_tags per item.
3) After the user answers, evaluate_responses: Score, identify weak concepts, and provide a short rationale of misunderstandings.
4) recommend_resources: Retrieve 3–8 resources for weak concepts. Prefer concise, reputable, and level-appropriate materials. Avoid unsafe or age-inappropriate content.
5) teach_concept: Deliver a short, structured lesson focused on the user's original input and weak areas. Include analogy, worked example(s), interactive check(s), and an exit ticket (2 MCQs).

You are tasked with step 4: recommend_resources. Follow this JSON schema only. Do not add extra text.

Input:
weakspots: A list of topics, ideas or concepts that the user needs further study on.
{
    "weakspots": [string], 
}

Input:
weakspot: For each weakspot, an array of resources will be provided. These are usually urls.
{
    weakspot: [string]
}


Output: For each weak concept, provide a comprehensive explanation on the subject, followed by 1-2 external resources (links to articles, videos, or interactive tools) that are reputable and appropriate for the user's level. Finally, generate 1-2 multiple-choice questions to assess understanding of the concept.
Follow this JSON schema only. Do not add extra text.
lessons: A list of lessons for each weak concept.
concept: The specific topic or idea being addressed.
explanation: A clear and concise explanation of the concept. Include example questions and answers to illustrate key points. Think of it as a mini lesson that a teacher might teach.
resources: A list of 1-2 reputable and level-appropriate resources (links to articles, videos, or interactive tools) for further study.
exit_ticket: A short quiz with 1-2 multiple-choice questions to assess understanding of the concept. Each question should have 4 answer choices. 
question: The question text.
choices: A list of answer choices. There should only be one correct answer. Each incorrect answer should be a plausible distractor based on common misconceptions.
choice: The text of the answer choice. 
is_correct: A boolean indicating if this choice is the correct answer.
explanation: A brief explanation of why this choice is correct or incorrect.
{
    "lessons": [
        {
            "concept": string,
            "explanation": string,
            "resources": [string],
            "exit_ticket": [
                {
                    "question": string,
                    "choices": [
                        {
                            "choice": string,
                            "is_correct": boolean,
                            "explanation": string
                        }
                    ],
                }
            ]
        }
    ]
}

Rules:
- Use tools whenever appropriate; do not fabricate tool results.
- Keep vocabulary aligned to the user's target level if provided.
- If input is unsafe, decline and ask for a different topic.
- Keep outputs in compact JSON or concise text depending on the tool’s contract below.
- When outputting JSON for tools or final results, strictly follow the specified schemas.
`
            },
            { role: "system", content: JSON.stringify(input) },
            { role: "system", content: JSON.stringify(resources) }
        ],
        temperature: 1
    });
    return response.choices[0].message.content;
}

async function fetch_resources(weakspots) {
    const response = await client.chat.completions.create({
        model: "gpt-4o-search-preview",
        messages: [
            {
                role: "system",
                content: `
You are part of an adaptive tutor, which follows this pipeline:

1) analyze_input: Extract subject, topics, and core concepts from the user's input.
2) generate_mcqs: Create 3–7 multiple-choice questions tied to the identified concepts and target level.
   - 4–5 choices each, one correct answer, no "all/none of the above".
   - Plausible distractors based on common misconceptions.
   - Include explanations and concept_tags per item.
3) After the user answers, evaluate_responses: Score, identify weak concepts, and provide a short rationale of misunderstandings.
4) recommend_resources: Retrieve 3–8 resources for weak concepts. Prefer concise, reputable, and level-appropriate materials. Avoid unsafe or age-inappropriate content.
5) teach_concept: Deliver a short, structured lesson focused on the user's original input and weak areas. Include analogy, worked example(s), interactive check(s), and an exit ticket (2 MCQs).

You are tasked with assisting step 4: recommend_resources. Follow this JSON schema only. Do not add extra text.
Your goal is to find 2-4 reputable, concise, and level-appropriate resources for each weakspot provided. These can include articles, videos, or interactive tools. Avoid unsafe or age-inappropriate content.

Inputs:
weakspots: A list of topics, ideas or concepts that the user needs further study on.
{
    "weakspots": [string], 
}

Output:
weakspot: For each weakspot, provide an array of resources. 
{
    weakspot: [string]
}

Rules:
- Use tools whenever appropriate; do not fabricate tool results.
- Keep vocabulary aligned to the user's target level if provided.
- If input is unsafe, decline and ask for a different topic.
- Keep outputs in compact JSON or concise text depending on the tool’s contract below.
- When outputting JSON for tools or final results, strictly follow the specified schemas.
`
            },
            { role: "system", content: JSON.stringify(weakspots) }
        ],
    });
    return response.choices[0].message.content;
}



export async function POST(req) {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    
    const resources = await fetch_resources(prompt);
    const response = await evaluate_responses(prompt, resources);

    return NextResponse.json({ response });
}
