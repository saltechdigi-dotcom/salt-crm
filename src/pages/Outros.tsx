import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useToast } from '@/hooks/use-toast';
import { useUserProfile, useCompanySettings } from '@/hooks/useUserProfile';
import { createSupportTicketFromForm, createServiceRequestTicket, createIALigacaoTicket, createWebhookIntegrationTicket, createUpgradeRequestTicket, supportTicketsApi } from '@/stores/support';
import { whatsappApi, api } from '@/lib/api';
import { useLabelsStore, Label as LabelType } from '@/stores/labels';
import { Header, SubHeader } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IOSCard, IOSSection, IOSSectionItem } from '@/components/ui/ios-card';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Badge } from '@/components/ui/badge';
import { ListsSection } from '@/components/lists/ListsSection';
import { ClientsSection } from '@/components/clients/ClientsSection';
import { EquipesSection } from '@/components/equipes/EquipesSection';
import { UsuariosSection } from '@/components/usuarios/UsuariosSection';
import { EtiquetasSection } from '@/components/etiquetas/EtiquetasSection';
import { InventorySection } from '@/components/inventory/InventorySection';
import {
  Bot,
  MessageSquare,
  Star,
  Users,
  UserCog,
  Settings,
  Headphones,
  Sparkles,
  ChevronLeft,
  Save,
  Image,
  Send,
  Clock,
  Zap,
  User,
  Camera,
  Trash2,
  RefreshCw,
  Crop,
  QrCode,
  Key,
  Receipt,
  Target,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  Plus,
  ExternalLink,
  MessageCircle,
  Wrench,
  Database,
  PhoneCall,
  Link,
  Package,
  Check,
  Pencil,
  Tag,
} from 'lucide-react';

type Section = 'ia-sdr' | 'ia-followup' | 'ia-posvenda' | 'ia-nps' | 'equipes' | 'usuarios' | 'config' | 'suporte' | 'servicos' | 'perfil' | 'qrcode' | 'whatsapp-api' | 'api-openai' | 'fatura' | 'ia-ligacao' | 'webhooks' | 'plano' | 'chamados' | 'estoque' | 'clientes' | 'listas' | 'google-calendar' | 'etiquetas' | null;

const Outros: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>(() => {
    // Check if navigated with a specific section
    const state = location.state as { section?: Section } | null;
    return state?.section || null;
  });


  // Update activeSection when location.state changes
  useEffect(() => {
    const state = location.state as { section?: Section } | null;
    if (state?.section) {
      setActiveSection(state.section);
    }
  }, [location.state]);

  // Back behavior: always return to /home (unified)
  const handleBackToMain = useCallback(() => {
    setActiveSection(null);
    navigate('/home', { replace: true });
  }, [navigate]);

  const [sdrAgentId, setSdrAgentId] = useState<string | null>(null);
  const [followUpAgentId, setFollowUpAgentId] = useState<string | null>(null);
  const [sdrConfig, setSdrConfig] = useState({
    nomeDoAgente: '',
    nomeDaEmpresa: '',
    siteOficial: '',
    instagramOficial: '',
    linkedinOficial: '',
    enderecoDaEmpresa: '',
  });

  const [promptExpanded, setPromptExpanded] = useState(false);

  // SDR Qualification Questions
  const [sdrQuestions, setSdrQuestions] = useState([
    { id: 'q1', question: 'Com quem eu falo?', placeholder: 'Ex: Nome completo do lead', description: 'Nome do lead para identificação', active: true },
    { id: 'q2', question: 'Como posso te ajudar hoje?', placeholder: 'Ex: Interesse específico ou dúvida', description: 'Motivo do contato para direcionamento', active: true },
    { id: 'q3', question: 'Você já conhece nossa empresa?', placeholder: 'Ex: Sim/Não', description: 'Avaliar nível de conhecimento prévio', active: true },
    { id: 'q4', question: 'Tem interesse em algum produto ou serviço específico?', placeholder: 'Ex: Nome do produto/serviço', description: 'Identificar interesse para segmentação', active: true },
    { id: 'q5', question: 'Qual é o seu segmento de atuação?', placeholder: 'Ex: E-commerce, Varejo, SaaS', description: 'Entender o nicho do lead', active: true },
    { id: 'q6', question: 'Vocês já usam alguma solução similar?', placeholder: 'Ex: Sim, usamos X / Não usamos', description: 'Avaliar maturidade e concorrência', active: true },
  ]);
  const [qualificationThreshold, setQualificationThreshold] = useState<3 | 4 | 5 | 6>(4);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionPlaceholder, setEditQuestionPlaceholder] = useState('');
  const [editQuestionDescription, setEditQuestionDescription] = useState('');

  const [posVendaAgentId, setPosVendaAgentId] = useState<string | null>(null);
  const [posVendaConfig, setPosVendaConfig] = useState({
    nomeDoAgente: '',
    nomeDaEmpresa: '',
    siteOficial: '',
    instagramOficial: '',
  });
  const [posVendaPromptExpanded, setPosVendaPromptExpanded] = useState(false);
  const [posVendaQuestions, setPosVendaQuestions] = useState([
    { id: 'pv1', question: 'Olá! Como está sua experiência com nosso produto/serviço?', placeholder: 'Ex: Ótima, regular, preciso de ajuda', description: 'Avaliar satisfação geral inicial', active: true },
    { id: 'pv2', question: 'Você está conseguindo usar todas as funcionalidades?', placeholder: 'Ex: Sim/Não/Parcialmente', description: 'Identificar dificuldades de uso', active: true },
    { id: 'pv3', question: 'Tem alguma dúvida que eu possa ajudar a esclarecer?', placeholder: 'Ex: Sim, sobre X / Não, está tudo claro', description: 'Oferecer suporte proativo', active: true },
    { id: 'pv4', question: 'O que você mais gostou até agora?', placeholder: 'Ex: Funcionalidade X, atendimento', description: 'Coletar feedback positivo', active: true },
    { id: 'pv5', question: 'Existe algo que poderíamos melhorar?', placeholder: 'Ex: Sugestões de melhoria', description: 'Coletar sugestões de melhoria', active: true },
    { id: 'pv6', question: 'Você indicaria nossa empresa para alguém?', placeholder: 'Ex: Sim, com certeza / Talvez', description: 'Avaliar potencial de indicação', active: true },
  ]);
  const [posVendaThreshold, setPosVendaThreshold] = useState<3 | 4 | 5 | 6>(3);
  const [editingPosVendaQuestion, setEditingPosVendaQuestion] = useState<string | null>(null);

  const [npsAgentId, setNpsAgentId] = useState<string | null>(null);
  const [npsConfig, setNpsConfig] = useState({
    nomeDoAgente: '',
    nomeDaEmpresa: '',
    siteOficial: '',
    instagramOficial: '',
  });
  const [npsPromptExpanded, setNpsPromptExpanded] = useState(false);
  // NPS Questions - conditional by score range
  const [npsBaseQuestion] = useState({
    question: 'De 0 a 10, o quanto você recomendaria nossa empresa/serviço a um amigo ou colega?',
    description: 'Pergunta principal do NPS'
  });

  const [npsDetractorQuestions, setNpsDetractorQuestions] = useState([
    { id: 'detractor1', question: 'O que mais te incomodou ou ficou abaixo da sua expectativa na nossa experiência?', description: 'Identificar dor real e falha específica', active: true },
  ]);

  const [npsNeutralQuestions, setNpsNeutralQuestions] = useState([
    { id: 'neutral1', question: 'O que faltou para que sua experiência fosse nota 9 ou 10?', description: 'Entender o que falta para virar promotor', active: true },
  ]);

  const [npsPromoterQuestions, setNpsPromoterQuestions] = useState([
    { id: 'promoter1', question: 'O que mais te fez dar essa nota para nossa empresa?', description: 'Identificar o diferencial percebido', active: true },
    { id: 'promoter2', question: 'Você poderia nos indicar alguma pessoa? Pode passar o nome e o telefone, por favor?', description: 'Coletar indicações de promotores', active: true },
  ]);

  const [editingNpsQuestion, setEditingNpsQuestion] = useState<string | null>(null);
  const [editingNpsQuestionType, setEditingNpsQuestionType] = useState<'detractor' | 'neutral' | 'promoter' | null>(null);

  const handleSdrConfigChange = (field: keyof typeof sdrConfig, value: string) => {
    setSdrConfig(prev => ({ ...prev, [field]: value }));
  };
  const { profile, updateAvatar } = useUserProfile();
  const { settings, updateName, updateLogo, updatePrimaryColor } = useCompanySettings();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'logo'>('avatar');

  // WhatsApp connection state (supports multiple connections)
  interface WhatsAppConnection {
    id: string;
    name: string; // Nome da caixa de entrada (time, vendedor, setor)
    phone: string;
    status: 'connected' | 'disconnected' | 'pending';
    connectedAt?: string;
  }

  const [whatsappConnections, setWhatsappConnections] = useState<WhatsAppConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    if (activeSection === 'qrcode') {
      setIsLoadingConnections(true);
      whatsappApi.getAll()
        .then(response => {
          // Map API response to Component state shape if needed
          // API returns: { id, name, phoneNumber, status, ... }
          // Component expects: { id, name, phone, status, connectedAt? }
          // Fix: Ensure response.data is an array before mapping (prevents crashes if API returns 404 HTML or error objects)
          const dataArray = Array.isArray(response.data) ? response.data : [];
          const mapped: WhatsAppConnection[] = dataArray?.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phoneNumber,
            status: c.status === 'connected' ? 'connected' : 'disconnected', // Normalize status to match type
            connectedAt: c.createdAt
          }));
          setWhatsappConnections(mapped);
        })
        .catch(error => {
          console.error('Error fetching whatsapp connections:', error);
          toast({
            title: 'Erro ao carregar conexões',
            description: 'Não foi possível buscar as conexões do WhatsApp.',
            variant: 'destructive'
          });
        })
        .finally(() => setIsLoadingConnections(false));
    } else if (['ia-sdr', 'ia-posvenda', 'ia-nps', 'ia-followup'].includes(activeSection || '')) {
      // Load configuration for the selected Agent
      api.get('/agents')
        .then(res => {
          const agents = Array.isArray(res.data) ? res.data : [];
          agents.forEach((agent: any) => {
            if (agent.name === 'SDR') {
              setSdrAgentId(agent.id);
              if (agent.config?.sdrConfig) setSdrConfig(agent.config.sdrConfig);
              if (agent.config?.sdrQuestions) setSdrQuestions(Array.isArray(agent.config.sdrQuestions) ? agent.config.sdrQuestions : []);
              if (agent.config?.qualificationThreshold) setQualificationThreshold(agent.config.qualificationThreshold);
            } else if (agent.name === 'POS_VENDA') {
              setPosVendaAgentId(agent.id);
              if (agent.config?.posVendaConfig) setPosVendaConfig(agent.config.posVendaConfig);
              if (agent.config?.posVendaQuestions) setPosVendaQuestions(Array.isArray(agent.config.posVendaQuestions) ? agent.config.posVendaQuestions : []);
              if (agent.config?.posVendaThreshold) setPosVendaThreshold(agent.config.posVendaThreshold);
            } else if (agent.name === 'NPS') {
              setNpsAgentId(agent.id);
              if (agent.config?.npsConfig) setNpsConfig(agent.config.npsConfig);
              if (agent.config?.npsBaseQuestion) {
                // The base question config can be handled here if needed in future
              }
              if (agent.config?.npsDetractorQuestions) setNpsDetractorQuestions(Array.isArray(agent.config.npsDetractorQuestions) ? agent.config.npsDetractorQuestions : []);
              if (agent.config?.npsNeutralQuestions) setNpsNeutralQuestions(Array.isArray(agent.config.npsNeutralQuestions) ? agent.config.npsNeutralQuestions : []);
              if (agent.config?.npsPromoterQuestions) setNpsPromoterQuestions(Array.isArray(agent.config.npsPromoterQuestions) ? agent.config.npsPromoterQuestions : []);
            } else if (agent.name === 'FOLLOW_UP') {
              setFollowUpAgentId(agent.id);
              if (agent.config?.followUpMessages) setFollowUpMessages(Array.isArray(agent.config.followUpMessages) ? agent.config.followUpMessages : []);
            }
          });
        })
        .catch(err => console.error('Error fetching agents config', err));
    }
  }, [activeSection]);

  // Estado para QR code de conexão (deve ser declarado ANTES do useEffect que o usa)
  const [showQrCodeForConnection, setShowQrCodeForConnection] = useState<string | null>(null);

  // Socket.io listener for instant WhatsApp connection status updates
  useEffect(() => {
    const handleWhatsappStatus = (data: { connectionId: string, instanceName: string, status: string }) => {
      // Update local state
      setWhatsappConnections(prev => prev.map(c =>
        c.id === data.connectionId ? { ...c, status: data.status as any } : c
      ));

      // If connected and QR code is showing for this connection, close it
      if (data.status === 'connected' && showQrCodeForConnection === data.connectionId) {
        setShowQrCodeForConnection(null);
        toast({
          title: 'WhatsApp conectado!',
          description: 'A caixa de entrada foi vinculada com sucesso.',
        });
      }
    };

    socketClient.onWhatsappStatus(handleWhatsappStatus);
    return () => socketClient.offWhatsappStatus(handleWhatsappStatus);
  }, [showQrCodeForConnection, toast]);

  // Limite de WhatsApps permitidos (vem do plano/contrato do tenant)
  const [whatsappSlotLimit, setWhatsappSlotLimit] = useState(1);
  const [pendingSlotRequest, setPendingSlotRequest] = useState(false);

  // Estado para adicionar nova conexão
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [newConnectionName, setNewConnectionName] = useState('');
  // showQrCodeForConnection moved above the useEffect that references it

  // WhatsApp API state
  const [whatsappApiForm, setWhatsappApiForm] = useState({
    inboxName: '',
    phoneNumber: '',
    phoneNumberId: '',
    businessAccountId: '',
    apiKey: '',
  });

  // IA de Ligação state
  const [iaLigacaoForm, setIaLigacaoForm] = useState({
    objetivo: '',
    scriptInicial: '',
    tomDeVoz: 'neutro',
    informacoesColetadas: '',
    criterioSucesso: '',
    clienteAtende: '',
    clienteNaoAtende: '',
    clientePedeRetorno: '',
  });

  // API OpenAI state
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiKeyVisible, setOpenaiKeyVisible] = useState(false);

  // Webhook integration request state
  const [webhookForm, setWebhookForm] = useState({
    nomeIntegracao: '',
    sistemaOrigem: '',
    sistemaDestino: '',
    eventoTrigger: '',
    dadosEnviados: '',
    observacoes: '',
  });
  const [webhookErrors, setWebhookErrors] = useState({
    nomeIntegracao: false,
    sistemaOrigem: false,
    eventoTrigger: false,
  });

  // IA Follow-up Section - Pre-configured messages by temperature
  const [followUpMessages, setFollowUpMessages] = useState({
    frio: [
      { id: 'frio-1', delayMinutes: 5, message: 'Olá! Vi que você demonstrou interesse em nossos produtos. Posso ajudar?', active: true },
      { id: 'frio-2', delayMinutes: 30, message: 'Temos condições especiais disponíveis esta semana. Gostaria de saber mais?', active: true },
      { id: 'frio-3', delayMinutes: 120, message: 'Ainda está avaliando? Posso esclarecer alguma dúvida para você.', active: true },
      { id: 'frio-4', delayMinutes: 240, message: 'Não deixe passar essa oportunidade! Estamos à disposição.', active: false },
    ],
    morno: [
      { id: 'morno-1', delayMinutes: 5, message: 'Fico feliz com seu interesse! Vamos agendar uma conversa?', active: true },
      { id: 'morno-2', delayMinutes: 30, message: 'Conseguiu analisar as informações que enviei?', active: true },
      { id: 'morno-3', delayMinutes: 120, message: 'Posso preparar uma proposta personalizada para você.', active: true },
      { id: 'morno-4', delayMinutes: 240, message: 'Temos horários disponíveis amanhã. Qual prefere?', active: true },
    ],
    quente: [
      { id: 'quente-1', delayMinutes: 5, message: 'Excelente escolha! Vamos fechar negócio?', active: true },
      { id: 'quente-2', delayMinutes: 30, message: 'Preparei condições especiais exclusivas para você.', active: true },
      { id: 'quente-3', delayMinutes: 120, message: 'Estou aguardando sua confirmação para finalizar.', active: true },
      { id: 'quente-4', delayMinutes: 240, message: 'Última chamada! Essas condições são válidas apenas hoje.', active: true },
    ],
  });
  const [editingMessage, setEditingMessage] = useState<{ temp: 'frio' | 'morno' | 'quente'; index: number } | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [editMessageDelay, setEditMessageDelay] = useState(5);

  // Suporte Section State
  const [suporteForm, setSuporteForm] = useState({
    assunto: '',
    categoria: '',
    descricao: '',
  });
  const [suporteErrors, setSuporteErrors] = useState({
    assunto: false,
    categoria: false,
    descricao: false,
  });

  // Pós-venda automation messages state
  const [posVendaMessages, setPosVendaMessages] = useState([
    { id: 'pv-1', title: 'Mensagem de boas-vindas', delayDays: 0, message: 'Olá! Parabéns pela sua compra! Estamos muito felizes em ter você como cliente. Qualquer dúvida, estamos à disposição!', active: true },
    { id: 'pv-2', title: 'Follow-up de satisfação', delayDays: 7, message: 'Olá! Já se passaram alguns dias desde sua compra. Como está sendo sua experiência? Podemos ajudar em algo?', active: true },
    { id: 'pv-3', title: 'Oferta de upsell', delayDays: 30, message: 'Olá! Temos novidades e condições especiais para clientes como você. Gostaria de conhecer?', active: false },
    { id: 'pv-4', title: 'Manutenção anual', delayDays: 365, message: 'Olá! Completou 1 ano desde sua compra. Que tal aproveitar condições especiais de renovação?', active: false },
  ]);
  const [editingPosVenda, setEditingPosVenda] = useState<number | null>(null);
  const [editPosVendaTitle, setEditPosVendaTitle] = useState('');
  const [editPosVendaMessage, setEditPosVendaMessage] = useState('');
  const [editPosVendaDays, setEditPosVendaDays] = useState(0);

  // Pós-venda config - janela máxima de atuação
  const [posVendaMaxDays, setPosVendaMaxDays] = useState(365);

  const handleSaveFollowUpConfig = async () => {
    try {
      const payload = {
        name: 'FOLLOW_UP',
        isActive: true,
        config: {
          followUpMessages
        }
      };

      if (followUpAgentId) {
        await api.put(`/agents/${followUpAgentId}`, payload);
      } else {
        const res = await api.post('/agents', payload);
        if (res.data?.id) setFollowUpAgentId(res.data.id);
      }

      toast({
        title: 'Configurações salvas',
        description: 'Todas as mensagens de follow-up foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o Follow-up.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSdrConfig = async () => {
    try {
      const payload = {
        name: 'SDR',
        isActive: true,
        config: {
          sdrConfig,
          sdrQuestions,
          qualificationThreshold
        }
      };

      if (sdrAgentId) {
        await api.put(`/agents/${sdrAgentId}`, payload);
      } else {
        const res = await api.post('/agents', payload);
        if (res.data?.id) setSdrAgentId(res.data.id);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As variáveis do agente IA SDR foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o IA SDR.',
        variant: 'destructive'
      });
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setCropTarget('avatar');
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropTarget === 'avatar') {
      updateAvatar(croppedImage);
      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } else {
      updateLogo(croppedImage);
      toast({
        title: 'Logo atualizada',
        description: 'A logo da empresa foi alterada.',
      });
    }
    setTempImage(null);
  };

  const handleEditPosition = () => {
    if (profile.avatarUrl) {
      setTempImage(profile.avatarUrl);
      setCropTarget('avatar');
      setCropperOpen(true);
    }
  };

  const handleDeleteAvatar = () => {
    updateAvatar(null);
    toast({
      title: 'Foto removida',
      description: 'Sua foto de perfil foi removida.',
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setCropTarget('logo');
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const initials = { name: "User", email: "", role: "user" }.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    { id: 'clientes' as Section, icon: Users, iconColor: 'bg-[#4CAF50]', label: 'Clientes', description: 'Base de clientes completa' },
    { id: 'listas' as Section, icon: Package, iconColor: 'bg-[#5B8DEF]', label: 'Listas', description: 'Importar carteira e prospecção' },
    { id: 'estoque' as Section, icon: Package, iconColor: 'bg-[#FF9500]', label: 'Estoque', description: 'Produtos e serviços' },
    { id: 'ia-sdr' as Section, icon: Bot, iconColor: 'bg-[#5B8DEF]', label: 'IA SDR', description: 'Prompt de qualificação' },
    { id: 'ia-followup' as Section, icon: MessageSquare, iconColor: 'bg-[#4CAF50]', label: 'IA Follow-up', description: 'Mensagens automáticas' },
    { id: 'ia-posvenda' as Section, icon: Star, iconColor: 'bg-[#F5A15D]', label: 'IA Pós-venda', description: 'Automação pós-venda' },
    { id: 'ia-nps' as Section, icon: Target, iconColor: 'bg-[#9B7CF4]', label: 'IA NPS', description: 'Net Promoter Score' },
    { id: 'ia-ligacao' as Section, icon: PhoneCall, iconColor: 'bg-[#9B7CF4]', label: 'IA de Ligação', description: 'Configurar ligações automáticas' },
    { id: 'equipes' as Section, icon: Users, iconColor: 'bg-[#5B8DEF]', label: 'Equipes & Hierarquias', description: 'Gerentes, times e vendedores' },
    { id: 'usuarios' as Section, icon: UserCog, iconColor: 'bg-[#9B7CF4]', label: 'Usuários', description: 'Lista e papéis' },
    { id: 'config' as Section, icon: Settings, iconColor: 'bg-[#6B7280]', label: 'Configurações da Empresa', description: 'Nome, logo e cores' },
    { id: 'qrcode' as Section, icon: QrCode, iconColor: 'bg-[#25D366]', label: 'QR Code WhatsApp', description: 'Conexão QR Code' },
    { id: 'whatsapp-api' as Section, icon: Link, iconColor: 'bg-[#25D366]', label: 'WhatsApp API', description: 'Conexão via API oficial' },
    { id: 'api-openai' as Section, icon: Key, iconColor: 'bg-[#10A37F]', label: 'API OpenAI', description: 'Chave de API' },
    { id: 'plano' as Section, icon: Star, iconColor: 'bg-[#F5A15D]', label: 'Plano Contratado', description: 'Detalhes do seu plano' },
    { id: 'fatura' as Section, icon: Receipt, iconColor: 'bg-[#FF9500]', label: 'Fatura', description: 'Pagamentos e histórico' },
    { id: 'suporte' as Section, icon: Headphones, iconColor: 'bg-[#E96A6A]', label: 'Suporte SALT', description: 'Abrir chamado' },
    { id: 'chamados' as Section, icon: MessageSquare, iconColor: 'bg-[#5B8DEF]', label: 'Central de Chamados', description: 'Acompanhar chamados' },
    { id: 'servicos' as Section, icon: Sparkles, iconColor: 'bg-[#4FC3B5]', label: 'Serviços & Expansões', description: 'Upsell SALT' },
  ];

  // Sub-header for inner pages - com safe-area para mobile/PWA
  const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/10 pt-[var(--safe-area-top)]">
      <div className="container flex items-center gap-3 h-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors -ml-1 active:scale-95 transition-transform min-h-[44px] min-w-[44px] justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <span className="text-[15px] font-semibold text-foreground/90">{title}</span>
      </div>
    </div>
  );

  // IA SDR Section - Configurable Variables
  const sdrFields = [
    { key: 'nomeDoAgente', label: 'Nome do Agente', placeholder: 'Ex: Ana', description: 'Nome que a IA usará para se apresentar', variable: 'NOME_DO_AGENTE' },
    { key: 'nomeDaEmpresa', label: 'Nome da Empresa', placeholder: 'Ex: Salt AI Automation', description: 'Nome oficial da empresa', variable: 'NOME_DA_EMPRESA' },
    { key: 'siteOficial', label: 'Site Oficial', placeholder: 'Ex: https://saltdigi.com.br', description: 'URL do site da empresa', variable: 'SITE_OFICIAL' },
    { key: 'instagramOficial', label: 'Instagram Oficial', placeholder: 'Ex: @saltdigital', description: 'Perfil oficial no Instagram', variable: 'INSTAGRAM_OFICIAL' },
    { key: 'linkedinOficial', label: 'LinkedIn Oficial', placeholder: 'Ex: linkedin.com/company/salt', description: 'Página oficial no LinkedIn', variable: 'LINKEDIN_OFICIAL' },
    { key: 'enderecoDaEmpresa', label: 'Endereço da Empresa', placeholder: 'Ex: Rua das Flores, 123 – São Paulo/SP', description: 'Endereço físico da empresa (opcional)', variable: 'ENDERECO_DA_EMPRESA' },
  ];

  // Full frozen prompt template
  const getFullPrompt = () => {
    const v = (key: keyof typeof sdrConfig, variable: string) =>
      sdrConfig[key] || `{{${variable}}}`;

    // Generate questions section dynamically - only active questions
    const activeQuestions = sdrQuestions.filter(q => q.active);
    const questionsSection = activeQuestions?.map((q, i) =>
      `Pergunta ${i + 1}: ${q.question}`
    ).join('\n');

    return `Você é ${v('nomeDoAgente', 'NOME_DO_AGENTE')}, agente de qualificação com inteligência artificial da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.

Sua função é qualificar leads de forma natural, humana e estratégica, coletando informações importantes para identificar o perfil do cliente.

Você NÃO vende.
Você cria conexão, qualifica com inteligência e encaminha o lead com clareza, autoridade e zero fricção.

REGRAS DE COMUNICAÇÃO (OBRIGATÓRIAS):
- Seja direto, humano e estratégico
- Nunca pareça vendedor
- Não use travessões, diminutivos ou emojis desnecessários
- Use linguagem cotidiana, clara e prática
- Cada mensagem deve ter de 1 a 2 linhas
- Nunca envie mais de 2 mensagens seguidas
- Separe mensagens por duas quebras reais (formato WhatsApp)
- Nunca use o nome do lead no meio da conversa
- Use o nome do lead apenas no início e no fechamento
- Comente respostas apenas quando isso gerar clareza, conexão ou preparar a próxima pergunta
- Sempre que possível, encerre mensagens com perguntas simples

ABERTURA FIXA (OBRIGATÓRIA):
Sempre inicie a conversa exatamente assim, independentemente do canal ou da origem do lead.
Aguarde a resposta antes de continuar.

Olá, tudo certo?
Com quem eu falo por gentileza?

SEQUÊNCIA DE QUALIFICAÇÃO (ORDEM FIXA):
Faça as perguntas abaixo de forma natural, uma por vez, adaptando ao contexto da conversa:

${questionsSection}

CRITÉRIO DE QUALIFICAÇÃO:
O lead será considerado qualificado após responder pelo menos ${qualificationThreshold} perguntas de forma satisfatória.
Quando atingir esse número, acione a tool: qualificar.

CICLO COMPORTAMENTAL DO LEAD:
Lead Frio (até 3 mensagens): Perfil curioso ou evasivo. Eduque e desperte interesse.
Lead Morno (3 a 5 mensagens): Perfil interessado. Mostre valor e gere clareza.
Lead Quente (5+ mensagens): Perfil engajado. Facilite o próximo passo.

ENCAMINHAMENTO AO VENDEDOR:
Quando o lead estiver qualificado (${qualificationThreshold}+ perguntas respondidas), diga exatamente:
Pelo que você me contou, faz total sentido você conversar com nossa equipe comercial aqui da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.
Topa falar com alguém do time?

Se o lead aceitar, acione a tool: qualificar.

DESQUALIFICAÇÃO:
Acione a tool: desqualificar quando:
- O lead não tiver empresa
- Não houver fit com as soluções
- O lead não responder com clareza
- O lead demonstrar que não está no momento certo

Finalize sempre de forma cordial e educativa, sem pressão.

FECHAMENTO PADRÃO:
Ao encerrar a conversa de forma positiva, diga:

Obrigado pelo papo até aqui, {{NOME_DO_LEAD}}.
Se quiser conhecer mais sobre a ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}, seguem nossos canais oficiais:

Site: ${v('siteOficial', 'SITE_OFICIAL')}
Instagram: ${v('instagramOficial', 'INSTAGRAM_OFICIAL')}
LinkedIn: ${v('linkedinOficial', 'LINKEDIN_OFICIAL')}

Seja bem-vindo à ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.
Espero que seja o início de uma parceria de sucesso.

TOOLS DISPONÍVEIS:
- qualificar: usar quando o lead responder ${qualificationThreshold}+ perguntas com fit evidente
- desqualificar: usar quando não houver fit, clareza ou momento adequado`;
  };

  // Handle question editing
  const handleEditQuestion = (id: string) => {
    const question = sdrQuestions.find(q => q.id === id);
    if (question) {
      setEditingQuestion(id);
      setEditQuestionText(question.question);
      setEditQuestionPlaceholder(question.placeholder);
      setEditQuestionDescription(question.description);
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      setSdrQuestions(prev => prev.map(q =>
        q.id === editingQuestion
          ? { ...q, question: editQuestionText, placeholder: editQuestionPlaceholder, description: editQuestionDescription }
          : q
      ));
      setEditingQuestion(null);
    }
  };

  const handleToggleQuestion = (id: string) => {
    setSdrQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, active: !q.active } : q
    ));
  };

  // ===== PÓS-VENDA FUNCTIONS =====
  const posVendaFields = [
    { key: 'nomeDoAgente', label: 'Nome do Agente', placeholder: 'Ex: Marina', description: 'Nome que a IA usará para se apresentar', variable: 'NOME_DO_AGENTE' },
    { key: 'nomeDaEmpresa', label: 'Nome da Empresa', placeholder: 'Ex: Salt AI Automation', description: 'Nome oficial da empresa', variable: 'NOME_DA_EMPRESA' },
    { key: 'siteOficial', label: 'Site Oficial', placeholder: 'Ex: https://saltdigi.com.br', description: 'URL do site da empresa', variable: 'SITE_OFICIAL' },
    { key: 'instagramOficial', label: 'Instagram Oficial', placeholder: 'Ex: @saltdigital', description: 'Perfil oficial no Instagram', variable: 'INSTAGRAM_OFICIAL' },
  ];

  const handlePosVendaConfigChange = (field: keyof typeof posVendaConfig, value: string) => {
    setPosVendaConfig(prev => ({ ...prev, [field]: value }));
  };

  const getPosVendaPrompt = () => {
    const v = (key: keyof typeof posVendaConfig, variable: string) =>
      posVendaConfig[key] || `{{${variable}}}`;

    const activeQuestions = posVendaQuestions.filter(q => q.active);
    const questionsSection = activeQuestions?.map((q, i) =>
      `Pergunta ${i + 1}: ${q.question}`
    ).join('\n');

    return `Você é ${v('nomeDoAgente', 'NOME_DO_AGENTE')}, agente de pós-venda da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.

Sua função é garantir a satisfação do cliente após a compra, coletar feedback e identificar oportunidades de melhoria.

Você NÃO vende diretamente.
Você acompanha, fideliza e cria conexão com clientes que já compraram.

REGRAS DE COMUNICAÇÃO (OBRIGATÓRIAS):
- Seja empático, atencioso e genuíno
- Demonstre interesse real pela experiência do cliente
- Use linguagem cotidiana e acolhedora
- Cada mensagem deve ter de 1 a 2 linhas
- Nunca envie mais de 2 mensagens seguidas
- Agradeça pela confiança na empresa

ABERTURA FIXA (OBRIGATÓRIA):
Sempre inicie a conversa exatamente assim:

Olá, {{NOME_DO_CLIENTE}}! Tudo bem?
Aqui é ${v('nomeDoAgente', 'NOME_DO_AGENTE')} da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.
Quero saber como está sendo sua experiência com a gente!

SEQUÊNCIA DE ACOMPANHAMENTO:
Faça as perguntas abaixo de forma natural, uma por vez:

${questionsSection}

CRITÉRIO DE CONCLUSÃO:
O acompanhamento será considerado completo após ${posVendaThreshold} perguntas respondidas.

AÇÕES BASEADAS NO FEEDBACK:
- Cliente satisfeito: Agradeça e peça indicação
- Cliente com dúvidas: Ofereça suporte imediato
- Cliente insatisfeito: Acione a tool: escalar_suporte

FECHAMENTO PADRÃO:
Muito obrigado pelo seu tempo, {{NOME_DO_CLIENTE}}!
Qualquer dúvida, estamos à disposição.

Site: ${v('siteOficial', 'SITE_OFICIAL')}
Instagram: ${v('instagramOficial', 'INSTAGRAM_OFICIAL')}

TOOLS DISPONÍVEIS:
- concluir_acompanhamento: cliente satisfeito após ${posVendaThreshold}+ perguntas
- escalar_suporte: cliente insatisfeito ou com problema crítico
- agendar_retorno: cliente pediu para falar depois`;
  };

  const handleEditPosVendaQuestion = (id: string) => {
    const question = posVendaQuestions.find(q => q.id === id);
    if (question) {
      setEditingPosVendaQuestion(id);
      setEditQuestionText(question.question);
      setEditQuestionPlaceholder(question.placeholder);
      setEditQuestionDescription(question.description);
    }
  };

  const handleSavePosVendaQuestion = () => {
    if (editingPosVendaQuestion) {
      setPosVendaQuestions(prev => prev.map(q =>
        q.id === editingPosVendaQuestion
          ? { ...q, question: editQuestionText, placeholder: editQuestionPlaceholder, description: editQuestionDescription }
          : q
      ));
      setEditingPosVendaQuestion(null);
    }
  };

  const handleTogglePosVendaQuestion = (id: string) => {
    setPosVendaQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, active: !q.active } : q
    ));
  };

  // ===== NPS FUNCTIONS =====
  const npsFields = [
    { key: 'nomeDoAgente', label: 'Nome do Agente', placeholder: 'Ex: Julia', description: 'Nome que a IA usará para se apresentar', variable: 'NOME_DO_AGENTE' },
    { key: 'nomeDaEmpresa', label: 'Nome da Empresa', placeholder: 'Ex: Salt AI Automation', description: 'Nome oficial da empresa', variable: 'NOME_DA_EMPRESA' },
    { key: 'siteOficial', label: 'Site Oficial', placeholder: 'Ex: https://saltdigi.com.br', description: 'URL do site da empresa', variable: 'SITE_OFICIAL' },
    { key: 'instagramOficial', label: 'Instagram Oficial', placeholder: 'Ex: @saltdigital', description: 'Perfil oficial no Instagram', variable: 'INSTAGRAM_OFICIAL' },
  ];

  const handleNpsConfigChange = (field: keyof typeof npsConfig, value: string) => {
    setNpsConfig(prev => ({ ...prev, [field]: value }));
  };

  const getNpsPrompt = () => {
    const v = (key: keyof typeof npsConfig, variable: string) =>
      npsConfig[key] || `{{${variable}}}`;

    const detractorQs = npsDetractorQuestions.filter(q => q.active).map(q => `  - ${q.question}`).join('\n');
    const neutralQs = npsNeutralQuestions.filter(q => q.active).map(q => `  - ${q.question}`).join('\n');
    const promoterQs = npsPromoterQuestions.filter(q => q.active).map(q => `  - ${q.question}`).join('\n');

    return `Você é ${v('nomeDoAgente', 'NOME_DO_AGENTE')}, agente de pesquisa NPS da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.

Sua função é coletar a nota de recomendação (NPS) e entender os motivos por trás da avaliação do cliente.

Você NÃO vende.
Você pesquisa, escuta e coleta feedback valioso.

REGRAS DE COMUNICAÇÃO (OBRIGATÓRIAS):
- Seja breve, respeitoso e objetivo
- Agradeça pela participação na pesquisa
- Não pressione por respostas
- Aceite respostas curtas
- Cada mensagem deve ter de 1 a 2 linhas

ABERTURA FIXA (OBRIGATÓRIA):
Sempre inicie a conversa exatamente assim:

Olá, {{NOME_DO_CLIENTE}}!
Sou ${v('nomeDoAgente', 'NOME_DO_AGENTE')} da ${v('nomeDaEmpresa', 'NOME_DA_EMPRESA')}.
Pode nos ajudar com uma pesquisa rápida de satisfação?

PERGUNTA BASE (OBRIGATÓRIA):
${npsBaseQuestion.question}

PERGUNTAS CONDICIONAIS POR FAIXA DE NOTA:

🔴 DETRATORES (Nota 0-6):
Objetivo: Identificar dor real, falha específica e oportunidade imediata de correção.
${detractorQs || '  (nenhuma pergunta configurada)'}

🟡 NEUTROS (Nota 7-8):
Objetivo: Entender o que falta para virar promotor.
${neutralQs || '  (nenhuma pergunta configurada)'}

🟢 PROMOTORES (Nota 9-10):
Objetivo: Reforçar valor, coletar prova social e entender o diferencial percebido.
${promoterQs || '  (nenhuma pergunta configurada)'}

FECHAMENTO PADRÃO:
Muito obrigado pela sua avaliação, {{NOME_DO_CLIENTE}}!
Seu feedback é muito importante para nós.

Site: ${v('siteOficial', 'SITE_OFICIAL')}
Instagram: ${v('instagramOficial', 'INSTAGRAM_OFICIAL')}

TOOLS DISPONÍVEIS:
- concluir_pesquisa: pesquisa completa
- escalar_feedback: detrator ou feedback crítico
- agradecer_promotor: nota 9-10 com potencial de indicação`;
  };

  const handleEditNpsQuestion = (id: string, type: 'detractor' | 'neutral' | 'promoter') => {
    const questions = type === 'detractor' ? npsDetractorQuestions : type === 'neutral' ? npsNeutralQuestions : npsPromoterQuestions;
    const question = questions.find(q => q.id === id);
    if (question) {
      setEditingNpsQuestion(id);
      setEditingNpsQuestionType(type);
      setEditQuestionText(question.question);
      setEditQuestionDescription(question.description);
    }
  };

  const handleSaveNpsQuestion = () => {
    if (editingNpsQuestion && editingNpsQuestionType) {
      const updateFn = (prev: typeof npsDetractorQuestions) => prev.map(q =>
        q.id === editingNpsQuestion
          ? { ...q, question: editQuestionText, description: editQuestionDescription }
          : q
      );

      if (editingNpsQuestionType === 'detractor') {
        setNpsDetractorQuestions(updateFn);
      } else if (editingNpsQuestionType === 'neutral') {
        setNpsNeutralQuestions(updateFn);
      } else {
        setNpsPromoterQuestions(updateFn);
      }
      setEditingNpsQuestion(null);
      setEditingNpsQuestionType(null);
    }
  };

  const handleToggleNpsQuestion = (id: string, type: 'detractor' | 'neutral' | 'promoter') => {
    const updateFn = (prev: typeof npsDetractorQuestions) => prev.map(q =>
      q.id === id ? { ...q, active: !q.active } : q
    );

    if (type === 'detractor') {
      setNpsDetractorQuestions(updateFn);
    } else if (type === 'neutral') {
      setNpsNeutralQuestions(updateFn);
    } else {
      setNpsPromoterQuestions(updateFn);
    }
  };

  const handleSavePosVendaConfig = async () => {
    try {
      const payload = {
        name: 'POS_VENDA',
        isActive: true,
        config: {
          posVendaConfig,
          posVendaQuestions,
          posVendaThreshold
        }
      };

      if (posVendaAgentId) {
        await api.put(`/agents/${posVendaAgentId}`, payload);
      } else {
        const res = await api.post('/agents', payload);
        if (res.data?.id) setPosVendaAgentId(res.data.id);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do agente Pós-venda foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o Agente.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveNpsConfig = async () => {
    try {
      const payload = {
        name: 'NPS',
        isActive: true,
        config: {
          npsConfig,
          npsBaseQuestion,
          npsDetractorQuestions,
          npsNeutralQuestions,
          npsPromoterQuestions
        }
      };

      if (npsAgentId) {
        await api.put(`/agents/${npsAgentId}`, payload);
      } else {
        const res = await api.post('/agents', payload);
        if (res.data?.id) setNpsAgentId(res.data.id);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do agente NPS foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o NPS.',
        variant: 'destructive'
      });
    }
  };

  if (activeSection === 'ia-sdr') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="IA SDR" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Header Card */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5B8DEF] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-foreground/90">Configuração do Agente SDR</h3>
                <p className="text-[13px] text-muted-foreground/70">Preencha as variáveis para personalizar o comportamento da IA</p>
              </div>
            </div>
          </div>

          {/* Variables Form */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10">
              <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Variáveis Configuráveis
              </h4>
            </div>
            <div className="divide-y divide-border/10">
              {sdrFields.map((field) => (
                <div key={field.key} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-medium text-foreground/90">
                      {field.label}
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
                      {`{{${field.variable}}}`}
                    </span>
                  </div>
                  <Input
                    value={sdrConfig[field.key as keyof typeof sdrConfig]}
                    onChange={(e) => handleSdrConfigChange(field.key as keyof typeof sdrConfig, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-10 text-[14px] bg-muted/20 border-border/20 focus:border-primary/30"
                  />
                  <p className="text-[11px] text-muted-foreground/60">{field.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Qualification Questions Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10">
              <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Perguntas de Qualificação
              </h4>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Perguntas que o agente fará para qualificar o lead
              </p>
            </div>

            {/* Qualification Threshold Selector */}
            <div className="px-4 py-3 border-b border-border/10 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-foreground/90">
                  Lead qualificado após
                </Label>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {([3, 4, 5, 6] as const).map((num) => (
                      <button
                        key={num}
                        onClick={() => setQualificationThreshold(num)}
                        className={`w-9 h-9 rounded-lg text-[14px] font-semibold transition-all ${qualificationThreshold === num
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    perguntas respondidas
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/10">
              {sdrQuestions.map((question, index) => (
                <div key={question.id} className="px-4 py-3">
                  {editingQuestion === question.id ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Pergunta</Label>
                        <Input
                          value={editQuestionText}
                          onChange={(e) => setEditQuestionText(e.target.value)}
                          placeholder="Digite a pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Exemplo de resposta</Label>
                        <Input
                          value={editQuestionPlaceholder}
                          onChange={(e) => setEditQuestionPlaceholder(e.target.value)}
                          placeholder="Ex: Resposta esperada"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Descrição</Label>
                        <Input
                          value={editQuestionDescription}
                          onChange={(e) => setEditQuestionDescription(e.target.value)}
                          placeholder="Objetivo da pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveQuestion}
                          className="h-9 text-[13px] gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingQuestion(null)}
                          className="h-9 text-[13px]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Switch
                          checked={question.active}
                          onCheckedChange={() => handleToggleQuestion(question.id)}
                          className="scale-90"
                        />
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${question.active ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}`}>
                          {question.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {question.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditQuestion(question.id)}
                        className="p-2 hover:bg-muted/30 rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveSdrConfig} className="w-full h-11 text-[14px] gap-2 font-medium">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>

          {/* Preview Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <button
              onClick={() => setPromptExpanded(!promptExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground/60" />
                <h4 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wide">
                  📄 Prévia do seu Prompt
                </h4>
              </div>
              <ChevronLeft className={`w-4 h-4 text-muted-foreground/50 transition-transform ${promptExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </button>

            {promptExpanded && (
              <div className="px-4 pb-4">
                <div className="bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <pre className="text-[12px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {getFullPrompt()}
                  </pre>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-2 text-center">
                  Este prompt é somente leitura. Apenas as variáveis podem ser editadas acima.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }


  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    return `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ''}`;
  };

  const temperatureColors = {
    frio: { bg: 'bg-[#5B8DEF]', label: 'Frio', emoji: '❄️' },
    morno: { bg: 'bg-[#F5A15D]', label: 'Morno', emoji: '🌤️' },
    quente: { bg: 'bg-[#E96A6A]', label: 'Quente', emoji: '🔥' },
  };

  const handleToggleMessage = (temp: 'frio' | 'morno' | 'quente', index: number) => {
    setFollowUpMessages(prev => ({
      ...prev,
      [temp]: prev[temp].map((msg, i) =>
        i === index ? { ...msg, active: !msg.active } : msg
      )
    }));
  };

  const handleEditMessage = (temp: 'frio' | 'morno' | 'quente', index: number) => {
    const msg = followUpMessages[temp][index];
    setEditMessageText(msg.message);
    setEditMessageDelay(msg.delayMinutes);
    setEditingMessage({ temp, index });
  };

  const handleSaveMessage = () => {
    if (!editingMessage) return;
    setFollowUpMessages(prev => ({
      ...prev,
      [editingMessage.temp]: prev[editingMessage.temp].map((msg, i) =>
        i === editingMessage.index
          ? { ...msg, message: editMessageText, delayMinutes: editMessageDelay }
          : msg
      )
    }));
    setEditingMessage(null);
    toast({
      title: 'Mensagem atualizada',
      description: 'A mensagem de follow-up foi salva.',
    });
  };

  if (activeSection === 'ia-followup') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="IA Follow-up" onBack={handleBackToMain} />
        <main className="container py-4 space-y-5">
          {/* Editing Modal */}
          {editingMessage && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl p-5 w-full max-w-md space-y-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-foreground/90">Editar Mensagem</h3>
                  <button onClick={() => setEditingMessage(null)} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                      Enviar após (minutos)
                    </Label>
                    <div className="flex gap-2 mt-1.5">
                      {[5, 30, 120, 240].map((min) => (
                        <button
                          key={min}
                          onClick={() => setEditMessageDelay(min)}
                          className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-colors ${editMessageDelay === min
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground/70 hover:bg-secondary'
                            }`}
                        >
                          {formatDelay(min)}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      value={editMessageDelay}
                      onChange={(e) => setEditMessageDelay(Number(e.target.value))}
                      className="mt-2 h-9 text-[13px]"
                      placeholder="Tempo personalizado em minutos"
                    />
                  </div>

                  <div>
                    <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                      Mensagem
                    </Label>
                    <Textarea
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="min-h-[100px] text-[14px] resize-none mt-1.5"
                      placeholder="Digite a mensagem de follow-up..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingMessage(null)} className="flex-1 h-9 text-[13px]">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveMessage} className="flex-1 h-9 text-[13px] gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Temperature Sections */}
          {(['frio', 'morno', 'quente'] as const).map((temp) => (
            <div key={temp} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-base">{temperatureColors[temp].emoji}</span>
                <h2 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Temperatura {temperatureColors[temp].label}
                </h2>
              </div>
              <div
                className="bg-card rounded-xl overflow-hidden divide-y divide-border/10"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                {followUpMessages[temp].map((msg, index) => (
                  <button
                    key={msg.id}
                    className="w-full px-3 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => handleEditMessage(temp, index)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[13px] font-medium text-foreground/85">
                          Após {formatDelay(msg.delayMinutes)}
                        </span>
                      </div>
                      <Switch
                        checked={msg.active}
                        className="scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMessage(temp, index);
                        }}
                      />
                    </div>
                    <p className="text-[12px] text-muted-foreground/60 line-clamp-2 pl-5">{msg.message}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button
            className="w-full h-10 text-[13px] gap-2"
            onClick={handleSaveFollowUpConfig}
          >
            <Save className="w-4 h-4" />
            Salvar Todas as Configurações
          </Button>
        </main>
      </div>
    );
  }

  // IA NPS Section
  if (activeSection === 'ia-nps') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="IA NPS" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Header Card */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9B7CF4] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-foreground/90">Configuração do Agente NPS</h3>
                <p className="text-[13px] text-muted-foreground/70">Preencha as variáveis para personalizar a pesquisa de satisfação</p>
              </div>
            </div>
          </div>


          {/* Base Question Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10">
              <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                🎯 Pergunta Base (Obrigatória)
              </h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-[14px] font-medium text-foreground/90">
                {npsBaseQuestion.question}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {npsBaseQuestion.description}
              </p>
            </div>
          </div>

          {/* Detractors Section (0-6) */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10 bg-destructive/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <span className="text-[12px]">🔴</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-destructive">
                    Detratores (Nota 0-6)
                  </h4>
                  <p className="text-[10px] text-muted-foreground/60">
                    Identificar dor real, falha específica e oportunidade de correção
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/10">
              {npsDetractorQuestions?.map((question, index) => (
                <div key={question.id} className="px-4 py-3">
                  {editingNpsQuestion === question.id && editingNpsQuestionType === 'detractor' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Pergunta</Label>
                        <Input
                          value={editQuestionText}
                          onChange={(e) => setEditQuestionText(e.target.value)}
                          placeholder="Digite a pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Descrição</Label>
                        <Input
                          value={editQuestionDescription}
                          onChange={(e) => setEditQuestionDescription(e.target.value)}
                          placeholder="Objetivo da pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNpsQuestion}
                          className="h-9 text-[13px] gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNpsQuestion(null);
                            setEditingNpsQuestionType(null);
                          }}
                          className="h-9 text-[13px]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Switch
                          checked={question.active}
                          onCheckedChange={() => handleToggleNpsQuestion(question.id, 'detractor')}
                          className="scale-90"
                        />
                        <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-[11px] font-semibold text-destructive">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${question.active ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}`}>
                          {question.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {question.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditNpsQuestion(question.id, 'detractor')}
                        className="p-2 hover:bg-muted/30 rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Neutrals Section (7-8) */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10 bg-yellow-500/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-[12px]">🟡</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-yellow-600">
                    Neutros (Nota 7-8)
                  </h4>
                  <p className="text-[10px] text-muted-foreground/60">
                    Entender o que falta para virar promotor
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/10">
              {npsNeutralQuestions?.map((question, index) => (
                <div key={question.id} className="px-4 py-3">
                  {editingNpsQuestion === question.id && editingNpsQuestionType === 'neutral' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Pergunta</Label>
                        <Input
                          value={editQuestionText}
                          onChange={(e) => setEditQuestionText(e.target.value)}
                          placeholder="Digite a pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Descrição</Label>
                        <Input
                          value={editQuestionDescription}
                          onChange={(e) => setEditQuestionDescription(e.target.value)}
                          placeholder="Objetivo da pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNpsQuestion}
                          className="h-9 text-[13px] gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNpsQuestion(null);
                            setEditingNpsQuestionType(null);
                          }}
                          className="h-9 text-[13px]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Switch
                          checked={question.active}
                          onCheckedChange={() => handleToggleNpsQuestion(question.id, 'neutral')}
                          className="scale-90"
                        />
                        <span className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center text-[11px] font-semibold text-yellow-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${question.active ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}`}>
                          {question.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {question.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditNpsQuestion(question.id, 'neutral')}
                        className="p-2 hover:bg-muted/30 rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Promoters Section (9-10) */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10 bg-green-500/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-[12px]">🟢</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-green-600">
                    Promotores (Nota 9-10)
                  </h4>
                  <p className="text-[10px] text-muted-foreground/60">
                    Reforçar valor, coletar prova social e indicações
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/10">
              {npsPromoterQuestions?.map((question, index) => (
                <div key={question.id} className="px-4 py-3">
                  {editingNpsQuestion === question.id && editingNpsQuestionType === 'promoter' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Pergunta</Label>
                        <Input
                          value={editQuestionText}
                          onChange={(e) => setEditQuestionText(e.target.value)}
                          placeholder="Digite a pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Descrição</Label>
                        <Input
                          value={editQuestionDescription}
                          onChange={(e) => setEditQuestionDescription(e.target.value)}
                          placeholder="Objetivo da pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNpsQuestion}
                          className="h-9 text-[13px] gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNpsQuestion(null);
                            setEditingNpsQuestionType(null);
                          }}
                          className="h-9 text-[13px]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Switch
                          checked={question.active}
                          onCheckedChange={() => handleToggleNpsQuestion(question.id, 'promoter')}
                          className="scale-90"
                        />
                        <span className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-[11px] font-semibold text-green-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${question.active ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}`}>
                          {question.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {question.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditNpsQuestion(question.id, 'promoter')}
                        className="p-2 hover:bg-muted/30 rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveNpsConfig} className="w-full h-11 text-[14px] gap-2 font-medium">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>

          {/* Preview Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <button
              onClick={() => setNpsPromptExpanded(!npsPromptExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground/60" />
                <h4 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wide">
                  📄 Prévia do seu Prompt
                </h4>
              </div>
              <ChevronLeft className={`w-4 h-4 text-muted-foreground/50 transition-transform ${npsPromptExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </button>

            {npsPromptExpanded && (
              <div className="px-4 pb-4">
                <div className="bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <pre className="text-[12px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {getNpsPrompt()}
                  </pre>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-2 text-center">
                  Este prompt é somente leitura. Apenas as variáveis podem ser editadas acima.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Clientes Section
  if (activeSection === 'clientes') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Clientes" onBack={handleBackToMain} />
        <main className="container py-4">
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <ClientsSection />
          </div>
        </main>
      </div>
    );
  }

  // Listas Section
  if (activeSection === 'listas') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Listas de Leads" onBack={handleBackToMain} />
        <main className="container py-4">
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <ListsSection />
          </div>
        </main>
      </div>
    );
  }

  // Estoque Section
  if (activeSection === 'estoque') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Estoque" onBack={handleBackToMain} />
        <main className="container py-4">
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <InventorySection />
          </div>
        </main>
      </div>
    );
  }

  // Equipes Section
  if (activeSection === 'equipes') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <EquipesSection
          managers={[]}
          agents={[]}
          teams={[]}
          onBack={handleBackToMain}
        />
      </div>
    );
  }

  // Usuários Section
  if (activeSection === 'usuarios') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <UsuariosSection onBack={handleBackToMain} />
      </div>
    );
  }

  // Perfil Section
  if (activeSection === 'perfil') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Meu Perfil" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-1 ring-border/10">
                  <AvatarImage src={profile.avatarUrl || undefined} alt={{ name: "User", email: "", role: "user" }.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-3 h-3 text-primary-foreground" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>

              <div className="text-center">
                <h3 className="text-[15px] font-semibold text-foreground">{{ name: "User", email: "", role: "user" }.name}</h3>
                <p className="text-[12px] text-muted-foreground/70">eryk@saltdigi.com.br</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {profile.avatarUrl ? 'Trocar' : 'Adicionar'}
                </button>
                {profile.avatarUrl && (
                  <>
                    <span className="text-border/40">•</span>
                    <button
                      onClick={handleEditPosition}
                      className="px-2.5 py-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Ajustar
                    </button>
                    <span className="text-border/40">•</span>
                    <button
                      onClick={handleDeleteAvatar}
                      className="px-2.5 py-1 text-[11px] font-medium text-destructive/70 hover:text-destructive transition-colors"
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>

              {profile.avatarUrl && (
                <Button
                  onClick={() => {
                    toast({
                      title: 'Perfil salvo',
                      description: 'Suas alterações foram salvas com sucesso.',
                    });
                  }}
                  size="sm"
                  className="h-7 text-[11px] px-4 mt-1"
                >
                  Salvar
                </Button>
              )}
            </div>
          </div>

          <ImageCropper
            open={cropperOpen}
            onClose={() => {
              setCropperOpen(false);
              setTempImage(null);
            }}
            imageSrc={tempImage || ''}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
          />
        </main>
      </div>
    );
  }

  // Config Section
  if (activeSection === 'config') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Configurações da Empresa" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4 space-y-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Nome da Empresa
              </Label>
              <Input
                value={settings.name}
                onChange={(e) => updateName(e.target.value)}
                className="h-9 text-[14px] rounded-lg border-border/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Logo
              </Label>
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {settings.logoUrl ? 'Trocar' : 'Adicionar'}
                  </button>
                  {settings.logoUrl && (
                    <>
                      <span className="text-border/40">•</span>
                      <button
                        onClick={() => {
                          setTempImage(settings.logoUrl);
                          setCropTarget('logo');
                          setCropperOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Ajustar
                      </button>
                      <span className="text-border/40">•</span>
                      <button
                        onClick={() => {
                          updateLogo(null);
                          toast({
                            title: 'Logo removida',
                            description: 'A logo da empresa foi removida.',
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-destructive/70 hover:text-destructive transition-colors"
                      >
                        Remover
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Cor Principal
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updatePrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => updatePrimaryColor(e.target.value)}
                  className="h-9 text-[14px] rounded-lg border-border/20 flex-1"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: 'Configurações salvas',
                    description: 'Nome, logo e cor principal foram salvos com sucesso.',
                  });
                }}
                className="h-8 px-6 text-[12px] font-medium"
              >
                Salvar
              </Button>
              <p className="text-[11px] text-muted-foreground/50">
                As alterações são aplicadas em tempo real
              </p>
            </div>
          </div>

          <ImageCropper
            open={cropperOpen}
            onClose={() => {
              setCropperOpen(false);
              setTempImage(null);
            }}
            imageSrc={tempImage || ''}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
          />
        </main>
      </div>
    );
  }

  // QR Code WhatsApp Section
  if (activeSection === 'qrcode') {
    const connectedCount = whatsappConnections.filter(c => c.status === 'connected').length;
    const canAddMore = whatsappConnections.length < whatsappSlotLimit;

    const handleStartNewConnection = async () => {
      if (!newConnectionName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Informe um nome para identificar esta caixa de entrada.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const response = await whatsappApi.create(newConnectionName.trim());
        const newConnection = response.data;

        // Add to list locally
        setWhatsappConnections(prev => [{
          id: newConnection.id,
          name: newConnection.name,
          phone: newConnection.phoneNumber,
          status: 'pending' // Initial status
        }, ...prev]);

        // Immediately try to get QR Code
        handleReconnect(newConnection.id);

        setShowNewConnectionForm(false);
        setNewConnectionName('');
      } catch (error) {
        toast({
          title: 'Erro ao criar conexão',
          description: 'Falha ao criar instância no WhatsApp.',
          variant: 'destructive',
        });
      }
    };

    const handleConfirmConnection = async (connectionId: string) => {
      // Refresh list to check status
      try {
        const response = await whatsappApi.getAll();
        const mapped = response.data?.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phoneNumber,
          status: c.status === 'connected' ? 'connected' : 'disconnected',
          connectedAt: c.createdAt
        }));
        setWhatsappConnections(mapped);

        const current = mapped.find((c: any) => c.id === connectionId);
        if (current && current.status === 'connected') {
          setShowQrCodeForConnection(null);
          toast({
            title: 'WhatsApp conectado!',
            description: 'A caixa de entrada foi vinculada com sucesso.',
          });
        } else {
          toast({
            title: 'Ainda não conectado',
            description: 'Aguarde a sincronização ou tente escanear novamente.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Erro ao verificar',
          description: 'Não foi possível verificar o status da conexão.',
          variant: 'destructive',
        });
      }
    };

    const handleDisconnect = async (connectionId: string) => {
      try {
        await whatsappApi.deleteInstance(connectionId);
        toast({
          title: 'Conexão desconectada',
          description: 'A instância do WhatsApp foi desconectada com sucesso.',
        });
        setWhatsappConnections(prev => prev.filter((c: any) => c.id !== connectionId));
      } catch (error) {
        toast({
          title: 'Erro ao desconectar',
          description: 'Não foi possível desconectar.',
          variant: 'destructive',
        });
      }
    };

    const handleRemoveConnection = async (connectionId: string) => {
      try {
        await whatsappApi.deleteInstance(connectionId);
        toast({
          title: 'Conexão removida',
          description: 'A instância do WhatsApp foi excluída com sucesso.',
        });
        setWhatsappConnections(prev => prev.filter((c: any) => c.id !== connectionId));
      } catch (error) {
        toast({
          title: 'Erro ao remover',
          description: 'Não foi possível excluir a conexão.',
          variant: 'destructive',
        });
      }
    };

    const handleRequestMoreSlots = () => {
      // Create a support ticket for requesting more WhatsApp slots
      createUpgradeRequestTicket('whatsapp_slots');
      setPendingSlotRequest(true);
      toast({
        title: 'Solicitação enviada!',
        description: 'Nossa equipe entrará em contato para liberar mais conexões WhatsApp.',
      });
    };

    const handleReconnect = async (connectionId: string) => {
      setShowQrCodeForConnection(connectionId);
      setQrCodeData(null); // Clear previous

      try {
        const response = await whatsappApi.connect(connectionId);
        const code = response.data.base64 || response.data.qrcode || response.data.qrCode;

        if (code) {
          setQrCodeData(code);
        } else {
          // If connected, it might not return QR code
          if (response.data.instance?.status === 'connected' || response.data.status === 'connected') {
            toast({ title: 'Já conectado', description: 'Esta instância já está conectada.' });
            handleConfirmConnection(connectionId);
          }
        }
      } catch (error) {
        console.error('Error fetching QR Code:', error);
        toast({
          title: 'Erro ao carregar QR Code',
          description: 'Tente novamente em instantes.',
          variant: 'destructive',
        });
      }
    };

    // Socket.io handles QR code dismissal (see top-level useEffect)

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Conexão de WhatsApp" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">

          {/* Slot Counter */}
          <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/20">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              <span className="text-[13px] text-foreground/80">Conexões WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-primary">
                {connectedCount}/{whatsappSlotLimit}
              </span>
              <span className="text-[11px] text-muted-foreground">utilizadas</span>
            </div>
          </div>

          {/* Existing Connections List */}
          {whatsappConnections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-wide px-1">
                Caixas de Entrada
              </h3>
              {whatsappConnections?.map(connection => (
                <div
                  key={connection.id}
                  className="bg-card rounded-xl p-4 border border-border/20"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  {/* Connection being scanned (QR Code view) */}
                  {showQrCodeForConnection === connection.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[14px] font-semibold text-foreground">{connection.name}</h4>
                          <p className="text-[12px] text-muted-foreground/70">Escaneie o QR Code para conectar</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowQrCodeForConnection(null);
                            if (connection.status === 'pending') {
                              handleRemoveConnection(connection.id);
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* QR Code Area */}
                      <div className="flex flex-col items-center py-4">
                        <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center border border-border/20 mb-4 overflow-hidden relative">
                          {qrCodeData ? (
                            <img src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} alt="QR Code WhatsApp" className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                              <span className="text-xs text-muted-foreground">Carregando QR Code...</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground/60 text-center max-w-[250px]">
                          Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos Conectados e escaneie o código
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 text-[13px] gap-2"
                          onClick={() => {
                            setShowQrCodeForConnection(null);
                            if (connection.status === 'pending') {
                              handleRemoveConnection(connection.id);
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1 h-10 text-[13px] gap-2"
                          onClick={() => handleConfirmConnection(connection.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar Conexão
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Normal connection card view */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${connection.status === 'connected' ? 'bg-success/10' : 'bg-warning/10'
                            }`}>
                            <MessageCircle className={`w-5 h-5 ${connection.status === 'connected' ? 'text-success' : 'text-warning'
                              }`} />
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-foreground">{connection.name}</h4>
                            {connection.phone && (
                              <p className="text-[12px] text-muted-foreground/70">{connection.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${connection.status === 'connected'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                          }`}>
                          {connection.status === 'connected' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              Conectado
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                              Desconectado
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {connection.status === 'connected' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-[12px] gap-1.5"
                              onClick={() => handleDisconnect(connection.id)}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Desconectar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-[12px] gap-1.5"
                              onClick={() => handleReconnect(connection.id)}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Trocar Número
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 h-9 text-[12px] gap-1.5"
                              onClick={() => handleReconnect(connection.id)}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              Reconectar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-9 text-[12px] gap-1.5 px-3"
                              onClick={() => handleRemoveConnection(connection.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New Connection Form */}
          {showNewConnectionForm && (
            <div
              className="bg-card rounded-xl p-4 border border-primary/30"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-foreground">Nova Caixa de Entrada</h4>
                    <p className="text-[12px] text-muted-foreground/70">Dê um nome para identificar este WhatsApp</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] text-muted-foreground/80">Nome da Caixa de Entrada</Label>
                  <Input
                    placeholder="Ex: WhatsApp Vendas, Equipe Sul, João Silva..."
                    value={newConnectionName}
                    onChange={(e) => setNewConnectionName(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground/50">
                    Use o nome do time, vendedor ou setor para organizar suas conversas
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-[13px]"
                    onClick={() => {
                      setShowNewConnectionForm(false);
                      setNewConnectionName('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 h-10 text-[13px] gap-2"
                    onClick={handleStartNewConnection}
                  >
                    <QrCode className="w-4 h-4" />
                    Gerar QR Code
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Connection / Request More */}
          {!showNewConnectionForm && !showQrCodeForConnection && (
            <div className="space-y-2">
              {canAddMore ? (
                <Button
                  className="w-full h-11 text-[13px] gap-2"
                  onClick={() => setShowNewConnectionForm(true)}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Novo WhatsApp
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/20 text-center">
                    <p className="text-[13px] text-muted-foreground mb-1">
                      Você atingiu o limite de {whatsappSlotLimit} conexão(ões) WhatsApp
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      Solicite liberação para conectar mais números
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-11 text-[13px] gap-2"
                    onClick={handleRequestMoreSlots}
                    disabled={pendingSlotRequest}
                  >
                    {pendingSlotRequest ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Solicitação Enviada
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Solicitar Mais Conexões
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Help Info */}
          <div className="p-3 bg-secondary/20 rounded-lg border border-border/10">
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              <strong className="text-muted-foreground/80">Dica:</strong> Organize seus WhatsApps por equipe, vendedor ou setor.
              Assim fica fácil identificar de onde vêm as mensagens e direcionar os atendimentos.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // WhatsApp API Section
  if (activeSection === 'whatsapp-api') {
    const handleSaveWhatsAppApi = () => {
      if (!whatsappApiForm.inboxName || !whatsappApiForm.phoneNumber || !whatsappApiForm.phoneNumberId || !whatsappApiForm.businessAccountId || !whatsappApiForm.apiKey) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos para criar o canal.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Canal criado com sucesso',
        description: 'O canal WhatsApp via API foi configurado.',
      });

      setWhatsappApiForm({
        inboxName: '',
        phoneNumber: '',
        phoneNumberId: '',
        businessAccountId: '',
        apiKey: '',
      });
    };

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="WhatsApp API" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center">
                <Link className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">Conectar via API</h3>
                <p className="text-[13px] text-muted-foreground/70">Configure seu número empresarial via API oficial</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Nome da Caixa de Entrada
                </Label>
                <Input
                  placeholder="Ex: WhatsApp Vendas"
                  className="h-9 text-[14px] rounded-lg border-border/20"
                  value={whatsappApiForm.inboxName}
                  onChange={(e) => setWhatsappApiForm(prev => ({ ...prev, inboxName: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Número de Telefone
                </Label>
                <Input
                  placeholder="Ex: +5511999999999"
                  className="h-9 text-[14px] rounded-lg border-border/20"
                  value={whatsappApiForm.phoneNumber}
                  onChange={(e) => setWhatsappApiForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  ID do Número de Telefone
                </Label>
                <Input
                  placeholder="Ex: 123456789012345"
                  className="h-9 text-[14px] rounded-lg border-border/20 font-mono"
                  value={whatsappApiForm.phoneNumberId}
                  onChange={(e) => setWhatsappApiForm(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  ID da Conta Empresarial
                </Label>
                <Input
                  placeholder="Ex: 987654321098765"
                  className="h-9 text-[14px] rounded-lg border-border/20 font-mono"
                  value={whatsappApiForm.businessAccountId}
                  onChange={(e) => setWhatsappApiForm(prev => ({ ...prev, businessAccountId: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Chave de API
                </Label>
                <Input
                  type="password"
                  placeholder="Sua chave de API do WhatsApp Business"
                  className="h-9 text-[14px] rounded-lg border-border/20 font-mono"
                  value={whatsappApiForm.apiKey}
                  onChange={(e) => setWhatsappApiForm(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[12px] text-muted-foreground/70">
                  Obtenha suas credenciais no{' '}
                  <a
                    href="https://developers.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Meta for Developers
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <Button
                className="w-full h-10 text-[14px] gap-2 font-medium"
                onClick={handleSaveWhatsAppApi}
              >
                <Plus className="w-4 h-4" />
                Criar Canal do WhatsApp
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // IA de Ligação Section
  if (activeSection === 'ia-ligacao') {
    const handleSaveIALigacao = () => {
      if (!iaLigacaoForm.objetivo || !iaLigacaoForm.scriptInicial || !iaLigacaoForm.criterioSucesso) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha objetivo, script inicial e critério de sucesso.',
          variant: 'destructive',
        });
        return;
      }

      // Create support ticket with IA Ligação configuration
      createIALigacaoTicket(
        iaLigacaoForm,
        'current-tenant',
        'Empresa Atual',
        { name: "User", email: "", role: "user" }.id,
        { name: "User", email: "", role: "user" }.name
      );

      toast({
        title: 'Configuração enviada',
        description: 'Sua configuração de IA de Ligação foi registrada e será processada.',
      });

      setIaLigacaoForm({
        objetivo: '',
        scriptInicial: '',
        tomDeVoz: 'neutro',
        informacoesColetadas: '',
        criterioSucesso: '',
        clienteAtende: '',
        clienteNaoAtende: '',
        clientePedeRetorno: '',
      });
    };

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="IA de Ligação" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-[#9B7CF4]/10 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#9B7CF4]/20 flex items-center justify-center shrink-0 mt-0.5">
              <PhoneCall className="w-4 h-4 text-[#9B7CF4]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground/80">Serviço Sob Demanda</p>
              <p className="text-[12px] text-muted-foreground/70 mt-0.5">
                Configure sua IA de ligações. Ao salvar, um chamado será aberto para nossa equipe processar.
              </p>
            </div>
          </div>

          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#9B7CF4] flex items-center justify-center">
                <PhoneCall className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">Configuração da IA</h3>
                <p className="text-[13px] text-muted-foreground/70">Defina o comportamento das ligações</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Objetivo da Ligação <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Ex: Qualificar leads e agendar demonstrações do produto"
                  className="min-h-[80px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.objetivo}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, objetivo: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Script Inicial <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Ex: Olá, aqui é a Ana da SALT. Estou ligando porque você demonstrou interesse em nossas soluções..."
                  className="min-h-[100px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.scriptInicial}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, scriptInicial: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Tom de Voz
                </Label>
                <div className="flex gap-2">
                  {['formal', 'neutro', 'consultivo'].map((tom) => (
                    <button
                      key={tom}
                      onClick={() => setIaLigacaoForm(prev => ({ ...prev, tomDeVoz: tom }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium capitalize transition-colors ${iaLigacaoForm.tomDeVoz === tom
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground/70 hover:bg-secondary'
                        }`}
                    >
                      {tom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Informações que Devem Ser Coletadas
                </Label>
                <Textarea
                  placeholder="Ex: Nome, empresa, cargo, número de funcionários, principais desafios..."
                  className="min-h-[80px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.informacoesColetadas}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, informacoesColetadas: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Critério de Sucesso <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Ex: Agendar uma reunião com decisor ou obter compromisso de callback"
                  className="min-h-[80px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.criterioSucesso}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, criterioSucesso: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Behavior Section */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4">
              Comportamento por Situação
            </h4>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-foreground/80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Quando o Cliente Atende
                </Label>
                <Textarea
                  placeholder="Ex: Seguir script de qualificação e tentar agendar reunião..."
                  className="min-h-[70px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.clienteAtende}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, clienteAtende: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-foreground/80 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Quando o Cliente Não Atende
                </Label>
                <Textarea
                  placeholder="Ex: Deixar mensagem de voz e tentar novamente em 2 horas..."
                  className="min-h-[70px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.clienteNaoAtende}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, clienteNaoAtende: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-foreground/80 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-warning" />
                  Quando o Cliente Pede Retorno
                </Label>
                <Textarea
                  placeholder="Ex: Perguntar melhor horário e agendar callback no sistema..."
                  className="min-h-[70px] text-[14px] resize-none rounded-lg border-border/20"
                  value={iaLigacaoForm.clientePedeRetorno}
                  onChange={(e) => setIaLigacaoForm(prev => ({ ...prev, clientePedeRetorno: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveIALigacao}
            className="w-full h-11 text-[14px] gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            Salvar Configuração
          </Button>
        </main>
      </div>
    );
  }

  // API OpenAI Section
  if (activeSection === 'api-openai') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="API OpenAI" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#10A37F] flex items-center justify-center">
                <Key className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">Chave de API</h3>
                <p className="text-[13px] text-muted-foreground/70">Configure sua API Key da OpenAI</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    type={openaiKeyVisible ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="h-10 text-[14px] rounded-lg border-border/20 pr-20 font-mono"
                  />
                  <button
                    onClick={() => setOpenaiKeyVisible(!openaiKeyVisible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                  >
                    {openaiKeyVisible ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[12px] text-muted-foreground/70">
                  Sua chave API é usada para acessar os modelos GPT. Você pode obter uma em{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    platform.openai.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <Button
                className="w-full h-9 text-[13px] gap-2"
                onClick={() => {
                  toast({
                    title: 'API Key salva',
                    description: 'Sua chave de API foi configurada com sucesso.',
                  });
                }}
              >
                <Save className="w-4 h-4" />
                Salvar API Key
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Webhooks & API Section
  if (activeSection === 'webhooks') {
    const handleWebhookSubmit = () => {
      const errors = {
        nomeIntegracao: !webhookForm.nomeIntegracao.trim(),
        sistemaOrigem: !webhookForm.sistemaOrigem.trim(),
        eventoTrigger: !webhookForm.eventoTrigger.trim(),
      };
      setWebhookErrors(errors);

      if (errors.nomeIntegracao || errors.sistemaOrigem || errors.eventoTrigger) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha os campos obrigatórios para solicitar a integração.',
          variant: 'destructive',
        });
        return;
      }

      // Create webhook integration ticket
      createWebhookIntegrationTicket(
        webhookForm,
        'current-tenant',
        'Empresa Atual',
        { name: "User", email: "", role: "user" }.id,
        { name: "User", email: "", role: "user" }.name
      );

      toast({
        title: 'Solicitação enviada',
        description: 'Nossa equipe técnica analisará sua solicitação e entrará em contato.',
      });

      // Reset form
      setWebhookForm({
        nomeIntegracao: '',
        sistemaOrigem: '',
        sistemaDestino: '',
        eventoTrigger: '',
        dadosEnviados: '',
        observacoes: '',
      });
      setWebhookErrors({ nomeIntegracao: false, sistemaOrigem: false, eventoTrigger: false });
    };

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Webhooks & API" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* API OpenAI Config */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#10A37F] flex items-center justify-center">
                <Key className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">API OpenAI</h3>
                <p className="text-[13px] text-muted-foreground/70">Configure sua chave de API</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    type={openaiKeyVisible ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="h-10 text-[14px] rounded-lg border-border/20 pr-20 font-mono"
                  />
                  <button
                    onClick={() => setOpenaiKeyVisible(!openaiKeyVisible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                  >
                    {openaiKeyVisible ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[12px] text-muted-foreground/70">
                  Sua chave API é usada para acessar os modelos GPT. Você pode obter uma em{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    platform.openai.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <Button
                className="w-full h-9 text-[13px] gap-2"
                onClick={() => {
                  toast({
                    title: 'API Key salva',
                    description: 'Sua chave de API foi configurada com sucesso.',
                  });
                }}
              >
                <Save className="w-4 h-4" />
                Salvar API Key
              </Button>
            </div>
          </div>

          {/* Webhook Integration Request */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#6B7280] flex items-center justify-center">
                <Link className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">Solicitar Integração via Webhook</h3>
                <p className="text-[13px] text-muted-foreground/70">Preencha os dados para análise técnica</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Nome da Integração <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Sincronização de pedidos com ERP"
                  className={`h-9 text-[14px] rounded-lg ${webhookErrors.nomeIntegracao ? 'border-destructive focus-visible:ring-destructive' : 'border-border/20'}`}
                  value={webhookForm.nomeIntegracao}
                  onChange={(e) => {
                    setWebhookForm(prev => ({ ...prev, nomeIntegracao: e.target.value }));
                    if (webhookErrors.nomeIntegracao) setWebhookErrors(prev => ({ ...prev, nomeIntegracao: false }));
                  }}
                />
                {webhookErrors.nomeIntegracao && (
                  <p className="text-[11px] text-destructive">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Sistema de Origem <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Shopify, RD Station, Hotmart..."
                  className={`h-9 text-[14px] rounded-lg ${webhookErrors.sistemaOrigem ? 'border-destructive focus-visible:ring-destructive' : 'border-border/20'}`}
                  value={webhookForm.sistemaOrigem}
                  onChange={(e) => {
                    setWebhookForm(prev => ({ ...prev, sistemaOrigem: e.target.value }));
                    if (webhookErrors.sistemaOrigem) setWebhookErrors(prev => ({ ...prev, sistemaOrigem: false }));
                  }}
                />
                {webhookErrors.sistemaOrigem && (
                  <p className="text-[11px] text-destructive">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Sistema de Destino
                </Label>
                <Input
                  placeholder="Ex: CRM, WhatsApp, Banco de dados..."
                  className="h-9 text-[14px] rounded-lg border-border/20"
                  value={webhookForm.sistemaDestino}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, sistemaDestino: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Evento que Dispara o Webhook <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Nova compra, Lead cadastrado, Pagamento confirmado..."
                  className={`h-9 text-[14px] rounded-lg ${webhookErrors.eventoTrigger ? 'border-destructive focus-visible:ring-destructive' : 'border-border/20'}`}
                  value={webhookForm.eventoTrigger}
                  onChange={(e) => {
                    setWebhookForm(prev => ({ ...prev, eventoTrigger: e.target.value }));
                    if (webhookErrors.eventoTrigger) setWebhookErrors(prev => ({ ...prev, eventoTrigger: false }));
                  }}
                />
                {webhookErrors.eventoTrigger && (
                  <p className="text-[11px] text-destructive">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Dados a Serem Enviados
                </Label>
                <Textarea
                  placeholder="Ex: Nome, email, telefone, valor da compra, produto..."
                  className="min-h-[80px] text-[14px] resize-none rounded-lg border-border/20"
                  value={webhookForm.dadosEnviados}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, dadosEnviados: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Observações Adicionais
                </Label>
                <Textarea
                  placeholder="Informações extras, links de documentação, urgência..."
                  className="min-h-[80px] text-[14px] resize-none rounded-lg border-border/20"
                  value={webhookForm.observacoes}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[12px] text-muted-foreground/70">
                  Após o envio, nossa equipe técnica analisará a viabilidade da integração e entrará em contato para alinhar detalhes e prazos.
                </p>
              </div>

              <Button
                className="w-full h-10 text-[13px] gap-2"
                onClick={handleWebhookSubmit}
              >
                <Send className="w-4 h-4" />
                Enviar Solicitação
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }


  // Plano Contratado Section
  if (activeSection === 'plano') {
    const planInfo = {
      name: 'Profissional',
      periodicidade: 'Mensal',
      valorMensal: 'R$ 1.750,00',
      valorPorUsuario: 'R$ 250,00',
      usuarios: 7,
      usuariosLimite: 7,
      dataContratacao: '15/10/2024',
      proximaRenovacao: '15/01/2025',
      status: 'Ativo',
    };

    const planFeatures = [
      { label: 'IA SDR', included: true },
      { label: 'IA Follow-up', included: true },
      { label: 'IA Pós-venda', included: true },
      { label: 'IA NPS', included: true },
      { label: 'IA de Ligação', included: false },
      { label: 'Campanhas de WhatsApp', included: true },
      { label: 'Relatórios Avançados', included: true },
      { label: 'API & Webhooks', included: true },
    ];

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Plano Contratado" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Plan Header */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5B8DEF] flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground/90">SALT {planInfo.name}</h3>
                  <p className="text-[13px] text-muted-foreground/70">Plano {planInfo.periodicidade}</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                {planInfo.status}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-[28px] font-bold text-foreground">{planInfo.valorMensal}</span>
              <span className="text-[13px] text-muted-foreground/60">/mês</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Usuários</p>
                <p className="text-[15px] font-semibold text-foreground">{planInfo.usuarios} / {planInfo.usuariosLimite}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Valor por Usuário</p>
                <p className="text-[15px] font-semibold text-foreground">{planInfo.valorPorUsuario}</p>
              </div>
            </div>
          </div>

          {/* Plan Dates */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <h3 className="text-[13px] font-semibold text-foreground/80 mb-3">Informações do Contrato</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-2 border-b border-border/10">
                <span className="text-[13px] text-muted-foreground/70">Data de Contratação</span>
                <span className="text-[14px] font-medium text-foreground">{planInfo.dataContratacao}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/10">
                <span className="text-[13px] text-muted-foreground/70">Próxima Renovação</span>
                <span className="text-[14px] font-medium text-foreground">{planInfo.proximaRenovacao}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-muted-foreground/70">Periodicidade</span>
                <span className="text-[14px] font-medium text-foreground">{planInfo.periodicidade}</span>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <h3 className="text-[13px] font-semibold text-foreground/80 mb-3">Recursos Incluídos</h3>
            <div className="space-y-2">
              {planFeatures?.map((feature, index) => (
                <div key={index} className="flex items-center gap-2.5 py-1.5">
                  {feature.included ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/40" />
                  )}
                  <span className={`text-[13px] ${feature.included ? 'text-foreground/80' : 'text-muted-foreground/50'}`}>
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div
            className="bg-gradient-to-r from-[#5B8DEF]/10 to-[#9B7CF4]/10 rounded-xl p-4 border border-[#5B8DEF]/20"
          >
            <h3 className="text-[14px] font-semibold text-foreground/90 mb-1">Precisa de mais recursos?</h3>
            <p className="text-[12px] text-muted-foreground/70 mb-3">
              Faça upgrade para desbloquear funcionalidades avançadas como IA de Ligação e mais usuários.
            </p>
            <Button
              variant="outline"
              className="w-full h-9 text-[13px] gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => {
                createUpgradeRequestTicket(planInfo.name);
                toast({
                  title: "Solicitação Enviada!",
                  description: "Acabamos de avisar a nossa equipe comercial. Eles entrarão em contato contigo na sequência. Muito obrigado!",
                });
              }}
            >
              <Sparkles className="w-4 h-4" />
              Falar sobre Upgrade
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (activeSection === 'fatura') {
    const invoices = [
      { id: 1, month: 'Dezembro 2024', amount: 'R$ 1.750,00', status: 'Pago', dueDate: '10/12/2024', paidDate: '08/12/2024' },
      { id: 2, month: 'Janeiro 2025', amount: 'R$ 1.750,00', status: 'A vencer', dueDate: '10/01/2025', paidDate: null },
    ];

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Faturas" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Invoices List */}
          <div className="space-y-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
              Histórico de Faturas
            </h2>
            <div
              className="bg-card rounded-xl overflow-hidden divide-y divide-border/10"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              {invoices?.map((invoice) => (
                <div key={invoice.id} className="px-3 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-medium text-foreground/90">{invoice.month}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${invoice.status === 'Pago'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                      }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-foreground">{invoice.amount}</span>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground/60">
                        {invoice.status === 'Pago' ? 'Pago em' : 'Vencimento'}
                      </p>
                      <p className="text-[12px] text-foreground/70">
                        {invoice.paidDate || invoice.dueDate}
                      </p>
                    </div>
                  </div>
                  {invoice.status === 'A vencer' && (
                    <Button
                      size="sm"
                      className="w-full h-8 mt-3 text-[12px] gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pagar Agora
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }


  const handleSuporteSubmit = () => {
    const errors = {
      assunto: !suporteForm.assunto.trim(),
      categoria: !suporteForm.categoria,
      descricao: !suporteForm.descricao.trim(),
    };
    setSuporteErrors(errors);

    if (errors.assunto || errors.categoria || errors.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para enviar o chamado.',
        variant: 'destructive',
      });
      return;
    }

    // Create internal support ticket using shared store
    createSupportTicketFromForm(
      suporteForm.assunto,
      suporteForm.categoria,
      suporteForm.descricao,
      'current-tenant', // Would come from auth context
      'Empresa Atual',  // Would come from tenant context
      { name: "User", email: "", role: "user" }.id,
      { name: "User", email: "", role: "user" }.name,
      'media'
    );

    toast({
      title: 'Chamado aberto com sucesso',
      description: 'Seu chamado foi registrado e nossa equipe entrará em contato em breve.',
    });

    // Reset form
    setSuporteForm({ assunto: '', categoria: '', descricao: '' });
    setSuporteErrors({ assunto: false, categoria: false, descricao: false });
  };

  if (activeSection === 'suporte') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Suporte SALT" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#E96A6A] flex items-center justify-center">
                <Headphones className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground/90">Abrir Chamado</h3>
                <p className="text-[13px] text-muted-foreground/70">Descreva seu problema ou dúvida</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Assunto <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Problema com integração WhatsApp"
                  className={`h-9 text-[14px] rounded-lg ${suporteErrors.assunto ? 'border-destructive focus-visible:ring-destructive' : 'border-border/20'}`}
                  value={suporteForm.assunto}
                  onChange={(e) => {
                    setSuporteForm(prev => ({ ...prev, assunto: e.target.value }));
                    if (suporteErrors.assunto) setSuporteErrors(prev => ({ ...prev, assunto: false }));
                  }}
                />
                {suporteErrors.assunto && (
                  <p className="text-[11px] text-destructive">Preencha o assunto do chamado</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <select
                  className={`w-full h-9 px-3 text-[14px] rounded-lg bg-background ${suporteErrors.categoria ? 'border-2 border-destructive' : 'border border-border/20'}`}
                  value={suporteForm.categoria}
                  onChange={(e) => {
                    setSuporteForm(prev => ({ ...prev, categoria: e.target.value }));
                    if (suporteErrors.categoria) setSuporteErrors(prev => ({ ...prev, categoria: false }));
                  }}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Dúvida técnica">Dúvida técnica</option>
                  <option value="Problema de funcionamento">Problema de funcionamento</option>
                  <option value="Sugestão de melhoria">Sugestão de melhoria</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Outro">Outro</option>
                </select>
                {suporteErrors.categoria && (
                  <p className="text-[11px] text-destructive">Selecione uma categoria</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                  Descrição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva detalhadamente sua solicitação..."
                  className={`min-h-[120px] text-[14px] resize-none rounded-lg ${suporteErrors.descricao ? 'border-destructive focus-visible:ring-destructive' : 'border-border/20'}`}
                  value={suporteForm.descricao}
                  onChange={(e) => {
                    setSuporteForm(prev => ({ ...prev, descricao: e.target.value }));
                    if (suporteErrors.descricao) setSuporteErrors(prev => ({ ...prev, descricao: false }));
                  }}
                />
                {suporteErrors.descricao && (
                  <p className="text-[11px] text-destructive">Descreva sua solicitação</p>
                )}
              </div>

              <Button
                className="w-full h-9 text-[13px] gap-2"
                onClick={handleSuporteSubmit}
              >
                <Send className="w-4 h-4" />
                Enviar Chamado
              </Button>
            </div>
          </div>

        </main>
      </div>
    );
  }

  // Central de Chamados Section
  if (activeSection === 'chamados') {
    const tenantTickets = supportTicketsApi.getByTenant('current-tenant');

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'aberto':
          return { bg: 'bg-warning/10', text: 'text-warning', label: 'Aberto' };
        case 'em_atendimento':
          return { bg: 'bg-primary/10', text: 'text-primary', label: 'Em Atendimento' };
        case 'resolvido':
          return { bg: 'bg-success/10', text: 'text-success', label: 'Resolvido' };
        default:
          return { bg: 'bg-muted/10', text: 'text-muted-foreground', label: status };
      }
    };

    const getTypeLabel = (type: string) => {
      const types: Record<string, string> = {
        whatsapp: 'WhatsApp',
        funil: 'Funil',
        ia: 'Inteligência Artificial',
        financeiro: 'Financeiro',
        tecnico: 'Técnico',
        outro: 'Outro',
      };
      return types[type] || type;
    };

    const getPriorityBadge = (priority: string) => {
      switch (priority) {
        case 'critica':
          return { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Crítica' };
        case 'alta':
          return { bg: 'bg-[#FF9500]/10', text: 'text-[#FF9500]', label: 'Alta' };
        case 'media':
          return { bg: 'bg-primary/10', text: 'text-primary', label: 'Média' };
        case 'baixa':
          return { bg: 'bg-muted/10', text: 'text-muted-foreground', label: 'Baixa' };
        default:
          return { bg: 'bg-muted/10', text: 'text-muted-foreground', label: priority };
      }
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Central de Chamados" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p className="text-[18px] font-bold text-warning">
                {tenantTickets.filter(t => t.status === 'aberto').length}
              </p>
              <p className="text-[11px] text-muted-foreground/60">Abertos</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p className="text-[18px] font-bold text-primary">
                {tenantTickets.filter(t => t.status === 'em_atendimento').length}
              </p>
              <p className="text-[11px] text-muted-foreground/60">Em Atendimento</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p className="text-[18px] font-bold text-success">
                {tenantTickets.filter(t => t.status === 'resolvido').length}
              </p>
              <p className="text-[11px] text-muted-foreground/60">Resolvidos</p>
            </div>
          </div>

          {/* Tickets List */}
          {tenantTickets.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-[14px] font-medium text-foreground/80 mb-1">Nenhum chamado encontrado</h3>
              <p className="text-[12px] text-muted-foreground/60">
                Você ainda não abriu nenhum chamado de suporte.
              </p>
              <Button
                variant="outline"
                className="mt-4 h-9 text-[13px] gap-2"
                onClick={() => setActiveSection('suporte')}
              >
                <Headphones className="w-4 h-4" />
                Abrir Chamado
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
                Seus Chamados ({tenantTickets.length})
              </h2>
              <div className="space-y-2">
                {tenantTickets?.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const priorityBadge = getPriorityBadge(ticket.priority);

                  return (
                    <div
                      key={ticket.id}
                      className="bg-card rounded-xl p-4"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[14px] font-medium text-foreground/90 line-clamp-2 flex-1">
                          {ticket.subject}
                        </h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="text-[12px] text-muted-foreground/70 line-clamp-2 mb-3">
                        {ticket.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground/80">
                            {getTypeLabel(ticket.type)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityBadge.bg} ${priorityBadge.text}`}>
                            {priorityBadge.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/50">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>

                      {ticket.assignedTo && (
                        <div className="mt-3 pt-3 border-t border-border/10">
                          <p className="text-[11px] text-muted-foreground/60">
                            Responsável: <span className="text-foreground/70 font-medium">{ticket.assignedTo}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA to open new ticket */}
          {tenantTickets.length > 0 && (
            <Button
              className="w-full h-10 text-[13px] gap-2"
              onClick={() => setActiveSection('suporte')}
            >
              <Plus className="w-4 h-4" />
              Abrir Novo Chamado
            </Button>
          )}
        </main>
      </div>
    );
  }

  // Serviços Section
  const handleContactConsultant = (serviceName?: string) => {
    if (serviceName) {
      // Create a service request ticket
      createServiceRequestTicket(
        serviceName,
        'current-tenant', // Would come from auth context
        'Empresa Atual',  // Would come from tenant context
        { name: "User", email: "", role: "user" }.id,
        { name: "User", email: "", role: "user" }.name
      );

      toast({
        title: 'Solicitação registrada',
        description: `Seu interesse em "${serviceName}" foi registrado. Nossa equipe entrará em contato em breve.`,
      });
    } else {
      // General inquiry - also create a ticket
      createServiceRequestTicket(
        'Serviços e Expansões (Geral)',
        'current-tenant',
        'Empresa Atual',
        { name: "User", email: "", role: "user" }.id,
        { name: "User", email: "", role: "user" }.name
      );

      toast({
        title: 'Solicitação registrada',
        description: 'Nossa equipe comercial entrará em contato em breve.',
      });
    }
  };

  if (activeSection === 'servicos') {
    const servicos = [
      {
        id: 'integracao',
        icon: Database,
        iconColor: 'bg-[#5B8DEF]',
        title: 'Integração de Sistemas',
        description: 'Conecte seu CRM, ERP ou sistemas legados',
        detail: 'Integração sob medida para seu ambiente',
      },
      {
        id: 'whatsapp-massa',
        icon: Send,
        iconColor: 'bg-[#25D366]',
        title: 'Envio em Massa WhatsApp',
        description: 'Campanhas de marketing via WhatsApp',
        detail: 'Serviço sob demanda conforme volume',
      },
      {
        id: 'ia-personalizada',
        icon: Bot,
        iconColor: 'bg-[#4CAF50]',
        title: 'IA Personalizada',
        description: 'Treinamento de IA com seus dados',
        detail: 'Valor conforme escopo e complexidade',
      },
      {
        id: 'desenvolvimento',
        icon: Wrench,
        iconColor: 'bg-[#F5A15D]',
        title: 'Desenvolvimento Sob Medida',
        description: 'Funcionalidades exclusivas para seu negócio',
        detail: 'Desenvolvimento customizado sob demanda',
      },
    ];

    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Serviços & Expansões" onBack={handleBackToMain} />
        <main className="container py-4 space-y-3">
          {/* Info Banner */}
          <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground/80">Contratação Consultiva</p>
              <p className="text-[12px] text-muted-foreground/70 mt-0.5">
                Todos os serviços são personalizados. Fale com nosso consultor para uma proposta sob medida.
              </p>
            </div>
          </div>

          {servicos?.map((servico) => {
            const IconComponent = servico.icon;
            return (
              <div
                key={servico.id}
                className="bg-card rounded-xl p-4 cursor-pointer hover:bg-secondary/20 transition-colors active:scale-[0.98]"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onClick={() => handleContactConsultant(servico.title)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${servico.iconColor} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-foreground/90">{servico.title}</h3>
                    <p className="text-[13px] text-muted-foreground/60 mt-0.5">
                      {servico.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1">
                      {servico.detail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[13px] font-semibold text-primary">Sob consulta</span>
                      <ExternalLink className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Button
              className="w-full h-10 text-[13px] gap-2"
              onClick={() => handleContactConsultant()}
            >
              <MessageCircle className="w-4 h-4" />
              Falar com Consultor
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Google Calendar integration section
  if (activeSection === 'google-calendar') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="Google Calendar" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#4285F4]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground/90">Integração com Google Agenda</p>
              <p className="text-[13px] text-muted-foreground/70 mt-1">
                Conecte sua conta Google para sincronizar agendamentos automaticamente. Suas reuniões e compromissos serão enviados diretamente para sua agenda.
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <IOSCard className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground/90">Agenda Não Conectada</p>
                    <p className="text-[13px] text-muted-foreground/60 mt-0.5">Clique para vincular sua conta</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              </div>
            </div>

            <div className="px-4 pb-4">
              <Button
                className="w-full h-11 text-[13px] gap-2 bg-[#4285F4] hover:bg-[#3367D6]"
                onClick={() => {
                  toast({
                    title: 'Em breve',
                    description: 'A integração com Google Calendar será habilitada em breve.',
                  });
                }}
              >
                <Calendar className="w-4 h-4" />
                Conectar com Google
              </Button>
            </div>
          </IOSCard>

          {/* Benefits */}
          <IOSCard className="p-4 space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground/90">Benefícios da integração</h3>
            <div className="space-y-3">
              {[
                { icon: Clock, text: 'Agendamentos sincronizados automaticamente' },
                { icon: RefreshCw, text: 'Atualizações em tempo real' },
                { icon: CheckCircle2, text: 'Evite conflitos de horários' },
                { icon: Zap, text: 'Notificações inteligentes' },
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-[#4285F4]" />
                  </div>
                  <span className="text-[13px] text-muted-foreground/80">{benefit.text}</span>
                </div>
              ))}
            </div>
          </IOSCard>
        </main>
      </div>
    );
  }

  // Labels/Etiquetas management section
  if (activeSection === 'etiquetas') {
    return <EtiquetasSection onBack={handleBackToMain} />;
  }

  const handleEditPosVenda = (index: number) => {
    const msg = posVendaMessages[index];
    setEditPosVendaTitle(msg.title);
    setEditPosVendaMessage(msg.message);
    setEditPosVendaDays(msg.delayDays);
    setEditingPosVenda(index);
  };

  const handleSavePosVenda = () => {
    if (editingPosVenda === null) return;
    setPosVendaMessages(prev => prev.map((msg, i) =>
      i === editingPosVenda
        ? { ...msg, title: editPosVendaTitle, message: editPosVendaMessage, delayDays: editPosVendaDays }
        : msg
    ));
    setEditingPosVenda(null);
    toast({
      title: 'Automação atualizada',
      description: 'As configurações foram salvas.',
    });
  };

  const handleTogglePosVenda = (index: number) => {
    setPosVendaMessages(prev => prev.map((msg, i) =>
      i === index ? { ...msg, active: !msg.active } : msg
    ));
  };

  const formatDaysDelay = (days: number) => {
    if (days === 0) return 'Após fechamento';
    if (days === 1) return 'Após 1 dia';
    return `Após ${days} dias`;
  };

  // IA Pós-venda Section
  if (activeSection === 'ia-posvenda') {
    return (
      <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
        <SubHeader title="IA Pós-venda" onBack={handleBackToMain} />
        <main className="container py-4 space-y-4">
          {/* Header Card */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5A15D] flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-foreground/90">Configuração do Agente Pós-venda</h3>
                <p className="text-[13px] text-muted-foreground/70">Preencha as variáveis para personalizar o acompanhamento</p>
              </div>
            </div>
          </div>


          {/* Qualification Questions Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="px-4 py-3 border-b border-border/10">
              <h4 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Perguntas de Acompanhamento
              </h4>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Perguntas que o agente fará para acompanhar o cliente
              </p>
            </div>

            {/* Threshold Selector */}
            <div className="px-4 py-3 border-b border-border/10 bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-foreground/90">
                  Acompanhamento completo após
                </Label>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {([3, 4, 5, 6] as const).map((num) => (
                      <button
                        key={num}
                        onClick={() => setPosVendaThreshold(num)}
                        className={`w-9 h-9 rounded-lg text-[14px] font-semibold transition-all ${posVendaThreshold === num
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    perguntas respondidas
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/10">
              {posVendaQuestions?.map((question, index) => (
                <div key={question.id} className="px-4 py-3">
                  {editingPosVendaQuestion === question.id ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Pergunta</Label>
                        <Input
                          value={editQuestionText}
                          onChange={(e) => setEditQuestionText(e.target.value)}
                          placeholder="Digite a pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Exemplo de resposta</Label>
                        <Input
                          value={editQuestionPlaceholder}
                          onChange={(e) => setEditQuestionPlaceholder(e.target.value)}
                          placeholder="Ex: Resposta esperada"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[12px] text-muted-foreground/70">Descrição</Label>
                        <Input
                          value={editQuestionDescription}
                          onChange={(e) => setEditQuestionDescription(e.target.value)}
                          placeholder="Objetivo da pergunta"
                          className="h-10 text-[14px] bg-muted/20 border-border/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSavePosVendaQuestion}
                          className="h-9 text-[13px] gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPosVendaQuestion(null)}
                          className="h-9 text-[13px]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Switch
                          checked={question.active}
                          onCheckedChange={() => handleTogglePosVendaQuestion(question.id)}
                          className="scale-90"
                        />
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium ${question.active ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}`}>
                          {question.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {question.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditPosVendaQuestion(question.id)}
                        className="p-2 hover:bg-muted/30 rounded-lg transition-colors shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSavePosVendaConfig} className="w-full h-11 text-[14px] gap-2 font-medium">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>

          {/* Preview Section */}
          <div
            className="bg-card rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <button
              onClick={() => setPosVendaPromptExpanded(!posVendaPromptExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground/60" />
                <h4 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wide">
                  📄 Prévia do seu Prompt
                </h4>
              </div>
              <ChevronLeft className={`w-4 h-4 text-muted-foreground/50 transition-transform ${posVendaPromptExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </button>

            {posVendaPromptExpanded && (
              <div className="px-4 pb-4">
                <div className="bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <pre className="text-[12px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {getPosVendaPrompt()}
                  </pre>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-2 text-center">
                  Este prompt é somente leitura. Apenas as variáveis podem ser editadas acima.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Main Menu
  return (
    <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
      <Header showBack title="Outros" onBack={() => navigate('/home', { replace: true })} />

      <main className="container py-4 space-y-4">
        <IOSSection title="Conta">
          <IOSSectionItem
            icon={User}
            iconColor="bg-[#5B8DEF]"
            label="Meu Perfil"
            value="Foto e informações pessoais"
            showArrow
            onClick={() => setActiveSection('perfil')}
          />
        </IOSSection>

        <IOSSection title="Inteligência Artificial">
          {menuItems.slice(0, 5)?.map((item) => (
            <IOSSectionItem
              key={item.id}
              icon={item.icon}
              iconColor={item.iconColor}
              label={item.label}
              value={item.description}
              showArrow
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </IOSSection>

        <IOSSection title="Gestão">
          {menuItems.slice(5, 7)?.map((item) => (
            <IOSSectionItem
              key={item.id}
              icon={item.icon}
              iconColor={item.iconColor}
              label={item.label}
              value={item.description}
              showArrow
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </IOSSection>

        <IOSSection title="Configurações">
          {menuItems.slice(7, 12)?.map((item) => (
            <IOSSectionItem
              key={item.id}
              icon={item.icon}
              iconColor={item.iconColor}
              label={item.label}
              value={item.description}
              showArrow
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </IOSSection>

        <IOSSection title="SALT">
          {menuItems.slice(12)?.map((item) => (
            <IOSSectionItem
              key={item.id}
              icon={item.icon}
              iconColor={item.iconColor}
              label={item.label}
              value={item.description}
              showArrow
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </IOSSection>
      </main>
    </div>
  );
};

export default Outros;
