import { useState } from 'react';
import { Plus, Search, UserPlus, Mail, Phone, MapPin, MoreHorizontal, Edit, Trash2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { z } from 'zod';
import { validatePhone } from '@/lib/validators';
import { BR_STATES } from '@/lib/brazil';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';

// Schema de validação do formulário
const createUserSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  senha: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || (val.length >= 8 && /[a-zA-Z]/.test(val) && /[0-9]/.test(val)), {
      message: 'Senha deve ter pelo menos 8 caracteres, letras e números',
    }),
  telefone: z.string()
    .optional()
    .refine((val) => !val || validatePhone(val), 'Telefone inválido'),
  regiao: z.string().max(100).optional(),
  role: z.enum(['comercial', 'regional', 'nacional', 'diretor', 'logistica']),
});

const roleLabels: Record<string, string> = {
  comercial: 'Comercial',
  regional: 'Regional',
  nacional: 'Nacional',
  diretor: 'Diretor',
  logistica: 'Logística',
};

const roleColors: Record<string, string> = {
  comercial: 'bg-blue-100 text-blue-800',
  regional: 'bg-purple-100 text-purple-800',
  nacional: 'bg-orange-100 text-orange-800',
  diretor: 'bg-red-100 text-red-800',
  logistica: 'bg-amber-100 text-amber-800',
};

type Subordinate = ReturnType<typeof useSubordinates>['subordinates'][number];

export default function GestaoComerciais() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    regiao: '',
    role: 'comercial' as string,
    senha: '',
    includeInStats: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { subordinates, isLoading, refetch, createUser, updateUser, deleteUser } = useSubordinates();
  const { role: currentUserRole } = useUserRole();

  const canManageRoles = currentUserRole === 'diretor' || currentUserRole === 'nacional' || currentUserRole === 'regional' || currentUserRole === 'admin';

  const filteredData = subordinates.filter((sub) =>
    (sub.nome?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (sub.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (sub.regiao?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) { // (11) 91234-1234
      value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) { // (11) 1234-1234
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    setFormData({ ...formData, telefone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Create a copy of data for validation
    let dataToValidate = { ...formData };

    // If editing and password is empty, inject a dummy valid password just for validation to pass
    // (We won't send this dummy password to the server)
    if (editingId && !dataToValidate.senha) {
      dataToValidate.senha = 'ValidPass123';
    }

    // Validação com Zod using the modified object
    const validation = createUserSchema.safeParse(dataToValidate);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      console.log(errors)
      setFormErrors(errors);

      toast.error('Corrija os erros no formulário');
      return;
    }

    setSaving(true);
    try {
      const dataToSend: any = {
        name: validation.data.nome,
        email: validation.data.email,
        phone: formData.telefone || null,
        region: formData.regiao || null,
        role: formData.role,
        includeInStats: formData.includeInStats,
      };

      // Only include password if it was actually provided in the form (not the dummy one)
      // And if creating a new user, '12345678' is already in formData.senha by default state or user input.
      if (formData.senha) {
        dataToSend.password = formData.senha;
      }

      let success;
      if (editingId) {
        success = await updateUser(editingId, dataToSend);
      } else {
        success = await createUser(dataToSend);
      }

      if (success) {
        setFormOpen(false);
        setFormData({ nome: '', email: '', telefone: '', regiao: '', role: 'comercial', senha: '', includeInStats: true });
        setFormErrors({});
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao cadastrar representante');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${userName}?`)) return;
    await deleteUser(userId);
  };

  const columns: ColumnDef<Subordinate>[] = [
    {
      accessorKey: 'nome',
      header: ({ column }) => <SortableHeader column={column}>Nome</SortableHeader>,
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          {row.original.email || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {row.original.telefone || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'regiao',
      header: ({ column }) => <SortableHeader column={column}>Região</SortableHeader>,
      cell: ({ row }) => row.original.regiao ? (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {row.original.regiao}
        </div>
      ) : <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <SortableHeader column={column}>Cargo</SortableHeader>,
      cell: ({ row }) => (
        <Badge className={roleColors[row.original.role] || 'bg-gray-100 text-gray-800'}>
          {roleLabels[row.original.role] || row.original.role}
        </Badge>
      ),
    },
    {
      id: 'includeInStats',
      accessorFn: (row) => row.includeInStats,
      header: ({ column }) => <SortableHeader column={column} className="mx-auto">Status</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.includeInStats ? (
            <Badge className="bg-emerald-100 text-emerald-800">Ativo</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
              <FlaskConical className="h-3 w-3" />
              Desativado
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'acoes',
      header: '',
      enableSorting: false,
      size: 50,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setEditingId(row.original.id);
              setFormData({
                nome: row.original.nome,
                email: row.original.email,
                telefone: row.original.telefone || '',
                regiao: row.original.regiao || '',
                role: row.original.role,
                senha: '',
                includeInStats: row.original.includeInStats,
              });
              setFormOpen(true);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(row.original.id, row.original.nome)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header - Static */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Representantes Comerciais</h1>
          <p className="text-muted-foreground">Gerencie os representantes da sua equipe</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Representante
        </Button>
      </div>

      {/* Stats Cards — labels always visible, values skeleton when loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', color: 'text-foreground', value: subordinates.length },
          { label: 'Comerciais', color: 'text-blue-600', value: subordinates.filter(s => s.role === 'comercial').length },
          { label: 'Regionais', color: 'text-purple-600', value: subordinates.filter(s => s.role === 'regional').length },
          { label: 'Nacionais', color: 'text-orange-600', value: subordinates.filter(s => s.role === 'nacional').length },
        ].map(({ label, color, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              {isLoading
                ? <Skeleton className="h-8 w-12 mb-1" />
                : <div className={`text-2xl font-bold ${color}`}>{value}</div>
              }
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou região..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {['Nome', 'Email', 'Telefone', 'Região', 'Cargo', 'Status', ''].map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage={search ? 'Nenhum representante encontrado com este filtro' : 'Nenhum representante cadastrado'}
            />
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        if (!open) {
          setFormOpen(false);
          setEditingId(null);
          setFormData({ nome: '', email: '', telefone: '', regiao: '', role: 'comercial', senha: '', includeInStats: true });
          setFormErrors({});
        } else {
          setFormOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Representante' : 'Novo Representante'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados do representante' : 'Cadastre um novo representante comercial'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                className={formErrors.nome ? 'border-destructive' : ''}
              />
              {formErrors.nome && (
                <p className="text-sm text-destructive">{formErrors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            {/* Senha - Condicional */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha {editingId ? '(Opcional)' : '(Opicional)'}</Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder={editingId ? "Deixe em branco para manter a atual" : "Deixe em branco para o usuário definir no login"}
                className={formErrors.senha ? 'border-destructive' : ''}
              />
              {formErrors.senha && (
                <p className="text-sm text-destructive">{formErrors.senha}</p>
              )}
            </div>
            {!editingId && !formData.senha && (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground border">
                  Se deixado em branco, o usuário poderá criar sua própria senha na tela de login (Primeiro Acesso).
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className={formErrors.telefone ? 'border-destructive' : ''}
                />
                {formErrors.telefone && (
                  <p className="text-sm text-destructive">{formErrors.telefone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regiao">Região (UF) *</Label>
                <Select
                  value={formData.regiao}
                  onValueChange={(value) => setFormData({ ...formData, regiao: value })}
                >
                  <SelectTrigger className={formErrors.regiao ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BR_STATES.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.uf} - {state.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.regiao && (
                  <p className="text-sm text-destructive">{formErrors.regiao}</p>
                )}
              </div>
            </div>
            {canManageRoles && (
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>

                    {(currentUserRole === 'nacional' || currentUserRole === 'diretor' || currentUserRole === 'admin') && (
                      <SelectItem value="regional">Regional</SelectItem>
                    )}

                    {(currentUserRole === 'diretor' || currentUserRole === 'admin') && (
                      <SelectItem value="nacional">Nacional</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Incluir no cálculo de gestão</p>
                <p className="text-xs text-muted-foreground">Desative para usuários de teste</p>
              </div>
              <Switch
                checked={formData.includeInStats}
                onCheckedChange={(val) => setFormData({ ...formData, includeInStats: val })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setFormOpen(false);
                setEditingId(null);
                setFormData({ nome: '', email: '', telefone: '', regiao: '', role: 'comercial', senha: '', includeInStats: true });
                setFormErrors({});
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
