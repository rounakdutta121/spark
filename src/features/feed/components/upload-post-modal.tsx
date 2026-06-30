"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostComposer } from "@/features/feed/components/post-composer";

interface UploadPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadPostModal({ open, onOpenChange }: UploadPostModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>Share photos and reels with your followers</DialogDescription>
        </DialogHeader>
        <PostComposer embedded onPosted={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
