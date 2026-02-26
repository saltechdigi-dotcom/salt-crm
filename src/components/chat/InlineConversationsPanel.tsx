import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { api } from '@/lib/api';

import { toast } from 'sonner';
import {
  Search,
  Plus,
  Tag,
  Wifi,
  X,
  Send,
  Paperclip,
  Mic,
  User,
  ArrowLeft,
  ChevronUp,
  MessageSquare,
  CheckCircle,
  Pin,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Calendar,
  Users,
  StickyNote,
  ChevronRight,
  ChevronLeft,
  Upload,
  Clock,
  FileText,
  CalendarCheck,
  Package,
  Wrench,
  Truck,
  Filter,
} from 'lucide-react';
import { useLabelsStore, Label as LabelType } from '@/stores/labels';
import { PinConversationModal } from '@/components/chat/PinConversationModal';
import { ScheduleAppointmentModal } from '@/components/chat/ScheduleAppointmentModal';
import { SellerCalendarView } from '@/components/funil/SellerCalendarView';
import { SalePrintView } from '@/components/sales/SalePrintView';
import { useLeadSchedules, LeadSchedule } from '@/stores/leads/lead-schedules-store';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useChatStore } from '@/stores/chat-store';

interface Conversation {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'ia' | 'manual' | 'waiting';
  isActive: boolean;
  tags?: string[];
}

interface Message {
  id: string;
  content: string;
  sender: 'client' | 'agent';
  agentName?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface InlineConversationsPanelProps {
  expanded: boolean;
  onToggle: () => void;
  initialConversationId?: string | null;
  initialConversationPhone?: string | null;
  initialConversationName?: string | null;
}

// Deprecated mock conversations array
// Left blank because we fetch from API now

// Mock vendedores list
const [] = [
  { id: '1', name: 'Ademir José', email: 'ademir.jose@empresa.com' },
  { id: '2', name: 'Administrativo TIME', email: 'admin@empresa.com' },
  { id: '3', name: 'Alexsandro', email: 'alexsandro.maciel@empresa.com' },
  { id: '4', name: 'Andrea', email: 'andrea@empresa.com' },
  { id: '5', name: 'Antônio', email: 'antonio.pereira@empresa.com' },
];

const configOptions = [
  {
    id: 'temperature',
    icon: RefreshCw,
    title: 'Temperatura',
    description: 'Alterar status do lead',
  },
  {
    id: 'schedule',
    icon: Calendar,
    title: 'Agendar Retorno',
    description: 'Programar mensagem futura',
  },
  {
    id: 'transfer',
    icon: Users,
    title: 'Transferir Atendimento',
    description: 'Transferir lead para outro vendedor',
  },
  {
    id: 'notes',
    icon: StickyNote,
    title: 'Observações',
    description: 'Adicionar notas sobre o lead',
  },
];

// All status options in funnel order - colors synced with Funil.tsx
const allStatusOptions = [
  { id: 'frio', label: 'Frio', color: '#5B8DEF' },
  { id: 'morno', label: 'Morno', color: '#F5A15D' },
  { id: 'quente', label: 'Quente', color: '#E96A6A' },
  { id: 'qualificado', label: 'Qualificado', color: '#4FC3B5' },
  {
    id: 'em_atendimento',
    label: 'Em Atendimento',
    color: '#9B7CF4',
    hasSubStatus: true,
    subStatuses: [
      { id: 'carteira', label: 'Carteira' },
      { id: 'marcar_agenda', label: 'Marcar Agenda' },
    ]
  },
  {
    id: 'em_negociacao',
    label: 'Em Negociação',
    color: '#F4C95D',
    hasSubStatus: true,
    subStatuses: [
      { id: 'proposta_enviada', label: 'Proposta Enviada' },
    ]
  },
  {
    id: 'fechado_ganho',
    label: 'Fechado – Ganho',
    color: '#4CAF50',
    hasSubStatus: true,
    subStatuses: [
      { id: 'fechado_ganho_mes', label: 'Ganho – Mês' },
      { id: 'fechado_ganho_historico', label: 'Ganho – Histórico' },
    ]
  },
  { id: 'fechado_perdido', label: 'Fechado – Perdido', color: '#9E9E9E' },
  { id: 'arquivado', label: 'Arquivado', color: '#607D8B' },
  { id: 'fora_de_perfil', label: 'Fora de Perfil', color: '#795548' },
  { id: 'sem_retorno', label: 'Sem Retorno', color: '#78909C' },
];

type ActivePanel = 'main' | 'notes' | 'schedule' | 'transfer' | 'temperature';

// Sale registration interface
interface SaleClientAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SaleData {
  saleType: 'produto' | 'servico';
  clientName: string;
  clientDocument: string;
  clientDocumentType: 'cpf' | 'cnpj';
  clientPhone: string;
  clientEmail: string;
  clientAddress: SaleClientAddress;
  productSold: string;
  saleCode: string;
  description: string;
  saleDate: string;
  value: string;
  paymentMethod: 'pix' | 'cartao_vista' | 'cartao_parcelado' | 'boleto' | 'transferencia' | 'dinheiro' | '';
  paymentCondition: 'avista' | 'parcelado' | '';
  installments: string;
  observations: string;
  deliveryMode: 'immediate' | 'scheduled';
  deliveryDate: string;
  deliveryShift: 'manha' | 'tarde' | 'noite' | 'personalizado' | '';
  deliveryTime: string;
  deliveryContact: string;
}

const initialSaleData: SaleData = {
  saleType: 'produto',
  clientName: '',
  clientDocument: '',
  clientDocumentType: 'cpf',
  clientPhone: '',
  clientEmail: '',
  clientAddress: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  },
  productSold: '',
  saleCode: '',
  description: '',
  saleDate: new Date().toISOString().split('T')[0],
  value: '',
  paymentMethod: '',
  paymentCondition: '',
  installments: '',
  observations: '',
  deliveryMode: 'immediate',
  deliveryDate: '',
  deliveryShift: '',
  deliveryTime: '',
  deliveryContact: '',
};

export const InlineConversationsPanel: React.FC<InlineConversationsPanelProps> = ({ expanded, onToggle, initialConversationId, initialConversationPhone, initialConversationName }) => {
  const isMobile = useIsMobile();
  const { role } = useUserRole();
  const canPinConversation = role === 'TENANT_ADMIN' || role === 'TENANT_GERENTE';

  const {
    conversations: storeConversations,
    messages: storeMessages,
    fetchConversations,
    sendMessage: storeSendMessage,
    initSocketListeners,
    activeConversationId,
    setActiveConversation
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('respondido');
  const [activeConversationTab, setActiveConversationTab] = useState<'todos' | 'funil' | 'carteira'>('todos');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings panel states
  const [showSettings, setShowSettings] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('main');
  const [observations, setObservations] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [expandedTemperatureStatus, setExpandedTemperatureStatus] = useState<string | null>(null);
  const [isConversationRead, setIsConversationRead] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleData, setSaleData] = useState<SaleData>(initialSaleData);
  const [saleErrors, setSaleErrors] = useState<Partial<Record<keyof SaleData, string>>>({});
  const [showPrintView, setShowPrintView] = useState(false);
  const [savedSaleData, setSavedSaleData] = useState<SaleData | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<LeadSchedule | null>(null);
  const [newScheduleData, setNewScheduleData] = useState<{ date: Date; time: string } | null>(null);

  // New lead modal states
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', reference: '', origin: '' });
  const [newLeadErrors, setNewLeadErrors] = useState({ name: '', phone: '', origin: '' });

  // Lead origins from API
  const [leadOrigins, setLeadOrigins] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api.get('/origins')
      .then(res => setLeadOrigins(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Error fetching origins:', err));
  }, []);

  // Tag filter state (funnel status filter)
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [expandedTagStatus, setExpandedTagStatus] = useState<string | null>(null);

  // Labels state (etiquetas)
  const { labels: availableLabels } = useLabelsStore();
  const [labelsPopoverOpen, setLabelsPopoverOpen] = useState(false);
  const [selectedConversationLabels, setSelectedConversationLabels] = useState<string[]>([]);

  // Status indicators
  const hasObservations = observations.trim().length > 0;
  const hasScheduledMessage = scheduleDate.trim().length > 0 && scheduleMessage.trim().length > 0;

  const mappedConversations: Conversation[] = storeConversations.map(c => ({
    id: c.id,
    name: c.lead?.name || c.contactPhone || 'Desconhecido',
    phone: c.contactPhone,
    avatar: c.lead?.avatarUrl || undefined,
    lastMessage: '...', // We don't get lastMessage content in the list endpoint yet, but that's ok
    timestamp: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    unreadCount: c.unreadCount || 0,
    status: (c.status === 'ai_handling' ? 'ia' : c.status === 'manual' ? 'manual' : 'waiting') as any,
    isActive: true, // We can determine this if needed
    tags: [],
  }));

  const messages = selectedConversation ? (storeMessages[selectedConversation.id] || []).map(m => ({
    id: m.id,
    content: m.content || '',
    contentType: m.contentType || 'text',
    mediaUrl: m.mediaUrl,
    sender: (m.direction === 'inbound' ? 'client' : 'agent') as 'client' | 'agent',
    agentName: m.sender?.name || 'Você',
    timestamp: new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: m.status as any,
  })) : [];

  // Initialize socket and fetch lists on mount
  useEffect(() => {
    fetchConversations();
    initSocketListeners();
  }, [fetchConversations, initSocketListeners]);

  // Auto-scroll to bottom when messages change (only within chat container)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Remove old mock getMessagesForConversation
  // Load messages handled by useChatStore

  // Auto-select conversation when initialConversationId, phone, or name changes
  useEffect(() => {
    if ((initialConversationId || initialConversationPhone || initialConversationName) && expanded && mappedConversations.length > 0) {
      // First try to find by ID
      let conv = mappedConversations.find(c => c.id === initialConversationId);

      // If not found by ID, try to match by phone number
      if (!conv && initialConversationPhone) {
        conv = mappedConversations.find(c => c.phone.includes(initialConversationPhone!));
      }

      // If still not found, try to match by name (exact match first, then partial)
      if (!conv && initialConversationName) {
        conv = mappedConversations.find(c => c.name.toLowerCase() === initialConversationName.toLowerCase());
        if (!conv) {
          conv = mappedConversations.find(c =>
            c.name.toLowerCase().includes(initialConversationName.toLowerCase()) ||
            initialConversationName.toLowerCase().includes(c.name.toLowerCase())
          );
        }
      }

      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [initialConversationId, initialConversationPhone, initialConversationName, expanded, isMobile, storeConversations.length]);

  // Reset panel when settings close
  useEffect(() => {
    if (!showSettings) {
      setActivePanel('main');
    }
  }, [showSettings]);

  // Helper function to determine if a conversation is Funil or Carteira
  const getConversationType = (convIndex: number): 'funil' | 'carteira' => {
    // In real implementation, this would be based on lead status in database
    // For mock: even indexes are Carteira (closed won), odd are Funil (in progress)
    return convIndex % 3 === 0 ? 'carteira' : 'funil';
  };

  // Filter conversations based on search, status, tag filter and active tab
  const filteredConversations = mappedConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'respondido' ? conv.isActive :
      filterStatus === 'nao_respondido' ? !conv.isActive : true; // In the future bind this to real status
    // Tag filter would match against conversation status/funnel stage in real implementation
    const matchesTag = !selectedTagFilter || true;

    // Filter by active tab (todos, funil or carteira)
    const convIndex = mappedConversations.indexOf(conv);
    const convType = getConversationType(convIndex);
    const matchesTab = activeConversationTab === 'todos' || activeConversationTab === convType;

    return matchesSearch && matchesStatus && matchesTag && matchesTab;
  });

  // New lead form validation
  const isNewLeadFormValid = useMemo(() => {
    return newLead.name.trim() !== '' && newLead.phone.trim() !== '' && newLead.origin !== '';
  }, [newLead.name, newLead.phone, newLead.origin]);

  const handleCreateLead = () => {
    const errors = {
      name: newLead.name.trim() === '' ? 'Nome é obrigatório' : '',
      phone: newLead.phone.trim() === '' ? 'Telefone é obrigatório' : '',
      origin: newLead.origin === '' ? 'Canal de origem é obrigatório' : '',
    };
    setNewLeadErrors(errors);

    if (errors.name || errors.phone || errors.origin) {
      return;
    }

    toast.success(`${newLead.name} foi adicionado ao funil com status Frio.`);
    setShowNewLeadModal(false);
    setNewLead({ name: '', phone: '', email: '', reference: '', origin: '' });
    setNewLeadErrors({ name: '', phone: '', origin: '' });
  };

  const handleNewLeadModalClose = (open: boolean) => {
    setShowNewLeadModal(open);
    if (!open) {
      setNewLeadErrors({ name: '', phone: '', origin: '' });
      setNewLead({ name: '', phone: '', email: '', reference: '', origin: '' });
    }
  };

  const handleTagFilterSelect = (tagId: string, subStatusId?: string) => {
    const filterId = subStatusId || tagId;
    setSelectedTagFilter(prev => prev === filterId ? null : filterId);
    setTagFilterOpen(false);
    setExpandedTagStatus(null);

    // Find label for toast
    let label = '';
    if (subStatusId) {
      const parent = allStatusOptions.find(s => s.id === tagId);
      const sub = parent?.subStatuses?.find(s => s.id === subStatusId);
      label = sub?.label || subStatusId;
    } else {
      label = allStatusOptions.find(s => s.id === tagId)?.label || tagId;
    }

    if (selectedTagFilter !== filterId) {
      toast.success(`Filtrando por: ${label}`);
    }
  };

  const getSelectedFilterLabel = () => {
    // Check if it's a main status
    const mainStatus = allStatusOptions.find(s => s.id === selectedTagFilter);
    if (mainStatus) return { label: mainStatus.label, color: mainStatus.color };

    // Check if it's a substatus
    for (const status of allStatusOptions) {
      if (status.subStatuses) {
        const sub = status.subStatuses.find(s => s.id === selectedTagFilter);
        if (sub) return { label: sub.label, color: status.color };
      }
    }
    return null;
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setActiveConversation(conv.id);
    setIsConversationRead(false);

    // Join the backend real-time Socket.io room so new webhook messages stream here
    import('@/lib/socket').then(({ socketClient }) => {
      socketClient.joinConversation(conv.id);
    });

    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    storeSendMessage(selectedConversation.id, newMessage, 'text');
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
    setActiveConversation(null);
    setShowSettings(false);
  };

  const handleBackToMain = () => {
    setActivePanel('main');
  };

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'temperature') {
      setActivePanel('temperature');
    } else {
      setActivePanel(optionId as ActivePanel);
    }
  };

  // Handle file attachment
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: Blob | File, filename: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.url;
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Erro ao fazer upload do arquivo.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Fazendo upload de ${file.name}...`);
      const url = await uploadFile(file, file.name);

      if (url && selectedConversation) {
        // Determine type based on mime
        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        storeSendMessage(selectedConversation.id, `📎 Anexo: ${file.name}`, type as any, url);
        toast.success(`Anexo enviado!`);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Audio recording functions
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const sendAudio = async () => {
    if (audioBlob) {
      const duration = formatRecordingTime(recordingTime);
      toast.info('Enviando áudio...');
      const url = await uploadFile(audioBlob, `audio-${Date.now()}.webm`);

      if (url && selectedConversation) {
        storeSendMessage(selectedConversation.id, `🎤 Áudio (${duration})`, 'audio', url);
        toast.success(`Áudio enviado (${duration})`);
      }

      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Handle status selection
  const handleStatusSelect = (statusId: string) => {
    // Check if it's any of the "Fechado – Ganho" variants
    if (statusId === 'fechado_ganho' || statusId === 'fechado_ganho_mes' || statusId === 'fechado_ganho_historico') {
      // Close settings sheet first, then open sale modal
      setShowSettings(false);
      setActivePanel('main');
      setTimeout(() => setShowSaleModal(true), 100);
    } else if (statusId === 'marcar_agenda') {
      // Close settings sheet first, then open schedule modal
      setShowSettings(false);
      setActivePanel('main');
      setTimeout(() => setShowScheduleModal(true), 100);
    } else {
      toast.success(`Status alterado com sucesso`);
      handleBackToMain();
      setShowSettings(false);
    }
  };

  // Sale form validation
  const isSaleFormValid = useMemo(() => {
    const hasClientName = saleData.clientName.trim().length > 0;
    const hasClientDocument = saleData.clientDocument.trim().length > 0;
    const hasClientPhone = saleData.clientPhone.trim().length > 0;
    const hasProduct = saleData.productSold.trim().length > 0;
    const hasValue = saleData.value.trim().length > 0 && parseFloat(saleData.value.replace(/\./g, '').replace(',', '.')) > 0;
    const hasPaymentMethod = saleData.paymentMethod !== '';
    const hasPaymentCondition = saleData.paymentCondition !== '';
    const hasInstallments = saleData.paymentCondition === 'avista' || (saleData.paymentCondition === 'parcelado' && saleData.installments.trim().length > 0 && parseInt(saleData.installments) > 0);
    return hasClientName && hasClientDocument && hasClientPhone && hasProduct && hasValue && hasPaymentMethod && hasPaymentCondition && hasInstallments;
  }, [saleData]);

  // Format helpers
  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDocument = (value: string, type: 'cpf' | 'cnpj'): string => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'cpf') {
      return numbers.slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numbers.slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCEP = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleSaveSale = () => {
    const errors: Partial<Record<keyof SaleData, string>> = {};
    if (!saleData.clientName.trim()) errors.clientName = 'Nome do cliente é obrigatório';
    if (!saleData.clientDocument.trim()) errors.clientDocument = 'Documento é obrigatório';
    if (!saleData.clientPhone.trim()) errors.clientPhone = 'Telefone é obrigatório';
    if (!saleData.productSold.trim()) errors.productSold = 'Informe o que foi vendido';
    if (!saleData.value.trim() || parseFloat(saleData.value.replace(/\./g, '').replace(',', '.')) <= 0) errors.value = 'Informe um valor válido maior que zero';
    if (!saleData.paymentMethod) errors.paymentMethod = 'Selecione a forma de pagamento';
    if (!saleData.paymentCondition) errors.paymentCondition = 'Selecione a condição de pagamento';
    if (saleData.paymentCondition === 'parcelado' && (!saleData.installments.trim() || parseInt(saleData.installments) <= 0)) errors.installments = 'Informe o número de parcelas';

    if (Object.keys(errors).length > 0) {
      setSaleErrors(errors);
      return;
    }

    setSavedSaleData({ ...saleData });
    setSaleData(initialSaleData);
    setSaleErrors({});
    setShowSaleModal(false);
    handleBackToMain();
    setShowSettings(false);
    toast.success('Venda registrada com sucesso! Lead atualizado para Fechado – Ganho');
    setTimeout(() => setShowPrintView(true), 500);
  };

  const handleCancelSale = () => {
    setSaleData(initialSaleData);
    setSaleErrors({});
    setShowSaleModal(false);
  };

  const handlePinConversation = (sellerId: string, note: string) => {
    console.log('Pin conversation:', { leadId: selectedConversation?.id, sellerId, note });
    toast.success('Conversa fixada com sucesso!');
  };

  // Settings content renderer
  const renderSettingsContent = () => {
    const panelClasses = "p-4 space-y-4";
    const headerClasses = "flex items-center gap-3 mb-4";
    const listItemClasses = "w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left min-h-[52px]";
    const iconContainerClasses = "w-10 h-10 rounded-xl flex items-center justify-center bg-muted shrink-0";
    const iconClasses = "w-5 h-5 text-muted-foreground";

    switch (activePanel) {
      case 'notes':
        return (
          <div className={panelClasses}>
            <div className={headerClasses}>
              <Button variant="ghost" size="icon" onClick={handleBackToMain} className="h-9 w-9">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold text-base text-foreground">Observações</h3>
                <p className="text-xs text-muted-foreground">Adicione notas sobre o lead</p>
              </div>
            </div>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Digite suas observações aqui..."
              className="min-h-[140px] bg-background border-border resize-none text-sm"
            />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleBackToMain} className="flex-1 h-11">
                Cancelar
              </Button>
              <Button onClick={() => { toast.success('Observações salvas'); handleBackToMain(); }} className="flex-1 h-11">
                Salvar
              </Button>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className={panelClasses}>
            <div className={headerClasses}>
              <Button variant="ghost" size="icon" onClick={handleBackToMain} className="h-9 w-9">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold text-base text-foreground">Agendar Retorno</h3>
                <p className="text-xs text-muted-foreground">Programe uma mensagem futura</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="pl-10 bg-background h-11"
                  />
                </div>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-24 bg-background h-11 text-center"
                />
              </div>
              <Textarea
                value={scheduleMessage}
                onChange={(e) => setScheduleMessage(e.target.value)}
                placeholder="Mensagem a enviar..."
                className="min-h-[80px] bg-background resize-none text-sm"
              />
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Anexar arquivo</span>
                <input type="file" className="hidden" onChange={(e) => setScheduleFile(e.target.files?.[0] || null)} />
              </label>
              {scheduleFile && <p className="text-xs text-muted-foreground text-center">{scheduleFile.name}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleBackToMain} className="flex-1 h-11">
                Cancelar
              </Button>
              <Button onClick={() => { toast.success('Mensagem agendada'); handleBackToMain(); }} className="flex-1 h-11">
                Agendar
              </Button>
            </div>
          </div>
        );

      case 'transfer':
        return (
          <div className={panelClasses}>
            <div className={headerClasses}>
              <Button variant="ghost" size="icon" onClick={handleBackToMain} className="h-9 w-9">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold text-base text-foreground">Transferir Atendimento</h3>
                <p className="text-xs text-muted-foreground">Selecione o vendedor</p>
              </div>
            </div>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {[].map((vendedor) => (
                  <button
                    key={vendedor.id}
                    className={listItemClasses}
                    onClick={() => { toast.success(`Lead transferido para ${vendedor.name}`); handleBackToMain(); setShowSettings(false); }}
                  >
                    <div className={iconContainerClasses}>
                      <User className={iconClasses} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{vendedor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{vendedor.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 'temperature':
        return (
          <div className={panelClasses}>
            <div className={headerClasses}>
              <Button variant="ghost" size="icon" onClick={handleBackToMain} className="h-9 w-9">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold text-base text-foreground">Temperatura</h3>
                <p className="text-xs text-muted-foreground">Alterar status do lead</p>
              </div>
            </div>
            <div className="space-y-2 pb-6">
              {allStatusOptions.map((option) => (
                <div key={option.id}>
                  <button
                    className={listItemClasses}
                    onClick={() => {
                      if (option.hasSubStatus && option.subStatuses) {
                        setExpandedTemperatureStatus(prev => prev === option.id ? null : option.id);
                      } else {
                        handleStatusSelect(option.id);
                      }
                    }}
                  >
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{option.label}</span>
                    </div>
                    {option.hasSubStatus && (
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedTemperatureStatus === option.id && "rotate-90")} />
                    )}
                  </button>
                  {option.hasSubStatus && expandedTemperatureStatus === option.id && option.subStatuses && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
                      {option.subStatuses.map((sub) => (
                        <button
                          type="button"
                          key={sub.id}
                          className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left min-h-[44px] cursor-pointer bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusSelect(sub.id);
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
                          <span className="text-sm text-foreground">{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className={panelClasses}>
            <div className="space-y-2">
              {configOptions.map((option) => (
                <button
                  key={option.id}
                  className={listItemClasses}
                  onClick={() => handleOptionClick(option.id)}
                >
                  <div className={iconContainerClasses}>
                    <option.icon className={iconClasses} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{option.title}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  // Collapsed state - just the toggle button
  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full py-2.5 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 group"
      >
        <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-primary">Ver Conversas</span>
      </button>
    );
  }

  // Conversation list component - WhatsApp style
  const ConversationList = () => (
    <div className={cn(
      "flex flex-col bg-[#ffffff] dark:bg-[#111b21]",
      isMobile ? "w-full" : "w-[340px] border-r border-[#d1d7db] dark:border-[#222d34]"
    )}>
      {/* Header - WhatsApp style */}
      <div className="p-3 border-b border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#202c33]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#111b21] dark:text-[#e9edef]">Conversas</h2>
            <Wifi className="w-4 h-4 text-[#00a884]" />
          </div>
          <Button size="sm" className="gap-1.5 h-8 bg-[#00a884] hover:bg-[#008f72] text-white" onClick={() => setShowNewLeadModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>

        {/* Search - WhatsApp style */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54656f] dark:text-[#8696a0]" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-[#ffffff] dark:bg-[#202c33] border-0 rounded-lg text-[16px] text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
          />
        </div>

        {/* Filter - WhatsApp style */}
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 h-9 bg-[#ffffff] dark:bg-[#2a3942] border-[#d1d7db] dark:border-[#3b4a54] text-[#111b21] dark:text-[#e9edef]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent className="bg-[#ffffff] dark:bg-[#233138] border-[#d1d7db] dark:border-[#3b4a54]">
              <SelectItem value="respondido">Respondido</SelectItem>
              <SelectItem value="nao_respondido">Não respondido</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 border-[#d1d7db] dark:border-[#3b4a54] text-[#54656f] dark:text-[#8696a0]",
                  selectedTagFilter && "bg-[#00a884]/10 border-[#00a884] text-[#00a884]"
                )}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-2 bg-[#ffffff] dark:bg-[#233138] border-[#d1d7db] dark:border-[#3b4a54] shadow-lg z-50">
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Filtrar por status do funil</p>
                  {selectedTagFilter && (
                    <button
                      onClick={() => { setSelectedTagFilter(null); setTagFilterOpen(false); setExpandedTagStatus(null); }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Limpar filtro
                    </button>
                  )}
                  {allStatusOptions.map((status) => (
                    <div key={status.id}>
                      <button
                        onClick={() => {
                          if (status.hasSubStatus && status.subStatuses) {
                            setExpandedTagStatus(prev => prev === status.id ? null : status.id);
                          } else {
                            handleTagFilterSelect(status.id);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left",
                          (selectedTagFilter === status.id || status.subStatuses?.some(s => s.id === selectedTagFilter)) && "bg-primary/10"
                        )}
                      >
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                        <span className="flex-1">{status.label}</span>
                        {status.hasSubStatus && (
                          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", expandedTagStatus === status.id && "rotate-90")} />
                        )}
                        {selectedTagFilter === status.id && <CheckCircle className="w-3 h-3 text-primary" />}
                      </button>
                      {status.hasSubStatus && expandedTagStatus === status.id && status.subStatuses && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-muted pl-2">
                          {status.subStatuses.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleTagFilterSelect(status.id, sub.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors text-left",
                                selectedTagFilter === sub.id && "bg-primary/10"
                              )}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                              <span className="flex-1 text-foreground">{sub.label}</span>
                              {selectedTagFilter === sub.id && <CheckCircle className="w-3 h-3 text-primary" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        {selectedTagFilter && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSelectedFilterLabel()?.color }} />
              {getSelectedFilterLabel()?.label}
              <button onClick={() => setSelectedTagFilter(null)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Conversations List - WhatsApp style */}
      <ScrollArea className="flex-1 bg-[#ffffff] dark:bg-[#111b21]">
        <div>
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-[#e9edef] dark:border-[#222d34]",
                selectedConversation?.id === conv.id
                  ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                  : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
              )}
            >
              {/* Avatar with status indicator */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conv.avatar} />
                  <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175] text-[#54656f] dark:text-[#d1d7db] text-sm font-medium">
                    {conv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#ffffff] dark:border-[#111b21]",
                  conv.isActive ? "bg-[#00a884]" : "bg-[#8696a0]"
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef] truncate text-[15px]">{conv.name}</span>
                  {conv.unreadCount > 0 && (
                    <Badge
                      className="ml-2 h-5 min-w-[20px] px-1.5 text-[11px] bg-[#25d366] text-white font-medium rounded-full border-0"
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#667781] dark:text-[#8696a0] truncate mb-0.5">{conv.timestamp}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25d366]" />
                  <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                    {conv.status === 'ia' ? 'Atendimento automático (IA)' :
                      conv.status === 'manual' ? 'Atendimento manual' : 'Aguardando'}
                  </span>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                    getConversationType(mappedConversations.indexOf(conv)) === 'carteira'
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {getConversationType(mappedConversations.indexOf(conv)) === 'carteira' ? 'Carteira' : 'Funil'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // Chat area component - WhatsApp style
  const renderChatArea = () => (
    <div className={cn(
      "flex flex-col flex-1 min-w-0 bg-[#efeae2] dark:bg-[#0b141a]",
      isMobile && "h-full"
    )}>
      {selectedConversation ? (
        <>
          {/* Chat Header - WhatsApp style */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#222d34]">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-1 h-8 w-8 text-[#54656f] dark:text-[#aebac1]">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedConversation.avatar} />
                <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175] text-[#54656f] dark:text-[#d1d7db] text-xs font-medium">
                  {selectedConversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef] text-[15px]">{selectedConversation.name}</span>
                </div>
                {/* Labels badges */}
                {selectedConversationLabels.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                    {selectedConversationLabels.slice(0, 3).map((labelId) => {
                      const label = availableLabels.find(l => l.id === labelId);
                      if (!label) return null;
                      return (
                        <span
                          key={label.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white font-medium"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      );
                    })}
                    {selectedConversationLabels.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{selectedConversationLabels.length - 3}</span>
                    )}
                  </div>
                )}
                <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">{selectedConversation.phone}</p>
              </div>
            </div>

            {/* Action icons - WhatsApp style */}
            <TooltipProvider>
              <div className="flex items-center gap-0.5">
                {/* Labels/Etiquetas button */}
                <Popover open={labelsPopoverOpen} onOpenChange={setLabelsPopoverOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            selectedConversationLabels.length > 0
                              ? "text-[#F5A15D] hover:bg-[#F5A15D]/10"
                              : "text-[#54656f] dark:text-[#aebac1] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]"
                          )}
                        >
                          <Tag className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Etiquetas</p></TooltipContent>
                  </Tooltip>
                  <PopoverContent align="end" className="w-56 p-2 bg-[#ffffff] dark:bg-[#233138] border-[#d1d7db] dark:border-[#3b4a54] shadow-lg z-50">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">Selecionar etiquetas</p>
                      {availableLabels.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Nenhuma etiqueta cadastrada</p>
                      ) : (
                        availableLabels.map((label) => (
                          <button
                            key={label.id}
                            onClick={() => {
                              const isSelected = selectedConversationLabels.includes(label.id);
                              if (isSelected) {
                                setSelectedConversationLabels(prev => prev.filter(id => id !== label.id));
                                toast.success(`Etiqueta "${label.name}" removida`);
                              } else {
                                setSelectedConversationLabels(prev => [...prev, label.id]);
                                toast.success(`Etiqueta "${label.name}" adicionada`);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left",
                              selectedConversationLabels.includes(label.id) && "bg-primary/10"
                            )}
                          >
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="flex-1">{label.name}</span>
                            {selectedConversationLabels.includes(label.id) && (
                              <CheckCircle className="w-3 h-3 text-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Observations indicator */}
                {hasObservations && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#f59e0b] hover:bg-[#f59e0b]/10 h-8 w-8"
                        onClick={() => { setShowSettings(true); setActivePanel('notes'); }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Observações salvas</p></TooltipContent>
                  </Tooltip>
                )}

                {/* Schedule indicator */}
                {hasScheduledMessage && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#00a884] hover:bg-[#00a884]/10 h-8 w-8"
                        onClick={() => { setShowSettings(true); setActivePanel('schedule'); }}
                      >
                        <CalendarCheck className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Mensagem agendada</p></TooltipContent>
                  </Tooltip>
                )}

                {/* Mark as read */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", isConversationRead ? "text-[#00a884] hover:bg-[#00a884]/10" : "text-[#54656f] dark:text-[#aebac1] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]")}
                      onClick={() => {
                        const newState = !isConversationRead;
                        setIsConversationRead(newState);
                        if (newState) toast.success('Conversa marcada como lida');
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isConversationRead ? "Conversa lida" : "Marcar como lida"}</p></TooltipContent>
                </Tooltip>

                {/* Pin (for managers) */}
                {canPinConversation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#54656f] dark:text-[#aebac1] hover:text-[#00a884] hover:bg-[#00a884]/10"
                        onClick={() => setShowPinModal(true)}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Fixar para vendedor</p></TooltipContent>
                  </Tooltip>
                )}

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", showSettings ? "text-[#00a884] hover:bg-[#00a884]/10" : "text-[#54656f] dark:text-[#aebac1] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]")}
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>

                {/* Fullscreen (desktop only) */}
                {!isMobile && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#54656f] dark:text-[#aebac1] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isFullscreen ? "Restaurar tamanho" : "Tela cheia"}</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Messages area - WhatsApp background pattern */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-3 overflow-y-auto min-h-0"
            style={{
              backgroundColor: '#efeae2',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d9d2c7' fill-opacity='0.4'%3E%3Cpath d='M50 50l10 0 0 10-10 0zM100 30l8 0 0 8-8 0zM150 60l6 0 0 6-6 0zM200 40l10 0 0 10-10 0zM250 70l8 0 0 8-8 0zM300 50l6 0 0 6-6 0zM350 30l10 0 0 10-10 0zM30 100l8 0 0 8-8 0zM80 130l10 0 0 10-10 0zM130 110l6 0 0 6-6 0zM180 140l8 0 0 8-8 0zM230 100l10 0 0 10-10 0zM280 130l6 0 0 6-6 0zM330 110l8 0 0 8-8 0zM370 140l6 0 0 6-6 0zM60 170l10 0 0 10-10 0zM110 200l6 0 0 6-6 0zM160 180l8 0 0 8-8 0zM210 210l10 0 0 10-10 0zM260 170l6 0 0 6-6 0zM310 200l8 0 0 8-8 0zM360 180l10 0 0 10-10 0zM40 240l6 0 0 6-6 0zM90 270l10 0 0 10-10 0zM140 250l8 0 0 8-8 0zM190 280l6 0 0 6-6 0zM240 240l10 0 0 10-10 0zM290 270l8 0 0 8-8 0zM340 250l6 0 0 6-6 0zM380 280l8 0 0 8-8 0zM70 310l8 0 0 8-8 0zM120 340l10 0 0 10-10 0zM170 320l6 0 0 6-6 0zM220 350l8 0 0 8-8 0zM270 310l10 0 0 10-10 0zM320 340l6 0 0 6-6 0zM370 320l8 0 0 8-8 0z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            <div className="space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.sender === 'agent' ? "justify-end" : "justify-start")}
                >
                  <div className="flex items-end gap-2 max-w-[65%]">
                    {msg.sender === 'client' && (
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="bg-[#dfe5e7] text-[#54656f] text-[10px] font-medium">
                          {selectedConversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {msg.sender === 'client' && (
                        <span className="text-[11px] text-[#667781] mb-0.5 block">
                          {selectedConversation.name}
                        </span>
                      )}
                      {msg.sender === 'agent' && (
                        <span className="text-[11px] text-[#667781] mb-0.5 block text-right">
                          {msg.agentName || 'Agente'}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-1.5 shadow-sm relative",
                          msg.sender === 'agent'
                            ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                            : "bg-[#ffffff] text-[#111b21] rounded-tl-none"
                        )}
                        style={{
                          boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                        }}
                      >
                        {msg.contentType === 'audio' ? (
                          msg.mediaUrl ? (
                            <div className="mb-1 w-[250px]">
                              <audio src={msg.mediaUrl} controls className="h-10 w-full" />
                            </div>
                          ) : (
                            <div className="mb-1 w-[250px] px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
                              [!] Áudio recebido, mas URL da mídia não foi capturada pelo backend.
                            </div>
                          )
                        ) : msg.contentType === 'image' && msg.mediaUrl ? (
                          <div className="mb-1">
                            <img src={msg.mediaUrl} alt="Imagem enviada" className="max-w-[250px] rounded-md" />
                          </div>
                        ) : msg.contentType === 'video' && msg.mediaUrl ? (
                          <div className="mb-1">
                            <video src={msg.mediaUrl} controls className="max-w-[250px] rounded-md" />
                          </div>
                        ) : msg.contentType === 'document' && msg.mediaUrl ? (
                          <div className="mb-1 flex items-center gap-2 p-2 bg-black/5 rounded-md">
                            <FileText className="w-5 h-5" />
                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[200px]">
                              Baixar Documento
                            </a>
                          </div>
                        ) : null}

                        {msg.content && !msg.content.startsWith('🎤 Áudio') && !msg.content.startsWith('📎 Anexo:') && (
                          <p className="text-[14.2px] whitespace-pre-wrap break-words leading-[19px]">{msg.content}</p>
                        )}
                        <div className={cn(
                          "flex items-center gap-1 mt-0.5",
                          msg.sender === 'agent' ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[11px] text-[#667781]">{msg.timestamp}</span>
                          {msg.sender === 'agent' && msg.status === 'read' && (
                            <span className="text-[11px] text-[#53bdeb]">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {msg.sender === 'agent' && (
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="bg-[#00a884] text-white text-[10px] font-medium">
                          AG
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area - WhatsApp style */}
          <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33]">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {isRecording || audioBlob ? (
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 shrink-0 h-9 w-9"
                      onClick={cancelRecording}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-[#ef4444]/10 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                      <span className="text-sm text-[#ef4444] font-medium">
                        Gravando {formatRecordingTime(recordingTime)}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      className="bg-[#00a884] hover:bg-[#008f72] shrink-0 rounded-full h-10 w-10 shadow-sm"
                      onClick={stopRecording}
                    >
                      <Send className="w-5 h-5 text-white" />
                    </Button>
                  </>
                ) : audioBlob ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 shrink-0 h-9 w-9"
                      onClick={cancelRecording}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-[#ffffff] dark:bg-[#2a3942] rounded-full">
                      <Mic className="w-4 h-4 text-[#54656f]" />
                      <span className="text-sm text-[#54656f] dark:text-[#8696a0]">
                        Áudio gravado ({formatRecordingTime(recordingTime)})
                      </span>
                    </div>
                    <Button
                      size="icon"
                      className="bg-[#00a884] hover:bg-[#008f72] shrink-0 rounded-full h-10 w-10 shadow-sm"
                      onClick={sendAudio}
                    >
                      <Send className="w-5 h-5 text-white" />
                    </Button>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] shrink-0 h-9 w-9"
                  onClick={handleAttachmentClick}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="bg-[#ffffff] dark:bg-[#2a3942] border-0 text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0] rounded-lg h-10 text-[16px]"
                  />
                </div>
                {newMessage.trim() ? (
                  <Button
                    size="icon"
                    className="bg-[#00a884] hover:bg-[#008f72] shrink-0 rounded-full h-10 w-10 shadow-sm"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] shrink-0 h-9 w-9"
                    onClick={startRecording}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty state - WhatsApp style */
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#00a884]/10 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7 text-[#00a884]" />
            </div>
            <p className="text-base font-medium text-[#41525d]">Selecione uma conversa</p>
            <p className="text-sm text-[#667781]">Escolha uma conversa na lista para começar</p>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile fullscreen chat mode - renders chat in fixed fullscreen overlay
  const mobileFullscreenChat = isMobile && showMobileChat && (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]" style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}>
      {renderChatArea()}
    </div>
  );

  return (
    <>
      {/* Mobile fullscreen chat overlay */}
      {mobileFullscreenChat}

      <div className={cn(
        "mt-3 rounded-xl overflow-hidden shadow-lg transition-all duration-300 border border-[#d1d7db] dark:border-[#222d34]",
        isFullscreen && "fixed inset-0 z-50 mt-0 rounded-none"
      )}>
        {/* Header with collapse button - WhatsApp style */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#00a884] border-b border-[#00a884]">
          {/* Desktop: Show title */}
          <div className="hidden sm:flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold text-white">Central de Conversas</h3>
            <Wifi className="w-3.5 h-3.5 text-white/80" />
          </div>

          {/* Mobile: Collapse arrow only */}
          <button
            onClick={onToggle}
            className="sm:hidden flex items-center justify-center w-8 h-8 text-white/90 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Tab buttons: TODOS, FUNIL, CARTEIRA - filters */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveConversationTab('todos')}
              className={cn(
                "px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide rounded-full transition-all",
                activeConversationTab === 'todos'
                  ? "bg-white text-[#00a884]"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveConversationTab('funil')}
              className={cn(
                "px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide rounded-full transition-all",
                activeConversationTab === 'funil'
                  ? "bg-white text-[#00a884]"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              Funil
            </button>
            <button
              onClick={() => setActiveConversationTab('carteira')}
              className={cn(
                "px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide rounded-full transition-all",
                activeConversationTab === 'carteira'
                  ? "bg-white text-[#00a884]"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              Carteira
            </button>
          </div>

          {/* Desktop: Collapse button with text */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hidden sm:flex h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            <span className="text-xs">Recolher</span>
          </Button>
        </div>

        {/* Main content - WhatsApp layout */}
        <div className={cn(
          "flex bg-[#f0f2f5] dark:bg-[#111b21]",
          isFullscreen ? "h-[calc(100vh-44px)]" : "h-[480px]"
        )}>
          {/* Mobile: Show conversation list (chat opens in fullscreen overlay) */}
          {isMobile ? (
            <ConversationList />
          ) : (
            <>
              <ConversationList />
              {renderChatArea()}
            </>
          )}
        </div>
      </div>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn("p-0 z-[70] bg-background", isMobile ? "rounded-t-2xl max-h-[85vh]" : "w-80 sm:w-96")}
        >
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
            <SheetTitle className="text-base font-semibold">
              {activePanel === 'main' ? 'Configurações' :
                activePanel === 'notes' ? 'Observações' :
                  activePanel === 'schedule' ? 'Agendar Retorno' :
                    activePanel === 'transfer' ? 'Transferir Atendimento' :
                      activePanel === 'temperature' ? 'Temperatura' : 'Configurações'}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-auto" style={{ maxHeight: isMobile ? 'calc(85vh - 60px)' : 'calc(100vh - 60px)' }}>
            {renderSettingsContent()}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Pin Conversation Modal */}
      {selectedConversation && (
        <PinConversationModal
          open={showPinModal}
          onClose={() => setShowPinModal(false)}
          leadId={selectedConversation.id}
          leadName={selectedConversation.name}
          sellers={[]}
          onPin={handlePinConversation}
        />
      )}

      {/* Schedule Appointment Modal with Full Calendar */}
      {selectedConversation && (
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="fixed inset-0 !top-0 !left-0 !right-0 !bottom-0 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none !translate-x-0 !translate-y-0 !transform-none flex flex-col p-0 !pb-0 border-0 data-[state=open]:!slide-in-from-bottom-0 data-[state=closed]:!slide-out-to-bottom-0 !pt-[var(--safe-area-top)]">
            <VisuallyHidden>
              <DialogTitle>Agendar para {selectedConversation.name}</DialogTitle>
            </VisuallyHidden>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0 bg-background">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScheduleModal(false)}
                  className="h-9 w-9 -ml-2"
                >
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex flex-col">
                  <span className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-success" />
                    Marcar Agenda
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Selecionando horário para {selectedConversation.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <SellerCalendarView
                onOpenChat={() => { }}
                onEditSchedule={(schedule) => setEditingSchedule(schedule)}
                onCreateSchedule={(date, time) => setNewScheduleData({ date, time })}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <ScheduleAppointmentModal
          open={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          lead={{
            id: editingSchedule.leadId,
            name: editingSchedule.leadName,
            origin: editingSchedule.leadOrigin,
          }}
          existingSchedule={{
            id: editingSchedule.id,
            scheduledAt: editingSchedule.scheduledAt,
            scheduleType: editingSchedule.scheduleType,
            description: editingSchedule.description,
          }}
          onSuccess={() => {
            setEditingSchedule(null);
            handleBackToMain();
          }}
        />
      )}

      {/* Create New Schedule Modal */}
      {newScheduleData && selectedConversation && (
        <ScheduleAppointmentModal
          open={!!newScheduleData}
          onClose={() => setNewScheduleData(null)}
          lead={{
            id: selectedConversation.id,
            name: selectedConversation.name,
          }}
          defaultDateTime={{
            date: newScheduleData.date,
            time: newScheduleData.time,
          }}
          onSuccess={() => {
            setNewScheduleData(null);
            setShowScheduleModal(false);
            handleBackToMain();
          }}
        />
      )}

      {/* Sale Registration Modal */}
      <Dialog open={showSaleModal} onOpenChange={(open) => { if (!open) handleCancelSale(); }}>
        <DialogContent className="max-w-2xl p-0 flex flex-col z-[60] sm:max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-lg font-semibold">Registrar Venda</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Preencha as informações completas para concluir a venda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 min-h-0">
            <div className="space-y-6 py-4 pb-6">
              {/* Cliente */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/30 pb-2">
                  Dados do Cliente
                </h3>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase">Nome do Cliente <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Nome completo"
                    value={saleData.clientName}
                    onChange={(e) => { setSaleData(prev => ({ ...prev, clientName: e.target.value })); if (saleErrors.clientName) setSaleErrors(prev => ({ ...prev, clientName: '' })); }}
                    className={cn("h-11 text-[16px]", saleErrors.clientName && "border-destructive")}
                  />
                  {saleErrors.clientName && <span className="text-xs text-destructive">{saleErrors.clientName}</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Tipo</Label>
                    <Select value={saleData.clientDocumentType} onValueChange={(value: 'cpf' | 'cnpj') => setSaleData(prev => ({ ...prev, clientDocumentType: value, clientDocument: '' }))}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Documento <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder={saleData.clientDocumentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                      value={saleData.clientDocument}
                      onChange={(e) => { const formatted = formatDocument(e.target.value, saleData.clientDocumentType); setSaleData(prev => ({ ...prev, clientDocument: formatted })); if (saleErrors.clientDocument) setSaleErrors(prev => ({ ...prev, clientDocument: '' })); }}
                      className={cn("h-11 text-[16px]", saleErrors.clientDocument && "border-destructive")}
                    />
                    {saleErrors.clientDocument && <span className="text-xs text-destructive">{saleErrors.clientDocument}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Telefone <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={saleData.clientPhone}
                      onChange={(e) => { const formatted = formatPhone(e.target.value); setSaleData(prev => ({ ...prev, clientPhone: formatted })); if (saleErrors.clientPhone) setSaleErrors(prev => ({ ...prev, clientPhone: '' })); }}
                      className={cn("h-11 text-[16px]", saleErrors.clientPhone && "border-destructive")}
                    />
                    {saleErrors.clientPhone && <span className="text-xs text-destructive">{saleErrors.clientPhone}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">E-mail</Label>
                    <Input type="email" placeholder="email@exemplo.com" value={saleData.clientEmail} onChange={(e) => setSaleData(prev => ({ ...prev, clientEmail: e.target.value }))} className="h-11 text-[16px]" />
                  </div>
                </div>
              </div>

              {/* Venda */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/30 pb-2">
                  Dados da Venda
                </h3>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase">Tipo de Venda <span className="text-destructive">*</span></Label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSaleData(prev => ({ ...prev, saleType: 'produto' }))} className={cn("flex-1 h-11 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all", saleData.saleType === 'produto' ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
                      <Package className="w-4 h-4" /> Produto
                    </button>
                    <button type="button" onClick={() => setSaleData(prev => ({ ...prev, saleType: 'servico' }))} className={cn("flex-1 h-11 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all", saleData.saleType === 'servico' ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
                      <Wrench className="w-4 h-4" /> Serviço
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">{saleData.saleType === 'produto' ? 'Produto vendido' : 'Serviço vendido'} <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder={saleData.saleType === 'produto' ? "Ex: Sofá, Mesa" : "Ex: Instalação, Consultoria"}
                      value={saleData.productSold}
                      onChange={(e) => { setSaleData(prev => ({ ...prev, productSold: e.target.value })); if (saleErrors.productSold) setSaleErrors(prev => ({ ...prev, productSold: '' })); }}
                      className={cn("h-11 text-[16px]", saleErrors.productSold && "border-destructive")}
                    />
                    {saleErrors.productSold && <span className="text-xs text-destructive">{saleErrors.productSold}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Valor <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        placeholder="0,00"
                        value={saleData.value}
                        onChange={(e) => { const formatted = formatCurrency(e.target.value); setSaleData(prev => ({ ...prev, value: formatted })); if (saleErrors.value) setSaleErrors(prev => ({ ...prev, value: '' })); }}
                        className={cn("h-11 text-[16px] pl-10", saleErrors.value && "border-destructive")}
                      />
                    </div>
                    {saleErrors.value && <span className="text-xs text-destructive">{saleErrors.value}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Forma de Pagamento <span className="text-destructive">*</span></Label>
                    <Select value={saleData.paymentMethod} onValueChange={(value: typeof saleData.paymentMethod) => { setSaleData(prev => ({ ...prev, paymentMethod: value })); if (saleErrors.paymentMethod) setSaleErrors(prev => ({ ...prev, paymentMethod: '' })); }}>
                      <SelectTrigger className={cn("h-11", saleErrors.paymentMethod && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_vista">Cartão à Vista</SelectItem>
                        <SelectItem value="cartao_parcelado">Cartão Parcelado</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    {saleErrors.paymentMethod && <span className="text-xs text-destructive">{saleErrors.paymentMethod}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Condição <span className="text-destructive">*</span></Label>
                    <Select value={saleData.paymentCondition} onValueChange={(value: typeof saleData.paymentCondition) => { setSaleData(prev => ({ ...prev, paymentCondition: value, installments: value === 'avista' ? '' : prev.installments })); if (saleErrors.paymentCondition) setSaleErrors(prev => ({ ...prev, paymentCondition: '' })); }}>
                      <SelectTrigger className={cn("h-11", saleErrors.paymentCondition && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="z-[70]">
                        <SelectItem value="avista">À Vista</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                    {saleErrors.paymentCondition && <span className="text-xs text-destructive">{saleErrors.paymentCondition}</span>}
                  </div>
                </div>
                {saleData.paymentCondition === 'parcelado' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase">Número de Parcelas <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 12"
                      value={saleData.installments}
                      onChange={(e) => { setSaleData(prev => ({ ...prev, installments: e.target.value })); if (saleErrors.installments) setSaleErrors(prev => ({ ...prev, installments: '' })); }}
                      className={cn("h-11 text-[16px]", saleErrors.installments && "border-destructive")}
                    />
                    {saleErrors.installments && <span className="text-xs text-destructive">{saleErrors.installments}</span>}
                  </div>
                )}
              </div>

              {/* Entrega */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-2">
                  {saleData.saleType === 'produto' ? <><Truck className="w-4 h-4" /> Entrega do Produto</> : <><Wrench className="w-4 h-4" /> Execução do Serviço</>}
                </h3>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSaleData(prev => ({ ...prev, deliveryMode: 'immediate', deliveryDate: '', deliveryShift: '', deliveryTime: '', deliveryContact: '' }))} className={cn("flex-1 h-11 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all", saleData.deliveryMode === 'immediate' ? "border-success bg-success/10 text-success" : "border-border bg-background text-muted-foreground hover:border-success/50")}>
                    <CheckCircle className="w-4 h-4" /> {saleData.saleType === 'produto' ? 'Entrega Imediata' : 'Já Executado'}
                  </button>
                  <button type="button" onClick={() => setSaleData(prev => ({ ...prev, deliveryMode: 'scheduled' }))} className={cn("flex-1 h-11 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all", saleData.deliveryMode === 'scheduled' ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
                    <Calendar className="w-4 h-4" /> {saleData.saleType === 'produto' ? 'Agendar Entrega' : 'Agendar Execução'}
                  </button>
                </div>
                {saleData.deliveryMode === 'scheduled' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase">Data</Label>
                      <Input type="date" value={saleData.deliveryDate} onChange={(e) => setSaleData(prev => ({ ...prev, deliveryDate: e.target.value }))} className="h-11 text-[16px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase">Turno</Label>
                      <Select value={saleData.deliveryShift} onValueChange={(value: typeof saleData.deliveryShift) => setSaleData(prev => ({ ...prev, deliveryShift: value }))}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="z-[70]">
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                          <SelectItem value="personalizado">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase">Horário</Label>
                      <Input type="time" value={saleData.deliveryTime} onChange={(e) => setSaleData(prev => ({ ...prev, deliveryTime: e.target.value }))} className="h-11 text-[16px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase">Contato para Entrega</Label>
                      <Input placeholder="(00) 00000-0000" value={saleData.deliveryContact} onChange={(e) => { const formatted = formatPhone(e.target.value); setSaleData(prev => ({ ...prev, deliveryContact: formatted })); }} className="h-11 text-[16px]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2 pb-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Observações</Label>
                <Textarea
                  placeholder="Informações adicionais sobre a venda..."
                  value={saleData.observations}
                  onChange={(e) => setSaleData(prev => ({ ...prev, observations: e.target.value }))}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 px-6 py-4 border-t border-border/30 shrink-0">
            <Button variant="ghost" onClick={handleCancelSale} className="text-muted-foreground">Cancelar</Button>
            <Button onClick={handleSaveSale} disabled={!isSaleFormValid} className="bg-primary hover:bg-primary/90">Salvar Venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print View */}
      {savedSaleData && selectedConversation && (
        <SalePrintView
          open={showPrintView}
          onClose={() => setShowPrintView(false)}
          saleData={{
            leadName: selectedConversation.name,
            leadPhone: selectedConversation.phone,
            leadOrigin: 'Digital',
            clientName: savedSaleData.clientName,
            clientDocument: savedSaleData.clientDocument,
            clientPhone: savedSaleData.clientPhone,
            clientEmail: savedSaleData.clientEmail || undefined,
            clientAddress: savedSaleData.clientAddress,
            productSold: savedSaleData.productSold,
            saleCode: savedSaleData.saleCode || undefined,
            saleDate: savedSaleData.saleDate,
            value: savedSaleData.value,
            paymentMethod: savedSaleData.paymentMethod,
            paymentCondition: savedSaleData.paymentCondition,
            installments: savedSaleData.installments || undefined,
            observations: savedSaleData.observations || undefined,
            deliveryDate: savedSaleData.deliveryDate || undefined,
            deliveryShift: savedSaleData.deliveryShift || undefined,
            deliveryTime: savedSaleData.deliveryTime || undefined,
            deliveryContact: savedSaleData.deliveryContact || undefined,
            responsibleSeller: 'Vendedor Atual',
          }}
        />
      )}

      {/* New Lead Modal */}
      <Dialog open={showNewLeadModal} onOpenChange={handleNewLeadModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Cadastrar Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo lead ao funil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nome completo"
                value={newLead.name}
                onChange={(e) => {
                  setNewLead(prev => ({ ...prev, name: e.target.value }));
                  if (newLeadErrors.name) setNewLeadErrors(prev => ({ ...prev, name: '' }));
                }}
                className={cn("h-11 text-[16px]", newLeadErrors.name && "border-destructive")}
              />
              {newLeadErrors.name && <p className="text-xs text-destructive">{newLeadErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Telefone <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="(00) 00000-0000"
                value={newLead.phone}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 11)
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d)/, '$1-$2');
                  setNewLead(prev => ({ ...prev, phone: formatted }));
                  if (newLeadErrors.phone) setNewLeadErrors(prev => ({ ...prev, phone: '' }));
                }}
                className={cn("h-11 text-[16px]", newLeadErrors.phone && "border-destructive")}
              />
              {newLeadErrors.phone && <p className="text-xs text-destructive">{newLeadErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Canal de Origem <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newLead.origin}
                onValueChange={(value) => {
                  setNewLead(prev => ({ ...prev, origin: value }));
                  if (newLeadErrors.origin) setNewLeadErrors(prev => ({ ...prev, origin: '' }));
                }}
              >
                <SelectTrigger className={cn("h-11", newLeadErrors.origin && "border-destructive")}>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg z-50">
                  {leadOrigins.map((origin) => (
                    <SelectItem key={origin.id} value={origin.name}>{origin.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newLeadErrors.origin && <p className="text-xs text-destructive">{newLeadErrors.origin}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">COD REF / ID</Label>
              <Input
                placeholder="Referência (opcional)"
                value={newLead.reference}
                onChange={(e) => setNewLead(prev => ({ ...prev, reference: e.target.value }))}
                className="h-11 text-[16px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewLeadModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLead} disabled={!isNewLeadFormValid}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InlineConversationsPanel;
