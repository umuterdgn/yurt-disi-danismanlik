"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Power, Shield } from "lucide-react";
import { toast } from "sonner";
import { approveStudent, rejectStudent, freezeStudent, activateStudent } from "@/actions/admin-student-actions";

interface AdminStudentActionsProps {
  studentId: string;
  isApproved: boolean;
  isActive: boolean | null;
}

export function AdminStudentActions({ studentId, isApproved, isActive }: AdminStudentActionsProps) {
  const handleApprove = async () => {
    const result = await approveStudent(studentId);
    if (result.success) {
      toast.success(result.message);
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  const handleReject = async () => {
    if (confirm('Bu öğrenci başvurusunu reddetmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      const result = await rejectStudent(studentId);
      if (result.success) {
        toast.success(result.message);
        window.location.href = '/admin/students';
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleFreeze = async () => {
    if (confirm('Bu öğrenci hesabını dondurmak istediğinizden emin misiniz?')) {
      const result = await freezeStudent(studentId);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleActivate = async () => {
    const result = await activateStudent(studentId);
    if (result.success) {
      toast.success(result.message);
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {!isApproved && (
        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Onayla / Aktifleştir
        </Button>
      )}

      <Button onClick={handleReject} variant="destructive">
        <XCircle className="w-4 h-4 mr-2" />
        Reddet
      </Button>

      {(isActive ?? true) ? (
        <Button onClick={handleFreeze} variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
          <Power className="w-4 h-4 mr-2" />
          Pasife Al (Dondur)
        </Button>
      ) : (
        <Button onClick={handleActivate} variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
          <Shield className="w-4 h-4 mr-2" />
          Aktifleştir
        </Button>
      )}
    </div>
  );
}