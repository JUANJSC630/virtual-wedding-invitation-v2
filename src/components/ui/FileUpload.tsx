import React, { useRef, useState } from "react";

import { ImageIcon, Music, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AssetType = "hero-photo" | "photo2" | "photo3" | "audio" | "asset" | "gallery";

interface FileUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: "image" | "audio";
  assetType: AssetType;
  eventId?: string | null | undefined;
}

const ACCEPT_MAP = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/mp4",
};

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  accept,
  assetType,
  eventId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", eventId!);
    formData.append("assetType", assetType);

    try {
      const res = await fetch("/api/master/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");

      onChange(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-uploaded if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isImage = accept === "image";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          {isImage ? (
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex items-center gap-3 p-3">
              <Music className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <audio controls src={value} className="w-full h-8" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
            title="Quitar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File picker (only when event exists) */}
      {eventId ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MAP[accept]}
            onChange={handleFileChange}
            className="hidden"
            id={`file-input-${assetType}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5"
          >
            {isImage
              ? <ImageIcon className="h-4 w-4" />
              : <Music className="h-4 w-4" />}
            {uploading ? "Subiendo..." : "Subir archivo"}
            {!uploading && <Upload className="h-3.5 w-3.5 opacity-60" />}
          </Button>
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="o pega una URL..."
            className="text-sm"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={isImage ? "/photos/foto.jpg o https://..." : "/audio.mp3 o https://..."}
          />
          <p className="text-xs text-muted-foreground">
            Guarda el evento primero para poder subir archivos.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
