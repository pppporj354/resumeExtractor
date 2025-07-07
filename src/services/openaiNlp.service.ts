export class OpenAINlpService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables.")
    }
  }

  async extractStructuredData(resumeText: string): Promise<any> {
    // Prepare the prompt using chat format and include schema sample
    const messages = [
      {
        role: "system",
        content:
          "You are a resume parsing assistant. Extract structured candidate information from resume text. Return only valid JSON matching the provided schema. Do not include any explanation or extra text.",
      },
      {
        role: "user",
        content: `Extract the following fields: personal_info, professional_summary, skills, work_experience, education, projects, languages. Use this schema as a guide:

{
  "personal_info": { "full_name": "", "email": "", "phone": "", "location": { "city": "", "state": "", "country": "", "postal_code": "" }, "linkedin": "", "github": "", "portfolio": "", "other_links": [] },
  "professional_summary": { "title": "", "summary": "", "total_years_experience": 0, "current_role": "", "current_company": "" },
  "skills": { "technical_skills": [ { "category": "", "skills": [ { "name": "", "proficiency_level": "", "years_experience": 0 } ] } ], "soft_skills": [], "certifications": [] },
  "work_experience": [ { "company": "", "position": "", "start_date": "", "end_date": "", "duration_years": 0, "location": "", "description": "", "key_achievements": [], "technologies_used": [] } ],
  "education": [ { "institution": "", "degree": "", "field_of_study": "", "start_date": "", "end_date": "", "gpa": "", "honors": [] } ],
  "projects": [ { "name": "", "description": "", "technologies": [], "url": "", "start_date": "", "end_date": "" } ],
  "languages": [ { "language": "", "proficiency": "" } ]
}

Here is the resume text:
"""
${resumeText}
"""`,
      },
    ]

    // Prepare the OpenAI API request
    const apiUrl = "https://api.openai.com/v1/chat/completions"
    const body = {
      model: "gpt-4o", // You can change to "gpt-4-turbo" or another model if needed
      messages,
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`
        )
      }

      const data = await response.json()
      // The model's JSON output is in data.choices[0].message.content
      if (
        !data ||
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        throw new Error("OpenAI API returned an unexpected response format.")
      }

      // Parse the JSON content from the model's response
      let structured
      try {
        structured = JSON.parse(data.choices[0].message.content)
      } catch (parseErr) {
        throw new Error(
          "Failed to parse JSON from OpenAI response: " +
            (parseErr as Error).message
        )
      }

      return structured
    } catch (err) {
      // Rethrow with explicit error message
      throw new Error("OpenAI NLP extraction failed: " + (err as Error).message)
    }
  }
}

export const openaiNlpService = new OpenAINlpService()
