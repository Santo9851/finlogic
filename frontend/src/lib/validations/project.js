import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
];
const ACCEPTED_EXCEL_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const projectSubmissionSchema = z.object({
  // Step 1: Vision
  problem_solving: z.string().min(10, "Please describe the problem clearly (min 10 characters)."),
  target_market: z.string().min(10, "Please describe your target market."),
  competitors: z.string().min(10, "Please describe your competitors."),

  // Step 2: Growth
  business_model: z.string().min(10, "Please explain your business model."),
  scale_plan: z.string().min(10, "Please explain your plan to scale."),
  social_impact: z.string().min(10, "Please describe the social impact.").optional().or(z.literal("")),

  // Step 3: Leadership
  background: z.string().min(10, "Please describe your background."),
  team_members: z.string().min(10, "Please list key team members."),
  experience: z.string().min(10, "Please share previous experience."),

  // Step 4: Insight
  revenue_metrics: z.string().optional().or(z.literal("")),
  growth_rate: z.number().min(0).optional().or(z.nan()),
  gross_margins: z.number().min(0).max(100).optional().or(z.nan()),
  customer_acquisition_cost: z.number().min(0).optional().or(z.nan()),
  lifetime_value: z.number().min(0).optional().or(z.nan()),
  feedback: z.string().min(10, "Please share any feedback.").optional().or(z.literal("")),
  risks: z.string().optional().or(z.literal("")),

  // Step 5: Partnership
  existing_partners: z.string().optional().or(z.literal("")),
  supplier_relations: z.string().optional().or(z.literal("")),
  investor_expectations: z.string().min(10, "What are you seeking from an investor?"),

  // Step 6: Standard Information
  company_name: z.string().min(2, "Company name is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  contact_name: z.string().min(2, "Primary contact name is required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().min(7, "Phone number is required"),
  funding_amount: z.number().min(1, "Funding amount is required"),
  
  // File uploads are handled separately, but we could add basic boolean flags for state tracking
  has_pitch_deck: z.boolean().default(false),
  has_financial_model: z.boolean().default(false),
});
