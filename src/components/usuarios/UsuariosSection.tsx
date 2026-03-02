import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Mail,
} from 'lucide-react';
import api from '@/lib/api';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'vendedor';
  active: boolean;
}

interface UsuariosSectionProps {
  onBack: () => void;
}

type View = 'main' | 'user-detail' | 'create-user' | 'edit-user';

export const UsuariosSection: React.FC<UsuariosSectionProps> = ({ onBack }) => {
  const { toast } = useToast();

  // Mock initial users
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    setUsersLoading(true);
    api.get('/users')
      .then(res => {
        const data = res.data?.data || res.data || [];
        const mapped: UserData[] = (Array.isArray(data) ? data : []).map((u: any) => ({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          role: u.role === 'manager' || u.role === 'admin' ? 'gerente' as const : 'vendedor' as const,
          active: u.isActive !== false,
        }));
        setUsers(mapped);
      })
      .catch(err => console.error('Error fetching users:', err))
      .finally(() => setUsersLoading(false));
  }, []);

  const [view, setView] = useState<View>('main');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'gerente' | 'vendedor'>('vendedor');

  const gerentes = users.filter(u => u.role === 'gerente');
  const vendedores = users.filter(u => u.role === 'vendedor');
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleToggleUser = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, active: !u.active } : u
    ));
    const user = users.find(u => u.id === userId);
    toast({
      title: user?.active ? 'Usuário desativado' : 'Usuário ativado',
      description: user?.name
    });
  };

  const handleCreateUser = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    try {
      const roleMap = { gerente: 'manager', vendedor: 'agent' } as const;
      const res = await api.post('/users', {
        name: formName.trim(),
        email: formEmail.trim(),
        role: roleMap[formRole],
        password: 'Salt@2024', // Default password — user should change
      });
      const newUser: UserData = {
        id: res.data.id || `user-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        active: true,
      };
      setUsers(prev => [...prev, newUser]);
      setFormName('');
      setFormEmail('');
      setFormRole('vendedor');
      setView('main');
      toast({ title: 'Usuário criado', description: `${newUser.name} foi adicionado.` });
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.response?.data?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserId || !formName.trim() || !formEmail.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    try {
      const roleMap = { gerente: 'manager', vendedor: 'agent' } as const;
      await api.put(`/users/${selectedUserId}`, {
        name: formName.trim(),
        email: formEmail.trim(),
        role: roleMap[formRole],
      });
      setUsers(prev => prev.map(u =>
        u.id === selectedUserId
          ? { ...u, name: formName.trim(), email: formEmail.trim(), role: formRole }
          : u
      ));
      setView('user-detail');
      toast({ title: 'Usuário atualizado' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.response?.data?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setView('main');
      toast({ title: 'Usuário excluído', description: `${user.name} foi removido.` });
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.response?.data?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  // Sub-header component - com safe-area para mobile/PWA
  const SubHeader = ({ title, onBackClick }: { title: string; onBackClick: () => void }) => (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/10 pt-[var(--safe-area-top)]">
      <div className="container flex items-center gap-3 h-12">
        <button
          onClick={onBackClick}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors -ml-1 active:scale-95 transition-transform min-h-[44px] min-w-[44px] justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <span className="text-[15px] font-semibold text-foreground/90">{title}</span>
      </div>
    </div>
  );

  // Section component
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h2 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
        {title}
      </h2>
      <div
        className="bg-card rounded-xl overflow-hidden divide-y divide-border/10"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {children}
      </div>
    </div>
  );

  // Item component
  const SectionItem = ({
    icon: Icon,
    iconColor,
    label,
    sublabel,
    value,
    showArrow = false,
    onClick,
    rightElement,
  }: {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    sublabel?: string;
    value?: string;
    showArrow?: boolean;
    onClick?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
      disabled={!onClick}
    >
      <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-foreground/90 truncate">{label}</p>
        {sublabel && (
          <p className="text-[12px] text-muted-foreground/60 truncate">{sublabel}</p>
        )}
      </div>
      {value && (
        <span className="text-[12px] text-muted-foreground/60 shrink-0">{value}</span>
      )}
      {rightElement}
      {showArrow && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      )}
    </button>
  );

  // Create User View
  if (view === 'create-user') {
    return (
      <div className="min-h-screen bg-background pb-6">
        <SubHeader title="Novo Usuário" onBackClick={() => setView('main')} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4 space-y-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Nome Completo
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: João Silva"
                className="h-10 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                E-mail
              </Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="joao@empresa.com"
                className="h-10 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Tipo de Usuário
              </Label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as 'gerente' | 'vendedor')}
                className="w-full h-10 px-3 text-[14px] rounded-lg border border-border/20 bg-background"
              >
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>

            <Button onClick={handleCreateUser} className="w-full h-10 text-[13px] gap-2">
              <Plus className="w-4 h-4" />
              Criar Usuário
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Edit User View
  if (view === 'edit-user' && selectedUserId) {
    return (
      <div className="min-h-screen bg-background pb-6">
        <SubHeader title="Editar Usuário" onBackClick={() => setView('user-detail')} />
        <main className="container py-4 space-y-4">
          <div
            className="bg-card rounded-xl p-4 space-y-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Nome Completo
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: João Silva"
                className="h-10 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                E-mail
              </Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="joao@empresa.com"
                className="h-10 text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                Tipo de Usuário
              </Label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as 'gerente' | 'vendedor')}
                className="w-full h-10 px-3 text-[14px] rounded-lg border border-border/20 bg-background"
              >
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>

            <Button onClick={handleUpdateUser} className="w-full h-10 text-[13px] gap-2">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // User Detail View
  if (view === 'user-detail' && selectedUserId && selectedUser) {
    return (
      <div className="min-h-screen bg-background pb-6">
        <SubHeader title={selectedUser.name} onBackClick={() => setView('main')} />
        <main className="container py-4 space-y-4">
          {/* User Info Card */}
          <div
            className="bg-card rounded-xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${selectedUser.role === 'gerente' ? 'bg-[#5B8DEF]' : 'bg-[#9B7CF4]'} flex items-center justify-center`}>
                {selectedUser.role === 'gerente' ? (
                  <User className="w-6 h-6 text-white" />
                ) : (
                  <UserCog className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-foreground/90">{selectedUser.name}</h3>
                <p className="text-[13px] text-muted-foreground/70">{selectedUser.email}</p>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${selectedUser.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                {selectedUser.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg mb-3">
              <div>
                <p className="text-[12px] font-medium text-foreground/80">Tipo de usuário</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {selectedUser.role === 'gerente' ? 'Gerente' : 'Vendedor'}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-medium ${selectedUser.role === 'gerente'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                {selectedUser.role === 'gerente' ? 'Gerente' : 'Vendedor'}
              </div>
            </div>

            {/* Toggle active status */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg mb-4">
              <div>
                <p className="text-[12px] font-medium text-foreground/80">Status do usuário</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {selectedUser.active ? 'Usuário está ativo no sistema' : 'Usuário está desativado'}
                </p>
              </div>
              <Switch
                checked={selectedUser.active}
                onCheckedChange={() => handleToggleUser(selectedUser.id)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-[12px] gap-1.5"
              onClick={() => {
                setFormName(selectedUser.name);
                setFormEmail(selectedUser.email);
                setFormRole(selectedUser.role);
                setView('edit-user');
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Usuário
            </Button>
          </div>

          {/* Delete User */}
          <Button
            variant="outline"
            className="w-full h-10 text-[13px] gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Tem certeza que deseja excluir "${selectedUser.name}"?`)) {
                handleDeleteUser(selectedUser.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Excluir Usuário
          </Button>
        </main>
      </div>
    );
  }

  // Main View
  return (
    <div className="min-h-screen bg-background pb-6">
      <SubHeader title="Usuários" onBackClick={onBack} />
      <main className="container py-4 space-y-4">
        <Section title={`Gerentes (${gerentes.length})`}>
          {gerentes.map(user => (
            <SectionItem
              key={user.id}
              icon={User}
              iconColor={user.active ? 'bg-[#5B8DEF]' : 'bg-muted-foreground/40'}
              label={user.name}
              sublabel={user.email}
              showArrow
              onClick={() => {
                setSelectedUserId(user.id);
                setView('user-detail');
              }}
              rightElement={
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${user.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              }
            />
          ))}
        </Section>

        <Section title={`Vendedores (${vendedores.length})`}>
          {vendedores.map(user => (
            <SectionItem
              key={user.id}
              icon={UserCog}
              iconColor={user.active ? 'bg-[#9B7CF4]' : 'bg-muted-foreground/40'}
              label={user.name}
              sublabel={user.email}
              showArrow
              onClick={() => {
                setSelectedUserId(user.id);
                setView('user-detail');
              }}
              rightElement={
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${user.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              }
            />
          ))}
        </Section>

        <Button
          className="w-full h-10 text-[13px] gap-2"
          onClick={() => {
            setFormName('');
            setFormEmail('');
            setFormRole('vendedor');
            setView('create-user');
          }}
        >
          <Plus className="w-4 h-4" />
          Adicionar Usuário
        </Button>
      </main>
    </div>
  );
};
