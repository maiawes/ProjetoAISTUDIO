
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Timer, BookOpen, Calendar, LogOut, Moon, Sun, 
  Gavel, Play, Pause, RotateCcw, Trash2, ExternalLink, ChevronRight,
  ChevronDown, User, Mail, Lock, CheckCircle, AlertTriangle, Plus, PlusCircle,
  X, RefreshCw
} from 'lucide-react';
import Sitemap from './components/Sitemap';

// --- Types ---
interface Subject {
  id: string;
  discipline: string;
  name: string;
  relevance: number;
  timeSpent: number;
  link?: string;
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

const INITIAL_SUBJECTS: Subject[] = DISCIPLINE_DATA.flatMap(m => 
  m.assuntos.map((name, i) => ({
    id: `${m.materia.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    discipline: m.materia,
    name,
    relevance: 75,
    timeSpent: 0
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
  login: (email: string) => void;
  logout: () => void;
} | null>(null);

const StudyContext = createContext<{
  state: UserState;
  updateState: (update: Partial<UserState>) => void;
  addTime: (id: string, seconds: number) => void;
  addScheduleItem: (day: number, subject: string) => void;
  removeScheduleItem: (day: number, subject: string) => void;
  resetSchedule: () => void;
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

// --- View Components ---

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
  const { user } = useAuth();
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-slate-500 text-sm mt-1">Sua jornada rumo à aprovação na Polícia Civil.</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold">{user?.email}</p>
          <p className="text-xs text-pcpr-gold font-bold uppercase tracking-widest">Investigador de Elite</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-pcpr-blue flex items-center justify-center shadow-lg">
          <User size={24} className="text-white" />
        </div>
      </div>
    </header>
  );
};

const Dashboard = () => {
  const { state } = useStudy();
  const totalSeconds = state.subjects.reduce((a, b) => a + b.timeSpent, 0);
  const todayIndex = new Date().getDay();
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const todaySchedule = state.schedule[todayIndex] || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Header title="Painel de Controle" />
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
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Hoje: {days[todayIndex]}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {todaySchedule.map((subj, idx) => (
              <span key={idx} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold border border-white/10">
                {subj}
              </span>
            ))}
            {todaySchedule.length === 0 && <span className="text-white/50 italic font-medium">Nenhuma matéria escalada.</span>}
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle size={20} className="text-pcpr-blue"/> Foco do Dia</h3>
          <div className="space-y-4">
            {state.subjects.filter(s => s.relevance >= 90).slice(0, 4).map(subj => (
              <div key={subj.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-sm">{subj.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{subj.discipline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Prioridade</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-pcpr-blue p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <h3 className="text-lg font-bold opacity-80 mb-2">Meta Semanal</h3>
          <p className="text-3xl font-black leading-tight mb-4">Mantenha a constância.</p>
          <p className="text-sm opacity-70 mb-8">A aprovação é o resultado de pequenos hábitos diários repetidos com excelência.</p>
          <Link to="/schedule" className="w-fit px-6 py-3 bg-white text-pcpr-blue font-black rounded-xl text-sm uppercase hover:scale-105 transition-transform">
            Ver Cronograma Completo
          </Link>
          <Gavel className="absolute -right-8 -bottom-8 text-white/10" size={240} />
        </div>
      </div>
    </div>
  );
};

const Pomodoro = () => {
  const { state, addTime } = useStudy();
  const [timeLeft, setTimeLeft] = useState(state.pomodoroConfig.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubj, setSelectedSubj] = useState(state.subjects[0]?.id || '');

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (selectedSubj) addTime(selectedSubj, state.pomodoroConfig.focus * 60);
      alert("Bloco de estudo concluído!");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  return (
    <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500 text-center">
      <Header title="Timer de Estudos" />
      <div className="glass p-12 rounded-[3rem] shadow-2xl border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
           <div className="h-full bg-pcpr-blue transition-all duration-1000" style={{ width: `${(timeLeft / (state.pomodoroConfig.focus * 60)) * 100}%` }}></div>
        </div>
        <div className="text-9xl font-black font-mono tracking-tighter mb-12 tabular-nums">
          {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={() => setIsActive(!isActive)} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 ${isActive ? 'bg-amber-500 text-white' : 'bg-pcpr-blue text-white'}`}>
            {isActive ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
          </button>
          <button onClick={() => { setIsActive(false); setTimeLeft(state.pomodoroConfig.focus * 60); }} className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center transition-all hover:rotate-180">
            <RotateCcw size={40} />
          </button>
        </div>
      </div>
      <div className="mt-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Vincular Estudo a:</label>
        <select value={selectedSubj} onChange={e => setSelectedSubj(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-pcpr-blue">
          {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.discipline})</option>)}
        </select>
      </div>
    </div>
  );
};

const Edital = () => {
  const { state, updateState } = useStudy();
  // Initially minimized as per request
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
                className="w-full p-6 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-black text-pcpr-blue dark:text-blue-400 uppercase tracking-widest text-sm">{disc}</h3>
                  <p className="text-xs text-slate-400 font-bold">{topics.length} Assuntos</p>
                </div>
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
              </button>
              
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-in slide-in-from-top-2 duration-300">
                  {topics.map(s => (
                    <div key={s.id} className="p-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-grow min-w-[300px]">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{s.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <input 
                            type="range" min="0" max="100" value={s.relevance}
                            onChange={e => updateState({ subjects: state.subjects.map(sub => sub.id === s.id ? {...sub, relevance: parseInt(e.target.value)} : sub) })}
                            className="h-1.5 w-32 bg-slate-200 rounded-full accent-pcpr-blue appearance-none cursor-pointer"
                          />
                          <span className={`text-[10px] font-black uppercase ${s.relevance >= 90 ? 'text-red-500' : 'text-slate-400'}`}>Relevância {s.relevance}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Estudado</p>
                          <p className="font-bold text-xs">{Math.floor(s.timeSpent/3600)}h {Math.floor((s.timeSpent%3600)/60)}m</p>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Schedule = () => {
  const { state, addScheduleItem, removeScheduleItem, resetSchedule } = useStudy();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(DISCIPLINE_DATA[0].materia);

  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const currentDayIndex = new Date().getDay();

  const handleAdd = () => {
    addScheduleItem(selectedDay, selectedSubject);
    setIsModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <Header title="Cronograma Semanal" />
        <div className="flex gap-2">
           <button onClick={resetSchedule} className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">
             <RefreshCw size={14} /> Resetar Padrão
           </button>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-pcpr-blue text-white rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg">
             <Plus size={14} /> Escalar Matéria
           </button>
        </div>
      </div>

      <div className="mb-6 px-6 py-3 bg-pcpr-blue/10 text-pcpr-blue rounded-2xl inline-block font-black uppercase text-[10px] tracking-widest border border-pcpr-blue/20">
        Hoje é: {days[currentDayIndex]}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {days.map((day, idx) => {
          const isToday = idx === currentDayIndex;
          const isSaturday = idx === 6;
          const isSunday = idx === 0;
          
          let cardStyle = "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800";
          let badgeStyle = "bg-slate-100 text-slate-500";
          
          if (isToday) cardStyle = "bg-white border-pcpr-blue ring-4 ring-pcpr-blue/10 dark:bg-slate-900 dark:border-pcpr-blue";
          if (isSaturday) { cardStyle = "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800"; badgeStyle = "bg-blue-100 text-blue-600"; }
          if (isSunday) { cardStyle = "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800"; badgeStyle = "bg-red-100 text-red-600"; }

          return (
            <div key={idx} className={`p-5 rounded-[2.5rem] border min-h-[350px] flex flex-col shadow-sm transition-all duration-300 ${cardStyle}`}>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${badgeStyle}`}>
                  {day}
                </span>
                {isToday && <div className="w-2 h-2 bg-pcpr-blue rounded-full animate-ping" />}
              </div>
              
              <div className="flex-grow space-y-3">
                {(state.schedule[idx] || []).map((subj, sIdx) => (
                  <div key={sIdx} className="group relative flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-[11px] font-bold transition-all hover:translate-x-1 hover:shadow-sm">
                    <span className="truncate pr-4">{subj}</span>
                    <button 
                      onClick={() => removeScheduleItem(idx, subj)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {(state.schedule[idx] || []).length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 mt-10">
                     <Calendar size={24} className="mb-2 opacity-20" />
                     <p className="text-[10px] font-bold uppercase italic opacity-30">Vazio</p>
                   </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {isSunday ? "Descanso / Leve" : isSaturday ? "Revisão / Simulados" : "Estudo Teórico"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight">Escalar Matéria</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dia da Semana</label>
                  <select 
                    value={selectedDay}
                    onChange={e => setSelectedDay(parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-pcpr-blue"
                  >
                    {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Matéria / Atividade</label>
                  <select 
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-pcpr-blue"
                  >
                    {DISCIPLINE_DATA.map(d => <option key={d.materia} value={d.materia}>{d.materia}</option>)}
                    <option value="Revisão">Revisão</option>
                    <option value="Simulado Completo">Simulado Completo</option>
                    <option value="Descanso Ativo">Descanso Ativo</option>
                    <option value="Jurisprudência STF/STJ">Jurisprudência STF/STJ</option>
                  </select>
                </div>
                <button onClick={handleAdd} className="w-full bg-pcpr-blue text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
                  Confirmar Escala
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
  const { login } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-pcpr-blue/20 rounded-full blur-[100px]"></div>
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-pcpr-blue mx-auto rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/20">
            <Gavel size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Login Candidato</h1>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold" />
          <input type="password" placeholder="Senha" className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold" />
          <button onClick={() => login(email)} className="w-full bg-pcpr-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 transition-transform active:scale-95">Acessar Hub</button>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isPreview = checkPreviewEnvironment();
  const Router = isPreview ? HashRouter : BrowserRouter;

  const [state, setState] = useState<UserState>(() => {
    const s = localStorage.getItem('pcpr_store_v5');
    return s ? JSON.parse(s) : { 
      subjects: INITIAL_SUBJECTS, 
      schedule: CRONOGRAMA_PADRAO,
      pomodoroConfig: { focus: 25, short: 5, long: 15 }, 
      theme: 'dark' 
    };
  });

  useEffect(() => {
    const saved = localStorage.getItem('pcpr_auth');
    if (saved) setUser({ uid: '123', email: saved });
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('pcpr_store_v5', JSON.stringify(state));
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state]);

  const login = (email: string) => { if (!email) return; localStorage.setItem('pcpr_auth', email); setUser({ uid: '123', email }); };
  const logout = () => { localStorage.removeItem('pcpr_auth'); setUser(null); };

  const updateState = (up: Partial<UserState>) => setState(s => ({...s, ...up}));

  const addTime = (id: string, sec: number) => {
    setState(s => ({...s, subjects: s.subjects.map(sub => sub.id === id ? {...sub, timeSpent: sub.timeSpent + sec} : sub)}));
  };

  const addScheduleItem = (day: number, subject: string) => {
    setState(s => {
      const daySchedule = s.schedule[day] || [];
      if (daySchedule.includes(subject)) return s;
      return {
        ...s,
        schedule: { ...s.schedule, [day]: [...daySchedule, subject] }
      };
    });
  };

  const removeScheduleItem = (day: number, subject: string) => {
    setState(s => ({
      ...s,
      schedule: { ...s.schedule, [day]: (s.schedule[day] || []).filter(item => item !== subject) }
    }));
  };

  const resetSchedule = () => {
    setState(s => ({ ...s, schedule: CRONOGRAMA_PADRAO }));
  };

  if (loading) return null;
  if (!user) return <AuthContext.Provider value={{ user: null, loading, login, logout }}><AuthScreen /></AuthContext.Provider>;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <StudyContext.Provider value={{ 
        state, 
        updateState,
        addTime,
        addScheduleItem,
        removeScheduleItem,
        resetSchedule
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
