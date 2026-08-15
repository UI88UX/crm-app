// src/components/appointments/AppointmentStatusActions.tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Play, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Appointment, AppointmentStatus } from "@/types";

interface AppointmentStatusActionsProps {
  appointment: Appointment;
  onStatusChange?: (appointment: Appointment) => void;
  size?: "sm" | "default";
}

export function AppointmentStatusActions({
  appointment,
  onStatusChange,
  size = "default",
}: AppointmentStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [reason, setReason] = useState("");

  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";
  const isNoShow = appointment.status === "no_show";
  const isFinished = isCompleted || isCancelled || isNoShow;

  const handleStatusChange = async (status: AppointmentStatus, reason?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در تغییر وضعیت");
      }

      toast.success("وضعیت نوبت با موفقیت تغییر کرد");
      if (onStatusChange) {
        onStatusChange(result.data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطا در تغییر وضعیت";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
      setShowNoShowDialog(false);
      setReason("");
    }
  };

  if (isFinished) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
        {isCancelled && <XCircle className="w-4 h-4 text-red-500" />}
        {isNoShow && <AlertCircle className="w-4 h-4 text-orange-500" />}
        <span>نوبت {isCompleted ? "انجام شده" : isCancelled ? "لغو شده" : "با عدم حضور"}</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Clock className="w-4 h-4 ml-2" />
                تغییر وضعیت
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>انتخاب وضعیت جدید</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleStatusChange("confirmed")}
            className="text-green-600"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            تایید نوبت
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleStatusChange("in_progress")}
            className="text-purple-600"
          >
            <Play className="w-4 h-4 ml-2" />
            شروع جلسه
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleStatusChange("completed")}
            className="text-gray-600"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            انجام شد
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowNoShowDialog(true)}
            className="text-orange-600"
          >
            <AlertCircle className="w-4 h-4 ml-2" />
            عدم حضور
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowCancelDialog(true)}
            className="text-red-600"
          >
            <XCircle className="w-4 h-4 ml-2" />
            لغو نوبت
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* دیالوگ لغو */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>لغو نوبت</DialogTitle>
            <DialogDescription>
              لطفاً دلیل لغو نوبت را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="دلیل لغو..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("cancelled", reason)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              لغو نوبت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ عدم حضور */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت عدم حضور</DialogTitle>
            <DialogDescription>
              لطفاً دلیل عدم حضور بیمار را وارد کنید (اختیاری)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="دلیل عدم حضور..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)}>
              انصراف
            </Button>
            <Button
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => handleStatusChange("no_show", reason)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              ثبت عدم حضور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}