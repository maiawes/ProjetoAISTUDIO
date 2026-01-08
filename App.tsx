
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Timer, BookOpen, Calendar, LogOut, Moon, Sun, 
  Gavel, Play, Pause, RotateCcw, Trash2, ExternalLink, ChevronRight,
  ChevronDown, User, Mail, Lock, CheckCircle, AlertTriangle, Plus, PlusCircle,
  X, RefreshCw, Zap, Settings2, Check, Scale, Globe, Bell, ListChecks, Filter,
  Coffee, Brain, Gamepad2, ArrowRight, Loader2, Save, WifiOff, Cloud, CloudOff, CloudUpload
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import Sitemap from './components/Sitemap';

// --- Firebase Configuration ---
// ATENÇÃO: Substitua pelos seus dados reais do Console do Firebase
// Se a API Key for o placeholder, o app entrará em "Modo Demo" automaticamente.
const firebaseConfig = {
  apiKey: "AIzaSyAcgYFNBKP7e8Qx5k9DcRQSNIOj4hQmBRY",
  authDomain: "projetoaistudio.firebaseapp.com",
  projectId: "projetoaistudio",
  storageBucket: "projetoaistudio.firebasestorage.app",
  messagingSenderId: "861465542556",
  appId: "1:861465542556:web:f77d5a190dd53554d51259",
  measurementId: "G-6JKYC5SEHE"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyD-YOUR_API_KEY_HERE";

// Initialize Firebase only if configured
let auth: any, db: any;
if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable Offline Persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log('Persistence failed: multiple tabs open');
      } else if (err.code == 'unimplemented') {
          console.log('Persistence not supported by browser');
      }
    });
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
  }
}

// --- Types ---
interface Subject {
  id: string;
  discipline: string;
  name: string;
  relevance: number;
  timeSpent: number;
  questionLink?: string;
  jurisprudencia?: string;
  lastStudied?: string | null; // Changed to allow null for Firestore compatibility
  needsReview?: boolean;
}

interface UserState {
  subjects: Subject[];
  schedule: Record<number, string[]>;
  pomodoroConfig: { focus: number; short: number; long: number };
  theme: 'light' | 'dark';
}

interface AuthUser {
  uid: string;
  email: string;
}

// --- Jurisprudência Mapping Data ---
const JURIS_DB: Record<string, string> = {
  "Língua Portuguesa": "Tribunais: Matéria eminentemente gramatical e interpretativa. Jurisprudência rara, foco em anulação de questões por ambiguidade.",
  "Inviolabilidade do domicílio": "STF: Entrada forçada somente é lícita quando houver fundadas razões, devidamente justificadas a posteriori (Tema 280).",
  "Direito à intimidade vs. interesse público": "STF: Divulgação de fatos de interesse público não gera dano moral automático (Tema 786).",
  "Direito de reunião": "STF: Independe de autorização, mas exige prévio aviso à autoridade competente.",
  "Liberdade de expressão": "STF: Não é absoluta; não protege discurso de ódio nem apologia ao crime.",
  "Segurança Pública": "STF: Polícia Civil exerce função de polícia judiciária, não podendo ser esvaziada por outros órgãos.\nSTF: Guardas Municipais não têm atribuição investigativa ampla, apenas proteção de bens e serviços.",
  "Direitos Políticos": "STF: Condenação criminal transitada em julgado → suspensão dos direitos políticos automática (art. 15, III, CF).",
  "Princípios da Administração Pública": "STF/STJ: Princípio da legalidade estrita para a Administração.\nSTF: Violação aos princípios do art. 37 pode configurar improbidade, mesmo sem dano ao erário (antes da reforma).",
  "Agentes públicos": "STF: Acumulação ilícita de cargos → devolução dos valores somente se comprovada má-fé.\nSTF: Estágio probatório não dispensa contraditório e ampla defesa para exoneração.",
  "Poder de polícia": "STJ: Poder de polícia é indelegável a pessoas jurídicas de direito privado, salvo atos materiais.\nSTF: Multas administrativas não podem ter caráter confiscatório.",
  "Responsabilidade civil do Estado": "STF (Tema 940): Responsabilidade objetiva do Estado; Direito de regresso contra o agente com dolo ou culpa.\nSTF: Omissão do Estado → responsabilidade subjetiva (necessidade de prova de culpa).",
  "Infração penal": "STF/STJ: Crime exige tipicidade + ilicitude + culpabilidade.\nSTF: Princípio da insignificância exige mínima ofensividade, nenhuma periculosidade social, reduzido grau de reprovabilidade e inexpressividade da lesão.",
  "Erro de tipo e erro de proibição": "STJ: Erro de tipo exclui dolo, podendo gerar culpa.\nSTF: Erro de proibição inevitável exclui culpabilidade; evitável → redução de pena.",
  "Concurso de pessoas": "STJ: Participação de menor importância → redução obrigatória de pena.\nSTF: Teoria do domínio do fato aplicada com cautela (não é automática).",
  "Crimes contra a administração pública": "STF: Crime de corrupção passiva independe do efetivo recebimento da vantagem.\nSTJ: Crime de peculato admite forma culposa.",
  "Inquérito policial": "STF: Inquérito é procedimento administrativo, inquisitivo e dispensável; não há contraditório pleno.",
  "Prova": "STF: Prova ilícita é inadmissível, salvo fonte independente.\nSTF: Cadeia de custódia é requisito de validade da prova.",
  "Prisão em flagrante": "STF: Flagrante não exige mandado.\nSTJ: Flagrante preparado → crime impossível.",
  "Prisão preventiva": "STF/STJ: Exige fundamentação concreta; gravidade abstrata não basta.\nSTF: Audiência de custódia é obrigatória.",
  "Prisão temporária": "STF: Somente para crimes expressamente previstos em lei.\nSTJ: Prazo é taxativo.",
  "Tráfico ilícito": "STF: Usuário não comete crime hediondo.\nSTF (Tema 712): Tráfico privilegiado não é hediondo.",
  "Crimes hediondos": "STF: Regime inicial não é automaticamente fechado; progressão deve observar individualização.",
  "Abuso de Autoridade": "STF: Exige dolo específico (finalidade de prejudicar, beneficiar ou agir por capricho).\nSTJ: Erro de interpretação razoável não configura crime.",
  "Estatuto do desarmamento": "STF: Porte ilegal é crime de perigo abstrato.\nSTJ: Numeração raspada → crime autônomo.",
  "Interceptação telefônica": "STF: Decisão judicial fundamentada, prazo de 15 dias prorrogável.\nSTJ: Prova emprestada é válida se houver contraditório.",
  "Pacote Anti-Crime": "STF: Juiz das garantias válido; ANPP retroage se mais benéfico.",
  "Estrutura do Executivo PR": "STF: Regime estatutário não afasta princípios constitucionais.\nSTJ: PAD exige contraditório e ampla defesa.\nSTF: Sanções administrativas não afastam responsabilidade penal."
};

// --- PCPR Official Content Data ---
const DISCIPLINE_DATA = [
  {
    "materia": "Língua Portuguesa",
    "assuntos": [
      "Apreensão do significado global dos textos", "Estabelecimento de relações intratextuais e intertextuais",
      "Identificação de ideias principais/secundárias e relações", "Organização argumentativa: tese e argumentos",
      "Dedução de ideias implícitas e inferência de sentidos", "Reconhecimento de diferentes 'vozes' no texto",
      "Posição do autor (fato/opinião)", "Significado de palavras em contextos",
      "Recursos coesivos (expressões, pronomes)", "Relações estruturais e semânticas entre frases",
      "Compreensão de textos complexos", "Ambiguidade, paráfrase, sinonímia e antonímia",
      "Reconhecimento da função de recursos gramaticais", "Domínio da norma padrão (gramática, ortografia)",
      "Variedades linguísticas", "Recursos verbais e não verbais (charges, gráficos)"
    ]
  },
  {
    "materia": "Informática",
    "assuntos": [
      "Sistema Operacional Linux (Ubuntu 14+)", "Operação com arquivos, Internet e Redes no Linux",
      "Planilhas Eletrônicas (LibreOffice Calc)", "Editor de Texto (LibreOffice Writer)",
      "Funcionamento de periféricos (impressoras/digitalizadoras)", "Conceitos de Internet, Intranet e gestão de info"
    ]
  },
  {
    "materia": "Estrutura do Executivo PR",
    "assuntos": [
      "Const. PR: Adm. Pública (Título II) e Poder Executivo (Título III)",
      "Lei Estadual nº 8.485/1987: Artigos 1º ao 43"
    ]
  },
  {
    "materia": "Direito Processual Penal",
    "assuntos": [
      "Prisão em flagrante", "Prisão preventiva", "Prisão temporária (Lei n.° 7.960/1989)",
      "Inquérito policial; notitia criminis", "Ação penal: espécies", "Jurisdição e competência",
      "Prova (artigos 158 a 184 do CPP)"
    ]
  },
  {
    "materia": "Direito Penal",
    "assuntos": [
      "Infração penal: elementos, espécies", "Sujeito ativo e sujeito passivo da infração penal",
      "Tipicidade, ilicitude, culpabilidade, punibilidade", "Erro de tipo e erro de proibição",
      "Imputabilidade penal", "Concurso de pessoas", "Crimes contra a administração pública",
      "Crimes contra o patrimônio", "Crimes contra a pessoa"
    ]
  },
  {
    "materia": "Direito Administrativo",
    "assuntos": [
      "Poderes administrativos: hierárquico, disciplinar, regulamentar, polícia",
      "Controle e responsabilização da administração", "Organização administrativa da União: administração direta e indireta",
      "Estado, governo e administração pública: conceitos, elementos, poderes",
      "Agentes públicos: espécies, classificação, poderes, deveres, regime jurídico",
      "Serviços públicos: conceito, classificação, regulamentação"
    ]
  },
  {
    "materia": "Direito Constitucional",
    "assuntos": [
      "Direitos e deveres fundamentais (individuais, coletivos, sociais)",
      "Defesa do Estado e das instituições democráticas (Segurança Pública)",
      "Declaração Universal dos Direitos Humanos (ONU – 1948)",
      "Poder Legislativo: fundamento e atribuições", "Poder Executivo: forma de governo, atribuições do Presidente",
      "Ordem social: seguridade, educação, cultura, meio ambiente"
    ]
  },
  {
    "materia": "Raciocínio Lógico",
    "assuntos": [
      "Resolução de problemas: números reais, conjuntos, contagem, porcentagem",
      "Problemas de raciocínio lógico: propsições, conectivos, equivalência",
      "Compreensão de estruturas lógicas", "Sistemas, equações e regra de três",
      "Semelhança e relações métricas no triângulo retângulo", "Área, volume e capacidade",
      "Medidas de tendência central, tabelas e gráficos", "Lógica de argumentação: analogias, inferências, deduções",
      "Diagramas lógicos", "Princípios de contagem e probabilidade"
    ]
  },
  {
    "materia": "Legislação Penal Especial",
    "assuntos": [
      "Tráfico ilícito e uso indevido de drogas (Lei nº 11.343/2006)", "Estatuto do desarmamento (Lei nº 10.826/2003)",
      "Abuso de Autoridade (Lei nº 13.869/2019)", "Crimes de tortura (Lei nº 9.455/1997)",
      "Crimes hediondos (Lei nº 8.072/1990)", "Crimes resultantes de preconceitos de raça ou de cor (Lei nº 7.716/1989)",
      "Estatuto da Criança e do Adolescente (Lei nº 8.069/1990)", "Crimes previstos no Código de proteção e defesa do consumidor (Lei nº 8.078/1990)",
      "Crimes contra o meio ambiente (Lei nº 9.605/1998)", "Juizados especiais (Lei nº 9.099/1995 e Lei nº 10.259/2001)",
      "Crimes previstos no Código de Trânsito Brasileiro (Lei nº 9.503/1997)", "Interceptação telefônica (Lei nº 9.296/1996)",
      "Lei nº 12.830/2013 (Investigação Criminal)", "Pacote Anti-Crime (Lei nº 13.964/2019)"
    ]
  }
];

const getInitialJuris = (discipline: string, topic: string) => {
  const match = Object.keys(JURIS_DB).find(key => 
    topic.toLowerCase().includes(key.toLowerCase()) || 
    discipline.toLowerCase().includes(key.toLowerCase())
  );
  return match ? JURIS_DB[match] : "";
};

const INITIAL_SUBJECTS: Subject[] = DISCIPLINE_DATA.flatMap(m => 
  m.assuntos.map((name, i) => ({
    id: `${m.materia.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    discipline: m.materia,
    name,
    relevance: 0, 
    timeSpent: 0,
    questionLink: "",
    jurisprudencia: getInitialJuris(m.materia, name),
    needsReview: false,
    lastStudied: null // Fixed: Use null instead of undefined for Firestore compatibility
  }))
);

const CRONOGRAMA_PADRAO: Record<number, string[]> = {
  0: ["Descanso Ativo"],
  1: ["Língua Portuguesa", "Direito Penal"],
  2: ["Informática", "Direito Processual Penal"],
  3: ["Raciocínio Lógico", "Direito Administrativo"],
  4: ["Legislação Penal Especial", "Direito Constitucional"],
  5: ["Estrutura do Executivo PR", "Revisão"],
  6: ["Simulado Completo", "Revisão"]
};

// --- Contexts ---
const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isDemo: boolean;
} | null>(null);

const StudyContext = createContext<{
  state: UserState;
  updateState: (update: Partial<UserState>) => void;
  addTime: (ids: string[], seconds: number) => void;
  markReviewComplete: (id: string) => void;
  addScheduleItem: (day: number, subject: string) => void;
  removeScheduleItem: (day: number, subject: string) => void;
  resetSchedule: () => void;
  bulkUpdateSchedule: (newSchedule: Record<number, string[]>) => void;
  updateSubjectData: (id: string, data: Partial<Subject>) => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
} | null>(null);

const useAuth = () => useContext(AuthContext)!;
const useStudy = () => useContext(StudyContext)!;

// --- Helper Functions ---
const checkPreviewEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  const r = window.location.href.toLowerCase();
  return ['googleusercontent', 'webcontainer', 'shim', '.goog', 'scf.usercontent', 'stackblitz', 'codesandbox'].some(i => h.includes(i) || r.includes(i));
};

// --- UI Components ---

const Sidebar = () => {
  const { pathname } = useLocation();
  const { state, updateState } = useStudy();
  const { logout } = useAuth();

  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { path: '/pomodoro', icon: Timer, label: 'Pomodoro' },
    { path: '/edital', icon: BookOpen, label: 'Edital' },
    { path: '/schedule', icon: Calendar, label: 'Cronograma' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-20 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-all duration-300">
      <div className="p-8 flex items-center space-x-4">
        <div className="w-12 h-12 bg-pcpr-blue rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Gavel size={24} />
        </div>
        <div className="hidden lg:block">
          <h2 className="font-extrabold text-xl tracking-tighter text-pcpr-blue dark:text-white uppercase">PCPR HUB</h2>
        </div>
      </div>
      <nav className="flex-grow px-4 space-y-2 mt-4">
        {menu.map(item => (
          <Link key={item.path} to={item.path} className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${pathname === item.path ? 'bg-pcpr-blue text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <item.icon size={22} />
            <span className="hidden lg:block font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-6 space-y-2">
        <button onClick={() => updateState({ theme: state.theme === 'light' ? 'dark' : 'light' })} className="w-full flex items-center justify-center lg:justify-start space-x-4 p-4 rounded-2xl text-slate-500 hover:bg-slate-100">
          {state.theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          <span className="hidden lg:block font-medium">Modo {state.theme === 'light' ? 'Escuro' : 'Claro'}</span>
        </button>
        <button onClick={logout} className="w-full flex items-center justify-center lg:justify-start space-x-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={22} />
          <span className="hidden lg:block font-bold">Sair</span>
        </button>
      </div>
    </aside>
  );
};

const Header = ({ title }: { title: string }) => {
  const { user, isDemo } = useAuth();
  const { syncStatus } = useStudy();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <div className="flex items-center gap-3 mt-1">
           <p className="text-slate-500 text-sm font-bold">Investigador PCPR Alpha 2025</p>
           {isDemo ? (
             <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
               <WifiOff size={10} /> Demo Offline
             </span>
           ) : (
             <div className="flex items-center gap-1 transition-all duration-300">
                {syncStatus === 'saving' && <span className="text-blue-500 flex items-center gap-1 text-[10px] font-bold uppercase"><Loader2 size={10} className="animate-spin"/> Salvando...</span>}
                {syncStatus === 'synced' && <span className="text-green-500 flex items-center gap-1 text-[10px] font-bold uppercase"><CheckCircle size={10} /> Salvo na Nuvem</span>}
                {syncStatus === 'error' && <span className="text-red-400 flex items-center gap-1 text-[10px] font-bold uppercase"><CloudOff size={10} /> Erro de Sincronização</span>}
             </div>
           )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold">{user?.email}</p>
          <p className="text-xs text-pcpr-gold font-bold uppercase tracking-widest">Candidato Elite</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-pcpr-blue flex items-center justify-center shadow-lg">
          <User size={24} className="text-white" />
        </div>
      </div>
    </header>
  );
};

// --- Views ---

const Dashboard = () => {
  const { state, markReviewComplete } = useStudy();
  const [randomJuris, setRandomJuris] = useState<{title: string, content: string} | null>(null);
  const totalSeconds = state.subjects.reduce((a, b) => a + b.timeSpent, 0);
  const now = new Date();
  const todayIndex = now.getDay();
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const formattedDate = now.toLocaleDateString('pt-BR');
  const todaySchedule = state.schedule[todayIndex] || [];

  useEffect(() => {
    const keys = Object.keys(JURIS_DB);
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      setRandomJuris({ title: randomKey, content: JURIS_DB[randomKey] });
    }
  }, []);

  const pendingReviews = state.subjects.filter(s => s.needsReview);
  const urgentReviews = pendingReviews.filter(s => todaySchedule.includes(s.discipline));
  const otherReviews = pendingReviews.filter(s => !todaySchedule.includes(s.discipline));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Header title="Painel de Controle" />
      
      {/* Jurisprudence Banner */}
      {randomJuris && (
        <div className="mb-10 bg-gradient-to-r from-pcpr-blue to-blue-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <Scale size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-pcpr-gold text-pcpr-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Jurisprudência do Dia
              </span>
              <span className="text-blue-200 text-xs font-medium">Sorteio Aleatório</span>
            </div>
            <h3 className="text-2xl font-black mb-2">{randomJuris.title}</h3>
            <p className="text-blue-100 font-medium leading-relaxed max-w-2xl">
              {randomJuris.content.split('\n')[0]}
            </p>
          </div>
        </div>
      )}
      
      {/* Alert Section */}
      {urgentReviews.length > 0 && (
        <div className="mb-10 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-black text-amber-800 dark:text-amber-200 uppercase tracking-tight">Revisão Obrigatória Detectada</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-400 font-bold mt-1">
                Você tem matérias agendadas para hoje que possuem tópicos estudados anteriormente pendentes.
              </p>
              <div className="mt-4 space-y-2">
                {urgentReviews.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white/60 dark:bg-black/20 p-3 rounded-xl">
                    <div className="flex flex-col">
                       <span className="text-xs font-black uppercase text-amber-600/70">{s.discipline}</span>
                       <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Revisar: {s.name}</span>
                    </div>
                    <button 
                      onClick={() => markReviewComplete(s.id)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={14} /> Feito
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass p-8 rounded-[2rem] border border-white/20 shadow-sm">
          <Timer className="text-pcpr-blue mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Estudado</p>
          <h3 className="text-3xl font-black mt-2">{Math.floor(totalSeconds/3600)}h {Math.floor((totalSeconds%3600)/60)}m</h3>
        </div>
        <div className="glass p-8 rounded-[2rem] border border-white/20 shadow-sm">
          <BookOpen className="text-pcpr-gold mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Assuntos</p>
          <h3 className="text-3xl font-black mt-2">{state.subjects.length}</h3>
        </div>
        <div className="glass p-8 rounded-[2rem] border border-white/20 shadow-sm bg-pcpr-blue text-white col-span-1 md:col-span-2">
          <Calendar className="text-white/70 mb-4" />
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Hoje: {days[todayIndex]}, {formattedDate}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {todaySchedule.map((subj, idx) => (
              <span key={idx} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold border border-white/10">
                {subj}
              </span>
            ))}
            {todaySchedule.length === 0 && <span className="text-white/50 italic font-medium">Livre.</span>}
          </div>
        </div>
      </div>

      {otherReviews.length > 0 && (
         <div className="mb-10">
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
               <ListChecks size={20} /> Outras Revisões Pendentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {otherReviews.slice(0, 6).map(s => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">{s.discipline}</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{s.name}</p>
                     </div>
                     <button onClick={() => markReviewComplete(s.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-green-500 rounded-lg transition-colors">
                        <Check size={16} />
                     </button>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

const Pomodoro = () => {
  const { state, addTime } = useStudy();
  const [totalTime, setTotalTime] = useState(state.pomodoroConfig.focus * 60);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isActive, setIsActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');

  const PRESETS = [
    { label: 'Pomodoro', min: 25, icon: <span className="text-lg">🍅</span> },
    { label: 'Foco Profundo', min: 50, icon: <Brain size={18} className="text-pink-500" /> },
    { label: 'Pausa Curta', min: 5, icon: <Coffee size={18} className="text-amber-500" /> },
    { label: 'Pausa Longa', min: 15, icon: <Gamepad2 size={18} className="text-purple-500" /> },
  ];

  const disciplines = Array.from(new Set(state.subjects.map(s => s.discipline)));

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (selectedIds.length > 0) {
        addTime(selectedIds, totalTime);
        alert("Sessão finalizada! O tempo foi computado e os assuntos marcados para revisão futura.");
        setSelectedIds([]);
        setTimeLeft(totalTime);
      } else {
        alert("Sessão finalizada, mas nenhum assunto estava selecionado (Pausa ou Esquecimento).");
        setTimeLeft(totalTime);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedIds, totalTime]);

  const toggleSubject = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePreset = (minutes: number) => {
    const sec = minutes * 60;
    setTotalTime(sec);
    setTimeLeft(sec);
    setIsActive(false);
  };

  const filteredSubjects = filterDiscipline === 'all' 
    ? state.subjects 
    : state.subjects.filter(s => s.discipline === filterDiscipline);

  return (
    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
         <Header title="Foco Pomodoro 🍅" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="sticky top-4">
           <div className="glass p-10 rounded-[3rem] shadow-2xl border border-white/20 text-center relative overflow-hidden">
             
             <div className="flex justify-center gap-3 mb-8 flex-wrap">
               {PRESETS.map((p, i) => (
                 <button 
                   key={i} 
                   onClick={() => handlePreset(p.min)}
                   className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${totalTime === p.min * 60 ? 'bg-white dark:bg-slate-700 shadow-md border-transparent scale-105' : 'bg-transparent border-slate-200 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800'}`}
                 >
                   {p.icon} {p.label}
                 </button>
               ))}
             </div>

             <div className="text-7xl xl:text-8xl font-black font-mono tracking-tighter mb-10 tabular-nums text-slate-800 dark:text-slate-100">
               {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
             </div>
             
             <div className="flex justify-center gap-4">
               <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 ${isActive ? 'bg-amber-500 text-white' : 'bg-pcpr-blue text-white'}`}>
                 {isActive ? <Pause size={32} /> : <Play size={32} className="ml-2" />}
               </button>
               <button onClick={() => { setIsActive(false); setTimeLeft(totalTime); }} className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center transition-all hover:rotate-180">
                 <RotateCcw size={32} />
               </button>
             </div>
             
             <p className="mt-8 text-xs font-bold text-slate-400">
               {selectedIds.length} Assunto(s) Selecionado(s) para Computar
             </p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 h-[600px] flex flex-col">
           <div className="mb-4">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 px-2">Filtrar por Disciplina</label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
                <select 
                  value={filterDiscipline} 
                  onChange={e => setFilterDiscipline(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 pl-10 p-3 rounded-2xl font-bold text-sm border-none outline-none focus:ring-2 focus:ring-pcpr-blue appearance-none"
                >
                  <option value="all">Todas as Matérias</option>
                  {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
           </div>

           <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {filteredSubjects.map(s => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => toggleSubject(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 group ${isSelected ? 'bg-pcpr-blue/5 border-pcpr-blue dark:bg-blue-900/20' : 'bg-transparent border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-pcpr-blue border-pcpr-blue' : 'border-slate-300 group-hover:border-pcpr-blue'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{s.discipline}</p>
                      <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-pcpr-blue dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {s.name}
                      </p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

const Edital = () => {
  const { state, updateSubjectData } = useStudy();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalJuris, setModalJuris] = useState<{title: string, content: string} | null>(null);

  const disciplines = Array.from(new Set(state.subjects.map(s => s.discipline)));

  const toggleDiscipline = (disc: string) => {
    setExpanded(prev => ({ ...prev, [disc]: !prev[disc] }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <Header title="Edital Verticalizado" />
      <div className="space-y-4">
        {disciplines.map(disc => {
          const isExpanded = !!expanded[disc];
          const topics = state.subjects.filter(s => s.discipline === disc);
          return (
            <div key={disc} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleDiscipline(disc)}
                className="w-full p-6 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-black text-pcpr-blue dark:text-blue-400 uppercase tracking-widest text-sm">{disc}</h3>
                  <p className="text-xs text-slate-400 font-bold">{topics.length} Tópicos</p>
                </div>
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
              </button>
              
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topics.map(s => (
                    <div key={s.id} className="p-8">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                        <div className="flex-grow w-full">
                          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{s.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 w-full">
                             {/* Editable Relevance Slider */}
                             <div className="flex-grow flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                               <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Relevância</span>
                               <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={s.relevance}
                                 onChange={(e) => updateSubjectData(s.id, { relevance: parseInt(e.target.value) })}
                                 className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                               />
                               <span className="text-xs font-bold w-8 text-right text-pcpr-blue dark:text-blue-400">{s.relevance}%</span>
                             </div>

                             {s.needsReview && (
                               <span className="bg-amber-100 text-amber-600 px-3 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm whitespace-nowrap">
                                 <AlertTriangle size={12} /> Revisar
                               </span>
                             )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-4 xl:mt-0">
                           {s.jurisprudencia && (
                             <button 
                               onClick={() => setModalJuris({title: s.name, content: s.jurisprudencia || "Nenhuma decisão cadastrada para este tema."})}
                               className="flex items-center gap-2 px-6 py-3 bg-pcpr-gold text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all"
                             >
                               <Scale size={14} /> Tribunais
                             </button>
                           )}
                           <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                             <p className="text-[10px] font-black text-slate-400 uppercase">Horas</p>
                             <p className="font-bold text-xs">{Math.floor(s.timeSpent/3600)}h</p>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Link de Questões</label>
                          <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                             <div className="p-2 text-slate-400"><Globe size={16}/></div>
                             <input 
                               type="text" 
                               placeholder="Ex: https://questoes.com/..."
                               value={s.questionLink || ""}
                               onChange={e => updateSubjectData(s.id, {questionLink: e.target.value})}
                               className="flex-grow bg-transparent p-2 outline-none font-medium text-xs text-slate-600 dark:text-slate-300"
                             />
                             {s.questionLink && (
                               <a href={s.questionLink} target="_blank" rel="noreferrer" className="p-2 bg-white dark:bg-slate-700 rounded-lg text-pcpr-blue hover:scale-110 transition-all">
                                 <ExternalLink size={16} />
                               </a>
                             )}
                          </div>
                        </div>
                        <div className="flex items-end gap-2">
                           <button className="flex-grow py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-500 hover:text-pcpr-blue transition-colors">
                             Marcar como Concluído
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalJuris && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/10 max-h-[80vh] overflow-y-auto relative">
             <button onClick={() => setModalJuris(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X/></button>
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-pcpr-gold/10 rounded-2xl flex items-center justify-center text-pcpr-gold">
                  <Scale size={32} />
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-tight">{modalJuris.title}</h3>
                   <p className="text-[10px] font-black text-pcpr-gold uppercase tracking-widest">Decisões STF / STJ</p>
                </div>
             </div>
             <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {modalJuris.content.split('\n').map((line, i) => (
                  <p key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-pcpr-gold">
                    {line}
                  </p>
                ))}
             </div>
             <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase text-center italic">Hub atualizado com informativos 2024/2025</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Schedule = () => {
  const { state, addScheduleItem, removeScheduleItem, resetSchedule, bulkUpdateSchedule } = useStudy();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(DISCIPLINE_DATA[0].materia);

  const [cycleDisciplines, setCycleDisciplines] = useState<string[]>([]);
  const [cycleDays, setCycleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [subjectsPerDay, setSubjectsPerDay] = useState(2);

  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const formattedDate = now.toLocaleDateString('pt-BR');

  const handleAdd = () => {
    addScheduleItem(selectedDay, selectedSubject);
    setIsModalOpen(false);
  };

  const generateCycle = () => {
    if (cycleDisciplines.length === 0 || cycleDays.length === 0) return;
    const sortedDays = [...cycleDays].sort((a, b) => a - b);
    const newSchedule = { ...state.schedule };
    sortedDays.forEach(d => { newSchedule[d] = []; });
    let disciplineIdx = 0;
    sortedDays.forEach(dayIdx => {
      const items = [];
      for (let i = 0; i < subjectsPerDay; i++) {
        items.push(cycleDisciplines[disciplineIdx % cycleDisciplines.length]);
        disciplineIdx++;
      }
      newSchedule[dayIdx] = items;
    });
    bulkUpdateSchedule(newSchedule);
    setIsCycleModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-10">
        <Header title="Cronograma Hub" />
        <div className="flex flex-wrap gap-2">
           <button onClick={resetSchedule} className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">
             <RefreshCw size={14} /> Resetar
           </button>
           <button onClick={() => setIsCycleModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-pcpr-gold text-white rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg shadow-yellow-500/20">
             <Zap size={14} /> Gerar Ciclo
           </button>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-pcpr-blue text-white rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
             <Plus size={14} /> Escalar Manual
           </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="px-6 py-3 bg-pcpr-blue/10 text-pcpr-blue rounded-2xl inline-block font-black uppercase text-[10px] tracking-widest border border-pcpr-blue/20">
          Hoje é: {days[currentDayIndex]}, {formattedDate}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {days.map((day, idx) => {
          const isToday = idx === currentDayIndex;
          const isSaturday = idx === 6;
          const isSunday = idx === 0;
          let cardStyle = isToday ? "bg-white border-pcpr-blue ring-4 ring-pcpr-blue/10 dark:bg-slate-900" : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800";
          return (
            <div key={idx} className={`p-6 rounded-[2.5rem] border min-h-[400px] flex flex-col shadow-sm transition-all duration-300 ${cardStyle}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 inline-block w-fit ${isSaturday ? 'bg-blue-100 text-blue-600' : isSunday ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                {day}
              </span>
              <div className="flex-grow space-y-3">
                {(state.schedule[idx] || []).map((subj, sIdx) => (
                  <div key={sIdx} className="group relative flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/50 border border-slate-200/50 rounded-2xl text-[11px] font-bold">
                    <span className="truncate pr-4">{subj}</span>
                    <button onClick={() => removeScheduleItem(idx, subj)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isCycleModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/10 my-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight">Gerador de Ciclo Automático</h3>
                <button onClick={() => setIsCycleModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X /></button>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest">1. Selecione Matérias</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DISCIPLINE_DATA.map(d => (
                      <button key={d.materia} onClick={() => setCycleDisciplines(prev => prev.includes(d.materia) ? prev.filter(x => x !== d.materia) : [...prev, d.materia])} className={`p-3 rounded-2xl text-[10px] font-bold text-left border ${cycleDisciplines.includes(d.materia) ? 'bg-pcpr-blue text-white' : 'bg-slate-50 dark:bg-slate-800'}`}>
                        {d.materia}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generateCycle} className="w-full bg-pcpr-blue text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
                  Aplicar Ciclo Inteligente
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const { login, register, isDemo } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden text-center">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 border border-slate-100">
        <div className="w-20 h-20 bg-pcpr-blue mx-auto rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/20">
          <Gavel size={40} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
          {isRegistering ? 'Nova Conta' : 'Login Candidato'}
        </h1>
        <p className="text-slate-500 text-sm font-bold mt-2 mb-8">Hub de Estudos PCPR 2025</p>
        
        {isDemo && (
          <div className="bg-amber-100 text-amber-700 p-3 rounded-xl text-xs font-bold mb-6 flex items-center justify-center gap-2">
            <WifiOff size={14} /> Modo Demo Ativo (Offline)
          </div>
        )}

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold mb-4 border border-red-100">{error}</div>}

        <div className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-pcpr-blue text-slate-800 placeholder:text-slate-400" />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-pcpr-blue text-slate-800 placeholder:text-slate-400" />
          
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-pcpr-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
             {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Criar Conta' : 'Entrar no Hub')}
          </button>

          <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 text-xs font-bold hover:text-pcpr-blue mt-4">
            {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
           <p className="text-[10px] text-slate-400 font-medium">
             {isDemo ? 'Running in Simulated Mode' : 'Database Integration Active'}
           </p>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');
  const isPreview = checkPreviewEnvironment();
  const Router = isPreview ? HashRouter : BrowserRouter;

  const [state, setState] = useState<UserState>(() => {
    // Fallback initial state if not logged in yet or no DB connection
    return { 
      subjects: INITIAL_SUBJECTS, 
      schedule: CRONOGRAMA_PADRAO,
      pomodoroConfig: { focus: 25, short: 5, long: 15 }, 
      theme: 'light' 
    };
  });

  // Auth Listener & Data Fetching
  useEffect(() => {
    // REAL FIREBASE MODE
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email || '' });
          
          if (db) {
             try {
               const docRef = doc(db, "users", firebaseUser.uid);
               const docSnap = await getDoc(docRef);
               if (docSnap.exists()) {
                 setState(docSnap.data() as UserState);
               } else {
                 // Remove undefined values before initial save
                 const cleanState = JSON.parse(JSON.stringify(state));
                 await setDoc(docRef, cleanState);
               }
             } catch (e: any) {
               console.error("Error fetching data:", e);
               // Permission error or other failures -> Fallback to local storage
               if (e.code === 'permission-denied' || e.message.includes('permission')) {
                 console.log("Permission denied. Falling back to local storage.");
                 setSyncStatus('error');
                 const savedData = localStorage.getItem(`pcpr_store_${firebaseUser.uid}`);
                 if (savedData) setState(JSON.parse(savedData));
               }
             }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } 
    // DEMO / MOCK MODE
    else {
      console.log("Running in Demo Mode");
      const checkMockAuth = async () => {
        // Simulate loading time
        await new Promise(r => setTimeout(r, 500));
        
        const savedUser = localStorage.getItem('pcpr_mock_auth');
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            setUser(u);
            const savedData = localStorage.getItem(`pcpr_store_${u.uid}`);
            if (savedData) setState(JSON.parse(savedData));
          } catch(e) {
            console.error("Demo data parse error", e);
            localStorage.removeItem('pcpr_mock_auth');
          }
        }
        setLoading(false);
      };
      checkMockAuth();
    }
  }, []);

  // Sync state to Persistence (Firestore OR LocalStorage)
  useEffect(() => {
    if (user) {
      if (isFirebaseConfigured && db) {
        setSyncStatus('saving');
        const saveToDb = async () => {
           try {
             // Sanitize state to remove undefined values which Firestore hates
             const cleanState = JSON.parse(JSON.stringify(state));
             await setDoc(doc(db, "users", user.uid), cleanState, { merge: true });
             setSyncStatus('synced');
           } catch (e) {
             console.error("Error saving state:", e);
             setSyncStatus('error');
             // Silent fail or fallback save to local storage
             localStorage.setItem(`pcpr_store_${user.uid}`, JSON.stringify(state));
           }
        };
        const handler = setTimeout(saveToDb, 1000);
        return () => clearTimeout(handler);
      } else {
        // Save to LocalStorage in Demo Mode
        localStorage.setItem(`pcpr_store_${user.uid}`, JSON.stringify(state));
      }
    }
    
    // Always sync theme
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state, user]);

  const login = async (e: string, p: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, e, p);
    } else {
      // Mock Login
      await new Promise(r => setTimeout(r, 800));
      if (!e || !p) throw new Error("Preencha todos os campos (Demo)");
      const u = { uid: 'demo-user-123', email: e };
      localStorage.setItem('pcpr_mock_auth', JSON.stringify(u));
      setUser(u);
    }
  };
  
  const register = async (e: string, p: string) => {
    if (isFirebaseConfigured && auth) {
      await createUserWithEmailAndPassword(auth, e, p);
    } else {
      // Mock Register
      await new Promise(r => setTimeout(r, 800));
      if (!e || !p) throw new Error("Preencha todos os campos (Demo)");
      const u = { uid: 'demo-user-123', email: e };
      localStorage.setItem('pcpr_mock_auth', JSON.stringify(u));
      setUser(u);
    }
  };

  const logout = () => {
    if (isFirebaseConfigured && auth) {
      signOut(auth);
    } else {
      localStorage.removeItem('pcpr_mock_auth');
      setUser(null);
    }
  };

  const updateState = (up: Partial<UserState>) => setState(s => ({...s, ...up}));

  const addTime = (ids: string[], sec: number) => {
    if (ids.length === 0) return;
    const timePerSubject = Math.floor(sec / ids.length);
    const now = new Date().toISOString();
    
    setState(s => ({
      ...s,
      subjects: s.subjects.map(sub => 
        ids.includes(sub.id) 
          ? { 
              ...sub, 
              timeSpent: sub.timeSpent + timePerSubject,
              lastStudied: now,
              needsReview: true 
            } 
          : sub
      )
    }));
  };

  const markReviewComplete = (id: string) => {
    setState(s => ({
      ...s,
      subjects: s.subjects.map(sub => 
        sub.id === id ? { ...sub, needsReview: false } : sub
      )
    }));
  };

  const addScheduleItem = (day: number, subject: string) => {
    setState(s => {
      const daySchedule = s.schedule[day] || [];
      if (daySchedule.includes(subject)) return s;
      return { ...s, schedule: { ...s.schedule, [day]: [...daySchedule, subject] } };
    });
  };

  const removeScheduleItem = (day: number, subject: string) => {
    setState(s => ({ ...s, schedule: { ...s.schedule, [day]: (s.schedule[day] || []).filter(item => item !== subject) } }));
  };

  const resetSchedule = () => setState(s => ({ ...s, schedule: CRONOGRAMA_PADRAO }));

  const bulkUpdateSchedule = (newSchedule: Record<number, string[]>) => setState(s => ({ ...s, schedule: newSchedule }));

  const updateSubjectData = (id: string, data: Partial<Subject>) => {
    setState(s => ({...s, subjects: s.subjects.map(subj => subj.id === id ? {...subj, ...data} : subj)}));
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-pcpr-blue w-12 h-12" />
     </div>
  );

  if (!user) return <AuthContext.Provider value={{ user: null, loading, login, register, logout, isDemo: !isFirebaseConfigured }}><AuthScreen /></AuthContext.Provider>;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isDemo: !isFirebaseConfigured }}>
      <StudyContext.Provider value={{ 
        state, 
        updateState,
        addTime,
        markReviewComplete,
        addScheduleItem,
        removeScheduleItem,
        resetSchedule,
        bulkUpdateSchedule,
        updateSubjectData,
        syncStatus
      }}>
        <Router>
          <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Sidebar />
            <main className="flex-grow pl-20 lg:pl-72 p-6 lg:p-10">
              <div className="max-w-[1600px] mx-auto">
                <Routes>
                  <Route path="/" element={<Navigate to={isPreview ? "/sitemap" : "/dashboard"} replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pomodoro" element={<Pomodoro />} />
                  <Route path="/edital" element={<Edital />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/sitemap" element={<Sitemap />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
      </StudyContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
