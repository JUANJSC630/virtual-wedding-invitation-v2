import { Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

import { Guest } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GuestQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  eventSlug: string;
}

const GuestQRModal: React.FC<GuestQRModalProps> = ({ open, onOpenChange, guest, eventSlug }) => {
  if (!guest) return null;

  const invitationUrl = `${window.location.origin}/${eventSlug}?code=${guest.code}`;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(invitationUrl)
      .then(() => toast.success("Enlace copiado al portapapeles"))
      .catch(() => toast.error("Error al copiar el enlace"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR de Invitación</DialogTitle>
          <DialogDescription>
            {guest.name} — Código: <span className="font-mono font-bold">{guest.code}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <QRCodeSVG value={invitationUrl} size={220} level="M" />
          <p className="text-xs text-muted-foreground text-center break-all">{invitationUrl}</p>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar enlace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestQRModal;
