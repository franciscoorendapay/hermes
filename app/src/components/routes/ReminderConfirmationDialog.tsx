import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReminderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReminderConfirmationDialog({
  open,
  onOpenChange,
  leadName,
  onConfirm,
  onCancel,
}: ReminderConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            Criar lembrete?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Gostaria de criar um lembrete para o lead{" "}
            <span className="font-semibold text-foreground">{leadName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
          <AlertDialogCancel
            onClick={onCancel}
            className="flex-1 sm:flex-none mt-0"
          >
            Não
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          >
            Sim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
