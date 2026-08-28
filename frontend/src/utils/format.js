export const formatWhen = (startsAt, endsAt) => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const time = (d) =>
    d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time(start)} – ${time(end)}`;
};