import supabaseClient, { supabaseUrl } from "@/utils/supabase";
import { HfInference } from "@huggingface/inference";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize Hugging Face client
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_TOKEN);

// Models for document understanding
const LAYOUTLM_MODEL = "impira/layoutlm-document-qa";
const NER_MODEL = "dslim/bert-base-NER";

// ============================================
// LOGGING UTILITY
// ============================================
const logger = {
  info: (message, data = {}) => {
    console.log(`[ResumeAI] ℹ️ ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`[ResumeAI] ⚠️ ${message}`, data);
  },
  error: (message, data = {}) => {
    console.error(`[ResumeAI] ❌ ${message}`, data);
  },
  debug: (message, data = {}) => {
    if (import.meta.env.DEV) {
      console.debug(`[ResumeAI] 🔍 ${message}`, data);
    }
  },
  success: (message, data = {}) => {
    console.log(`[ResumeAI] ✅ ${message}`, data);
  },
};

// ============================================
// CONSTANTS & CONFIGURATIONS
// ============================================

export const WORK_MODES = {
  REMOTE: "remote",
  HYBRID: "hybrid",
  ONSITE: "onsite",
  FLEXIBLE: "flexible",
};

export const EXPERIENCE_LEVELS = {
  FRESHER: "fresher",
  ENTRY: "entry",
  MID: "mid",
  SENIOR: "senior",
  LEAD: "lead",
  EXECUTIVE: "executive",
};

export const EMPLOYMENT_TYPES = {
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  CONTRACT: "contract",
  INTERNSHIP: "internship",
  FREELANCE: "freelance",
};

// Validation error types
export const RESUME_ERRORS = {
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  EMPTY_CONTENT: "EMPTY_CONTENT",
  PARSING_FAILED: "PARSING_FAILED",
  NO_SKILLS: "NO_SKILLS_FOUND",
};

// ============================================
// COMPREHENSIVE SKILLS DATABASE
// ============================================
const SKILLS_DATABASE = {
  // Programming Languages
  programming: [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "c",
    "ruby",
    "go",
    "golang",
    "rust",
    "swift",
    "kotlin",
    "php",
    "scala",
    "perl",
    "r",
    "matlab",
    "dart",
    "lua",
    "objective-c",
    "assembly",
    "haskell",
    "elixir",
    "clojure",
    "f#",
    "groovy",
    "julia",
    "solidity",
    "vba",
    "cobol",
    "fortran",
    "lisp",
    "prolog",
    "erlang",
    "ocaml",
  ],

  // Frontend
  frontend: [
    "react",
    "reactjs",
    "react.js",
    "angular",
    "angularjs",
    "vue",
    "vuejs",
    "vue.js",
    "svelte",
    "next",
    "nextjs",
    "next.js",
    "nuxt",
    "nuxtjs",
    "gatsby",
    "remix",
    "html",
    "html5",
    "css",
    "css3",
    "sass",
    "scss",
    "less",
    "stylus",
    "tailwind",
    "tailwindcss",
    "bootstrap",
    "material-ui",
    "mui",
    "chakra",
    "chakra-ui",
    "styled-components",
    "emotion",
    "jquery",
    "backbone",
    "ember",
    "webpack",
    "vite",
    "rollup",
    "parcel",
    "babel",
    "esbuild",
    "turbopack",
    "storybook",
    "redux",
    "mobx",
    "zustand",
    "recoil",
    "pinia",
    "vuex",
    "ngrx",
    "rxjs",
    "three.js",
    "d3",
    "d3.js",
    "chart.js",
    "highcharts",
    "framer-motion",
    "gsap",
    "webgl",
    "canvas",
  ],

  // Backend
  backend: [
    "node",
    "nodejs",
    "node.js",
    "express",
    "expressjs",
    "nestjs",
    "fastify",
    "koa",
    "hapi",
    "django",
    "flask",
    "fastapi",
    "pyramid",
    "tornado",
    "spring",
    "spring boot",
    "springboot",
    "hibernate",
    "struts",
    "rails",
    "ruby on rails",
    "sinatra",
    "laravel",
    "symfony",
    "codeigniter",
    "yii",
    "cakephp",
    "asp.net",
    ".net",
    "dotnet",
    ".net core",
    "blazor",
    "gin",
    "echo",
    "fiber",
    "actix",
    "rocket",
    "axum",
    "phoenix",
    "ktor",
    "quarkus",
    "micronaut",
    "grpc",
    "rest",
    "restful",
    "graphql",
    "websocket",
    "websockets",
    "socket.io",
    "microservices",
    "serverless",
  ],

  // Databases
  databases: [
    "sql",
    "mysql",
    "postgresql",
    "postgres",
    "mongodb",
    "mongo",
    "redis",
    "memcached",
    "elasticsearch",
    "elastic",
    "cassandra",
    "dynamodb",
    "firebase",
    "firestore",
    "supabase",
    "sqlite",
    "oracle",
    "sql server",
    "mssql",
    "mariadb",
    "couchdb",
    "couchbase",
    "neo4j",
    "arangodb",
    "influxdb",
    "timescaledb",
    "cockroachdb",
    "planetscale",
    "fauna",
    "faunadb",
    "prisma",
    "sequelize",
    "typeorm",
    "mongoose",
    "knex",
    "drizzle",
    "hibernate",
    "mybatis",
    "jpa",
    "jdbc",
    "plsql",
    "t-sql",
    "nosql",
    "graphql",
    "hasura",
  ],

  // Cloud & DevOps
  cloud: [
    "aws",
    "amazon web services",
    "azure",
    "microsoft azure",
    "gcp",
    "google cloud",
    "google cloud platform",
    "heroku",
    "vercel",
    "netlify",
    "digitalocean",
    "linode",
    "vultr",
    "cloudflare",
    "docker",
    "kubernetes",
    "k8s",
    "openshift",
    "rancher",
    "helm",
    "jenkins",
    "ci/cd",
    "cicd",
    "github actions",
    "gitlab ci",
    "gitlab-ci",
    "circleci",
    "travis",
    "travis ci",
    "bamboo",
    "teamcity",
    "azure devops",
    "argo",
    "argocd",
    "spinnaker",
    "terraform",
    "pulumi",
    "cloudformation",
    "cdk",
    "ansible",
    "puppet",
    "chef",
    "saltstack",
    "vagrant",
    "packer",
    "nginx",
    "apache",
    "haproxy",
    "traefik",
    "envoy",
    "istio",
    "consul",
    "vault",
    "linux",
    "unix",
    "ubuntu",
    "centos",
    "rhel",
    "debian",
    "alpine",
    "bash",
    "shell",
    "powershell",
    "zsh",
    "lambda",
    "ec2",
    "s3",
    "ecs",
    "eks",
    "fargate",
    "rds",
    "aurora",
    "redshift",
    "athena",
    "kinesis",
    "sqs",
    "sns",
    "cloudwatch",
    "route53",
    "apigateway",
    "cloudfront",
    "elb",
  ],

  // Mobile
  mobile: [
    "android",
    "ios",
    "react native",
    "react-native",
    "flutter",
    "dart",
    "xamarin",
    "ionic",
    "cordova",
    "phonegap",
    "capacitor",
    "expo",
    "swift",
    "swiftui",
    "uikit",
    "kotlin",
    "jetpack compose",
    "objective-c",
    "cocoapods",
    "gradle",
    "xcode",
    "android studio",
    "mobile development",
    "cross-platform",
    "pwa",
    "progressive web app",
  ],

  // AI & Data Science
  ai_ml: [
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "ai",
    "ml",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "sklearn",
    "pandas",
    "numpy",
    "scipy",
    "matplotlib",
    "seaborn",
    "plotly",
    "jupyter",
    "jupyter notebook",
    "colab",
    "opencv",
    "computer vision",
    "nlp",
    "natural language processing",
    "transformers",
    "hugging face",
    "huggingface",
    "bert",
    "gpt",
    "llm",
    "langchain",
    "rag",
    "vector database",
    "pinecone",
    "weaviate",
    "milvus",
    "qdrant",
    "chroma",
    "embeddings",
    "neural network",
    "cnn",
    "rnn",
    "lstm",
    "gan",
    "reinforcement learning",
    "recommendation system",
    "data mining",
    "data analysis",
    "data analytics",
    "data visualization",
    "tableau",
    "power bi",
    "looker",
    "metabase",
    "superset",
    "spark",
    "apache spark",
    "pyspark",
    "hadoop",
    "hive",
    "kafka",
    "apache kafka",
    "airflow",
    "apache airflow",
    "luigi",
    "dbt",
    "etl",
    "elt",
    "data pipeline",
    "data warehouse",
    "data lake",
    "snowflake",
    "databricks",
    "bigquery",
    "sagemaker",
    "mlflow",
    "kubeflow",
    "mlops",
    "data science",
  ],

  // Security
  security: [
    "cybersecurity",
    "security",
    "infosec",
    "penetration testing",
    "pentest",
    "ethical hacking",
    "vulnerability assessment",
    "siem",
    "soc",
    "incident response",
    "forensics",
    "malware analysis",
    "threat hunting",
    "owasp",
    "burp suite",
    "metasploit",
    "nmap",
    "wireshark",
    "kali linux",
    "cryptography",
    "encryption",
    "ssl",
    "tls",
    "oauth",
    "oauth2",
    "saml",
    "openid",
    "jwt",
    "authentication",
    "authorization",
    "identity management",
    "iam",
    "sso",
    "ldap",
    "active directory",
    "keycloak",
    "auth0",
    "okta",
    "zero trust",
    "devsecops",
    "sast",
    "dast",
    "sonarqube",
    "snyk",
    "trivy",
  ],

  // Testing & QA
  testing: [
    "jest",
    "mocha",
    "chai",
    "jasmine",
    "cypress",
    "playwright",
    "selenium",
    "puppeteer",
    "testing library",
    "react testing library",
    "enzyme",
    "junit",
    "pytest",
    "unittest",
    "rspec",
    "testng",
    "karma",
    "protractor",
    "vitest",
    "tdd",
    "bdd",
    "unit testing",
    "integration testing",
    "e2e testing",
    "qa",
    "quality assurance",
    "manual testing",
    "automation testing",
    "test automation",
    "postman",
    "insomnia",
    "api testing",
    "load testing",
    "performance testing",
    "jmeter",
  ],

  // Tools & Platforms
  tools: [
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "svn",
    "mercurial",
    "jira",
    "confluence",
    "trello",
    "asana",
    "monday",
    "notion",
    "linear",
    "clickup",
    "figma",
    "sketch",
    "adobe xd",
    "invision",
    "zeplin",
    "photoshop",
    "illustrator",
    "after effects",
    "premiere",
    "blender",
    "unity",
    "unreal engine",
    "vscode",
    "visual studio",
    "intellij",
    "eclipse",
    "vim",
    "neovim",
    "emacs",
    "sublime text",
    "postman",
    "insomnia",
    "swagger",
    "openapi",
    "datadog",
    "new relic",
    "splunk",
    "grafana",
    "prometheus",
    "kibana",
    "logstash",
    "elk stack",
    "pagerduty",
    "opsgenie",
    "slack",
    "teams",
    "discord",
    "zoom",
  ],

  // Soft Skills & Methodologies
  soft_skills: [
    "agile",
    "scrum",
    "kanban",
    "waterfall",
    "lean",
    "six sigma",
    "project management",
    "product management",
    "team lead",
    "leadership",
    "technical lead",
    "tech lead",
    "architect",
    "architecture",
    "system design",
    "communication",
    "presentation",
    "public speaking",
    "mentoring",
    "coaching",
    "problem solving",
    "critical thinking",
    "analytical",
    "creative",
    "innovation",
    "collaboration",
    "teamwork",
    "time management",
    "stakeholder management",
    "client facing",
    "customer service",
    "documentation",
    "technical writing",
    "code review",
    "pair programming",
    "clean code",
    "solid",
    "design patterns",
    "event-driven",
    "cqrs",
    "event sourcing",
    "domain driven design",
    "ddd",
  ],

  // Certifications
  certifications: [
    "aws certified",
    "aws solutions architect",
    "aws developer",
    "azure certified",
    "az-900",
    "az-104",
    "az-204",
    "gcp certified",
    "pmp",
    "prince2",
    "itil",
    "cissp",
    "ceh",
    "comptia",
    "security+",
    "network+",
    "a+",
    "ccna",
    "ccnp",
    "cka",
    "ckad",
    "certified kubernetes",
    "scrum master",
    "csm",
    "psm",
    "product owner",
    "cspo",
    "safe",
    "togaf",
    "oracle certified",
    "microsoft certified",
  ],
};

// Flatten all skills for matching
const ALL_SKILLS = Object.values(SKILLS_DATABASE).flat();

// Skill importance weights (for matching algorithm)
const SKILL_WEIGHTS = {
  programming: 1.2,
  frontend: 1.1,
  backend: 1.1,
  databases: 1.0,
  cloud: 1.0,
  mobile: 1.0,
  ai_ml: 1.2,
  security: 1.1,
  testing: 0.9,
  tools: 0.8,
  soft_skills: 0.7,
  certifications: 1.0,
};

// ============================================
// PDF EXTRACTION UTILITIES
// ============================================

/**
 * Convert PDF to image for LayoutLM processing
 */
async function convertPDFToImage(file) {
  logger.info("Converting PDF to image", { fileName: file.name });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.95);
    });

    const imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageBlob);
    });

    logger.debug("PDF converted to image", {
      width: canvas.width,
      height: canvas.height,
    });

    return { imageBlob, imageBase64 };
  } catch (error) {
    logger.error("PDF to image conversion failed", { error: error.message });
    throw error;
  }
}

/**
 * Extract text from PDF using PDF.js
 */
async function extractTextFromPDF(file) {
  logger.info("Extracting text from PDF", { fileName: file.name });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    logger.debug("PDF text extracted", {
      pages: pdf.numPages,
      length: fullText.length,
    });

    return cleanText(fullText);
  } catch (error) {
    logger.error("PDF extraction failed", { error: error.message });
    throw error;
  }
}

/**
 * Convert DOCX to image for LayoutLM processing
 */
async function convertDOCXToImage(file) {
  logger.info("Converting DOCX to image", { fileName: file.name });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlContent = result.value;

    if (!htmlContent || htmlContent.length < 50) {
      throw new Error("Insufficient HTML content from DOCX");
    }

    // Create canvas and render text
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1700;
    canvas.height = 2200;

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Extract plain text from HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.innerText || tempDiv.textContent || "";

    // Draw text
    ctx.fillStyle = "black";
    ctx.font = "24px Arial, sans-serif";

    const lines = plainText.split("\n");
    let y = 100;
    const lineHeight = 36;
    const maxWidth = 1500;
    const leftMargin = 100;

    for (const line of lines) {
      if (y > 2100) break;

      const words = line.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          ctx.fillText(currentLine, leftMargin, y);
          currentLine = word;
          y += lineHeight;
          if (y > 2100) break;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine && y <= 2100) {
        ctx.fillText(currentLine, leftMargin, y);
        y += lineHeight;
      }
    }

    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.95);
    });

    const imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageBlob);
    });

    return { imageBlob, imageBase64, htmlContent };
  } catch (error) {
    logger.error("DOCX to image conversion failed", { error: error.message });
    throw error;
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(file) {
  logger.info("Extracting text from DOCX", { fileName: file.name });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.value && result.value.length >= 50) {
      logger.debug("DOCX text extracted", { length: result.value.length });
      return result.value;
    }

    throw new Error("Insufficient content extracted from DOCX");
  } catch (error) {
    logger.error("DOCX extraction failed", { error: error.message });
    throw error;
  }
}

/**
 * Clean extracted text
 */
function cleanText(text) {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 32 || code === 9 || code === 10 || code === 13) {
        return char;
      }
      return " ";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================
// AI EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract information using LayoutLM Document QA
 */
async function extractWithLayoutLM(imageBase64) {
  logger.info("Extracting with LayoutLM");

  const questions = [
    { field: "name", query: "What is the person's full name?" },
    { field: "email", query: "What is the email address?" },
    { field: "phone", query: "What is the phone number?" },
    { field: "location", query: "What city or location is mentioned?" },
    {
      field: "currentTitle",
      query: "What is the current or most recent job title?",
    },
    {
      field: "currentCompany",
      query: "What is the current or most recent company?",
    },
    { field: "education", query: "What is the highest degree or education?" },
    { field: "skills", query: "What technical skills are listed?" },
    { field: "experience", query: "How many years of experience?" },
  ];

  const results = {};

  for (const q of questions) {
    try {
      const response = await hf.documentQuestionAnswering({
        model: LAYOUTLM_MODEL,
        inputs: {
          image: imageBase64,
          question: q.query,
        },
      });

      if (response && response.answer) {
        results[q.field] = response.answer;
        logger.debug(`LayoutLM: ${q.field} = ${response.answer}`);
      }
    } catch (error) {
      logger.warn(`LayoutLM failed for ${q.field}`, { error: error.message });
    }
  }

  return results;
}

/**
 * Extract entities using NER model
 */
async function extractWithNER(text) {
  logger.info("Extracting entities with NER");

  try {
    const truncatedText = text.slice(0, 5000);

    const response = await hf.tokenClassification({
      model: NER_MODEL,
      inputs: truncatedText,
    });

    const entities = {
      persons: [],
      organizations: [],
      locations: [],
    };

    if (response && Array.isArray(response)) {
      for (const entity of response) {
        const word = entity.word?.replace(/^##/, "") || "";
        const type = entity.entity_group || entity.entity || "";

        if (type.includes("PER") && word.length > 1) {
          entities.persons.push(word);
        } else if (type.includes("ORG") && word.length > 1) {
          entities.organizations.push(word);
        } else if (type.includes("LOC") && word.length > 1) {
          entities.locations.push(word);
        }
      }
    }

    logger.debug("NER extraction complete", entities);
    return entities;
  } catch (error) {
    logger.warn("NER extraction failed", { error: error.message });
    return { persons: [], organizations: [], locations: [] };
  }
}

// ============================================
// LOCAL EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract name from text
 */
function extractName(text) {
  const lines = text.split(/\n+/).filter((l) => l.trim());

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();

    // Skip common headers
    if (
      /^(resume|cv|curriculum|profile|summary|objective|experience|education|skills)/i.test(
        line,
      )
    ) {
      continue;
    }

    // Skip if contains email, phone, or URL
    if (
      /@/.test(line) ||
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) ||
      /https?:\/\//.test(line)
    ) {
      continue;
    }

    // Skip if too short or too long
    if (line.length < 3 || line.length > 50) continue;

    // Check if looks like a name (2-4 words, mostly letters)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const isNameLike = words.every((word) => {
        const cleaned = word.replace(/[^\w]/g, "");
        return /^[A-Za-z]{2,}$/.test(cleaned);
      });

      if (isNameLike) {
        return line;
      }
    }
  }

  return "";
}

/**
 * Extract email from text
 */
function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : "";
}

/**
 * Extract phone from text
 */
function extractPhone(text) {
  const patterns = [
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
    /(?:\+?91[-.\s]?)?[6-9][0-9]{9}/,
    /(?:\+?[0-9]{1,3}[-.\s]?)?[0-9]{10,14}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return "";
}

/**
 * Extract location from text
 */
function extractLocation(text) {
  const patterns = [
    /(?:location|address|city|based\s+in|residing\s+in)\s*:?\s*([A-Za-z\s,]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(?:\d{5})?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.trim() || "";
    }
  }

  return "";
}

/**
 * Extract skills from text
 */
function extractSkills(text) {
  if (!text) return [];

  const lowerText = " " + text.toLowerCase() + " ";
  const foundSkills = new Set();

  for (const skill of ALL_SKILLS) {
    const skillLower = skill.toLowerCase();

    // Create patterns for matching
    const patterns = [
      new RegExp(`\\b${escapeRegex(skillLower)}\\b`, "i"),
      new RegExp(`[^a-z]${escapeRegex(skillLower)}[^a-z]`, "i"),
    ];

    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        foundSkills.add(capitalizeSkill(skill));
        break;
      }
    }
  }

  // Also extract from skills sections
  const skillsSectionPattern =
    /(?:skills|technologies|expertise|proficient)\s*:?\s*([^\n]+(?:\n(?![A-Z][a-z]+:)[^\n]+)*)/gi;
  let match;

  while ((match = skillsSectionPattern.exec(text)) !== null) {
    const items = match[1].split(/[,;|•·\-\n]+/);
    for (const item of items) {
      const cleaned = item.trim().toLowerCase();
      if (cleaned.length >= 2 && cleaned.length <= 50) {
        for (const skill of ALL_SKILLS) {
          if (cleaned.includes(skill.toLowerCase())) {
            foundSkills.add(capitalizeSkill(skill));
          }
        }
      }
    }
  }

  return Array.from(foundSkills);
}

/**
 * Extract experience from text
 */
function extractExperience(text) {
  const experiences = [];

  // Check for experience section
  const hasExperienceSection =
    /\b(experience|employment|work\s*history)\b/i.test(text);

  if (!hasExperienceSection) {
    return [];
  }

  // Extract job titles
  const titlePatterns = [
    /(?:^|\n)\s*((?:senior|junior|lead|principal|staff|associate)?\s*(?:software|web|frontend|backend|full[- ]?stack|mobile|devops|data|ml|ai)?\s*(?:engineer|developer|architect|scientist|analyst|manager|consultant|designer))/gi,
    /(?:^|\n)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:at|@|-|–)\s+([A-Z][a-zA-Z0-9\s&]+)/g,
  ];

  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const title = match[1]?.trim();
      const company = match[2]?.trim() || "";

      if (title && title.length >= 3) {
        experiences.push({
          title: capitalizeSkill(title),
          company: company || "Company",
          duration: "",
        });
      }

      if (experiences.length >= 10) break;
    }
    if (experiences.length >= 10) break;
  }

  return experiences;
}

/**
 * Extract education from text
 */
function extractEducation(text) {
  const education = [];

  const degreePatterns = [
    /\b(bachelor'?s?|master'?s?|ph\.?d\.?|mba|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?)\b/gi,
  ];

  for (const pattern of degreePatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches.slice(0, 3)) {
      education.push({
        degree: match.toUpperCase(),
        institution: "",
        field: "",
      });
    }
  }

  return education;
}

/**
 * Estimate years of experience
 */
function estimateYearsOfExperience(text, experiences) {
  // Check for explicit mention
  const yearsMatch = text.match(
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
  );
  if (yearsMatch) {
    return parseInt(yearsMatch[1], 10);
  }

  // Estimate from number of positions
  if (experiences.length >= 4) return 8;
  if (experiences.length >= 3) return 5;
  if (experiences.length >= 2) return 3;
  if (experiences.length >= 1) return 1;

  return 0;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalizeSkill(skill) {
  const acronyms = [
    "aws",
    "gcp",
    "sql",
    "css",
    "html",
    "api",
    "rest",
    "grpc",
    "jwt",
    "http",
    "tcp",
    "udp",
    "dns",
    "ssl",
    "tls",
    "ssh",
    "json",
    "xml",
    "yaml",
    "ai",
    "ml",
    "nlp",
    "llm",
    "cnn",
    "rnn",
    "etl",
    "ui",
    "ux",
    "seo",
    "sso",
    "iam",
    "cdn",
    "cms",
    "crm",
    "erp",
    "saas",
    "paas",
    "iaas",
  ];

  const mixedCase = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    nodejs: "Node.js",
    "node.js": "Node.js",
    reactjs: "React.js",
    "react.js": "React.js",
    vuejs: "Vue.js",
    "vue.js": "Vue.js",
    angularjs: "AngularJS",
    nextjs: "Next.js",
    "next.js": "Next.js",
    nuxtjs: "Nuxt.js",
    nestjs: "NestJS",
    graphql: "GraphQL",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    mysql: "MySQL",
    firebase: "Firebase",
    supabase: "Supabase",
    tailwindcss: "TailwindCSS",
    github: "GitHub",
    gitlab: "GitLab",
    bitbucket: "Bitbucket",
    docker: "Docker",
    kubernetes: "Kubernetes",
    tensorflow: "TensorFlow",
    pytorch: "PyTorch",
    opencv: "OpenCV",
    devops: "DevOps",
    ios: "iOS",
    macos: "macOS",
    vscode: "VS Code",
    intellij: "IntelliJ",
    elasticsearch: "Elasticsearch",
    dynamodb: "DynamoDB",
    openai: "OpenAI",
    langchain: "LangChain",
    "power bi": "Power BI",
    powerbi: "Power BI",
  };

  const lower = skill.toLowerCase();

  if (mixedCase[lower]) {
    return mixedCase[lower];
  }

  if (acronyms.includes(lower)) {
    return skill.toUpperCase();
  }

  return skill
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ============================================
// MAIN PARSING FUNCTION
// ============================================

/**
 * Parse resume with AI models
 */
async function parseResume(file) {
  logger.info("Starting resume parsing", {
    fileName: file.name,
    size: file.size,
  });

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const isPDF = fileType === "application/pdf" || fileName.endsWith(".pdf");
  const isDOCX =
    fileType.includes("wordprocessingml") || fileName.endsWith(".docx");

  let resumeText = "";
  let layoutlmResults = {};
  let nerEntities = { persons: [], organizations: [], locations: [] };

  // Step 1: Extract text
  try {
    if (isPDF) {
      resumeText = await extractTextFromPDF(file);
    } else if (isDOCX) {
      resumeText = await extractTextFromDOCX(file);
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      resumeText = await file.text();
    } else {
      throw new Error("Unsupported file type");
    }
  } catch (error) {
    logger.error("Text extraction failed", { error: error.message });
    throw new Error(`Failed to extract text: ${error.message}`);
  }

  if (resumeText.length < 50) {
    throw new Error("Could not extract sufficient text from the document");
  }

  // Step 2: Try LayoutLM for visual extraction (PDF/DOCX only)
  if (import.meta.env.VITE_HUGGINGFACE_API_TOKEN && (isPDF || isDOCX)) {
    try {
      let imageBase64;

      if (isPDF) {
        const pdfImage = await convertPDFToImage(file);
        imageBase64 = pdfImage.imageBase64;
      } else if (isDOCX) {
        const docxImage = await convertDOCXToImage(file);
        imageBase64 = docxImage.imageBase64;
      }

      if (imageBase64) {
        layoutlmResults = await extractWithLayoutLM(imageBase64);
      }
    } catch (error) {
      logger.warn("LayoutLM extraction failed", { error: error.message });
    }
  }

  // Step 3: Try NER for entity extraction
  if (import.meta.env.VITE_HUGGINGFACE_API_TOKEN) {
    try {
      nerEntities = await extractWithNER(resumeText);
    } catch (error) {
      logger.warn("NER extraction failed", { error: error.message });
    }
  }

  // Step 4: Local extraction
  const localName = extractName(resumeText);
  const localEmail = extractEmail(resumeText);
  const localPhone = extractPhone(resumeText);
  const localLocation = extractLocation(resumeText);
  const localSkills = extractSkills(resumeText);
  const localExperience = extractExperience(resumeText);
  const localEducation = extractEducation(resumeText);

  // Step 5: Merge results (AI results take precedence for structured fields)
  const name =
    layoutlmResults.name ||
    (nerEntities.persons.length > 0
      ? nerEntities.persons.slice(0, 2).join(" ")
      : "") ||
    localName;

  const email = layoutlmResults.email || localEmail;
  const phone = layoutlmResults.phone || localPhone;

  const location =
    layoutlmResults.location ||
    (nerEntities.locations.length > 0 ? nerEntities.locations[0] : "") ||
    localLocation;

  // Parse LayoutLM skills and merge with local
  let layoutlmSkills = [];
  if (layoutlmResults.skills) {
    layoutlmSkills = layoutlmResults.skills
      .split(/[,;|•·-]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 50)
      .map(capitalizeSkill);
  }

  const skills = [...new Set([...localSkills, ...layoutlmSkills])];

  // Build experience array
  let experience = localExperience;
  if (layoutlmResults.currentTitle || layoutlmResults.currentCompany) {
    const existingTitles = experience.map((e) => e.title?.toLowerCase());
    const newTitle = layoutlmResults.currentTitle?.toLowerCase();

    if (newTitle && !existingTitles.includes(newTitle)) {
      experience.unshift({
        title: layoutlmResults.currentTitle,
        company: layoutlmResults.currentCompany || "Company",
        duration: layoutlmResults.experience || "",
      });
    }
  }

  // Build education array
  let education = localEducation;
  if (layoutlmResults.education && education.length === 0) {
    education.push({
      degree: layoutlmResults.education,
      institution: "",
      field: "",
    });
  }

  const yearsOfExperience = estimateYearsOfExperience(resumeText, experience);

  const result = {
    name,
    email,
    phone,
    location,
    skills,
    experience,
    education,
    yearsOfExperience,
    extractionMethod: layoutlmResults.name
      ? "layoutlm"
      : nerEntities.persons.length > 0
        ? "ner"
        : "local",
  };

  logger.success("Resume parsing complete", {
    name: result.name,
    skillCount: result.skills.length,
    experienceCount: result.experience.length,
    method: result.extractionMethod,
  });

  return result;
}

// ============================================
// JOB MATCHING ALGORITHM
// ============================================

/**
 * Calculate match score between user profile and job
 */
function calculateMatchScore(job, userProfile) {
  const {
    skills: userSkills = [],
    yearsOfExperience = 0,
    location: userLocation = "",
    preferences = {},
  } = userProfile;

  let score = 0;
  const reasons = [];
  const matchingSkills = [];

  const userSkillsLower = userSkills.map((s) => s.toLowerCase());

  // Extract job skills
  const jobSkillsRaw = [];
  if (Array.isArray(job.skills_required)) {
    jobSkillsRaw.push(...job.skills_required);
  }
  if (job.requirements) {
    jobSkillsRaw.push(...extractSkills(job.requirements));
  }
  if (job.description) {
    jobSkillsRaw.push(...extractSkills(job.description));
  }

  const jobSkillsLower = [...new Set(jobSkillsRaw.map((s) => s.toLowerCase()))];

  // ============ SKILL MATCHING (50 points max) ============
  for (const userSkill of userSkillsLower) {
    for (const jobSkill of jobSkillsLower) {
      const isMatch =
        userSkill === jobSkill ||
        userSkill.includes(jobSkill) ||
        jobSkill.includes(userSkill);

      if (
        isMatch &&
        !matchingSkills.map((s) => s.toLowerCase()).includes(userSkill)
      ) {
        matchingSkills.push(capitalizeSkill(userSkill));
      }
    }
  }

  if (matchingSkills.length > 0) {
    // More matching skills = higher score, with diminishing returns
    const skillScore = Math.min(matchingSkills.length * 6, 50);
    score += skillScore;
    reasons.push(`${matchingSkills.length} matching skills`);
  }

  // ============ WORK MODE MATCHING (20 points) ============
  const preferredWorkMode = preferences.workMode?.toLowerCase();
  const jobWorkMode = job.work_mode?.toLowerCase() || "";

  if (preferredWorkMode) {
    if (jobWorkMode === preferredWorkMode) {
      score += 20;
      reasons.push(`${capitalizeSkill(preferredWorkMode)} position`);
    } else if (preferredWorkMode === "remote" && jobWorkMode === "hybrid") {
      score += 10;
      reasons.push("Hybrid (partial remote)");
    } else if (preferredWorkMode === "hybrid" && jobWorkMode === "remote") {
      score += 15;
      reasons.push("Remote friendly");
    }
  } else {
    // No preference set, give partial credit
    score += 5;
  }

  // ============ LOCATION MATCHING (10 points) ============
  if (userLocation && job.location) {
    const jobLocationLower = job.location.toLowerCase();
    const userLocationLower = userLocation.toLowerCase();

    if (
      jobLocationLower.includes(userLocationLower) ||
      userLocationLower.includes(jobLocationLower.split(",")[0])
    ) {
      score += 10;
      reasons.push("Location match");
    } else if (jobWorkMode === "remote") {
      score += 8;
      reasons.push("Remote - location flexible");
    }
  }

  // ============ EXPERIENCE LEVEL MATCHING (15 points) ============
  const jobLevel = (job.experience_level || "").toLowerCase();
  const isFresher = yearsOfExperience === 0;

  if (isFresher) {
    if (
      [
        "entry",
        "junior",
        "fresher",
        "graduate",
        "intern",
        "trainee",
        "",
      ].includes(jobLevel)
    ) {
      score += 15;
      reasons.push("Fresher-friendly");
    } else if (jobLevel === "mid") {
      score += 5;
    }
  } else if (yearsOfExperience <= 2 && ["entry", "junior"].includes(jobLevel)) {
    score += 15;
    reasons.push("Entry-level match");
  } else if (
    yearsOfExperience >= 2 &&
    yearsOfExperience <= 5 &&
    ["mid", "intermediate"].includes(jobLevel)
  ) {
    score += 15;
    reasons.push("Mid-level match");
  } else if (
    yearsOfExperience >= 5 &&
    ["senior", "lead", "principal"].includes(jobLevel)
  ) {
    score += 15;
    reasons.push("Senior-level match");
  } else if (!jobLevel) {
    score += 8;
  }

  // ============ EMPLOYMENT TYPE MATCHING (5 points) ============
  const preferredEmploymentType = preferences.employmentType?.toLowerCase();
  const jobEmploymentType = job.employment_type?.toLowerCase() || "";

  if (preferredEmploymentType && jobEmploymentType) {
    if (
      jobEmploymentType.includes(preferredEmploymentType) ||
      preferredEmploymentType.includes(jobEmploymentType)
    ) {
      score += 5;
      reasons.push(`${capitalizeSkill(jobEmploymentType.replace("_", " "))}`);
    }
  } else {
    score += 2;
  }

  // ============ RECENCY BONUS (5 points) ============
  const daysSincePosted = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSincePosted <= 3) {
    score += 5;
    reasons.push("Posted recently");
  } else if (daysSincePosted <= 7) {
    score += 3;
    reasons.push("Posted this week");
  } else if (daysSincePosted <= 14) {
    score += 1;
  }

  return {
    score: Math.min(Math.round(score), 100),
    reasons,
    matchingSkills,
  };
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Upload and process resume
 */
export async function uploadAndProcessResume(
  token,
  _,
  { user_id, file, profileData },
) {
  logger.info("Processing resume upload", {
    userId: user_id,
    fileName: file.name,
  });

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: {
        code: RESUME_ERRORS.FILE_TOO_LARGE,
        message: "File size exceeds 5MB limit",
      },
    };
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  const allowedExtensions = [".pdf", ".docx", ".txt", ".md"];
  const fileExtension = "." + file.name.split(".").pop().toLowerCase();

  if (
    !allowedTypes.includes(file.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    return {
      success: false,
      error: {
        code: RESUME_ERRORS.UNSUPPORTED_TYPE,
        message: "Please upload PDF, DOCX, or TXT files",
      },
    };
  }

  try {
    // Parse resume
    const parsedResume = await parseResume(file);

    if (!parsedResume.skills || parsedResume.skills.length === 0) {
      return {
        success: false,
        error: {
          code: RESUME_ERRORS.NO_SKILLS,
          message:
            "Could not detect skills in your resume. Please ensure your resume includes a skills section.",
        },
        parsedResume,
      };
    }

    // Upload file to storage
    const supabase = await supabaseClient(token);
    const random = Math.floor(Math.random() * 90000);
    const fileName = `resume-${random}-${user_id}-${file.name}`;

    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file, { upsert: true });

    if (storageError) {
      logger.error("Storage upload failed", { error: storageError.message });
      throw new Error("Failed to upload resume file");
    }

    const resumeUrl = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

    // Update profile with parsed data
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ai_resume_data: parsedResume,
        ai_resume_parsed_at: new Date().toISOString(),
        ai_resume_url: resumeUrl,
        skills: [
          ...new Set([...(profileData?.skills || []), ...parsedResume.skills]),
        ],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) {
      logger.error("Profile update failed", { error: updateError.message });
      throw new Error("Failed to save resume data");
    }

    logger.success("Resume processed successfully", {
      skillCount: parsedResume.skills.length,
    });

    return {
      success: true,
      parsedResume,
      resumeUrl,
    };
  } catch (error) {
    logger.error("Resume processing failed", { error: error.message });
    return {
      success: false,
      error: {
        code: RESUME_ERRORS.PARSING_FAILED,
        message: error.message || "Failed to process resume",
      },
    };
  }
}

/**
 * Get AI job recommendations
 */
export async function getAIJobRecommendations(
  token,
  { user_id, filters = {}, limit = 20 },
) {
  logger.info("Fetching AI job recommendations", {
    userId: user_id,
    filters,
    limit,
  });

  const supabase = await supabaseClient(token);

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (profileError) {
    logger.error("Failed to fetch profile", { error: profileError.message });
    throw new Error("Failed to fetch profile");
  }

  // Check if user has skills
  const userSkills = profile?.skills || profile?.ai_resume_data?.skills || [];

  if (userSkills.length === 0) {
    return {
      recommendations: [],
      message:
        "Upload your resume or add skills to get personalized job recommendations",
      needsSetup: true,
    };
  }

  // Build job query
  let query = supabase
    .from("jobs")
    .select(
      `
      *,
      company:companies(id, name, logo_url)
    `,
    )
    .eq("isopen", true)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.workMode && filters.workMode !== "all") {
    query = query.eq("work_mode", filters.workMode);
  }

  if (filters.employmentType && filters.employmentType !== "all") {
    query = query.eq("employment_type", filters.employmentType);
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data: jobs, error: jobsError } = await query.limit(100);

  if (jobsError) {
    logger.error("Failed to fetch jobs", { error: jobsError.message });
    throw new Error("Failed to fetch jobs");
  }

  // Get user's applied jobs
  const { data: applications } = await supabase
    .from("applications")
    .select("job_id")
    .eq("candidate_id", user_id);

  const appliedJobIds = new Set((applications || []).map((a) => a.job_id));

  // Build user profile for matching
  const resumeData = profile.ai_resume_data || {};
  const userProfile = {
    skills: userSkills,
    yearsOfExperience: resumeData.yearsOfExperience || 0,
    location: profile.location || resumeData.location || "",
    preferences: {
      workMode: filters.workMode || profile.preferred_work_mode || "",
      employmentType:
        filters.employmentType || profile.preferred_employment_type || "",
    },
  };

  // Calculate match scores
  const scoredJobs = (jobs || [])
    .filter((job) => !appliedJobIds.has(job.id))
    .map((job) => {
      const matchResult = calculateMatchScore(job, userProfile);
      return {
        job,
        score: matchResult.score,
        reasons: matchResult.reasons,
        matchingSkills: matchResult.matchingSkills,
      };
    })
    .filter((item) => item.score >= 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  logger.success("Recommendations generated", {
    totalJobs: jobs?.length || 0,
    matchedJobs: scoredJobs.length,
  });

  return {
    recommendations: scoredJobs,
    totalMatches: scoredJobs.length,
    userSkillCount: userSkills.length,
    needsSetup: false,
  };
}

/**
 * Get parsed resume data
 */
export async function getParsedResumeData(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "ai_resume_data, ai_resume_parsed_at, ai_resume_url, skills, preferred_work_mode, preferred_employment_type, location",
    )
    .eq("user_id", user_id)
    .single();

  if (error) {
    throw new Error("Failed to fetch resume data");
  }

  return {
    hasResume: !!data?.ai_resume_data,
    parsedData: data?.ai_resume_data || null,
    parsedAt: data?.ai_resume_parsed_at || null,
    resumeUrl: data?.ai_resume_url || null,
    skills: data?.skills || [],
    preferences: {
      workMode: data?.preferred_work_mode || "",
      employmentType: data?.preferred_employment_type || "",
      location: data?.location || "",
    },
  };
}

/**
 * Update user skills
 */
export async function updateUserSkills(token, { user_id }, skills) {
  logger.info("Updating user skills", {
    userId: user_id,
    count: skills.length,
  });

  const supabase = await supabaseClient(token);

  const { error } = await supabase
    .from("profiles")
    .update({
      skills: skills.map(capitalizeSkill),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (error) {
    throw new Error("Failed to update skills");
  }

  return { success: true, skills };
}

/**
 * Add skills to profile
 */
export async function addManualSkills(token, { user_id }, newSkills) {
  logger.info("Adding manual skills", {
    userId: user_id,
    count: newSkills.length,
  });

  const supabase = await supabaseClient(token);

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("skills")
    .eq("user_id", user_id)
    .single();

  if (fetchError) {
    throw new Error("Failed to fetch profile");
  }

  const existingSkills = profile?.skills || [];
  const allSkills = [
    ...new Set([...existingSkills, ...newSkills.map(capitalizeSkill)]),
  ];

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      skills: allSkills,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (updateError) {
    throw new Error("Failed to add skills");
  }

  return { success: true, skills: allSkills };
}

/**
 * Update job preferences
 */
export async function updateJobPreferences(token, { user_id }, preferences) {
  logger.info("Updating job preferences", { userId: user_id, preferences });

  const supabase = await supabaseClient(token);

  const updates = {};
  if (preferences.workMode !== undefined) {
    updates.preferred_work_mode = preferences.workMode;
  }
  if (preferences.employmentType !== undefined) {
    updates.preferred_employment_type = preferences.employmentType;
  }
  if (preferences.location !== undefined) {
    updates.location = preferences.location;
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user_id);

  if (error) {
    throw new Error("Failed to update preferences");
  }

  return { success: true, preferences };
}

/**
 * Clear resume data
 */
export async function clearResumeData(token, { user_id }) {
  logger.info("Clearing resume data", { userId: user_id });

  const supabase = await supabaseClient(token);

  const { error } = await supabase
    .from("profiles")
    .update({
      ai_resume_data: null,
      ai_resume_parsed_at: null,
      ai_resume_url: null,
      skills: [],
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (error) {
    throw new Error("Failed to clear resume data");
  }

  return { success: true };
}

/**
 * Remove a specific skill
 */
export async function removeSkill(token, { user_id }, skillToRemove) {
  const supabase = await supabaseClient(token);

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("skills")
    .eq("user_id", user_id)
    .single();

  if (fetchError) {
    throw new Error("Failed to fetch profile");
  }

  const updatedSkills = (profile?.skills || []).filter(
    (skill) => skill.toLowerCase() !== skillToRemove.toLowerCase(),
  );

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      skills: updatedSkills,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user_id);

  if (updateError) {
    throw new Error("Failed to remove skill");
  }

  return { success: true, skills: updatedSkills };
}
