function downloadCalendarFile(events) {
  const calendarData = generateCalendarData(events);
  downloadFile(calendarData, "calendar.ics");
}

function generateCalendarData(events) {
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My Company//EN",
  ];

  events.forEach((event) => {
    const start = formatDate(event.event_date);
    const end = formatDate(event.event_date);
    const description = event.event_notes || "";
    const title = event.event_title || "";

    const eventLines = [
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `SUMMARY:${title}`,
      "END:VEVENT",
    ];

    calendarLines.push(...eventLines);
  });

  calendarLines.push("END:VCALENDAR");

  return calendarLines.join("\n");
}

function downloadFile(data, filename) {
  const blob = new Blob([data], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function padNumber(number) {
  return number.toString().padStart(2, "0");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = padNumber(date.getUTCMonth() + 1);
  const day = padNumber(date.getUTCDate());
  const hours = padNumber(date.getUTCHours());
  const minutes = padNumber(date.getUTCMinutes());
  const seconds = padNumber(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export { downloadCalendarFile }
