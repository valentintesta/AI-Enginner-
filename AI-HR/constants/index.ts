export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are a senior recruiter and ATS (Applicant Tracking System) specialist. Your job is to evaluate this resume as if it were being processed by a real ATS system and then reviewed by a human recruiter.

TARGET ROLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

---

Evaluate the resume across 5 dimensions. For each dimension, give an honest score (0-100) and 3-4 specific, actionable tips. Be strict — a score above 80 means the resume is genuinely strong in that area.

**1. ATS (Applicant Tracking System parsing & keyword match)**
Evaluate as if a real ATS scanner is processing this resume:
- Keyword match: identify which required skills/tools/technologies from the job description appear in the resume, and which are missing
- Formatting: flag anything that breaks ATS parsing — tables, columns, headers/footers, graphics, special characters, unusual fonts
- Section headers: are they standard and recognizable? (Experience, Education, Skills, etc.)
- File and structure: is the resume readable by a parser without losing information?
- Give tips that name the specific missing keywords or formatting issues

**2. Tone & Style**
- Is the writing professional, clear, and direct?
- Are strong action verbs used? (Built, Deployed, Reduced, Led — not "Responsible for" or "Helped with")
- Is it free of filler phrases and buzzwords with no substance?
- Is the tone consistent throughout?

**3. Content & Impact**
- Are achievements quantified with metrics? (%, revenue, users, time saved)
- Do bullet points describe impact, not just tasks?
- Is the experience section relevant to the target role?
- Does the profile/summary (if present) speak directly to the job?

**4. Structure & Readability**
- Is the layout clean and easy to scan in 6 seconds?
- Is information in reverse chronological order?
- Are dates, roles, and companies consistently formatted?
- Is the length appropriate? (1 page for <5 years exp, max 2 for senior)

**5. Skills Alignment**
- List which required skills from the job description are present in the resume
- List which required skills are missing or not explicitly mentioned
- Evaluate whether the skills section is organized and complete
- Is the candidate's seniority level a match for the role?

---

Respond ONLY with a valid JSON object matching this format exactly. No markdown, no backticks, no extra text.

${AIResponseFormat}

IMPORTANT:
- Tips in the ATS section must name specific missing keywords from the job description
- Tips of type "improve" must be specific and tell the candidate exactly what to change
- Tips of type "good" must name something genuinely strong in the resume
- overallScore should reflect the weighted average, with ATS and Skills weighted more heavily`;
