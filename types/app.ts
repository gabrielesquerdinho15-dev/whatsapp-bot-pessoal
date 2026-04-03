export type LeadStatus = "novo" | "qualificado" | "aguardando" | "em_atendimento" | "ganho" | "perdido";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  whatsappLabel: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  leadName: string;
  stage: string;
  owner: "bot" | "voce";
  lastMessage: string;
  updatedAt: string;
  manualMode: boolean;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  summary: string;
  steps: Array<{ type: string; label: string }>;
}

export interface AutomationStep {
  id: string;
  order: number;
  type: "message" | "question" | "save_field" | "assign_status" | "handoff" | "end";
  title: string;
  content: string;
}

export interface AutomationConfig {
  id: string;
  name: string;
  welcomeMessage: string;
  initialDelayMinutes: number;
  isActive: boolean;
  steps: AutomationStep[];
}
