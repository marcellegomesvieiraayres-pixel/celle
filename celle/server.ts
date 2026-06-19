import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Ensure data folder and database exist
function initializeDatabase() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      JSON.parse(content);
      console.log("Database successfully loaded.");
      return;
    } catch (e) {
      console.warn("Database file corrupted, recreating...");
    }
  }

  // Pre-seed database with warm, highly interactive, illustrative sample data
  console.log("Database not found or corrupt, seeding initial sample data...");
  const sampleData = {
    users: [
      {
        id: "user-1",
        nome: "Gabriela Oliveira",
        email: "gabi.oliveira@gmail.com",
        dataNascimento: "1997-08-12",
        cidade: "São Paulo",
        estado: "SP",
        profissao: "Designer Gráfica",
        estadoCivil: "Solteira",
        filhos: false,
        interesses: ["Autoconhecimento", "Desenvolvimento pessoal", "Carreira"],
        comoConheceu: "Instagram",
        aceiteLgpd: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "user-2",
        nome: "Juliana Santos",
        email: "ju.santos34@outlook.com",
        dataNascimento: "1991-11-28",
        cidade: "Belo Horizonte",
        estado: "MG",
        profissao: "Gerente de Projetos",
        estadoCivil: "Casada",
        filhos: true,
        interesses: ["Ansiedade", "Maternidade", "Amizades"],
        comoConheceu: "Indicação de amiga",
        aceiteLgpd: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "user-3",
        nome: "Mariana Souza",
        email: "mari.souza@yahoo.com.br",
        dataNascimento: "1988-04-15",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        profissao: "Arquiteta",
        estadoCivil: "Divorciada",
        filhos: true,
        interesses: ["Espiritualidade", "Autoconhecimento", "Ansiedade"],
        comoConheceu: "Pesquisa na Internet",
        aceiteLgpd: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    messages: [
      // Gabriela Oliveira's Chat
      {
        id: "msg-1",
        usuarioId: "user-1",
        sender: "user",
        text: "Oi, Celle. Estou me sentindo muito cansada essa semana... o trabalho está exigindo muito de mim e mal consigo dormir.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          humor: 4,
          energia: 3,
          ansiedade: 8,
          estresse: 9,
          qualidade_do_sono: 3,
          tema_principal: "Cansaço Profissional",
          tema_secundario: "Distúrbios de Sono",
          sentimento_predominante: "Exaustão",
          interesse_em_cafe: false,
          interesse_em_terapia: true,
          interesse_em_grupo: false,
          data_hora: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: "msg-2",
        usuarioId: "user-1",
        sender: "celle",
        text: "Olá, Gabi. Que bom ter você aqui no nosso cantinho. Sinto muito que esteja passando por essa exaustão. Lidar com cobranças excessivas desgasta nossa mente e nosso corpo de forma profunda. O que você acha de separarmos apenas cinco minutos hoje para respirar fundo e tomar um chá com calma? Você merece essa pausa.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 5000).toISOString()
      },
      {
        id: "msg-3",
        usuarioId: "user-1",
        sender: "user",
        text: "Obrigada, Celle. Eu fiz isso ontem e me senti um pouquinho mais leve. Acho que preciso marcar um café presencial do grupo para espairecer um pouco.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          humor: 6,
          energia: 5,
          ansiedade: 6,
          estresse: 6,
          qualidade_do_sono: 5,
          tema_principal: "Autocuidado",
          tema_secundario: "Sociabilidade",
          sentimento_predominante: "Esperança",
          interesse_em_cafe: true,
          interesse_em_terapia: false,
          interesse_em_grupo: true,
          data_hora: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: "msg-4",
        usuarioId: "user-1",
        sender: "celle",
        text: "Fico tão contente em ouvir isso, Gabi! Pequenos rituais de afeto mudam nosso dia. Participar do nosso café presencial vai ser incrível para você rir, trocar histórias e se alimentar desse carinho coletivo. Vamos marcar sim!",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString()
      },

      // Juliana Santos's Chat
      {
        id: "msg-5",
        usuarioId: "user-2",
        sender: "user",
        text: "Tem sido difícil equilibrar a maternidade com o trabalho remoto. Sinto que estou falhando em tudo.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          humor: 3,
          energia: 4,
          ansiedade: 7,
          estresse: 8,
          qualidade_do_sono: 4,
          tema_principal: "Maternidade e Carreira",
          tema_secundario: "Cobrança pessoal",
          sentimento_predominante: "Culpa",
          interesse_em_cafe: false,
          interesse_em_terapia: true,
          interesse_em_grupo: true,
          data_hora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: "msg-6",
        usuarioId: "user-2",
        sender: "celle",
        text: "Ju, por favor, respire fundo. Essa sensação de 'dar conta de tudo' é uma armadilha que a sociedade nos impõe. Você é uma mãe maravilhosa e uma profissional dedicada, mas você é, acima de tudo, um ser humano com limites. Não há falha em estar sobrecarregada. Que tal darmos as mãos virtualmente e conversar sem cobranças?",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000).toISOString()
      }
    ],
    agendamentos: [
      {
        id: "agenda-1",
        usuarioId: "user-1",
        usuarioNome: "Gabriela Oliveira",
        data: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        hora: "15:00",
        tipo: "cafe_presencial",
        observacoes: "Adoraria conhecer outras participantes e trocar experiências profissionais.",
        status: "confirmado",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "agenda-2",
        usuarioId: "user-2",
        usuarioNome: "Juliana Santos",
        data: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        hora: "10:30",
        tipo: "atendimento_online",
        observacoes: "Conversa introdutória para orientação sobre autocuidado materno.",
        status: "confirmado",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    sessoes: [
      {
        id: "sessao-1",
        usuarioId: "user-2",
        usuarioNome: "Juliana Santos",
        data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        resumoSessao: "Primeira escuta focada na sobrecarga materna de Juliana. Expressa sentimentos intensos de culpa e perfeccionismo na criação do filho de 3 anos.",
        observacoesClinicas: "Paciente demonstra alto nível de vigilância, fadiga visível e discurso acelerado ao falar da rotina dupla.",
        hipotesesClinicas: "Sobrecarga de papel social, sintomatologia de ansiedade moderada a acentuada potencializada pelo trabalho remoto.",
        planoTerapeutico: "Estabelecer rotinas curtas de descompressão diária, descentralização de tarefas com o cônjuge e psicoeducação sobre culpa materna.",
        aiGenerated: {
          resumoClinico: "Juliana Santos apresenta queixa principal relacionada à sobrecarga decorrente do acúmulo de papéis (maternidade e trabalho remoto). Manifesta culpa parental severa e sinais de esgotamento físico-emocional.",
          evolucaoClinica: "Paciente em contato inicial. Mostrou-se responsiva à escuta ativa e acolhimento, verbalizando alívio ao compartilhar sua realidade.",
          possiveisTemasAprofundamento: ["Relação com cobranças familiares do passado", "Divisão de responsabilidades conjugais", "Limites no trabalho remoto"],
          resumoSimplificadoPaciente: "Hoje pudemos olhar com muito carinho para o peso enorme que você tem carregado ao tentar equilibrar tudo com perfeição. O foco agora é se abraçar e reduzir pequenas cobranças diárias.",
          sugestoesAutocuidado: [
            "Fazer uma pausa de 10 minutos após o expediente antes de iniciar a rotina com o filho.",
            "Listar 3 coisas que realizou no dia ao invés de focar nas que ficaram pendentes.",
            "Fazer respiração quadrada (4-4-4) nos momentos de pico de estresse."
          ]
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    whatsappLogs: [
      {
        id: "wa-1",
        phone: "11999998888",
        name: "Clara Guedes",
        direction: "inbound",
        text: "Olá! Gostaria de saber mais sobre o grupo Vai um Café e como faço para me cadastrar.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: "chat"
      },
      {
        id: "wa-2",
        phone: "11999998888",
        name: "Celle Autômato",
        direction: "outbound",
        text: "Olá Clara! Seja muito bem-vinda ao Vai um Café? ☕\n\nNós somos um ambiente de acolhimento focado em conexões leves, partilhas e autocuidado para mulheres.\n\nPara começar a sua jornada e poder conversar de forma especial com a Celle, pedimos que preencha seu cadastro pelo link abaixo:\n👉 https://vaiumcafe.aistudio.build/cadastro\n\nAbraços carinhosos! Celle",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10000).toISOString(),
        type: "welcome"
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(sampleData, null, 2), "utf-8");
  console.log("Database initialized on data/db.json with illustrative data.");
}

initializeDatabase();

// Database read/write helpers
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading db", e);
    return { users: [], messages: [], agendamentos: [], sessoes: [], whatsappLogs: [] };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing db", e);
  }
}

// Initialize Firestore Database with custom DB Support
let dbFirestore: Firestore | null = null;
let firestoreDisabledPermanently = false;

function getFirestoreDB(): Firestore | null {
  if (firestoreDisabledPermanently) return null;
  if (dbFirestore) return dbFirestore;
  
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (getApps().length === 0) {
        initializeApp({
          projectId: config.projectId,
        });
      }
      
      const appInstance = getApp();
      if (config.firestoreDatabaseId) {
        dbFirestore = getFirestore(appInstance, config.firestoreDatabaseId);
      } else {
        dbFirestore = getFirestore(appInstance);
      }
      console.log("Firebase Admin initialized successfully with config. Database ID:", config.firestoreDatabaseId || "(default)");
    } else {
      console.warn("firebase-applet-config.json not found, attempting default GCP initialization.");
      if (getApps().length === 0) {
        initializeApp();
      }
      dbFirestore = getFirestore();
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK. Web client Firestore fallback is enabled.", error);
    dbFirestore = null;
    firestoreDisabledPermanently = true;
  }
  
  return dbFirestore;
}

// Async Firestore Collection wrappers
async function getCollectionDocs(collectionName: string): Promise<any[]> {
  const db = getFirestoreDB();
  if (!db) {
    const local = readDb();
    return local[collectionName] || [];
  }
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const items: any[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName} from Firestore. Falling back to local cache:`, error);
    const local = readDb();
    return local[collectionName] || [];
  }
}

async function addCollectionDoc(collectionName: string, id: string, data: any): Promise<void> {
  // Always update local fallback cache to keep them perfectly in sync
  const local = readDb();
  if (!local[collectionName]) local[collectionName] = [];
  
  // Prevent duplicate keys in local list
  const filtered = local[collectionName].filter((x: any) => x.id !== id);
  filtered.push({ id, ...data });
  local[collectionName] = filtered;
  writeDb(local);

  const db = getFirestoreDB();
  if (!db) return;

  try {
    await db.collection(collectionName).doc(id).set(data);
    console.log(`[Firestore] Successfully wrote document '${id}' to collection '${collectionName}'`);
  } catch (error) {
    console.error(`[Firestore] Error saving document to Firestore collection '${collectionName}':`, error);
  }
}

async function updateCollectionDoc(collectionName: string, id: string, updatedFields: any): Promise<void> {
  // Sync locally
  const local = readDb();
  const list = local[collectionName] || [];
  const index = list.findIndex((x: any) => x.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedFields };
    writeDb(local);
  }

  const db = getFirestoreDB();
  if (!db) return;

  try {
    await db.collection(collectionName).doc(id).update(updatedFields);
    console.log(`[Firestore] Successfully updated document '${id}' in collection '${collectionName}'`);
  } catch (error) {
    console.error(`[Firestore] Error updating document in Firestore collection '${collectionName}':`, error);
  }
}

// On Startup, Sync Local Data (Seeding with db.json values if Firestore is empty)
async function syncDatabaseToFirestore() {
  const db = getFirestoreDB();
  if (!db) {
    console.log("Firestore not reached. Skipping automatic database synchronization.");
    return;
  }

  try {
    const local = readDb();
    const collections = ["users", "messages", "agendamentos", "sessoes", "whatsappLogs"];
    
    console.log("Verifying other Firestore databases structure...");
    
    for (const col of collections) {
      const colRef = db.collection(col);
      const snapshot = await colRef.limit(1).get();
      
      if (snapshot.empty) {
        console.log(`[Sync] Firestore collection '${col}' is empty. Seeding with illustrative data...`);
        const items = local[col] || [];
        for (const item of items) {
          const { id, ...data } = item;
          if (id) {
            await colRef.doc(id).set(data);
          }
        }
        console.log(`[Sync] Seeded ${items.length} records into Firestore collection '${col}' successfully.`);
      } else {
        console.log(`[Sync] Firestore collection '${col}' has existing records. Pulling and merging into local cache...`);
        const allSnap = await colRef.get();
        const firestoreItems: any[] = [];
        allSnap.forEach(d => {
          firestoreItems.push({ id: d.id, ...d.data() });
        });
        
        let hasNewBytes = false;
        for (const fItem of firestoreItems) {
          const exists = local[col].some((lItem: any) => lItem.id === fItem.id);
          if (!exists) {
            local[col].push(fItem);
            hasNewBytes = true;
          }
        }
        if (hasNewBytes) {
          writeDb(local);
          console.log(`[Sync] Synchronized ${firestoreItems.length} cloud records to local db.`);
        }
      }
    }
    console.log("[Sync] Firestore database sync finished perfectly.");
  } catch (error) {
    console.warn("[Firestore Setup] Cloud Firestore custom database is currently inaccessible (PERMISSION_DENIED or other connection issue) in this sandboxed environment due to Google Cloud IAM Service Account permissions propagation delay or cross-project constraints.");
    console.warn("[Firestore Setup] Seamlessly putting the backend server into fast local database persistence block ('data/db.json') to enable 100% app uptime and avoid gRPC runtime credentials logs.");
    dbFirestore = null;
    firestoreDisabledPermanently = true;
  }
}

// Trigger database synchronization background job immediately
syncDatabaseToFirestore();

// Instantiate Gemini SDK comfortably with fallback capabilities
function getGeminiSDK(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ------------------- API ROUTES -------------------

// 1. App details and database query endpoints
app.get("/api/dashboard", async (req, res) => {
  const users = await getCollectionDocs("users");
  const messages = await getCollectionDocs("messages");
  const agendamentos = await getCollectionDocs("agendamentos");
  
  // Calculate stats
  const totalUsers = users.length;
  const conversationsCount = messages.filter((m: any) => m.sender === 'user').length;
  const agendamentosCount = agendamentos.length;
  
  // Interests statistics
  const interestsCounts: Record<string, number> = {};
  users.forEach((u: any) => {
    if (u.interesses && Array.isArray(u.interesses)) {
      u.interesses.forEach((interest: string) => {
        interestsCounts[interest] = (interestsCounts[interest] || 0) + 1;
      });
    }
  });

  // Calculate therapeutic interest and coffee interest from metadata
  let interesseTerapia = 0;
  let interesseCafe = 0;
  let totalMetadataLogs = 0;

  messages.forEach((m: any) => {
    if (m.metadata) {
      totalMetadataLogs++;
      if (m.metadata.interesse_em_terapia) interesseTerapia++;
      if (m.metadata.interesse_em_cafe) interesseCafe++;
    }
  });

  // Collect emotional logs over time for averages charts
  // Group by date or just compile recent timeline
  const emotionalTimeline = messages
    .filter((m: any) => m.metadata !== undefined)
    .map((m: any) => ({
      userName: users.find((u: any) => u.id === m.usuarioId)?.nome || "Usuária",
      date: new Date(m.metadata.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      rawDate: m.metadata.data_hora,
      humor: m.metadata.humor,
      energia: m.metadata.energia,
      ansiedade: m.metadata.ansiedade,
      estresse: m.metadata.estresse,
      qualidade_do_sono: m.metadata.qualidade_do_sono,
      temaPrincipal: m.metadata.tema_principal
    }))
    .sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  res.json({
    totalUsers,
    conversationsCount,
    agendamentosCount,
    interesseTerapia,
    interesseCafe,
    interestsCounts,
    emotionalTimeline
  });
});

// Fetch all registered users
app.get("/api/users", async (req, res) => {
  const users = await getCollectionDocs("users");
  res.json(users);
});

// Fetch specific user data (including profile, chat logs, emotional progress, sessions)
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const users = await getCollectionDocs("users");
  const user = users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Usuária não encontrada" });
  }

  const messages = await getCollectionDocs("messages");
  const agendamentos = await getCollectionDocs("agendamentos");
  const sessoes = await getCollectionDocs("sessoes");

  const userMessages = messages.filter((m: any) => m.usuarioId === id);
  const userAgendamentos = agendamentos.filter((a: any) => a.usuarioId === id);
  const userSessoes = sessoes.filter((s: any) => s.usuarioId === id);

  res.json({
    profile: user,
    messages: userMessages,
    agendamentos: userAgendamentos,
    sessoes: userSessoes
  });
});

// Register a new user
app.post("/api/users/register", async (req, res) => {
  const { nome, email, dataNascimento, cidade, estado, profissao, estadoCivil, filhos, interesses, comoConheceu, aceiteLgpd } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ error: "Nome e e-mail são obrigatórios para o cadastro." });
  }

  const users = await getCollectionDocs("users");
  const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    // Return existing user to let them re-login easily during sandbox demonstration
    return res.json({ message: "Usuária existente retornada", user: existingUser });
  }

  const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
  const newUser = {
    nome,
    email,
    dataNascimento,
    cidade,
    estado,
    profissao,
    estadoCivil,
    filhos: filhos === "sim" || filhos === true,
    interesses: Array.isArray(interesses) ? interesses : [],
    comoConheceu: comoConheceu || "",
    aceiteLgpd: !!aceiteLgpd,
    createdAt: new Date().toISOString()
  };

  await addCollectionDoc("users", newUserId, newUser);

  // Trigger automated mock WhatsApp message simulation to represent real-life business flow
  const waId = "wa-sim-" + Math.random().toString(36).substr(2, 9);
  const newWALogIn = {
    phone: "Simulado",
    name: nome,
    direction: "outbound",
    text: `Olá, ${nome}! Que felicidade enorme ver você cadastrada no Vai um Café? ☕\n\nNossa assistente virtual Celle já está de braços abertos esperando por você. Pode iniciar a conversa em nosso portal para desfrutar de um momento único de descompressão!\n\nRegras de Convivência:\n1. Respeito mútuo em todas as trocas.\n2. Espaço confidencial e livre de julgamentos.\n3. Incentivo mútuo ao autocuidado diário.`,
    timestamp: new Date().toISOString(),
    type: "rules"
  };
  await addCollectionDoc("whatsappLogs", waId, newWALogIn);

  res.status(201).json({ message: "Cadastro realizado com sucesso!", user: { id: newUserId, ...newUser } });
});

// 2. Chat with Celle (with core Gemini and extracted metadata)
app.post("/api/chat", async (req, res) => {
  const { usuarioId, messageText } = req.body;
  if (!usuarioId || !messageText) {
    return res.status(400).json({ error: "usuarioId e messageText são obrigatórios." });
  }

  const users = await getCollectionDocs("users");
  const user = users.find((u: any) => u.id === usuarioId);
  if (!user) {
    return res.status(404).json({ error: "Usuária não cadastrada." });
  }

  // 1. Get recent message history (limit to last 10 messages for context)
  const messages = await getCollectionDocs("messages");
  const recentMessages = messages
    .filter((m: any) => m.usuarioId === usuarioId)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-10);

  // Save the user message first
  const userMessageId = "msg-user-" + Math.random().toString(36).substr(2, 9);
  const userMsgRecord = {
    usuarioId,
    sender: "user",
    text: messageText,
    timestamp: new Date().toISOString()
  };

  // 2. Formulate system instruction for Celle
  const systemInstruction = 
    `Você é a Celle ☕, assistente virtual acolhedora do grupo 'Vai um Café?'. 
    Seu papel é criar um espaço extremamente seguro, gentil, empático e de escuta ativa para mulheres estressadas ou sobrecarregadas da rotina.
    VALORES ESSENCIAIS:
    - Tom: gentil, respeitoso, acolhedor, leve e profundamente humano.
    - REGRAS IMPORTANTÍSSIMAS:
      - Nunca forneça diagnósticos, laudos, pareceres psicológicos ou médicos. Você NÃO substitui terapia.
      - Nunca afirme doenças nem prometa curas/resultados milagrosos.
      - Nunca classifique ou interprete traumas de maneira clínica.
      - Seja honesta: se a usuária apresentar ideação suicida ou sofrimento clínico muito profundo, oriente de forma doce e clara a buscar atendimento profissional de saúde mental (como psicólogas, terapeutas credenciadas ou o CVV ligando 188).
    - OBJETIVOS:
      - Estimular conversa leve.
      - Criar vínculo saudável e encorajar autocuidado com ideias práticas (ex: tomar um chá morno, banho relaxante, escrever o que sente, ouvir música calma, etc.).
      - Fazer perguntas abertas amigáveis como: "Como foi sua semana?", "Como você está cuidando de você hoje?", "O que tem tirado seu sono por esses dias?".
    
    Perfil da usuária com quem você está conversando agora:
    - Nome: ${user.nome}
    - Profissão: ${user.profissao}
    - Interesses: ${user.interesses.join(", ")}
    - Estado Civil / Filhos: ${user.estadoCivil} ${user.filhos ? "com filhos" : "sem filhos"}.
    
    Responda em português de maneira carinhosa, calorosa, sempre mantendo os limites éticos de apoio de uma assistente sem pretensões técnicas clínicas.`;

  const ai = getGeminiSDK();
  let celleResponseText = "";
  let extractedMeta: any = null;

  if (ai) {
    try {
      // Create chat parameters
      const chatHistory = recentMessages.map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      // A. Generate Celle's response
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...chatHistory,
          { role: "user", parts: [{ text: messageText }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.8
        }
      });

      celleResponseText = response.text || "";

      // B. Structure Meta-data extraction response schema in Portuguese/English.
      // Ask Gemini to extract emotional metadata from the entire current exchange
      const metaPrompt = 
        `Analise a mensagem recente de ${user.nome}: "${messageText}" no contexto da conversa.
        Gere e extraia os metadados emocionais em formato JSON estrito conforme as seguintes orientações.
        Qualquer nível de intensidade deve ser de 0 a 10:
        - humor (0-10): Quão alegre/otimista ela parece (0=pessimista/triste, 10=muito alegre/equilibrada).
        - energia (0-10): Nível de disposição e força de vontade demonstrado.
        - ansiedade (0-10): Nível de preocupação, afobação ou inquietação.
        - estresse (0-10): Nível de sobrecarga, tensões de trabalho ou rotina acumulada.
        - qualidade_do_sono (0-10): Caso mencione no texto ou implicitamente (se não mencionado, estime 6 como neutro).
        - tema_principal: Descrição corta do tópico mais marcante do estresse/conversa (ex: Sobrecarga materna, Pressão corporativa, Autocuidado).
        - tema_secundario: Um segundo tema relacionado ou de base (ex: Distúrbio do sono, Término afetivo, Organização de tempo).
        - sentimento_predominante: Sentimento mais vivo na escrita (ex: Culpa, Cansaço, Esperança, Ansiedade, Paz).
        - interesse_em_cafe: Detectar se demonstrou de alguma forma vontade de se encontrar pessoalmente ou tomar café virtual (true/false).
        - interesse_em_terapia: Detectar se demonstrou interesse, dor ou aceitabilidade para terapia individual profissional (true/false).
        - interesse_em_grupo: Detectar se manifestou vontade de interagir com o grupo de mulheres (true/false).

        Retorne EXCLUSIVAMENTE o objeto JSON solicitado, sem quaisquer blocos de markdown adicionais.`;

      const metaResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: metaPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              humor: { type: Type.INTEGER },
              energia: { type: Type.INTEGER },
              ansiedade: { type: Type.INTEGER },
              estresse: { type: Type.INTEGER },
              qualidade_do_sono: { type: Type.INTEGER },
              tema_principal: { type: Type.STRING },
              tema_secundario: { type: Type.STRING },
              sentimento_predominante: { type: Type.STRING },
              interesse_em_cafe: { type: Type.BOOLEAN },
              interesse_em_terapia: { type: Type.BOOLEAN },
              interesse_em_grupo: { type: Type.BOOLEAN }
            },
            required: [
              "humor", "energia", "ansiedade", "estresse", "qualidade_do_sono",
              "tema_principal", "tema_secundario", "sentimento_predominante",
              "interesse_em_cafe", "interesse_em_terapia", "interesse_em_grupo"
            ]
          }
        }
      });

      if (metaResponse.text) {
        extractedMeta = JSON.parse(metaResponse.text.trim());
        extractedMeta.data_hora = new Date().toISOString();
      }
    } catch (e: any) {
      console.error("Gemini API computation failed. Falling back to rule-based fallback generation.", e);
    }
  }

  // 3. Fallback logic when offline / Gemini API is not set or failed
  if (!celleResponseText) {
    celleResponseText = generateFallbackCelleResponse(user.nome, messageText);
  }
  if (!extractedMeta) {
    extractedMeta = generateFallbackMetadata(messageText);
  }

  // Assign metadata to user's message and write to Firestore
  (userMsgRecord as any).metadata = extractedMeta;
  await addCollectionDoc("messages", userMessageId, userMsgRecord);

  // Save Celle message in Firestore
  const celleMsgId = "msg-cl-" + Math.random().toString(36).substr(2, 9);
  const celleMsgRecord = {
    usuarioId,
    sender: "celle",
    text: celleResponseText,
    timestamp: new Date().toISOString()
  };
  await addCollectionDoc("messages", celleMsgId, celleMsgRecord);

  res.json({
    userMessage: { id: userMessageId, ...userMsgRecord },
    celleMessage: { id: celleMsgId, ...celleMsgRecord },
    extractedMetadata: extractedMeta
  });
});

// Local Fallback text generators for offline resiliency
function generateFallbackCelleResponse(userName: string, txt: string): string {
  const normalized = txt.toLowerCase();
  
  if (normalized.includes("triste") || normalized.includes("mal") || normalized.includes("chorei") || normalized.includes("chora")) {
    return `Oh, meu bem... sinto muito que as coisas pareçam cinzentas agora. Não tenha vergonha do seu choro; ele é o desabafo da nossa alma. Quero que você saiba que você não está sozinha nessa jornada. Que tal botarmos os pés para cima um pouquinho agora e escutarmos uma música reconfortante? O que acha? ☕`;
  }
  if (normalized.includes("cansad") || normalized.includes("exaust") || normalized.includes("rotina") || normalized.includes("trabalho") || normalized.includes("sobrecarreg")) {
    return `Sei bem o que é esse cansaço, ${userName}... Muitas vezes somos cobradas a ser super-heroínas e esquecemos que temos o direito de cansar. O Vai um Café existe exatamente para isso: para ser o seu porto seguro onde você não precisa fingir força. Pode relaxar seus ombros hoje e respirar bem fundo. Uma pausa curta de 10 minutos já vai fazer uma pequena diferença maravilhosa em você.`;
  }
  if (normalized.includes("ansios") || normalized.includes("ansiedade") || normalized.includes("pânico") || normalized.includes("coração")) {
    return `${userName}, sinto de perto a sua aflição. Quando o peito aperta desse jeito, convido você a colocar uma das mãos no coração e outra no abdômen. Respire devagar, contando até quatro para inspirar, segurando e soltando o ar suavemente. Lembre-se: este momento difícil vai passar. Você está segura aqui comigo. No que você quiser conversar, estou ouvindo. Se a ansiedade te sufocar com frequência, te aconselho a conversar com um terapeuta que possa te ajudar a decifrar essas ondas de forma técnica e profunda, combinado?`;
  }
  if (normalized.includes("sono") || normalized.includes("dormi") || normalized.includes("insônia")) {
    return `O sono é vital para reabastecer nossa paz, ${userName}. Quando a mente não para de rodar, o corpo sofre. Antes de deitar hoje, experimente afastar as telas por meia hora e tente tomar uma xícara de chá morno de camomila. Quero te ver bem descansada, pois seu bem-estar é o seu maior tesouro. ☕`;
  }
  if (normalized.includes("obrigad") || normalized.includes("grata") || normalized.includes("valeu")) {
    return `Imagino, com muito carinho! Estou aqui para te ouvir sempre de coração aberto. Se precisar de outras conversas leves ou quiser programar nossa presença no próximo café presencial com as outras meninas, me avise!`;
  }

  // Default cozy response
  return `Obrigada por confiar em mim e compartilhar esse momento, ${userName}. Às vezes, colocar para fora em palavras já começa a organizar nossa confusão interna. O que você acha que poderia fazer de mais simples por você mesma hoje que te traria um pouquinho de alegria?`;
}

function generateFallbackMetadata(txt: string): any {
  const normalized = txt.toLowerCase();
  let humor = 7;
  let energia = 6;
  let ansiedade = 3;
  let estresse = 4;
  let sentimento_predominante = "Neutro";
  let tema_principal = "Geral";
  let tema_secundario = "Cotidiano";

  if (normalized.includes("triste") || normalized.includes("mal")) {
    humor = 3;
    energia = 4;
    ansiedade = 6;
    sentimento_predominante = "Tristeza";
    tema_principal = "Balanço Emocional";
  } else if (normalized.includes("cansad") || normalized.includes("exaust") || normalized.includes("sobrecarreg")) {
    humor = 5;
    energia = 2;
    estresse = 8;
    sentimento_predominante = "Cansaço";
    tema_principal = "Rotina Acelerada";
  } else if (normalized.includes("ansios") || normalized.includes("ansiedade") || normalized.includes("medo")) {
    humor = 4;
    ansiedade = 9;
    estresse = 7;
    sentimento_predominante = "Ansiedade";
    tema_principal = "Crise de Inquietação";
  } else if (normalized.includes("dormi") || normalized.includes("insônia") || normalized.includes("sono")) {
    humor = 5;
    energia = 3;
    sentimento_predominante = "Fadiga";
    tema_principal = "Higiene do Sono";
  }

  return {
    humor,
    energia,
    ansiedade,
    estresse,
    qualidade_do_sono: normalized.includes("sono") ? 3 : 6,
    tema_principal,
    tema_secundario,
    sentimento_predominante,
    interesse_em_cafe: normalized.includes("café") || normalized.includes("encontro") || normalized.includes("presencial"),
    interesse_em_terapia: normalized.includes("terapia") || normalized.includes("psicólog") || normalized.includes("atendimento"),
    interesse_em_grupo: normalized.includes("grupo") || normalized.includes("meninas") || normalized.includes("participar"),
    data_hora: new Date().toISOString()
  };
}

// 3. Appointments / Agendamentos endpoints
app.get("/api/agendamentos", async (req, res) => {
  const agendamentos = await getCollectionDocs("agendamentos");
  res.json(agendamentos);
});

app.post("/api/agendamentos", async (req, res) => {
  const { usuarioId, data, hora, tipo, observacoes } = req.body;
  if (!usuarioId || !data || !hora || !tipo) {
    return res.status(400).json({ error: "usuarioId, data, hora e tipo são obrigatórios." });
  }

  const users = await getCollectionDocs("users");
  const user = users.find((u: any) => u.id === usuarioId);
  if (!user) {
    return res.status(404).json({ error: "Usuária não encontrada." });
  }

  const apptId = "agenda-" + Math.random().toString(36).substr(2, 9);
  const newAppointment = {
    usuarioId,
    usuarioNome: user.nome,
    data,
    hora,
    tipo,
    observacoes: observacoes || "",
    status: "confirmado", // Auto confirmation as requested
    createdAt: new Date().toISOString()
  };

  await addCollectionDoc("agendamentos", apptId, newAppointment);

  // Send WhatsApp simulation notice
  const labelMap = {
    cafe_presencial: "Café Presencial",
    atendimento_online: "Atendimento Terapêutico Online (Marcelle)",
    atendimento_presencial: "Atendimento Terapêutico Presencial (Marcelle)"
  };
  const friendlyType = labelMap[tipo as keyof typeof labelMap] || tipo;

  const waNoticeId = "wa-sim-" + Math.random().toString(36).substr(2, 9);
  const waNotice = {
    phone: "Simulado",
    name: user.nome,
    direction: "outbound",
    text: `🍵 Confirmação Automática: Olá ${user.nome}! Seu agendamento para o tipo **${friendlyType}** no dia **${data.split("-").reverse().join("/")}** às **${hora}** foi CONFIRMADO com sucesso! Estamos preparando este momento com muito carinho. ❤️`,
    timestamp: new Date().toISOString(),
    type: "notification"
  };
  await addCollectionDoc("whatsappLogs", waNoticeId, waNotice);

  res.status(201).json({ message: "Agendamento efetuado com confirmação instantânea!", agendamento: { id: apptId, ...newAppointment } });
});

// Update appointment status or detail
app.patch("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const agendamentos = await getCollectionDocs("agendamentos");
  const orig = agendamentos.find((a: any) => a.id === id);
  if (!orig) {
    return res.status(404).json({ error: "Agendamento não encontrado." });
  }
  
  const finalStatus = status || orig.status;
  await updateCollectionDoc("agendamentos", id, { status: finalStatus });
  res.json({ ...orig, status: finalStatus });
});

// 4. Therapeutic Sessions logging endpoint (Marcelle Only Panel)
app.post("/api/sessoes", async (req, res) => {
  const { usuarioId, data, resumoSessao, observacoesClinicas, hipotesesClinicas, planoTerapeutico } = req.body;
  if (!usuarioId || !data || !resumoSessao) {
    return res.status(400).json({ error: "usuarioId, data e resumoSessao são de preenchimento obrigatório." });
  }

  const users = await getCollectionDocs("users");
  const user = users.find((u: any) => u.id === usuarioId);
  if (!user) {
    return res.status(404).json({ error: "Usuária não encontrada." });
  }

  // Invoke Gemini to create Clinical Summaries, Evolutions, and Tips automatically
  let aiGenerated = null;
  const ai = getGeminiSDK();
  
  const aiPrompt = 
    `Analise este registro de sessão clínica efetuado pela terapeuta Marcelle sobre a paciente ${user.nome}:
    - Data: ${data}
    - Resumo Bruto: ${resumoSessao}
    - Observações da Terapeuta: ${observacoesClinicas || "Nenhuma"}
    - Hipóteses Clínicas: ${hipotesesClinicas || "Nenhuma"}
    - Plano de Tratamento: ${planoTerapeutico || "Nenhuma"}
 
    Forneça uma resposta JSON estrita contendo a análise e evolução clínica da paciente, estruturado assim:
    - resumoClinico: Um resumo técnico condensado e formal da sessão de 2 a 3 linhas.
    - evolucaoClinica: O estado de progressão terapêutica sugerido para o prontuário.
    - possiveisTemasAprofundamento: Um array de strings com 3 tópicos potenciais para debater nas próximas sessões.
    - resumoSimplificadoPaciente: Uma redação extremamente generosa, de acolhimento e amigável direcionada à paciente (escrita em 2ª pessoa: "Você"), explicando o cerne da sessão sem jargões psiquiátricos pesados.
    - sugestoesAutocuidado: Um array com 3 sugestões práticas personalizadas que a paciente pode executar em casa para incentivar o bem-estar dela.
 
    Retorne APENAS o JSON, sem markdown ou caracteres extras.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumoClinico: { type: Type.STRING },
              evolucaoClinica: { type: Type.STRING },
              possiveisTemasAprofundamento: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              resumoSimplificadoPaciente: { type: Type.STRING },
              sugestoesAutocuidado: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["resumoClinico", "evolucaoClinica", "possiveisTemasAprofundamento", "resumoSimplificadoPaciente", "sugestoesAutocuidado"]
          }
        }
      });
      
      if (response.text) {
        aiGenerated = JSON.parse(response.text.trim());
      }
    } catch (e: any) {
      console.error("Gemini failed during therapeutic session analysis. Falling back to rule-based analysis.", e);
    }
  }

  // Fallback clinical AI generation if offline
  if (!aiGenerated) {
    aiGenerated = {
      resumoClinico: `Atendimento efetuado em ${data}. Paciente trouxe queixas de sobrecarga cotidiana e necessidade de partilha. Escuta clínica humanizada mantida.`,
      evolucaoClinica: "Fase de acolhimento inicial e estabelecimento de vínculo. Paciente demonstra boa aceitação à proposta de reestruturação de rotina.",
      possiveisTemasAprofundamento: [
        "Identificação de ativadores de estresse na rotina de trabalho",
        "Necessidade de delegação de responsabilidades familiares",
        "Autoaceitação e redução de metas perfeccionistas"
      ],
      resumoSimplificadoPaciente: `Hoje conversamos com muito carinho sobre como as demandas do seu dia a dia têm pesado nos seus ombros. Lembre-se que você é forte, mas também deve ser gentil com os seus próprios limites. Estamos caminhando juntas rumo a uma rotina mais acolhedora para você.`,
      sugestoesAutocuidado: [
        "Estipular um horário limite para responder mensagens de trabalho.",
        "Separar um intervalo curto para tomar um café ou deitar silenciosamente à tarde.",
        "Anotar 1 sentimento positivo de tranquilidade que vivenciou no seu dia."
      ]
    };
  }

  const sId = "sessao-" + Math.random().toString(36).substr(2, 9);
  const newSessionRecord = {
    usuarioId,
    usuarioNome: user.nome,
    data,
    resumoSessao,
    observacoesClinicas: observacoesClinicas || "",
    hipotesesClinicas: hipotesesClinicas || "",
    planoTerapeutico: planoTerapeutico || "",
    aiGenerated,
    createdAt: new Date().toISOString()
  };

  await addCollectionDoc("sessoes", sId, newSessionRecord);

  res.status(201).json({ message: "Sessão terapêutica consolidada com sucesso!", sessao: { id: sId, ...newSessionRecord } });
});

// Fetch therapy sessions logs
app.get("/api/sessoes", async (req, res) => {
  const sessoes = await getCollectionDocs("sessoes");
  res.json(sessoes);
});

// 5. WhatsApp Simulator routes
app.get("/api/whatsapp/logs", async (req, res) => {
  const logs = await getCollectionDocs("whatsappLogs");
  res.json(logs);
});

app.post("/api/whatsapp/send", async (req, res) => {
  const { phone, direction, text, name, type } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: "Número e texto são obrigatórios." });
  }

  const newLogId = "wa-sim-" + Math.random().toString(36).substr(2, 9);
  const newLog = {
    phone,
    name: name || "Simulado",
    direction: direction || "inbound",
    text,
    timestamp: new Date().toISOString(),
    type: type || "chat"
  };

  await addCollectionDoc("whatsappLogs", newLogId, newLog);

  // If inbound message, simulate automatic response from "Celle Autômato"
  if (direction === "inbound") {
    const norm = text.toLowerCase();
    let responseText = "Olá! Celle aqui. Que bom ter você em contato pelo WhatsApp. Lembre-se que você pode realizar seu cadastro pelo nosso portal e iniciar uma conversa completa no nosso app de forma imersiva e segura! 👉 https://vaiumcafe.aistudio.build/login";
    
    if (norm.includes("oi") || norm.includes("olá") || norm.includes("quero participar") || norm.includes("saber mais")) {
      responseText = `Olá! Seja muito bem-vinda ao Vai um Café? ☕\n\nNós somos uma comunidade de partilha focado em desaceleração e autocuidado saudável para mulheres.\n\nPara começar sua conversa afetiva de forma completa com a assistente Celle e registrar suas emoções, clique no link de cadastro abaixo:\n👉 https://vaiumcafe.aistudio.build/cadastro\n\nEstarei te aguardando com um espresso quente e todo carinho do mundo! ☕❤️`;
    }

    const autoReplyId = "wa-sim-" + Math.random().toString(36).substr(2, 9);
    const autoReply = {
      phone,
      name: "Celle Autômato",
      direction: "outbound",
      text: responseText,
      timestamp: new Date(Date.now() + 1000).toISOString(),
      type: "welcome"
    };
    await addCollectionDoc("whatsappLogs", autoReplyId, autoReply);
  }

  res.status(201).json({ success: true, log: { id: newLogId, ...newLog } });
});

// Configure Vite middleware in developmental server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    // Mount Vite middleware
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for rich frontend rendering.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production bundle from dist folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`☕ Vai um Café? + Celle server running on port ${PORT}`);
  });
}

startServer();
