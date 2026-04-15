import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  FileText,
  Camera,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const mockVisits = [
  {
    id: 1,
    lead: "João Silva",
    address: "Rua das Flores, 123 - Centro",
    date: "2024-01-15",
    time: "10:30",
    status: "completed",
    notes: "Cliente interessado, retornar em 1 semana",
    agent: "Carlos Operador",
  },
  {
    id: 2,
    lead: "Maria Santos",
    address: "Av. Brasil, 456 - Jardim",
    date: "2024-01-15",
    time: "11:15",
    status: "completed",
    notes: "Venda realizada",
    agent: "Carlos Operador",
  },
  {
    id: 3,
    lead: "Pedro Costa",
    address: "Rua do Comércio, 789 - Industrial",
    date: "2024-01-15",
    time: "14:00",
    status: "pending",
    notes: "",
    agent: "Carlos Operador",
  },
  {
    id: 4,
    lead: "Ana Oliveira",
    address: "Alameda Santos, 321 - Centro",
    date: "2024-01-15",
    time: "15:30",
    status: "pending",
    notes: "",
    agent: "Ana Operadora",
  },
  {
    id: 5,
    lead: "Carlos Ferreira",
    address: "Rua Nova, 654 - Residencial",
    date: "2024-01-14",
    time: "16:45",
    status: "cancelled",
    notes: "Cliente não estava em casa",
    agent: "Carlos Operador",
  },
  {
    id: 6,
    lead: "Fernanda Lima",
    address: "Av. Paulista, 1000 - Bela Vista",
    date: "2024-01-14",
    time: "09:00",
    status: "rescheduled",
    notes: "Reagendado para próxima semana",
    agent: "Ana Operadora",
  },
];

const statusConfig = {
  completed: {
    label: "Concluída",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  rescheduled: {
    label: "Reagendada",
    icon: AlertCircle,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

export default function Visits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState<typeof mockVisits[0] | null>(null);

  const filteredVisits = mockVisits.filter((visit) => {
    const matchesSearch =
      visit.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayVisits = filteredVisits.filter((v) => v.date === "2024-01-15");
  const pastVisits = filteredVisits.filter((v) => v.date !== "2024-01-15");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Visitas"
        description="Acompanhe e registre suas visitas"
        showBack
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-white border-0">
              <Plus className="h-4 w-4" />
              Nova Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nova Visita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">João Silva</SelectItem>
                    <SelectItem value="2">Maria Santos</SelectItem>
                    <SelectItem value="3">Pedro Costa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora</label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea placeholder="Adicione observações sobre a visita..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Camera className="h-4 w-4" />
                  Foto
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Anexo
                </Button>
              </div>
              <Button className="w-full gradient-primary text-white border-0">
                Registrar Visita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por lead ou endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="rescheduled">Reagendada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Today's visits */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass h-[180px]">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : todayVisits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Visitas de Hoje
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayVisits.map((visit) => {
              const config = statusConfig[visit.status as keyof typeof statusConfig];
              return (
                <Card
                  key={visit.id}
                  className="glass hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                          {visit.lead.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{visit.lead}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visit.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={config.className}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {visit.address}
                    </p>
                    {visit.notes && (
                      <p className="text-sm mt-2 p-2 bg-muted/50 rounded-lg">
                        {visit.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past visits */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <Card className="glass">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full max-w-[300px]" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : pastVisits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            Visitas Anteriores
          </h2>
          <Card className="glass">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pastVisits.map((visit) => {
                  const config = statusConfig[visit.status as keyof typeof statusConfig];
                  return (
                    <div
                      key={visit.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <config.icon className={`h-5 w-5 ${config.className.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{visit.lead}</p>
                          <Badge variant="outline" className={`${config.className} text-xs`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {visit.address}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{visit.date}</p>
                        <p className="text-muted-foreground">{visit.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visit detail dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedVisit && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Visita</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-white font-medium text-lg">
                    {selectedVisit.lead.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedVisit.lead}</p>
                    <Badge
                      variant="outline"
                      className={
                        statusConfig[selectedVisit.status as keyof typeof statusConfig]
                          .className
                      }
                    >
                      {statusConfig[selectedVisit.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{selectedVisit.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data e Hora</p>
                      <p className="font-medium">
                        {selectedVisit.date} às {selectedVisit.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Operador</p>
                      <p className="font-medium">{selectedVisit.agent}</p>
                    </div>
                  </div>
                  {selectedVisit.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p>{selectedVisit.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    Editar
                  </Button>
                  <Button className="flex-1 gradient-primary text-white border-0">
                    Atualizar Status
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
