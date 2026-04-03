import { AppUser, AutomationStep, AutomationTemplate, Conversation, Lead } from "@/types/app";

export const demoUser: AppUser = {
  id: "me-1",
  name: "Gabriel",
  email: "gabriel@local.test",
  whatsappLabel: "Meu WhatsApp Principal"
};

export const summary = {
  leadCount: 38,
  openConversations: 7,
  autoRepliesToday: 19,
  manualQueue: 3
};

export const leads: Lead[] = [
  { id: "lead-1", name: "Marina Costa", phone: "+55 11 98888-0001", status: "qualificado", updatedAt: "Hoje, 10:14" },
  { id: "lead-2", name: "Rafael Mota", phone: "+55 11 97777-0002", status: "aguardando", updatedAt: "Hoje, 09:41" },
  { id: "lead-3", name: "Juliana Rocha", phone: "+55 21 96666-0003", status: "em_atendimento", updatedAt: "Ontem, 18:05" }
];

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    leadName: "Marina Costa",
    stage: "Pergunta de interesse",
    owner: "bot",
    lastMessage: "Tenho interesse no plano premium.",
    updatedAt: "2 min atras",
    manualMode: false
  },
  {
    id: "conv-2",
    leadName: "Rafael Mota",
    stage: "Aguardando voce",
    owner: "voce",
    lastMessage: "Pode me chamar no horario do almoco?",
    updatedAt: "8 min atras",
    manualMode: true
  }
];

export const templates: AutomationTemplate[] = [
  {
    id: "template-1",
    name: "Entrada rapida",
    summary: "Da boas-vindas, pergunta nome, entende interesse e te entrega a conversa.",
    steps: [
      { type: "message", label: "Saudacao automatica" },
      { type: "question", label: "Pergunta o nome" },
      { type: "question", label: "Pergunta o interesse" },
      { type: "handoff", label: "Entrega para voce" }
    ]
  },
  {
    id: "template-2",
    name: "Qualificacao curta",
    summary: "Faz 2 perguntas e marca o lead como qualificado antes de te chamar.",
    steps: [
      { type: "message", label: "Mensagem inicial" },
      { type: "question", label: "Qualificacao" },
      { type: "assign_status", label: "Atualiza o lead" }
    ]
  }
];

export const flowSteps: AutomationStep[] = [
  { id: "step-1", order: 1, type: "message", title: "Mensagem inicial", content: "Ola. Obrigado por chamar. Vou te fazer duas perguntas rapidas antes de continuar." },
  { id: "step-2", order: 2, type: "question", title: "Coletar nome", content: "Qual e o seu nome?" },
  { id: "step-3", order: 3, type: "question", title: "Entender interesse", content: "O que voce procura hoje?" },
  { id: "step-4", order: 4, type: "assign_status", title: "Atualizar lead", content: "Marcar como qualificado" },
  { id: "step-5", order: 5, type: "handoff", title: "Transferir para voce", content: "Parar o bot e te avisar para assumir" }
];
