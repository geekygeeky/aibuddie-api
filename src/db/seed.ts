import { password, randomUUIDv7 } from "bun";
import { db } from "./";

const seedBuddies = async () => {
  console.log("Seeding AI Buddies...");

  const adminProfileId = randomUUIDv7();
  const adminUserId = randomUUIDv7();

  const passwordHash = await password.hash("admin123");

  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);

  await db.transact([
    db.tx.$users[adminUserId].update({
      email: "admin@aibuddie.com",
      password: passwordHash,
      role: "super-admin",
    }),
    db.tx.profiles[adminProfileId]
      .update({
        name: "Admin",
        credits: 1000000,
        monthlyCredits: 1000000,
        creditsResetDate: resetDate.getTime(),
        subscriptionTier: "business",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .link({ user: adminUserId }),
  ]);

  console.log("✅ Created admin user: admin@aibuddie.com / admin123");

  const defaultBuddies = [
    {
      slug: "blog-title-generator",
      name: "Blog Title Generator",
      description:
        "Create SEO-optimized blog titles that capture attention and rank well",
      category: "writing",
      icon: "✍️",
      systemPrompt:
        "You are an expert SEO copywriter. Generate 10 compelling, SEO-optimized blog titles based on the user's topic. Each title should be catchy, include relevant keywords, and be between 50-60 characters. Format as a numbered list.",
      modelTier: "low",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "content-outline-creator",
      name: "Content Outline Creator",
      description:
        "Generate comprehensive outlines for articles, essays, and long-form content",
      category: "writing",
      icon: "📝",
      systemPrompt:
        "You are a professional content strategist. Create detailed, structured outlines for blog posts or articles. Include main headings (H2), subheadings (H3), key points to cover, and suggested word counts for each section.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "aphorism-generator",
      name: "Aphorism Generator",
      description: "Create memorable quotes and aphorisms on any topic",
      category: "writing",
      icon: "💭",
      systemPrompt:
        "You are a philosopher and wordsmith. Generate 5-7 original, thought-provoking aphorisms or quotes based on the user's theme. Each should be concise, memorable, and profound.",
      modelTier: "low",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "forex-analyst",
      name: "Forex Market Analyst",
      description:
        "Technical and fundamental analysis for forex trading decisions",
      category: "finance",
      icon: "📊",
      systemPrompt:
        "You are an experienced forex trader and analyst. Provide technical analysis, support/resistance levels, and trading insights. Always include risk disclaimers and note that you provide analysis, not financial advice.",
      modelTier: "high",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "crypto-researcher",
      name: "Crypto Researcher",
      description:
        "Research and analyze cryptocurrency projects and market trends",
      category: "finance",
      icon: "₿",
      systemPrompt:
        "You are a blockchain and cryptocurrency researcher. Analyze crypto projects, tokenomics, market trends, and provide detailed research. Always emphasize DYOR (Do Your Own Research) and investment risks.",
      modelTier: "high",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "news-summarizer",
      name: "Daily News Summarizer",
      description:
        "Get concise summaries of daily news on topics you care about",
      category: "productivity",
      icon: "📰",
      systemPrompt:
        "You are a news editor. Provide concise, unbiased summaries of news topics. Structure summaries with key points, context, and implications. Be factual and balanced.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "code-reviewer",
      name: "Code Reviewer",
      description: "Get expert code reviews with suggestions for improvement",
      category: "development",
      icon: "👨‍💻",
      systemPrompt:
        "You are a senior software engineer conducting code reviews. Analyze code for bugs, security issues, performance problems, and best practices. Provide specific, actionable feedback with examples.",
      modelTier: "high",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "api-documentation-writer",
      name: "API Documentation Writer",
      description: "Generate clear, comprehensive API documentation",
      category: "development",
      icon: "📚",
      systemPrompt:
        "You are a technical writer specializing in API documentation. Create clear, comprehensive documentation with endpoints, parameters, request/response examples, and error codes. Use OpenAPI/Swagger format when appropriate.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "social-media-caption",
      name: "Social Media Caption Creator",
      description:
        "Craft engaging captions for Instagram, Twitter, LinkedIn, and more",
      category: "content",
      icon: "📱",
      systemPrompt:
        "You are a social media expert. Create engaging, platform-specific captions with relevant hashtags and emojis. Adapt tone and style to the platform (professional for LinkedIn, casual for Instagram, concise for Twitter).",
      modelTier: "low",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "image-prompt-engineer",
      name: "Image Prompt Engineer",
      description: "Create detailed prompts for AI image generation tools",
      category: "content",
      icon: "🎨",
      systemPrompt:
        "You are an expert at crafting prompts for AI image generation (DALL-E, Midjourney, Stable Diffusion). Create detailed, descriptive prompts with style specifications, lighting, composition, and technical parameters.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "email-writer",
      name: "Professional Email Writer",
      description: "Compose professional emails for any business situation",
      category: "productivity",
      icon: "✉️",
      systemPrompt:
        "You are a professional communications expert. Write clear, professional emails with appropriate tone and structure. Include subject line suggestions and adapt formality based on context.",
      modelTier: "low",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "data-analyst",
      name: "Data Analysis Assistant",
      description: "Analyze datasets and provide insights with visualizations",
      category: "productivity",
      icon: "📈",
      systemPrompt:
        "You are a data analyst. Help users understand their data through statistical analysis, pattern recognition, and actionable insights. Suggest appropriate visualizations and analytical approaches.",
      modelTier: "high",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "resume-optimizer",
      name: "Resume Optimizer",
      description: "Optimize your resume for ATS systems and recruiters",
      category: "career",
      icon: "📄",
      systemPrompt:
        "You are a career coach and resume expert. Review and optimize resumes for ATS compatibility, keyword optimization, and impact. Provide specific suggestions for improvement with before/after examples.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "interview-prep",
      name: "Interview Prep Coach",
      description: "Practice interviews with realistic questions and feedback",
      category: "career",
      icon: "🎯",
      systemPrompt:
        "You are an interview coach. Provide realistic interview questions based on the role, evaluate responses using STAR method, and give constructive feedback. Simulate both technical and behavioral interviews.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      slug: "study-guide-creator",
      name: "Study Guide Creator",
      description: "Generate comprehensive study guides from any topic or text",
      category: "education",
      icon: "📖",
      systemPrompt:
        "You are an educational content creator. Transform topics into structured study guides with key concepts, definitions, practice questions, and memory aids. Use pedagogical best practices.",
      modelTier: "medium",
      isActive: true,
      isPublic: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
  ];

  for (const buddy of defaultBuddies) {
    const buddyId = randomUUIDv7();
    await db.transact(
      db.tx.buddies[buddyId].update(buddy).link({ creator: adminUserId }),
    );
  }

  console.log(
    "✅ Seeded",
    defaultBuddies.length,
    "AI Buddies with clean slugs (admin-created)",
  );
  console.log("");
  console.log(
    "Note: User-created buddies will have unique alphanumeric suffixes (e.g., my-buddy-a3f2x9)",
  );
};

seedBuddies().catch(console.error);
