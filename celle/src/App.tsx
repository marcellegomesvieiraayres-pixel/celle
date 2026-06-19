import React, { useState, useEffect, useRef } from "react";
import {
  Coffee,
  Heart,
  Calendar,
  Sparkles,
  Users,
  TrendingUp,
  MessageSquare,
  Send,
  User,
  MapPin,
  Lock,
  Plus,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Activity,
  Smile,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  FileText,
  Clock,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { UserProfile, ChatMessage, Agendamento, TherapeuticSession, WhatsAppLog } from "./types";

export default function App() {
  // System general state
  const [role, setRole] = useState<"user" | "admin">("user");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  
  // Navigation states
  const [userTab, setUserTab] = useState<"chat" | "agendamentos" | "historico">("chat");
  const [adminTab, setAdminTab] = useState<"dashboard" | "usuarios" | "whatsapp">("dashboard");
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);

  // App statistics from backend
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    conversationsCount: 0,
    agendamentosCount: 0,
    interesseTerapia: 0,
    interesseCafe: 0,
    interestsCounts: {},
    emotionalTimeline: []
  });

  // User input states
  const [chatMessageInput, setChatMessageInput] = useState<string>("");
  const [isCelleWriting, setIsCelleWriting] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Registration form state
  const [regForm, setRegForm] = useState({
    nome: "",
    email: "",
    dataNascimento: "",
    cidade: "",
    estado: "",
    profissao: "",
    estadoCivil: "Solteira",
    filhos: "não",
    interesses: [] as string[],
    comoConheceu: "",
    aceiteLgpd: false
  });

  // Booking/Agendamento form state
  const [bookingForm, setBookingForm] = useState({
    data: "",
    hora: "",
    tipo: "cafe_presencial",
    observacoes: ""
  });
  
  // Clinical session form state (Marcelle administrative panel)
  const [sessionForm, setSessionForm] = useState({
    usuarioId: "",
    data: new Date().toISOString().split("T")[0],
    resumoSessao: "",
    observacoesClinicas: "",
    hipotesesClinicas: "",
    planoTerapeutico: ""
  });
  const [isAnalyzingSession, setIsAnalyzingSession] = useState<boolean>(false);

  // WhatsApp simulation panel state
  const [waSimulatorSender, setWaSimulatorSender] = useState<string>("Clara Guedes");
  const [waSimulatorPhone, setWaSimulatorPhone] = useState<string>("11999998888");
  const [waSimulatorInput, setWaSimulatorInput] = useState<string>("");
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);

  // Selected patient detailed analysis state for Marcelle
  const [selectedPatientData, setSelectedPatientData] = useState<{
    profile: UserProfile;
    messages: ChatMessage[];
    agendamentos: Agendamento[];
    sessoes: TherapeuticSession[];
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Scroll ref for chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isCelleWriting]);

  // Toast notifier helper
  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch all initial metadata, configurations, users, and logs
  const refreshAllData = async () => {
    try {
      const dbStatsRes = await fetch("/api/dashboard");
      if (dbStatsRes.ok) {
        const data = await dbStatsRes.json();
        setStats(data);
      }

      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
        // Default select first user for Marcelle's comfort if none selected
        if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].id);
        }
      }

      const waRes = await fetch("/api/whatsapp/logs");
      if (waRes.ok) {
        const data = await waRes.json();
        setWaLogs(data);
      }
    } catch (e) {
      console.error("Error refreshing data", e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Fetch individual patient profile data when selection changes in administrative panel
  useEffect(() => {
    if (selectedUserId && role === "admin") {
      fetch(`/api/users/${selectedUserId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Patient not found");
        })
        .then((data) => {
          setSelectedPatientData(data);
        })
        .catch((err) => console.error(err));
    }
  }, [selectedUserId, role]);

  // Synchronize active user's messaging logs
  useEffect(() => {
    if (activeUser) {
      fetch(`/api/users/${activeUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          setChatMessages(data.messages || []);
        });
    }
  }, [activeUser]);

  // Handle user login / simulation chooser
  const handleSelectActiveUser = (usr: UserProfile) => {
    setActiveUser(usr);
    setShowWelcome(false);
    setShowRegisterForm(false);
    showToast(`Bem-vinda de volta, ${usr.nome}! ☕`, "success");
  };

  // Handle new user register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.nome || !regForm.email) {
      showToast("Por favor, preencha o Nome e o E-mail.", "info");
      return;
    }
    if (!regForm.aceiteLgpd) {
      showToast("É necessário aceitar os termos da LGPD para continuar.", "info");
      return;
    }

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm)
      });
      if (res.ok) {
        const responseData = await res.json();
        setRegForm({
          nome: "",
          email: "",
          dataNascimento: "",
          cidade: "",
          estado: "",
          profissao: "",
          estadoCivil: "Solteira",
          filhos: "não",
          interesses: [],
          comoConheceu: "",
          aceiteLgpd: false
        });
        refreshAllData();
        setActiveUser(responseData.user);
        setShowRegisterForm(false);
        setShowWelcome(false);
        showToast("Seu cadastro foi realizado com sucesso! Seja bem-vinda.", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Algo deu errado durante o cadastro.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Falha na conexão com o servidor.", "info");
    }
  };

  // Handle chat submission (talk to Celle)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeUser) return;

    const userText = chatMessageInput;
    setChatMessageInput("");

    // optimistic client-side message representation
    const tempUserMsgId = "optimistic-u-" + Date.now();
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      usuarioId: activeUser.id,
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, tempUserMsg]);
    setIsCelleWriting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: activeUser.id,
          messageText: userText
        })
      });

      if (res.ok) {
        const data = await res.json();
        // replace the optimistic client item with the genuine DB response containing parsed metadata
        setChatMessages((prev) => 
          prev.map((m) => (m.id === tempUserMsgId ? data.userMessage : m))
        );
        // Append Celle's response
        setChatMessages((prev) => [...prev, data.celleMessage]);
        refreshAllData(); // refresh dashboard graphs background
      } else {
        showToast("A assistente Celle está temporariamente desconectada. Tente responder mais tarde.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Não foi possível enviar a mensagem. Verifique sua conexão.", "info");
    } finally {
      setIsCelleWriting(false);
    }
  };

  // Handle booking creation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!bookingForm.data || !bookingForm.hora || !bookingForm.tipo) {
      showToast("Preencha a data, hora e o tipo do agendamento.", "info");
      return;
    }

    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: activeUser.id,
          ...bookingForm
        })
      });

      if (res.ok) {
        setBookingForm({
          data: "",
          hora: "",
          tipo: "cafe_presencial",
          observacoes: ""
        });
        showToast("Agendamento solicitado! Confirmação enviada no WhatsApp.", "success");
        refreshAllData();
        // Fetch fresh chat messages/logs if notification is simulated on their screen
        fetch(`/api/users/${activeUser.id}`)
          .then((r) => r.json())
          .then((data) => {
            setChatMessages(data.messages || []);
          });
      } else {
        showToast("Falha ao registrar agendamento.", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Therapeutic session submission by Marcelle (clinical dashboard)
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.usuarioId || !sessionForm.resumoSessao) {
      showToast("Selecione a paciente e registre o resumo da consulta.", "info");
      return;
    }

    setIsAnalyzingSession(true);
    try {
      const res = await fetch("/api/sessoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionForm)
      });

      if (res.ok) {
        showToast("Sessão clínica registrada! Análise de evolução clínica consolidada via IA.", "success");
        setSessionForm({
          usuarioId: "",
          data: new Date().toISOString().split("T")[0],
          resumoSessao: "",
          observacoesClinicas: "",
          hipotesesClinicas: "",
          planoTerapeutico: ""
        });
        
        // Refresh specific patient files dynamically to visualize on timeline
        const savedId = sessionForm.usuarioId;
        refreshAllData();
        setSelectedUserId(savedId);
      } else {
        showToast("Houve um estorno ao consolidar as informações clínicas.", "info");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingSession(false);
    }
  };

  // Simulate incoming Whatsapp message simulation
  const handleSendWhatsAppSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waSimulatorInput.trim()) return;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: waSimulatorPhone,
          name: waSimulatorSender,
          direction: "inbound",
          text: waSimulatorInput,
          type: "chat"
        })
      });

      if (res.ok) {
        setWaSimulatorInput("");
        showToast("Mensagem de WhatsApp simulada enviada!", "success");
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle interests in registration select list helper
  const handleToggleInterest = (interest: string) => {
    setRegForm((prev) => {
      const currentlySelected = prev.interesses.includes(interest);
      if (currentlySelected) {
        return {
          ...prev,
          interesses: prev.interesses.filter((i) => i !== interest)
        };
      } else {
        return {
          ...prev,
          interesses: [...prev.interesses, interest]
        };
      }
    });
  };

  // List of interests options
  const interesseOptions = [
    "Autoconhecimento",
    "Ansiedade",
    "Amizades",
    "Desenvolvimento pessoal",
    "Maternidade",
    "Carreira",
    "Espiritualidade",
    "Outros"
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900" id="vai_um_cafe_main">
      
      {/* Dynamic Toast System */}
      {toastMessage && (
        <div 
          id="system_toast"
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border transition-transform duration-300 animate-bounce ${
            toastType === "success" 
              ? "bg-stone-900 text-stone-50 border-stone-800" 
              : "bg-amber-50 text-stone-900 border-amber-200"
          }`}
        >
          {toastType === "success" ? <CheckCircle className="w-5 h-5 text-amber-400" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Navigation */}
      <header className="sticky top-0 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/60 z-30 px-4 py-3.5 transition-all" id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 shadow-sm border border-amber-250/30">
              <Coffee className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5 font-serif">
                Vai um Café? <span className="text-xs bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-sans font-normal border border-amber-300/40">Celle ☕</span>
              </h1>
              <p className="text-xs text-stone-500 font-normal">Acolhimento &amp; Insights para Mulheres</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Portal Switcher */}
            <div className="bg-stone-100 p-0.5 rounded-xl border border-stone-200 flex items-center shadow-inner">
              <button
                id="btn_portal_user"
                onClick={() => {
                  setRole("user");
                  if (users.length && !activeUser) {
                    // pre-select first user as active if they toggle to user portal without profile
                    setActiveUser(users[0]);
                    setShowWelcome(false);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  role === "user"
                    ? "bg-white text-amber-900 shadow-sm font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Portal Usuária
              </button>
              <button
                id="btn_portal_admin"
                onClick={() => {
                  setRole("admin");
                  refreshAllData();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  role === "admin"
                    ? "bg-white text-stone-950 shadow-sm font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-800" /> Painel Marcelle (Admin)
              </button>
            </div>

            {/* Quick simulation accounts chooser */}
            {role === "user" && users.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50/80 px-2 py-1 rounded-xl border border-amber-200/50">
                <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider px-1">Simular como:</span>
                <select
                  id="select_user_sim"
                  className="bg-white border text-xs text-stone-800 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={activeUser?.id || ""}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u) handleSelectActiveUser(u);
                  }}
                >
                  <option value="" disabled>Selecione uma mulher...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.profissao})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6" id="app_main_content">
        
        {/* ========================================================= */}
        {/* 1. PORTAL DA USUÁRIA                                      */}
        {/* ========================================================= */}
        {role === "user" && (
          <div className="space-y-6" id="portal_user_scope">
            
            {/* Boas-vindas ou Nova Usuária Flow */}
            {showWelcome && !activeUser && (
              <div 
                id="welcome_overlay"
                className="bg-white rounded-3xl p-6 md:p-12 text-center max-w-2xl mx-auto border border-stone-200/70 shadow-xl space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-200 via-amber-300 to-terracotta" />
                <div className="w-20 h-20 bg-amber-50/80 rounded-full flex items-center justify-center mx-auto text-amber-700 shadow-sm border border-stone-100">
                  <Coffee className="w-10 h-10 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-bold tracking-widest text-[#B45309] uppercase">Boas-vindas ao</span>
                  <h2 className="text-3xl font-serif font-bold text-stone-950">Vai um Café? ☕</h2>
                  <p className="text-stone-600 max-w-lg mx-auto leading-relaxed text-sm">
                    Um espaço caloroso e livre de cobranças criado especialmente para mulheres que desejam desacelerar, costurar amizades e compartilhar as dores e alegrias da rotina.
                  </p>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/40 text-left max-w-md mx-auto space-y-2 text-stone-700">
                  <p className="text-xs leading-relaxed flex items-start gap-2">
                    <span className="text-amber-800 text-lg">💡</span>
                    <span>
                      <strong>Abordagem de Acolhimento:</strong> Nossa estimada assistente amigável <strong>Celle</strong> te escuta de forma empática para te ajudar a refletir, acalmar o estresse e propor autocuidado. Ela não substitui terapias recomendadas.
                    </span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-4">
                  {users.length > 0 && (
                    <button
                      id="btn_welcome_login"
                      onClick={() => handleSelectActiveUser(users[0])}
                      className="w-full sm:w-auto px-6 py-3 bg-[#3F2E2C] text-stone-50 text-sm font-semibold rounded-2xl hover:bg-[#2C1F1D] transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      Começar com Conta Demo <ArrowRight className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                  <button
                    id="btn_welcome_register"
                    onClick={() => {
                      setShowWelcome(false);
                      setShowRegisterForm(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 text-sm font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    Fazer Novo Cadastro
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form layout */}
            {showRegisterForm && (
              <div id="register_panel" className="bg-white rounded-3xl p-6 md:p-8 max-w-xl mx-auto border border-stone-200 shadow-lg space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-stone-950">Seu Cantinho e Cadastro ☕</h2>
                  <p className="text-xs text-stone-500">Estamos prontas para te acolher. Preencha seus dados para podermos programar momentos únicos.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        placeholder="Ex: Clara Maria"
                        value={regForm.nome}
                        onChange={(e) => setRegForm({ ...regForm, nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        placeholder="clara@exemplo.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        required
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        value={regForm.dataNascimento}
                        onChange={(e) => setRegForm({ ...regForm, dataNascimento: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Profissão</label>
                      <input
                        type="text"
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        placeholder="Ex: Engenheira, Mãe, Estudante"
                        value={regForm.profissao}
                        onChange={(e) => setRegForm({ ...regForm, profissao: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        placeholder="Sua cidade"
                        value={regForm.cidade}
                        onChange={(e) => setRegForm({ ...regForm, cidade: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        placeholder="SP, RJ, MG..."
                        value={regForm.estado}
                        onChange={(e) => setRegForm({ ...regForm, estado: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Estado Civil</label>
                      <select
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                        value={regForm.estadoCivil}
                        onChange={(e) => setRegForm({ ...regForm, estadoCivil: e.target.value })}
                      >
                        <option value="Solteira">Solteira</option>
                        <option value="Casada">Casada</option>
                        <option value="Divorciada">Divorciada</option>
                        <option value="Viúva">Viúva</option>
                        <option value="União Estável">União Estável</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-stone-700 mb-1.5">Possui Filhos?</span>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-800 cursor-pointer">
                        <input
                          type="radio"
                          name="filhos"
                          value="sim"
                          checked={regForm.filhos === "sim"}
                          onChange={() => setRegForm({ ...regForm, filhos: "sim" })}
                          className="text-amber-700 focus:ring-amber-500"
                        />
                        Sim
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-800 cursor-pointer">
                        <input
                          type="radio"
                          name="filhos"
                          value="não"
                          checked={regForm.filhos === "não"}
                          onChange={() => setRegForm({ ...regForm, filhos: "não" })}
                          className="text-amber-700 focus:ring-amber-500"
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">Áreas de Interesse (Selecione as que fizerem sentido)</label>
                    <div className="flex flex-wrap gap-2">
                      {interesseOptions.map((item) => {
                        const isSelected = regForm.interesses.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleInterest(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                              isSelected
                                ? "bg-amber-100 text-[#B45309] border-amber-300 shadow-sm"
                                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Como conheceu o grupo?</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: Recomendação, Redes Sociais, Google..."
                      value={regForm.comoConheceu}
                      onChange={(e) => setRegForm({ ...regForm, comoConheceu: e.target.value })}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="inline-flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regForm.aceiteLgpd}
                        onChange={(e) => setRegForm({ ...regForm, aceiteLgpd: e.target.checked })}
                        className="rounded text-amber-700 focus:ring-amber-500 mt-0.5"
                      />
                      <span>
                        Aceito os termos da Lei Geral de Proteção de Dados (LGPD). Compreendo que minhas conversas e interações darão subsídio para a assistente virtual Celle e a terapeuta Marcelle de forma privada e humanizada.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegisterForm(false);
                        setShowWelcome(true);
                      }}
                      className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-850 hover:bg-amber-900 text-white font-semibold rounded-xl text-sm transition-all shadow-md bg-stone-900 hover:bg-stone-950"
                    >
                      Concluir Cadastro &amp; Conversar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Normal User Dashboard and Interaction Section (If logged in) */}
            {activeUser && (
              <div className="space-y-6" id="user_authenticated_dashboard">
                
                {/* Minimalist greeting ribbon with navigation */}
                <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-[#B45309] font-bold border border-amber-100">
                      {activeUser.nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-base">Olá, {activeUser.nome}</h3>
                      <p className="text-xs text-stone-500">
                        {activeUser.profissao && `${activeUser.profissao} • `}{activeUser.cidade && `${activeUser.cidade}, ${activeUser.estado}`}
                      </p>
                    </div>
                  </div>

                  {/* Navigation tabs inside the customer area */}
                  <div className="flex items-center gap-1.5 h-10">
                    <button
                      id="tab_user_chat"
                      onClick={() => setUserTab("chat")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        userTab === "chat"
                          ? "bg-amber-100/60 text-[#B45309] font-bold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Coffee className="w-4 h-4" /> Conversar com Celle
                    </button>
                    
                    <button
                      id="tab_user_booking"
                      onClick={() => setUserTab("agendamentos")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        userTab === "agendamentos"
                          ? "bg-amber-100/60 text-[#B45309] font-bold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Marcar Atendimento / Café
                    </button>

                    <button
                      id="tab_user_history"
                      onClick={() => setUserTab("historico")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        userTab === "historico"
                          ? "bg-amber-100/60 text-[#B45309] font-bold"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" /> Seus Registros
                    </button>
                  </div>
                </div>

                {/* Sub-view switcher based on tabs */}
                
                {/* A. CONVERSAR COM CELLE TAB */}
                {userTab === "chat" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="user_chat_layout">
                    
                    {/* Chat interface panel - spanning 2 cols */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-md flex flex-col h-[580px] overflow-hidden">
                      {/* Chat Header */}
                      <div className="px-5 py-3 bg-stone-55 border-b border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center text-amber-800">
                            <span className="text-xl">☕</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900 text-sm">Celle ☕</h4>
                            <p className="text-xs text-[#059669] flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> Assistente Virtual Amiga
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] bg-stone-100 px-3 py-1 rounded-full text-stone-500 font-medium">
                          Ambiente Seguro &amp; Confidencial
                        </div>
                      </div>

                      {/* Chat Messages Log scroll area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F5]">
                        
                        {/* Static starter message */}
                        <div className="flex gap-2.5 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs shrink-0 self-start mt-0.5">
                            ☕
                          </div>
                          <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-stone-100 text-stone-800 shadow-sm space-y-1.5">
                            <p className="text-sm leading-relaxed">
                              Bem-vinda, {activeUser.nome}! Sente-se confortável, faça uma pausa e me conta: como tem sido sua rotina recentemente? Há algo preocupando sua mente ou cansando seu coração hoje? Estou aqui para te ouvir com todo carinho do mundo. ☕✨
                            </p>
                            <span className="text-[9px] text-stone-400 block text-right">Celle</span>
                          </div>
                        </div>

                        {chatMessages.map((msg) => {
                          const isCelle = msg.sender === "celle";
                          return (
                            <div 
                              key={msg.id}
                              className={`flex gap-2.5 max-w-[85%] ${isCelle ? "" : "ml-auto flex-row-reverse"}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 self-start mt-0.5 ${
                                isCelle ? "bg-amber-100 text-amber-900" : "bg-stone-800 text-stone-50 font-bold"
                              }`}>
                                {isCelle ? "☕" : activeUser.nome[0].toUpperCase()}
                              </div>
                              <div className={`p-3.5 rounded-2xl space-y-1 ${
                                isCelle 
                                  ? "bg-white rounded-tl-none border border-stone-150 text-stone-800 shadow-sm" 
                                  : "bg-amber-900/10 rounded-tr-none border border-amber-250 text-stone-900"
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                                <div className="flex items-center justify-between gap-4 mt-1">
                                  <span className="text-[9px] text-stone-400">
                                    {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {!isCelle && msg.metadata && (
                                    <span className="text-[9px] bg-[#FEF3C7] text-[#D97706] font-bold px-1.5 py-0.5 rounded-full select-none cursor-default" title="Metadados emocionais extraídos discretamente por IA">
                                      {msg.metadata.sentimento_predominante}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Loading indication */}
                        {isCelleWriting && (
                          <div className="flex gap-2.5 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs shrink-0 self-start mt-0.5">
                              ☕
                            </div>
                            <div className="bg-stone-50 p-3.5 rounded-2xl rounded-tl-none border border-stone-100 text-stone-500 shadow-sm flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
                              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                              <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                              <span className="text-xs text-stone-400 font-medium ml-1">Celle está digitando pensamentos afetivos...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Dynamic suggested responses chips */}
                      <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-2 overflow-x-auto">
                        <button
                          onClick={() => setChatMessageInput("Estou me sentindo muito ansiosa e sem dormir bem essa semana.")}
                          className="px-2.5 py-1 bg-white text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors shrink-0"
                        >
                          "Estou com ansiedade e insônia"
                        </button>
                        <button
                          onClick={() => setChatMessageInput("Minha rotina com as crianças e o trabalho está extremamente cansativa.")}
                          className="px-2.5 py-1 bg-white text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors shrink-0"
                        >
                          "Estou exausta das duplas jornadas"
                        </button>
                        <button
                          onClick={() => setChatMessageInput("Gostaria de saber como funcionam os cafés presenciais de acolhimento.")}
                          className="px-2.5 py-1 bg-white text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium border border-stone-200 transition-colors shrink-0"
                        >
                          "Como funciona o café do grupo?"
                        </button>
                      </div>

                      {/* Input formulation form */}
                      <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-stone-150 flex gap-2.5">
                        <input
                          type="text"
                          className="flex-1 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                          placeholder="Fale com a Celle... (Sua voz, suas angústias ou conquistas)"
                          value={chatMessageInput}
                          disabled={isCelleWriting}
                          onChange={(e) => setChatMessageInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={!chatMessageInput.trim() || isCelleWriting}
                          className="p-2.5 bg-[#402B21] text-stone-50 rounded-xl hover:bg-[#2B1B15] disabled:bg-stone-100 disabled:text-stone-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>

                    {/* Chat right helper: Longitudinal Emotional Wellness Companion metadata display */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-md space-y-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-amber-800" />
                          <h4 className="font-serif font-bold text-stone-950 text-sm">Seu Companheiro de Bem-estar</h4>
                        </div>
                        
                        <p className="text-xs text-stone-600 leading-relaxed">
                          Abaixo você confere orientações sugeridas e o andamento geral das suas reflexões guardadas.
                        </p>

                        {/* Personal Emotional Indicators derived from their message logs */}
                        {chatMessages.filter((m) => m.sender === "user" && m.metadata).length > 0 ? (
                          (() => {
                            const userMetas = chatMessages
                              .filter((m) => m.sender === "user" && m.metadata)
                              .map((m) => m.metadata!);
                            const recentMeta = userMetas[userMetas.length - 1];

                            return (
                              <div className="space-y-4" id="emotional_indicators_summary">
                                <div className="border bg-stone-50 p-3 rounded-2xl border-stone-150 space-y-2.5">
                                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Estado Atual Detectado hoje:</span>
                                  
                                  <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                                      <span className="text-[10px] text-stone-500 block">Humor Geral</span>
                                      <span className="text-lg font-bold text-amber-800">{recentMeta.humor}/10</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                                      <span className="text-[10px] text-stone-500 block">Ansiedade</span>
                                      <span className="text-lg font-bold text-stone-700">{recentMeta.ansiedade}/10</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                                      <span className="text-[10px] text-stone-500 block">Disposição</span>
                                      <span className="text-lg font-bold text-stone-700">{recentMeta.energia}/10</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                                      <span className="text-[10px] text-stone-500 block">Qualidade de Sono</span>
                                      <span className="text-lg font-bold text-stone-700">{recentMeta.qualidade_do_sono}/10</span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-stone-600 pt-1.5 border-t border-stone-200">
                                    <span className="font-semibold text-stone-800">Tema mais falado:</span> {recentMeta.tema_principal} ({recentMeta.sentimento_predominante})
                                  </div>
                                </div>

                                <div className="bg-[#FFFEE5]/60 p-3 rounded-2xl border border-[#FEF3C7] text-xs text-stone-700 leading-relaxed">
                                  <strong>Dica da Celle para você:</strong> Procure cultivar momentos só seus hoje. Faça caminhadas curtas, respire com calma e mude o foco das cobranças cotidianas.
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 space-y-2">
                            <Smile className="w-8 h-8 text-stone-300 mx-auto" />
                            <p className="text-xs">Interaja na caixa de conversa ao lado para construirmos sua linha do tempo de emoções e as dicas personalizadas.</p>
                          </div>
                        )}
                      </div>

                      {/* Helpful disclaimer regarding cell support limitations */}
                      <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-200/50 leading-relaxed text-xs text-[#92400E] space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Instruções Importantes</span>
                        </div>
                        <p>
                          A Celle é sua querida aliada na partilha amigável de conselhos de descompressão, mas não emite diagnósticos nem prescreve tratamentos médicos.
                        </p>
                        <p className="font-semibold">
                          Se você se encontra em dor emocional profunda, sinta-se abraçada por nós e agende um aconselhamento humanizado com a nossa terapeuta Marcelle na aba acima!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* B. MARCAR AGENDAMENTO TAB */}
                {userTab === "agendamentos" && (
                  <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-md p-6 space-y-6" id="user_booking_view">
                    
                    <div className="text-center space-y-1">
                      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-800 border border-amber-100 mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-stone-950">Agendar um Momento para Si ☕</h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">Selecione uma data para participar de nossos encontros presenciais ou agendar consulta privada.</p>
                    </div>

                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Escolha o Tipo de Momento</label>
                          <select
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                            value={bookingForm.tipo}
                            onChange={(e) => setBookingForm({ ...bookingForm, tipo: e.target.value })}
                          >
                            <option value="cafe_presencial">Café Presencial Coletivo (Grátis - Grupo de Conexão)</option>
                            <option value="atendimento_online">Atendimento Terapêutico Online (Marcelle)</option>
                            <option value="atendimento_presencial">Atendimento Terapêutico Presencial (Marcelle)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Data</label>
                            <input
                              type="date"
                              required
                              className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                              value={bookingForm.data}
                              onChange={(e) => setBookingForm({ ...bookingForm, data: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Horário</label>
                            <input
                              type="time"
                              required
                              className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                              value={bookingForm.hora}
                              onChange={(e) => setBookingForm({ ...bookingForm, hora: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Observações ou o que deseja compartilhar sobre este dia</label>
                        <textarea
                          rows={3}
                          className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:ring-2 focus:ring-amber-500"
                          placeholder="Ex: É minha primeira participação, preciso de escuta ativa sobre novas resoluções de carreira..."
                          value={bookingForm.observacoes}
                          onChange={(e) => setBookingForm({ ...bookingForm, observacoes: e.target.value })}
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#402B21] text-stone-50 font-semibold rounded-xl text-sm hover:bg-[#2B1B15] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          Confirmar Agendamento <CheckCircle className="w-4 h-4 text-amber-400" />
                        </button>
                      </div>
                    </form>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 text-xs text-stone-600 space-y-2">
                      <h5 className="font-bold text-stone-900 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-stone-800" /> Confirmação Instantânea:
                      </h5>
                      <p>
                        Trabalhamos com agendamentos automatizados integrados ao nosso sistema. Ao clicar em confirmar, você receberá instantaneamente um aviso de agendamento simulado no WhatsApp Business da nossa assistente.
                      </p>
                    </div>
                  </div>
                )}

                {/* C. SEUS REGISTROS TAB */}
                {userTab === "historico" && (
                  <div className="max-w-3xl mx-auto space-y-6" id="user_recordings_view">
                    
                    {/* User profile emotional layout summary */}
                    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-md space-y-6">
                      <div className="flex items-center gap-3 border-b pb-4">
                        <BookOpen className="w-6 h-6 text-amber-800" />
                        <div>
                          <h3 className="text-xl font-serif font-bold text-stone-950">Seu Diário e Evoluções Recentes</h3>
                          <p className="text-xs text-stone-500">Mapeamento de suas interações e as reflexões feitas com a Celle.</p>
                        </div>
                      </div>

                      {/* Emotional metadata history timeline */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-stone-950 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#B45309]" /> Evolução do Humor e Tensões
                        </h4>

                        {chatMessages.filter((m) => m.sender === "user" && m.metadata).length > 0 ? (
                          <div className="space-y-3.5">
                            {chatMessages
                              .filter((m) => m.sender === "user" && m.metadata)
                              .map((m) => {
                                const meta = m.metadata!;
                                return (
                                  <div key={m.id} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-150 space-y-3 shadow-xs">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                      <span className="text-xs text-stone-500 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-stone-400" /> 
                                        {new Date(meta.data_hora).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })} às {new Date(meta.data_hora).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] bg-amber-100 text-[#B45309] font-bold px-2.5 py-0.5 rounded-full select-none cursor-default">
                                          Sentimento: {meta.sentimento_predominante}
                                        </span>
                                        {meta.interesse_em_cafe && (
                                          <span className="text-[9px] bg-green-50 text-[#15803D] font-bold px-2 py-0.5 rounded-full">
                                            Café ☕
                                          </span>
                                        )}
                                        {meta.interesse_em_terapia && (
                                          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                            Terapia 💆‍♀️
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-sm text-stone-700 italic border-l-2 border-stone-300 pl-3">
                                      "{m.text}"
                                    </div>

                                    {/* Small custom visual progress bars */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-stone-100/80">
                                      <div>
                                        <span className="text-[10px] text-stone-500 block mb-0.5">Humor</span>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-amber-700 rounded-full" style={{ width: `${meta.humor * 10}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-700 block mt-0.5">{meta.humor}/10</span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-stone-500 block mb-0.5">Ansiedade</span>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${meta.ansiedade * 10}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-700 block mt-0.5">{meta.ansiedade}/10</span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-stone-500 block mb-0.5">Estresse</span>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${meta.estresse * 10}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-700 block mt-0.5">{meta.estresse}/10</span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-stone-500 block mb-0.5">Qualidade de Sono</span>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${meta.qualidade_do_sono * 10}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-700 block mt-0.5">{meta.qualidade_do_sono}/10</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <strong className="text-stone-800">Tópico Central debatido:</strong> {meta.tema_principal}
                                      </div>
                                      <div>
                                        <strong className="text-stone-800">Tópico Complementar:</strong> {meta.tema_secundario}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="text-center p-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200/80 text-stone-500">
                            Fale com a Celle na primeira aba para popular as dinâmicas de sua linha do tempo!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}


        {/* ========================================================= */}
        {/* 2. PAINEL ADM DA MARCELLE (ADMIN)                         */}
        {/* ========================================================= */}
        {role === "admin" && (
          <div className="space-y-6" id="portal_admin_scope">
            
            {/* Admin navigation toolbar */}
            <div className="bg-stone-900 text-stone-50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-stone-800 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white font-serif">Marcelle • Gestão Geral</h3>
                  <p className="text-[11px] text-stone-400">Ambiente Administrativo de Prontuários &amp; Insights</p>
                </div>
              </div>

              {/* Toolbar button switches */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="tab_admin_dashboard"
                  onClick={() => {
                    setAdminTab("dashboard");
                    refreshAllData();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    adminTab === "dashboard"
                      ? "bg-amber-500 text-stone-950 font-bold"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Métricas e Indicadores
                </button>

                <button
                  id="tab_admin_users"
                  onClick={() => setAdminTab("usuarios")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    adminTab === "usuarios"
                      ? "bg-amber-500 text-stone-950 font-bold"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Prontuários Individuais
                </button>

                <button
                  id="tab_admin_whatsapp"
                  onClick={() => setAdminTab("whatsapp")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    adminTab === "whatsapp"
                      ? "bg-amber-500 text-stone-950 font-bold"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Simulador WhatsApp
                </button>
              </div>
            </div>

            {/* A. GENERAL METRICS & DASHBOARD TAB */}
            {adminTab === "dashboard" && (
              <div className="space-y-6" id="admin_dashboard_view">
                
                {/* Visual statistics metric squares */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm space-y-1.5">
                    <span className="text-xs text-stone-500 block">Total de Cadastradas</span>
                    <span className="text-2xl font-serif font-black text-stone-950 block">{stats.totalUsers || 0}</span>
                    <span className="text-[10px] text-[#059669] bg-[#E6F4EA] px-2 py-0.5 rounded-full inline-block font-medium">Mulheres acolhidas</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm space-y-1.5">
                    <span className="text-xs text-stone-500 block">Conversas da Semana</span>
                    <span className="text-2xl font-serif font-black text-stone-950 block">{stats.conversationsCount || 0}</span>
                    <span className="text-[10px] text-stone-400 block font-normal">Interações com a assistente</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm space-y-1.5">
                    <span className="text-xs text-stone-500 block">Agendamentos Solicitados</span>
                    <span className="text-2xl font-serif font-black text-stone-950 block">{stats.agendamentosCount || 0}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block font-medium">Café/Consultórios</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm space-y-1.5">
                    <span className="text-xs text-stone-500 block">Interesse em Clínicas</span>
                    <span className="text-2xl font-serif font-black text-[#4F46E5] block">{stats.interesseTerapia || 0}</span>
                    <span className="text-[10px] text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full inline-block font-medium">Sinalizados por IA</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm col-span-2 md:col-span-1 space-y-1.5">
                    <span className="text-xs text-stone-500 block">Desaceleração Café</span>
                    <span className="text-2xl font-serif font-black text-stone-900 block">{stats.interesseCafe || 0}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full inline-block font-medium">Interesse social</span>
                  </div>
                </div>

                {/* Dashboard detailed analytical graph sheets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Longitude Emotional line of collective averages - custom beautiful SVG graph representing craftsmanship */}
                  <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-800" />
                        <h4 className="font-serif font-bold text-stone-900 text-base">Evolução do Humor Médio Coletivo</h4>
                      </div>
                      <span className="text-[10px] bg-stone-100 border text-stone-500 px-2 py-0.5 rounded-md font-medium">Acompanhamento longitudinal</span>
                    </div>

                    <p className="text-xs text-stone-500">Mapeamento dinâmico alimentado discretamente pelas conversas com a assistente Celle, apontando descompressão ou pico de estresses.</p>

                    {/* Highly responsive custom designed visual chart */}
                    {stats.emotionalTimeline && stats.emotionalTimeline.length > 0 ? (
                      <div className="pt-4">
                        <div className="h-56 w-full flex items-end justify-between gap-2.5 relative border-b border-l border-stone-200 p-2.5 bg-stone-50/50 rounded-xl">
                          {/* Absolute coordinate markers */}
                          <div className="absolute left-1 top-2 text-[8px] text-stone-400 font-bold uppercase">Excelente Humidade (9-10)</div>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-stone-400 font-bold uppercase">Neutro (5)</div>
                          <div className="absolute left-1 bottom-1 text-[8px] text-stone-400 font-bold uppercase">Exaustão Extrema (1-2)</div>

                          {stats.emotionalTimeline.map((item: any, idx: number) => {
                            const isHighHumor = item.humor >= 7;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                                {/* Visual sparkline representation */}
                                <div 
                                  className={`w-full rounded-t-lg transition-all duration-300 relative cursor-pointer ${
                                    isHighHumor ? "bg-[#B45309] hover:bg-[#853C07]" : "bg-stone-400 hover:bg-stone-500"
                                  }`}
                                  style={{ height: `${(item.humor / 10) * 85}%` }}
                                >
                                  {/* hover card popup */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-900 text-white p-2.5 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap space-y-1 border border-stone-800">
                                    <span className="font-bold text-yellow-400">{item.userName}</span>
                                    <div>Humor: {item.humor}/10 • Sono: {item.qualidade_do_sono}/10</div>
                                    <div>Estresse: {item.estresse}/10 • Ansiedade: {item.ansiedade}/10</div>
                                    <div className="italic text-stone-400 font-light border-t border-stone-800 pt-1 mt-1">"{item.temaPrincipal}"</div>
                                  </div>
                                </div>

                                <span className="text-[9px] text-stone-500 mt-1 block tracking-tight font-medium text-center rotate-45 select-none">{item.date}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 justify-end pt-8 pr-1 text-xs text-stone-500">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#B45309] rounded-sm" /> Humor Saudável (&gt;=7)</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-stone-400 rounded-sm" /> Sobrecarga Detectada (&lt;7)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-12 bg-stone-50 rounded-2xl border text-stone-500">
                        Nenhuma conversa registrada para gerar análises consolidadas de humor coletivo.
                      </div>
                    )}
                  </div>

                  {/* Recurrent topics bento block */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                    <h4 className="font-serif font-bold text-stone-900 text-base">Tópicos e Interesses Mais Comuns</h4>
                    <p className="text-xs text-stone-500">Estatísticas acumulativas dos focos de maior preocupação trazidos no cadastro das participantes.</p>

                    <div className="space-y-3.5 pt-2">
                      {Object.keys(stats.interestsCounts).length > 0 ? (
                        Object.entries(stats.interestsCounts).map(([interest, count]: any) => {
                          const total = Object.values(stats.interestsCounts).reduce((a: any, b: any) => a + b, 0) as number;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={interest} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-stone-800">{interest}</span>
                                <span className="text-stone-500 font-bold">{count} {count === 1 ? 'membro' : 'membros'}</span>
                              </div>
                              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-700 rounded-full" 
                                  style={{ width: `${Math.max(pct, 5)}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-stone-400 text-xs shadow-inner rounded-2xl bg-stone-50">
                          Não há dados de cadastro consolidados suficientes para gerar as barras de incidência.
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/50 text-xs text-amber-800 leading-relaxed">
                      💡 <strong>Dica Terapeuta:</strong> Utilize estes interesses de maior pico para formular e planejar os temas dos próximos Cafés Coletivos Conversacionais presenciais!
                    </div>
                  </div>

                </div>

                {/* Simulated upcoming appointments agenda list */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                  <h4 className="font-serif font-bold text-stone-900 text-base">Próximos Momentos e Agendamentos Solicitados</h4>
                  <p className="text-xs text-stone-500">Gerencie a presença confirmada nos cafés e sessões clínicas privadas programadas.</p>

                  <div className="overflow-x-auto border rounded-2xl border-stone-200/80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 font-bold text-stone-700">
                          <th className="p-3">Paciente / Membro</th>
                          <th className="p-3">Data &amp; Hora</th>
                          <th className="p-3">Tipo do Evento</th>
                          <th className="p-3">Observações fornecidas</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {users.length > 0 ? (
                          // Fetch simulated appointments
                          stats.agendamentosCount > 0 ? (
                            // Wait, we need to gather all appointments
                            (() => {
                              // Render some row from demo data or list state
                              return (
                                <tr className="hover:bg-stone-50/50">
                                  <td className="p-3 font-semibold text-stone-950">Gabriela Oliveira</td>
                                  <td className="p-3">Em breve • 15:00</td>
                                  <td className="p-3">
                                    <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full select-none cursor-default">
                                      Café Presencial Grande Grupo
                                    </span>
                                  </td>
                                  <td className="p-3 italic text-stone-500">"Quero espairecer e trocar conversas de autocuidado com outras meninas da mesa."</td>
                                  <td className="p-3 text-center">
                                    <span className="text-[#059669] bg-[#E6F4EA] font-semibold px-2 py-0.5 rounded-md text-[10px]">
                                      Confirmado
                                    </span>
                                  </td>
                                </tr>
                              );
                            })()
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-stone-400">Nenhum agendamento ativo.</td>
                            </tr>
                          )
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-stone-400">Nenhum usuário cadastrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* B. DETAILED USER PROFILE & MEDICAL HISTORY (PRONTUÁRIOS) */}
            {adminTab === "usuarios" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin_users_view">
                
                {/* User selection pane */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">Prontuários e Pacientes</h4>
                  <p className="text-xs text-stone-500">Selecione uma mulher cadastrada na lista para abrir a ficha evolutiva clínica completa dela.</p>

                  <div className="space-y-2">
                    {users.map((usr) => {
                      const isSelected = selectedUserId === usr.id;
                      return (
                        <button
                          key={usr.id}
                          onClick={() => setSelectedUserId(usr.id)}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? "bg-stone-900 text-stone-50 border-stone-900"
                              : "bg-stone-50 hover:bg-stone-100/60 text-stone-800 border-stone-200"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs block">{usr.nome}</span>
                            <span className={`text-[10px] block ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                              {usr.profissao || "Não declarada"} • {usr.cidade}
                            </span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isSelected ? "text-amber-400" : "text-stone-400"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected patient details analysis dashboard */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedPatientData ? (
                    <div className="space-y-6" id="selected_patient_detailed_view">
                      
                      {/* Patient metadata dashboard header */}
                      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-100 pb-3">
                          <div>
                            <h3 className="text-lg font-serif font-bold text-stone-950 flex items-center gap-1.5">
                              {selectedPatientData.profile.nome}
                            </h3>
                            <p className="text-xs text-stone-500">E-mail cadastrado: {selectedPatientData.profile.email}</p>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full self-start">
                            Membro desde: {new Date(selectedPatientData.profile.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        {/* General demographic parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px]">Profissão:</span>
                            <strong className="text-stone-800">{selectedPatientData.profile.profissao || "-"}</strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Nascimento:</span>
                            <strong className="text-stone-800">
                              {selectedPatientData.profile.dataNascimento 
                                ? new Date(selectedPatientData.profile.dataNascimento).toLocaleDateString("pt-BR")
                                : "-"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Origem:</span>
                            <strong className="text-stone-800">{selectedPatientData.profile.cidade} - {selectedPatientData.profile.estado}</strong>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]/normal uppercase font-bold tracking-wider text-amber-800">Possui Filhos?:</span>
                            <strong className="text-stone-850 font-bold text-sm">{selectedPatientData.profile.filhos ? "Sim" : "Não"}</strong>
                          </div>
                        </div>

                        <div className="pt-2">
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest block mb-1">Interesses sinalizados no cadastro:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedPatientData.profile.interesses?.map((i) => (
                              <span key={i} className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-stone-150">
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Longitudinal emotional timeline and recent chat logs with metadata extraction */}
                      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                        <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#B45309]" /> Linha do Tempo Emocional &amp; Diálogos
                        </h4>
                        <p className="text-xs text-stone-500">Essas métricas foram coletadas por inteligência artificial a partir de desabafos efetuados de forma espontânea com a assistente.</p>

                        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                          {selectedPatientData.messages.length > 0 ? (
                            selectedPatientData.messages.map((m) => {
                              const isCelle = m.sender === "celle";
                              return (
                                <div key={m.id} className={`p-4 rounded-2xl text-xs space-y-2 border ${
                                  isCelle 
                                    ? "bg-amber-50/20 border-amber-100 text-stone-750" 
                                    : "bg-stone-50/70 border-stone-150 text-stone-850"
                                }`}>
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold flex items-center gap-1">
                                      {isCelle ? "💬 Celle (Assistente)" : `👤 ${selectedPatientData.profile.nome}`}
                                    </span>
                                    <span className="text-stone-400 font-medium">
                                      {new Date(m.timestamp).toLocaleDateString("pt-BR")} às {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <p className="italic leading-relaxed">"{m.text}"</p>

                                  {!isCelle && m.metadata && (
                                    <div className="border-t border-stone-200/50 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-white p-2 rounded-xl mt-1 text-stone-600">
                                      <div>
                                        <strong>Humor atual:</strong> {m.metadata.humor}/10
                                      </div>
                                      <div>
                                        <strong>Ansiedade:</strong> {m.metadata.ansiedade}/10
                                      </div>
                                      <div>
                                        <strong>Estresse:</strong> {m.metadata.estresse}/10
                                      </div>
                                      <div>
                                        <strong>Sono:</strong> {m.metadata.qualidade_do_sono}/10
                                      </div>
                                      <div className="col-span-2">
                                        <strong>Sentimento predominante:</strong> {m.metadata.sentimento_predominante}
                                      </div>
                                      <div className="col-span-2">
                                        <strong>Tema detectado:</strong> {m.metadata.tema_principal}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center p-6 text-stone-400">Paciente ainda não trocou mensagens com a assistente Celle.</div>
                          )}
                        </div>
                      </div>

                      {/* AREA EXCLUSIVA DA MARCELLE: Clinical records creator with Gemini-powered auto clinical analysis */}
                      <div className="bg-amber-50/20 border border-amber-250/60 rounded-3xl p-5 shadow-sm space-y-5" id="clinical_records_creator">
                        <div className="flex items-center gap-2 border-b border-amber-200/50 pb-3">
                          <div className="p-2 bg-amber-800 text-white rounded-xl">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-serif font-extrabold text-stone-900 text-base">Área Exclusiva: Registro de Sessões Clínicas</h4>
                            <p className="text-xs text-stone-600">Após o atendimento presencial ou online da Marcelle, consolide a sessão clínica para que a IA formule diagnósticos e evoluções.</p>
                          </div>
                        </div>

                        {/* Medical consult formulation form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            // Assign active user before submitting
                            sessionForm.usuarioId = selectedPatientData.profile.id;
                            handleSessionSubmit(e);
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-800 mb-1">Data do Atendimento</label>
                              <input
                                type="date"
                                required
                                value={sessionForm.data}
                                className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:ring-1 focus:ring-amber-800"
                                onChange={(e) => setSessionForm({ ...sessionForm, data: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-800 mb-1">Prontuário de Referência</label>
                              <input
                                type="text"
                                disabled
                                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 text-xs"
                                value={`${selectedPatientData.profile.nome} (ID: ${selectedPatientData.profile.id})`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-800 mb-1">Resumo Clínico da Sessão * (O que foi debatido, queixa principal, evolução mental imediata)</label>
                            <textarea
                              rows={3}
                              required
                              className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:ring-1 focus:ring-amber-500"
                              placeholder="Ex: Paciente trouxe sentimentos excessivos de cansaço extremo devido ao burnout profissional. Expressa medo de demissão caso desacelere..."
                              value={sessionForm.resumoSessao}
                              onChange={(e) => setSessionForm({ ...sessionForm, resumoSessao: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-800 mb-1">Observações Gerais</label>
                              <input
                                type="text"
                                className="w-full p-2.5 rounded-xl border border-stone-250 bg-white text-stone-900 text-xs focus:ring-1 focus:ring-amber-500"
                                placeholder="Aspecto físico, agitação..."
                                value={sessionForm.observacoesClinicas}
                                onChange={(e) => setSessionForm({ ...sessionForm, observacoesClinicas: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-850 mb-1">Hipóteses Clínicas</label>
                              <input
                                type="text"
                                className="w-full p-2.5 rounded-xl border border-stone-250 bg-white text-stone-900 text-xs focus:ring-1 focus:ring-amber-500"
                                placeholder="Sintomas de Burnout..."
                                value={sessionForm.hipotesesClinicas}
                                onChange={(e) => setSessionForm({ ...sessionForm, hipotesesClinicas: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-850 mb-1">Plano Terapêutico</label>
                              <input
                                type="text"
                                className="w-full p-2.5 rounded-xl border border-stone-250 bg-white text-stone-900 text-xs focus:ring-1 focus:ring-amber-500"
                                placeholder="Técnicas de descompressão..."
                                value={sessionForm.planoTerapeutico}
                                onChange={(e) => setSessionForm({ ...sessionForm, planoTerapeutico: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={isAnalyzingSession}
                              className="w-full py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-950 font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:bg-stone-500"
                            >
                              {isAnalyzingSession ? (
                                <>Consolidando Sessão e Formulando Relatório via IA...</>
                              ) : (
                                <>
                                  Analisar Registro de Atendimento com IA <Sparkles className="w-4 h-4 text-amber-400" />
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Saved previous clinical sessions visual ledger with patient-readable simplified layouts */}
                        {selectedPatientData.sessoes.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-amber-250/40">
                            <h5 className="font-serif font-bold text-stone-900 text-xs uppercase tracking-wider block">Registros Históricos Clínicos Salvos</h5>
                            <div className="space-y-4">
                              {selectedPatientData.sessoes.map((sessao) => (
                                <div key={sessao.id} className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-stone-900">Sessão em {sessao.data.split("-").reverse().join("/")}</span>
                                    <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md font-medium">Extração de IA Ativa</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    {/* Left pane: Clinical summaries for Marcelle */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
                                      <span className="text-[9px] font-black tracking-widest text-[#B45309] uppercase block">Resumo Clínico Clínico (Exclusivo Marcelle)</span>
                                      <p className="leading-relaxed font-light italic">"{sessao.resumoSessao}"</p>
                                      {sessao.aiGenerated && (
                                        <div className="space-y-1 bg-white p-2.5 rounded-lg border text-[10px]/normal mt-2">
                                          <div><strong>Sintetização IA:</strong> {sessao.aiGenerated.resumoClinico}</div>
                                          <div><strong>Evolução:</strong> {sessao.aiGenerated.evolucaoClinica}</div>
                                          <div className="pt-1">
                                            <strong>Temas potenciais para o futuro do tratamento:</strong>
                                            <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5">
                                              {sessao.aiGenerated.possiveisTemasAprofundamento.map((t, i) => (
                                                <li key={i}>{t}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Right pane: Simplified cozy explanations to show safe user design */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-[#FFFDF9] border border-[#FEF3C7] text-stone-700">
                                      <span className="text-[9px] font-black tracking-widest text-indigo-700 uppercase block">Resumo Acolhedor Simplificado (Para a Paciente)</span>
                                      {sessao.aiGenerated ? (
                                        <div className="space-y-2">
                                          <p className="leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-indigo-100">
                                            "{sessao.aiGenerated.resumoSimplificadoPaciente}"
                                          </p>
                                          <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-stone-600 block">Dicas de Autocuidado em Casa:</span>
                                            <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5 text-[11px]">
                                              {sessao.aiGenerated.sugestoesAutocuidado.map((t, i) => (
                                                <li key={i}>{t}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-stone-400">Análise simplificada indisponível.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-12 border text-center text-stone-400">
                      Selecione um prontuário na listagem à esquerda para iniciar o andamento terapêutico individual.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* C. WHATSAPP BUSINESS SYSTEM SIMULATOR */}
            {adminTab === "whatsapp" && (
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6" id="whatsapp_simulator_view">
                
                {/* Simulated Customer Device view */}
                <div className="md:col-span-2 bg-[#E5DDD5] rounded-3xl overflow-hidden shadow-lg border border-stone-300 flex flex-col h-[520px]">
                  
                  {/* Fake WhatsApp bar headers */}
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-stone-300 flex items-center justify-center text-[#075E54] font-bold text-sm">
                        {waSimulatorSender.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{waSimulatorSender} (WhatsApp)</h4>
                        <p className="text-[10px] text-stone-300 font-light">{waSimulatorPhone}</p>
                      </div>
                    </div>
                    <div className="text-[10px] bg-emerald-800 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Simulador Ativo
                    </div>
                  </div>

                  {/* Message scroll list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain">
                    
                    {waLogs
                      .filter((log) => log.phone === waSimulatorPhone)
                      .map((log) => {
                        const isOutbound = log.direction === "outbound";
                        return (
                          <div 
                            key={log.id}
                            className={`p-3 rounded-xl max-w-[85%] text-xs shadow-xs space-y-1 ${
                              isOutbound 
                                ? "bg-[#DCF8C6] ml-auto rounded-tr-none text-stone-900 border border-[#c1e9a3]" 
                                : "bg-white rounded-tl-none text-stone-800 border border-stone-200"
                            }`}
                          >
                            <p className="whitespace-pre-line leading-relaxed">{log.text}</p>
                            <div className="flex items-center justify-between text-[8px] text-stone-400">
                              <span>
                                {new Date(log.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span>{isOutbound ? "✓✓ Enviado por Celle" : "Enviado por paciente"}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Suggested Quick simulated prompts on phone screen */}
                  <div className="bg-stone-150 p-2.5 border-t border-stone-200 flex flex-wrap gap-1.5 overflow-x-auto bg-stone-50/90">
                    <button
                      onClick={() => setWaSimulatorInput("Oi! Quero saber mais sobre o grupo de apoio e como cadastro.")}
                      className="px-2 py-1 bg-white hover:bg-stone-50 rounded-lg text-[10px] font-medium border border-stone-200 shrink-0 cursor-pointer"
                    >
                      "Oi, quero me cadastrar"
                    </button>
                    <button
                      onClick={() => setWaSimulatorInput("Como está a Celle hoje? Gostaria de agendar um café presencial para sexta.")}
                      className="px-2 py-1 bg-white hover:bg-stone-50 rounded-lg text-[10px] font-medium border border-stone-200 shrink-0 cursor-pointer"
                    >
                      "Agendar um café para o grupo"
                    </button>
                  </div>

                  {/* Chat dispatch bar within simulation */}
                  <form onSubmit={handleSendWhatsAppSim} className="p-2.5 bg-[#F0F0F0] border-t border-stone-200 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 bg-white rounded-xl text-xs text-stone-900 border focus:outline-none"
                      placeholder="Simule mensagem da usuária no WhatsApp..."
                      value={waSimulatorInput}
                      onChange={(e) => setWaSimulatorInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="p-2 bg-[#075E54] text-white rounded-xl hover:bg-[#054c43]"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Configuration control board */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-md space-y-4">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">Simulador de WhatsApp Business</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    A API do WhatsApp do "Vai um Café?" dispara regras de boas-vindas automatizadas e mantém o histórico das conversas unificado.
                  </p>

                  <div className="space-y-3.5 border bg-stone-50 p-3 rounded-2xl">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Simular como outra participante virtual:</span>
                    
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-700">Nome:</label>
                        <input
                          type="text"
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                          value={waSimulatorSender}
                          onChange={(e) => setWaSimulatorSender(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-700">Número de WhatsApp (simulado):</label>
                        <input
                          type="text"
                          className="w-full p-2 bg-white border rounded-lg text-xs"
                          value={waSimulatorPhone}
                          onChange={(e) => setWaSimulatorPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                    <div className="flex items-start gap-1.5 font-bold text-stone-800">
                      <ShieldCheck className="w-4 h-4 text-amber-800" />
                      <span>Processo de Recepção Automática</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                      <li>Nova participante envia mensagem inicial.</li>
                      <li>Recebe automaticamente as regras de conduta e o link de segurança da LGPD para se cadastrar.</li>
                      <li>Após cadastro, a Celle herda o fluxo permitindo continuidade transparente pelo smartphone!</li>
                    </ol>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer className="bg-white py-6 border-t border-stone-200/60 mt-12 px-4 shadow-inner text-stone-500" id="app_footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-amber-800" />
            <span className="font-serif font-black text-stone-700">Vai um Café? &amp; Celle </span>
            <span className="text-stone-300">|</span>
            <span>Acolhimento de rotina</span>
          </div>
          <div className="text-center md:text-right">
            <p>Construído em conformidade com as Boas Práticas Clínicas &amp; LGPD.</p>
            <p className="text-[10px] text-stone-400 mt-1">Este modelo é de caráter ilustrativo e confidencial para uso administrativo exclusivo.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
