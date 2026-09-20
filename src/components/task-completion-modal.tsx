"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (correct: number, wrong: number, empty: number) => Promise<void>;
  taskTitle: string;
  isLoading?: boolean;
}

export function TaskCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  isLoading = false
}: TaskCompletionModalProps) {
  const [correct, setCorrect] = useState<string>("0");
  const [wrong, setWrong] = useState<string>("0");
  const [empty, setEmpty] = useState<string>("0");

  const handleSubmit = async () => {
    const correctNum = parseInt(correct) || 0;
    const wrongNum = parseInt(wrong) || 0;
    const emptyNum = parseInt(empty) || 0;
    
    await onConfirm(correctNum, wrongNum, emptyNum);
    
    // Reset form
    setCorrect("0");
    setWrong("0");
    setEmpty("0");
  };

  const handleCancel = () => {
    setCorrect("0");
    setWrong("0");
    setEmpty("0");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Görev Performans Verisi</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{taskTitle}</span> görevi için performans verilerini girin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="correct" className="text-right">
              Doğru
            </Label>
            <Input
              id="correct"
              type="number"
              min="0"
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wrong" className="text-right">
              Yanlış
            </Label>
            <Input
              id="wrong"
              type="number"
              min="0"
              value={wrong}
              onChange={(e) => setWrong(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="empty" className="text-right">
              Boş
            </Label>
            <Input
              id="empty"
              type="number"
              min="0"
              value={empty}
              onChange={(e) => setEmpty(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            İptal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}