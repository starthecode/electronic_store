import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileText,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAuditLog,
} from "../../../services/auditLog.service";

import AuditLogActionBadge from "../../../components/auditLogsComp/AuditLogActionBadge";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);
};

const getUserName = (user) => {
  if (!user) return "System";

  return (
    [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "System"
  );
};

const AuditLogDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLog = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAuditLog(id);

        setLog(response.data);
      } catch (err) {
        console.error(
          "Failed to fetch audit log:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Failed to load audit log."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadLog();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-5 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-gray-100" />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-gray-50"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-full bg-gray-50 p-5 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/audit-logs")
            }
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Audit Logs
          </button>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error || "Audit log not found."}
          </div>
        </div>
      </div>
    );
  }

  const metadata =
    log.metadata &&
      typeof log.metadata === "object"
      ? log.metadata
      : null;

  return (
    <div className="min-h-full bg-gray-50 p-5 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate("/admin/audit-logs")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Audit Logs
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
            <FileText size={16} />
            <span>Administration</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Audit Log Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View the complete record of this activity.
          </p>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Summary */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {log.description ||
                        "Audit activity"}
                    </h2>

                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {log.id}
                    </p>
                  </div>
                </div>
              </div>

              <AuditLogActionBadge
                action={log.action}
              />
            </div>
          </div>

          {/* Information */}
          <div className="grid gap-px bg-gray-100 md:grid-cols-2">
            <div className="bg-white p-6">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Entity
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {log.entity || "—"}
              </div>
            </div>

            <div className="bg-white p-6">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Entity ID
              </div>

              <div className="break-all font-mono text-sm text-gray-700">
                {log.entityId || "—"}
              </div>
            </div>

            <div className="bg-white p-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                <User size={14} />
                Performed By
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {getUserName(log.user)}
              </div>

              {log.user?.email && (
                <div className="mt-1 text-xs text-gray-400">
                  {log.user.email}
                </div>
              )}

              {log.user?.role?.name && (
                <div className="mt-2 inline-flex rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-500">
                  {log.user.role.name}
                </div>
              )}
            </div>

            <div className="bg-white p-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                <Clock size={14} />
                Timestamp
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {formatDateTime(log.createdAt)}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-100 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Metadata
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Additional information recorded with this activity.
              </p>
            </div>

            {metadata &&
              Object.keys(metadata).length > 0 ? (
              <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-6 text-gray-700">
                {JSON.stringify(
                  metadata,
                  null,
                  2
                )}
              </pre>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                No metadata recorded for this activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetails;