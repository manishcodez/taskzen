"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cropProfilePhotoToFile, createPreviewUrl, loadImageFromFile, revokePreviewUrl } from "@/lib/images/crop-profile-photo";
import { cn } from "@/lib/utils";

const VIEWPORT_SIZE = 280;

type ProfilePhotoCropperProps = {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
  isApplying?: boolean;
};

export function ProfilePhotoCropper({
  file,
  open,
  onOpenChange,
  onCancel,
  onApply,
  isApplying = false,
}: ProfilePhotoCropperProps) {
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !open) {
      setImage(null);
      setPreviewUrl((current) => {
        revokePreviewUrl(current);
        return null;
      });
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setError(null);
      return;
    }

    let cancelled = false;
    const nextPreviewUrl = createPreviewUrl(file);
    setPreviewUrl((current) => {
      revokePreviewUrl(current);
      return nextPreviewUrl;
    });

    loadImageFromFile(file)
      .then((loadedImage) => {
        if (!cancelled) {
          setImage(loadedImage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load the selected image.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, open]);

  useEffect(() => {
    return () => {
      revokePreviewUrl(previewUrl);
      if (image?.src.startsWith("blob:")) {
        URL.revokeObjectURL(image.src);
      }
    };
  }, [image, previewUrl]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) {
      return;
    }

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;

    setOffset({
      x: dragState.current.originX + deltaX,
      y: dragState.current.originY + deltaY,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragState.current = null;
    }
  }

  async function handleApplyCrop() {
    if (!file || !image) {
      return;
    }

    setError(null);

    try {
      const croppedFile = await cropProfilePhotoToFile({
        image,
        viewportSize: VIEWPORT_SIZE,
        transform: { scale, offsetX: offset.x, offsetY: offset.y },
        fileName: file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg",
      });

      await onApply(croppedFile);
      onOpenChange(false);
    } catch {
      setError("Unable to crop and save the photo. Please try again.");
    }
  }

  const drawScale = image
    ? Math.max(VIEWPORT_SIZE / image.naturalWidth, VIEWPORT_SIZE / image.naturalHeight) * scale
    : 1;
  const drawWidth = image ? image.naturalWidth * drawScale : VIEWPORT_SIZE;
  const drawHeight = image ? image.naturalHeight * drawScale : VIEWPORT_SIZE;
  const drawX = (VIEWPORT_SIZE - drawWidth) / 2 + offset.x;
  const drawY = (VIEWPORT_SIZE - drawHeight) / 2 + offset.y;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isApplying}>
        <DialogHeader>
          <DialogTitle>Adjust profile photo</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. Your photo will be saved as a circle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="relative mx-auto overflow-hidden rounded-full border border-border/70 bg-muted/30 shadow-soft"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {previewUrl && image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Crop preview"
                draggable={false}
                className="absolute max-w-none select-none touch-none"
                style={{
                  width: drawWidth,
                  height: drawHeight,
                  left: drawX,
                  top: drawY,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Loading image...
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent/70 ring-offset-2 ring-offset-background" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoZoom">Zoom</Label>
            <input
              id="photoZoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className={cn("w-full accent-accent")}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isApplying}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApplyCrop} disabled={!image || isApplying}>
            {isApplying ? "Saving photo..." : "Apply photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
