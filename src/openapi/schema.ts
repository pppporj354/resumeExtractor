export const ResumeParseResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        personal_info: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: {
              type: "object",
              properties: {
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
                postal_code: { type: "string" },
              },
            },
            linkedin: { type: "string" },
            github: { type: "string" },
            portfolio: { type: "string" },
            other_links: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        professional_summary: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            total_years_experience: { type: "number" },
            current_role: { type: "string" },
            current_company: { type: "string" },
          },
        },
        skills: {
          type: "object",
          properties: {
            technical_skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        proficiency_level: { type: "string" },
                        years_experience: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
            soft_skills: {
              type: "array",
              items: { type: "string" },
            },
            certifications: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
        work_experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              position: { type: "string" },
              start_date: { type: "string" },
              end_date: { type: "string" },
              duration_years: { type: "number" },
              location: { type: "string" },
              description: { type: "string" },
              key_achievements: {
                type: "array",
                items: { type: "string" },
              },
              technologies_used: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              institution: { type: "string" },
              degree: { type: "string" },
              field_of_study: { type: "string" },
              start_date: { type: "string" },
              end_date: { type: "string" },
              gpa: { type: "string" },
              honors: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              technologies: {
                type: "array",
                items: { type: "string" },
              },
              url: { type: "string" },
              start_date: { type: "string" },
              end_date: { type: "string" },
            },
          },
        },
        languages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              language: { type: "string" },
              proficiency: { type: "string" },
            },
          },
        },
      },
    },
    metadata: {
      type: "object",
    },
    error: {
      type: "object",
    },
  },
}

export const ResumeParseErrorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", enum: [false] },
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: { type: "string" },
        suggestions: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["code", "message"],
    },
    metadata: { type: "object" },
  },
  required: ["success", "error"],
}
