import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { tAppointmentStatus } from "../i18n/labels";
import {
  MdPeople,
  MdLocalHospital,
  MdEventNote,
  MdToday,
  MdReceipt,
  MdSchedule,
} from "react-icons/md";
import "./Dashboard.css";

const COL_BAR = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadStats();
  }, [user?.id, user?.role]);

  const loadStats = async () => {
    try {
      const response = await axios.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role;
  const isStaff = ["ADMIN", "NURSE", "RECEPTIONIST"].includes(role);
  const isDoctor = role === "DOCTOR";
  const isPatient = role === "PATIENT";

  const pageSubtitle = useMemo(() => {
    if (isDoctor) return t("dashboard.subtitleDoctor");
    if (isPatient) return t("dashboard.subtitlePatient");
    return t("dashboard.subtitleStaff");
  }, [isDoctor, isPatient, t]);

  const dateLocale = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";

  const barData = useMemo(() => {
    if (!stats) return [];
    if (isDoctor) {
      return [
        { name: t("dashboard.myPatients"), value: stats.totalPatients },
        { name: t("dashboard.barInvoices"), value: stats.totalInvoices },
        { name: t("dashboard.barAppointments"), value: stats.totalAppointments },
        { name: t("dashboard.barToday"), value: stats.todayAppointments },
      ];
    }
    if (isPatient) {
      return [
        { name: t("dashboard.barAppointments"), value: stats.totalAppointments },
        { name: t("dashboard.barToday"), value: stats.todayAppointments },
        { name: t("dashboard.barInvoices"), value: stats.totalInvoices },
        { name: t("dashboard.barUpcoming"), value: stats.pendingAppointments || 0 },
      ];
    }
    return [
      { name: t("dashboard.barPatients"), value: stats.totalPatients },
      { name: t("dashboard.barDoctors"), value: stats.totalDoctors },
      { name: t("dashboard.barAppointments"), value: stats.totalAppointments },
      { name: t("dashboard.barToday"), value: stats.todayAppointments },
    ];
  }, [stats, t, isDoctor, isPatient]);

  const pieData = useMemo(
    () =>
      stats
        ? [
            { name: t("dashboard.pieScheduled"), value: stats.scheduledAppointments || 0 },
            { name: t("dashboard.pieCompleted"), value: stats.completedAppointments || 0 },
            { name: t("dashboard.pieCancelled"), value: stats.cancelledAppointments || 0 },
          ]
        : [],
    [stats, t]
  );

  const showCharts = isStaff || isDoctor || isPatient;

  return (
    <div className="dashboard-page">
      <div className="page-head">
        <h1 className="page-title">{t("dashboard.title")}</h1>
        <p className="page-subtitle">
          {pageSubtitle}
          <span className="dashboard-role-pill" title={t("auth.role")}>
            {t(`roles.${role}`, role)}
          </span>
        </p>
      </div>

      {loading && <div className="dashboard-skeleton">{t("loadingStats")}</div>}

      {!loading && stats && (isStaff || isDoctor || isPatient) && (
        <>
          <div className="stats-grid">
            {isStaff && (
              <>
                <div className="stat-card stat-card--patients">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.totalPatients")}</h3>
                    <p className="stat-number">{stats.totalPatients}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdPeople />
                  </div>
                </div>
                <div className="stat-card stat-card--doctors">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.doctors")}</h3>
                    <p className="stat-number">{stats.totalDoctors}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdLocalHospital />
                  </div>
                </div>
                <div className="stat-card stat-card--appointments">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.appointments")}</h3>
                    <p className="stat-number">{stats.totalAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdEventNote />
                  </div>
                </div>
                <div className="stat-card stat-card--today">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.todayAppointments")}</h3>
                    <p className="stat-number">{stats.todayAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdToday />
                  </div>
                </div>
              </>
            )}

            {isDoctor && (
              <>
                <div className="stat-card stat-card--patients">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.myPatients")}</h3>
                    <p className="stat-number">{stats.totalPatients}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdPeople />
                  </div>
                </div>
                <div className="stat-card stat-card--invoices">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.myInvoices")}</h3>
                    <p className="stat-number">{stats.totalInvoices}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdReceipt />
                  </div>
                </div>
                <div className="stat-card stat-card--appointments">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.appointments")}</h3>
                    <p className="stat-number">{stats.totalAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdEventNote />
                  </div>
                </div>
                <div className="stat-card stat-card--today">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.todayAppointments")}</h3>
                    <p className="stat-number">{stats.todayAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdToday />
                  </div>
                </div>
              </>
            )}

            {isPatient && (
              <>
                <div className="stat-card stat-card--appointments">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.appointments")}</h3>
                    <p className="stat-number">{stats.totalAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdEventNote />
                  </div>
                </div>
                <div className="stat-card stat-card--today">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.todayAppointments")}</h3>
                    <p className="stat-number">{stats.todayAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdToday />
                  </div>
                </div>
                <div className="stat-card stat-card--invoices">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.totalInvoices")}</h3>
                    <p className="stat-number">{stats.totalInvoices}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdReceipt />
                  </div>
                </div>
                <div className="stat-card stat-card--patients">
                  <div className="stat-card__body">
                    <h3>{t("dashboard.upcoming")}</h3>
                    <p className="stat-number">{stats.pendingAppointments}</p>
                  </div>
                  <div className="stat-card__icon" aria-hidden>
                    <MdSchedule />
                  </div>
                </div>
              </>
            )}
          </div>

          {showCharts && barData.length > 0 && (
            <div className="charts-section">
              <div className="chart-container">
                <h3>{t("dashboard.quickStats")}</h3>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    <BarChart
                      data={barData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {COL_BAR.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container">
                <h3>{t("dashboard.appointmentStatus")}</h3>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                        outerRadius="78%"
                        dataKey="value"
                      >
                        <Cell fill="#fbbf24" />
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {stats.recentAppointments && stats.recentAppointments.length > 0 && (
            <div className="recent-appointments">
              <h3>{t("dashboard.recentAppointments")}</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {!isPatient && <th>{t("dashboard.thPatient")}</th>}
                      <th>{t("dashboard.thDoctor")}</th>
                      <th>{t("dashboard.thDate")}</th>
                      <th>{t("dashboard.thStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAppointments.map((apt) => (
                      <tr key={apt.id}>
                        {!isPatient && (
                          <td data-label={t("dashboard.thPatient")}>{apt.patientName}</td>
                        )}
                        <td data-label={t("dashboard.thDoctor")}>{apt.doctorName}</td>
                        <td data-label={t("dashboard.thDate")}>
                          {apt.date ? new Date(apt.date).toLocaleString(dateLocale) : "—"}
                        </td>
                        <td data-label={t("dashboard.thStatus")}>
                          <span className={`status ${String(apt.status).toLowerCase()}`}>
                            {tAppointmentStatus(t, apt.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !stats && (
        <div className="welcome-message">
          <h3>{t("dashboard.welcomeTitle")}</h3>
          <p>{t("dashboard.welcomeHint")}</p>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
