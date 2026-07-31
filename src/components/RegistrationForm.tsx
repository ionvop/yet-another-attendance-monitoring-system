import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YEAR_LEVELS, COURSES } from "@/utils/types";
import type { Registration } from "@/utils/types";

interface Props {
  initialData?: Partial<Registration>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  errors: Record<string, string[]>;
}

export default function RegistrationForm({
  initialData,
  onSubmit,
  onCancel,
  saving,
  errors,
}: Props) {
  const [studentId, setStudentId] = useState(initialData?.student_id || "");
  const [firstName, setFirstName] = useState(initialData?.first_name || "");
  const [lastName, setLastName] = useState(initialData?.last_name || "");
  const [yearLevel, setYearLevel] = useState(initialData?.year_level || "");
  const [course, setCourse] = useState(initialData?.course || "");
  const [registeredAt, setRegisteredAt] = useState(
    initialData?.registered_at
      ? new Date(initialData.registered_at).toISOString().slice(0, 16)
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, string> = {
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      year_level: yearLevel,
      course: course,
    };
    if (registeredAt) data.registered_at = new Date(registeredAt).toISOString();
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="student_id">Student ID *</Label>
          <Input
            id="student_id"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 123456"
            required
            maxLength={50}
          />
          {errors.student_id && (
            <p className="text-sm text-destructive">{errors.student_id[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="registered_at">Registered At</Label>
          <Input
            id="registered_at"
            type="datetime-local"
            value={registeredAt}
            onChange={(e) => setRegisteredAt(e.target.value)}
          />
          {errors.registered_at && (
            <p className="text-sm text-destructive">{errors.registered_at[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. John"
            required
            maxLength={255}
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Doe"
            required
            maxLength={255}
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Year Level *</Label>
          <Select value={yearLevel} onValueChange={setYearLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select year level" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_LEVELS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.year_level && (
            <p className="text-sm text-destructive">{errors.year_level[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Course *</Label>
          <Select value={course} onValueChange={setCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {COURSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.course && (
            <p className="text-sm text-destructive">{errors.course[0]}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || !studentId.trim() || !firstName.trim() || !lastName.trim() || !yearLevel || !course}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}