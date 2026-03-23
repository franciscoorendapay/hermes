import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { http } from "@/shared/api/http";
import { toast } from "sonner";

interface LeadData {
  id: string;
  name: string;
  tradeName?: string;
  companyName?: string;
  document?: string;
  email?: string;
  phone?: string;
  tpv?: string;
  mcc?: string;
  city?: string;
  state?: string;
  user?: { id: string; name: string } | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface EditLeadAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData | null;
  onSaved: () => void;
}

export function EditLeadAdminDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: EditLeadAdminDialogProps) {
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tpv, setTpv] = useState("");
  const [mcc, setMcc] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Load commercial users
  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      http
        .get("/users/commercial")
        .then((res) => setUsers(res.data))
        .catch(() => toast.error("Erro ao carregar usuários"))
        .finally(() => setLoadingUsers(false));
    }
  }, [open]);

  // Populate form when lead changes
  useEffect(() => {
    if (lead) {
      setName(lead.name || "");
      setTradeName(lead.tradeName || "");
      setCompanyName(lead.companyName || "");
      setDocument(lead.document || "");
      setEmail(lead.email || "");
      setPhone(lead.phone || "");
      setTpv(lead.tpv || "");
      setMcc(lead.mcc || "");
      setSelectedUserId(lead.user?.id || "");
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);

    try {
      // 1. Update lead data
      await http.patch(`/leads/${lead.id}`, {
        name,
        tradeName,
        companyName,
        document,
        email,
        phone,
        tpv,
        mcc,
      });

      // 2. If user changed, reassign
      if (selectedUserId && selectedUserId !== lead.user?.id) {
        await http.put(`/leads/${lead.id}/assign`, {
          user_id: selectedUserId,
        });
      }

      toast.success("Lead atualizado com sucesso!");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar lead:", error);
      toast.error(
        error.response?.data?.error || "Erro ao salvar alterações do lead"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Comercial (User) Assignment */}
          <div className="space-y-2">
            <Label className="font-semibold text-primary">
              Comercial Responsável
            </Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o comercial" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <hr />

          {/* Lead Fields */}
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CNPJ/CPF</Label>
              <Input
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>MCC</Label>
              <Input
                value={mcc}
                onChange={(e) => setMcc(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>TPV</Label>
            <Input
              value={tpv}
              onChange={(e) => setTpv(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
