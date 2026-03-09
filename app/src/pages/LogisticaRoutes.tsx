import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Navigation, 
  Package, 
  Truck, 
  CheckCircle,
  Route,
  RefreshCw,
  ExternalLink,
  Map
} from "lucide-react";
import { LogisticaMap } from "@/components/logistica/LogisticaMap";

interface OrdemParaRota {
  id: string;
  tipo: string;
  quantidade: number;
  status: string;
  created_at: string;
  leads: {
    nome_fantasia: string;
    endereco_logradouro: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
}

const tipoLabels: Record<string, string> = {
  bobinas: "Bobinas",
  entrega_equipamento: "Entrega",
  troca_equipamento: "Troca",
  retirada_equipamento: "Retirada",
  nova_maquina: "Nova Máq.",
};

const tipoIcons: Record<string, string> = {
  bobinas: "📦",
  entrega_equipamento: "🚚",
  troca_equipamento: "🔄",
  retirada_equipamento: "📤",
  nova_maquina: "🆕",
};

export default function LogisticaRoutes() {
  const [ordens, setOrdens] = useState<OrdemParaRota[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrdens, setSelectedOrdens] = useState<Set<string>>(new Set());
  const [routeSaved, setRouteSaved] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const fetchOrdens = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(`
          id,
          tipo,
          quantidade,
          status,
          created_at,
          leads (
            nome_fantasia,
            endereco_logradouro,
            endereco_numero,
            endereco_bairro,
            endereco_cidade,
            endereco_estado,
            endereco_cep,
            lat,
            lng
          )
        `)
        .in("status", ["pendente", "em_andamento"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrdens(data || []);
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
      toast.error("Erro ao carregar ordens");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrdens();
  };

  const toggleOrdem = (ordemId: string) => {
    const newSelected = new Set(selectedOrdens);
    if (newSelected.has(ordemId)) {
      newSelected.delete(ordemId);
    } else {
      newSelected.add(ordemId);
    }
    setSelectedOrdens(newSelected);
    setRouteSaved(false);
  };

  const selectAll = () => {
    if (selectedOrdens.size === ordens.length) {
      setSelectedOrdens(new Set());
    } else {
      setSelectedOrdens(new Set(ordens.map(o => o.id)));
    }
    setRouteSaved(false);
  };

  const selectedOrdensData = useMemo(() => {
    return ordens.filter(o => selectedOrdens.has(o.id));
  }, [ordens, selectedOrdens]);

  const handleSaveRoute = async () => {
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ status: "em_andamento" })
        .in("id", Array.from(selectedOrdens));

      if (error) throw error;
      
      setRouteSaved(true);
      toast.success("Rota salva! Ordens marcadas como em andamento.");
      fetchOrdens();
    } catch (err) {
      console.error("Erro ao salvar rota:", err);
      toast.error("Erro ao salvar rota");
    }
  };

  const handleStartNavigation = () => {
    const destinations = selectedOrdensData
      .filter(o => o.leads?.lat && o.leads?.lng)
      .map(o => `${o.leads!.lat},${o.leads!.lng}`);

    if (destinations.length === 0) {
      toast.error("Nenhum endereço com coordenadas disponível");
      return;
    }

    const origin = destinations[0];
    const waypoints = destinations.slice(1, -1).join("|");
    const destination = destinations[destinations.length - 1] || origin;
    
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      mapsUrl += `&waypoints=${waypoints}`;
    }
    mapsUrl += "&travelmode=driving";

    window.open(mapsUrl, "_blank");
  };

  const formatEndereco = (leads: OrdemParaRota["leads"]) => {
    if (!leads) return "Endereço não disponível";
    const parts = [
      leads.endereco_logradouro,
      leads.endereco_numero,
      leads.endereco_bairro,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Endereço não disponível";
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[250px] rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Planejamento de Rotas</h2>
            <p className="text-xs text-muted-foreground">
              Selecione as entregas para roteirizar
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showMap ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowMap(!showMap)}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mapa */}
        {showMap && ordens.length > 0 && (
          <LogisticaMap
            ordens={ordens}
            selectedIds={Array.from(selectedOrdens)}
            onSelectOrdem={toggleOrdem}
            className="h-[250px] md:h-[350px]"
          />
        )}

        {/* Resumo da Rota */}
        {selectedOrdens.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Rota Selecionada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paradas</span>
                <span className="font-medium">{selectedOrdens.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Itens</span>
                <span className="font-medium">
                  {selectedOrdensData.reduce((acc, o) => acc + o.quantidade, 0)} un
                </span>
              </div>
              
              <div className="flex gap-2 pt-2">
                {!routeSaved ? (
                  <Button 
                    className="flex-1"
                    onClick={handleSaveRoute}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Iniciar Entregas
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    onClick={handleStartNavigation}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Abrir no Maps
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Select All */}
        {ordens.length > 0 && (
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={selectAll}
              className="text-xs"
            >
              {selectedOrdens.size === ordens.length ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>
            <Badge variant="secondary">
              {ordens.length} {ordens.length === 1 ? "ordem" : "ordens"} disponíveis
            </Badge>
          </div>
        )}

        {/* Orders List */}
        {ordens.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>Nenhuma entrega pendente</p>
              <p className="text-xs mt-1">Todas as ordens foram concluídas!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ordens.map((ordem, index) => (
              <Card 
                key={ordem.id}
                className={`cursor-pointer transition-all ${
                  selectedOrdens.has(ordem.id) 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => toggleOrdem(ordem.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedOrdens.has(ordem.id)}
                      onCheckedChange={() => toggleOrdem(ordem.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{tipoIcons[ordem.tipo] || "📦"}</span>
                        <p className="font-medium text-sm truncate">
                          {ordem.leads?.nome_fantasia || "Cliente"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{formatEndereco(ordem.leads)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {tipoLabels[ordem.tipo] || ordem.tipo}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {ordem.quantidade} un
                        </Badge>
                        {ordem.status === "em_andamento" && (
                          <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
                            Em rota
                          </Badge>
                        )}
                        {ordem.leads?.lat && ordem.leads?.lng && (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                            📍 GPS
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
