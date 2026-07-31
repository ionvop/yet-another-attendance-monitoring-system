import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Pencil, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { YEAR_LEVELS, COURSES } from "@/utils/types";
import type { Registration, ApiResponse, PaginationMeta } from "@/utils/types";

interface Props {
  registrations: Registration[];
  meta: PaginationMeta | null;
  loading: boolean;
  search: string;
  yearLevel: string;
  course: string;
  page: number;
  onSearchChange: (v: string) => void;
  onYearLevelChange: (v: string) => void;
  onCourseChange: (v: string) => void;
  onPageChange: (v: number) => void;
  onRefresh: () => void;
}

export default function RegistrationTable({
  registrations,
  meta,
  loading,
  search,
  yearLevel,
  course,
  page,
  onSearchChange,
  onYearLevelChange,
  onCourseChange,
  onPageChange,
  onRefresh,
}: Props) {
  const { eventId } = useParams<{ eventId: string }>();

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/events/${eventId}/registrations/${id}`);
      toast.success("Registration deleted");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete registration");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or name..."
            className="pl-9"
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
          />
        </div>
        <Select value={yearLevel} onValueChange={(v) => { onYearLevelChange(v); onPageChange(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Year Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEAR_LEVELS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={course} onValueChange={(v) => { onCourseChange(v); onPageChange(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {COURSES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student ID</th>
                <th className="text-left px-4 py-3 font-medium">First Name</th>
                <th className="text-left px-4 py-3 font-medium">Last Name</th>
                <th className="text-left px-4 py-3 font-medium">Year Level</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Registered</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{reg.student_id}</td>
                    <td className="px-4 py-3">{reg.first_name}</td>
                    <td className="px-4 py-3">{reg.last_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{reg.year_level}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{reg.course}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(reg.registered_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/events/${eventId}/registrations/${reg.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Registration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete registration for {reg.first_name} {reg.last_name} ({reg.student_id})?
                                If attendance has been recorded, deletion may be blocked.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(reg.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {meta.total} total registrations
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}