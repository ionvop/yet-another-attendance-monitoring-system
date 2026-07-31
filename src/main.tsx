import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import EventsList from "@/pages/EventsList";
import EventCreate from "@/pages/EventCreate";
import EventEdit from "@/pages/EventEdit";
import EventDashboard from "@/pages/EventDashboard";
import RegistrationsList from "@/pages/RegistrationsList";
import RegistrationCreate from "@/pages/RegistrationCreate";
import RegistrationEdit from "@/pages/RegistrationEdit";
import SessionsList from "@/pages/SessionsList";
import SessionCreate from "@/pages/SessionCreate";
import SessionEdit from "@/pages/SessionEdit";
import AttendanceScan from "@/pages/AttendanceScan";
import SessionAttendanceList from "@/pages/SessionAttendanceList";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<EventsList />} />
          <Route path="events/new" element={<EventCreate />} />
          <Route path="events/:eventId" element={<EventDashboard />} />
          <Route path="events/:eventId/edit" element={<EventEdit />} />
          <Route path="events/:eventId/registrations" element={<RegistrationsList />} />
          <Route path="events/:eventId/registrations/new" element={<RegistrationCreate />} />
          <Route path="events/:eventId/registrations/:registrationId/edit" element={<RegistrationEdit />} />
          <Route path="events/:eventId/sessions" element={<SessionsList />} />
          <Route path="events/:eventId/sessions/new" element={<SessionCreate />} />
          <Route path="events/:eventId/sessions/:sessionId/edit" element={<SessionEdit />} />
          <Route path="events/:eventId/sessions/:sessionId/scan" element={<AttendanceScan />} />
          <Route path="events/:eventId/sessions/:sessionId/attendances" element={<SessionAttendanceList />} />
          <Route path="events/:eventId/reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);