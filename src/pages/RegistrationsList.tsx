import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RegistrationTable from "@/components/RegistrationTable";
import CsvImportDialog from "@/components/CsvImportDialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Registration, ApiResponse, PaginationMeta } from "@/utils/types";

export default function RegistrationsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [yearLevel, setYearLevel] = useState("all");
  const [course, setCourse] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: "25" };
      if (search) params.search = search;
      if (yearLevel !== "all") params.year_level = yearLevel;
      if (course !== "all") params.course = course;
      const res = await api.get<ApiResponse<Registration[]>>(
        `/events/${eventId}/registrations`,
        params
      );
      setRegistrations(res.data);
      setMeta(res.meta || null);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [eventId, page, search, yearLevel, course]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
            <p className="text-muted-foreground">
              {meta ? `${meta.total} registered students` : "Manage student registrations"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CsvImportDialog onImportComplete={fetchRegistrations} />
          <Button asChild>
            <Link to={`/events/${eventId}/registrations/new`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RegistrationTable
            registrations={registrations}
            meta={meta}
            loading={loading}
            search={search}
            yearLevel={yearLevel}
            course={course}
            page={page}
            onSearchChange={setSearch}
            onYearLevelChange={setYearLevel}
            onCourseChange={setCourse}
            onPageChange={setPage}
            onRefresh={fetchRegistrations}
          />
        </CardContent>
      </Card>
    </div>
  );
}