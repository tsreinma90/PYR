

(function () {
  // ---- CSV EXPORT ----
  function exportToCSV(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    const headers = [
      "Week #",
      "Date",
      "Day",
      "Workout Type",
      "Title",
      "Distance (mi)",
      "Notes"
    ];

    const rows = events.map((e) => ([
      e.weekNumber ?? "",
      e.event_date ?? "",
      e.dayOfWeek ?? "",
      e.event_type ?? "",
      e.event_title ?? "",
      e.event_distance ?? "",
      (e.event_notes || "").replace(/\r?\n|\r/g, " ")
    ]));

    const csvContent = [headers, ...rows]
      .map(row =>
        row
          .map(cell => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "training-plan.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- ICS EXPORT ----
  function exportToICS(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PlanYourRun//Training Plan//EN"
    ];

    events.forEach(e => {
      if (!e.event_date) return;

      // Normalize to midday to avoid TZ edge weirdness
      const date = new Date(e.event_date + "T12:00:00");
      const dt = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      const summary = e.event_title || e.event_type || "Workout";
      const descriptionParts = [];

      if (e.event_type) {
        descriptionParts.push(`Type: ${e.event_type}`);
      }
      if (e.event_distance) {
        descriptionParts.push(`Distance: ${e.event_distance} mi`);
      }
      if (e.event_notes) {
        descriptionParts.push(e.event_notes);
      }

      const description = descriptionParts.join("\\n");
      const safeTitle = (summary || "Workout").replace(/\s+/g, "-");
      const uid = `PYR-${dt}-${safeTitle}`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dt}`,
        `DTSTART:${dt}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training-plan.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- PDF EXPORT ----
  function exportToPDF(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.warn("jsPDF not found. Make sure it is loaded before exporting PDF.");
      return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4"
    });

    doc.setFontSize(18);
    doc.text("Training Plan", 40, 40);

    const headers = [
      "Week #",
      "Date",
      "Day",
      "Workout Type",
      "Title",
      "Distance (mi)",
      "Notes"
    ];

    const rows = events.map(e => ([
      e.weekNumber ?? "",
      e.event_date ?? "",
      e.dayOfWeek ?? "",
      e.event_type ?? "",
      e.event_title ?? "",
      e.event_distance ?? "",
      e.event_notes || ""
    ]));

    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak"
        },
        headStyles: {
          fontStyle: "bold"
        }
      });
    }

    doc.save("training-plan.pdf");
  }

  // Expose as global for pyr.js / Alpine to call
  window.PYR_Exporters = {
    exportToCSV,
    exportToICS,
    exportToPDF
  };
})();