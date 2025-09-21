import { NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


async function analyzeText(input) {
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

You are tasked with step 1: analyze_input. Follow this JSON schema only. Do not add extra text.
Subject: A broad academic subject (e.g., "Mathematics", "Biology", "Physics").
Topics: A list of specific topics within the subject (e.g., ["Calculus", "Linear Algebra", "Statistics"]).
Concepts: A list of core concepts relevant to the topics (e.g., ["Derivatives", "Integrals", "Matrix Multiplication"]).
{
  "subject": string,
  "topics": [string],
  "concepts": [string],
}

Rules:
- Use tools whenever appropriate; do not fabricate tool results.
- Keep vocabulary aligned to the user's target level if provided.
- If input is unsafe, decline and ask for a different topic.
- Keep outputs in compact JSON or concise text depending on the tool’s contract below.
- When outputting JSON for tools or final results, strictly follow the specified schemas.
`
            },
            { role: "user", content: input }
        ],
        temperature: 0
    });
    return response.choices[0].message.content;
}
async function generateAssessment(input) {
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

You are tasked with step 2: generate_mcqs. Your goal is to gain an understanding on the users knowledge level and gaps. Follow this JSON schema only. Do not add extra text.

Input:
Subject: A broad academic subject (e.g., "Mathematics", "Biology", "Physics").
Topics: A list of specific topics within the subject (e.g., ["Calculus", "Linear Algebra", "Statistics"]).
Concepts: A list of core concepts relevant to the topics (e.g., ["Derivatives", "Integrals", "Matrix Multiplication"]).
{
  "subject": string,
  "topics": [string],
  "concepts": [string],
}

Output:  Use the input given to generate relavent questions. While you will be using concepts to create the questions, use topics and subject as a background.
Questions: A list of multiple-choice questions. You should have 1-2 questions per concept.
Choices: Each question should have 4 answer choices. Only one should be correct. The other three should be plausible distractors based on common misconceptions.
Correct_answer: The correct answer for each question.
Explanations: A brief explanation (1-2 sentences) of why the correct answer is right and why the distractors are wrong.
{
    "questions": [
        {
            "question": string,
            "choices": [string],
            "correct_answer": integer,
            "explanations": string
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
            { role: "user", content: input }
        ],
        temperature: 0
    });

    return response.choices[0].message.content;
}
async function generateAssessment(input) {
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: input
            }
        ]
    });
}

export async function POST(req) {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const analysis = await analyzeText(prompt);

    return NextResponse.json({ response });
}
