import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, UserPlus, Route, RotateCcw } from "lucide-react";
import type { PlaceResult } from "./PlacesSearch";

interface AddPlaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: PlaceResult | null;
  onAddToRoute: (place: PlaceResult) => void;
  onNewClient: (place: PlaceResult) => void;
  onReturnVisit: (place: PlaceResult) => void;
}

export function AddPlaceModal({
  open,
  onOpenChange,
  place,
  onAddToRoute,
  onNewClient,
  onReturnVisit,
}: AddPlaceModalProps) {
  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {place.name}
          </DialogTitle>
          <DialogDescription>{place.address}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            className="w-full justify-start gap-3 h-14 bg-primary hover:bg-primary/90 text-white border-0"
            onClick={() => {
              onNewClient(place);
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Novo Cliente</p>
              <p className="text-xs text-white/80">
                Primeiro contato com o estabelecimento
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onReturnVisit(place);
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">Retorno</p>
              <p className="text-xs text-muted-foreground">
                Visita a cliente já cadastrado
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onAddToRoute(place);
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Adicionar Agendamento</p>
              <p className="text-xs text-muted-foreground">
                Adicionar novo agendamento
              </p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
