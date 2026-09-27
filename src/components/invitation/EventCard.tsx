import type { InvitationEvent } from "@/lib/invitation-schema";
import type { Dict } from "@/lib/i18n";
import { formatGregorian, formatHijri, formatTime, toIcsUtc, zonedToDate } from "@/lib/dates";
import { Icon } from "./Ornaments";

export function mapQuery(e: InvitationEvent) {
  if (e.lat != null && e.lng != null) return `${e.lat},${e.lng}`;
  return [e.venueName, e.address].filter(Boolean).join("، ");
}

export function directionsUrl(e: InvitationEvent) {
  if (e.mapUrl) return e.mapUrl;
  const q = mapQuery(e);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
}

export function googleCalendarUrl(e: InvitationEvent, timezone: string, title: string, details: string) {
  const start = zonedToDate(e.startsAt, timezone);
  const end = e.endsAt ? zonedToDate(e.endsAt, timezone) : new Date(start.getTime() + 4 * 3600000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    details,
    location: [e.venueName, e.address].filter(Boolean).join(" - "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function EventCard({
  event,
  timezone,
  locale,
  d,
  showHijri,
  showMap,
  showCalendar,
  calendarTitle,
  calendarDetails,
  icsUrl,
}: {
  event: InvitationEvent;
  timezone: string;
  locale: "ar" | "en";
  d: Dict;
  showHijri: boolean;
  showMap: boolean;
  showCalendar: boolean;
  calendarTitle: string;
  calendarDetails: string;
  icsUrl: string;
}) {
  const q = mapQuery(event);
  const hijri = showHijri ? formatHijri(event.startsAt, locale) : "";
  const directions = directionsUrl(event);

  return (
    <div className="inv-card overflow-hidden">
      <div className="p-6 sm:p-8">
        <h3 className="text-center font-heading text-3xl text-inv-accent">{event.title}</h3>
        <dl className="mt-6 space-y-4 font-sans">
          <Row icon="calendar" label={d.date}>
            <span className="font-body text-lg">{formatGregorian(event.startsAt, locale)}</span>
            {hijri && <span className="block text-sm text-inv-muted">{hijri}</span>}
          </Row>
          <Row icon="clock" label={d.time}>
            <span className="font-body text-lg">
              {formatTime(event.startsAt, locale)}
              {event.endsAt && ` ${d.until} ${formatTime(event.endsAt, locale)}`}
            </span>
          </Row>
          {(event.venueName || event.address) && (
            <Row icon="pin" label={d.venue}>
              <span className="font-body text-lg">{event.venueName}</span>
              {event.address && <span className="block text-sm text-inv-muted">{event.address}</span>}
            </Row>
          )}
          {event.note && (
            <Row icon="info" label="">
              <span className="text-sm text-inv-muted">{event.note}</span>
            </Row>
          )}
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className="inv-btn">
              <Icon name="pin" className="h-4 w-4" /> {d.directions}
            </a>
          )}
          {showCalendar && (
            <details className="group relative">
              <summary className="inv-btn-outline cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <Icon name="calendar" className="h-4 w-4" /> {d.addToCalendar}
              </summary>
              <div className="absolute left-1/2 z-20 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-[var(--inv-radius-sm)] border border-inv-border bg-inv-surface font-sans text-sm shadow-xl">
                <a className="block px-4 py-3 hover:bg-inv-accent-soft" target="_blank" rel="noopener noreferrer" href={googleCalendarUrl(event, timezone, calendarTitle, calendarDetails)}>
                  {d.googleCalendar}
                </a>
                <a className="block border-t border-inv-border px-4 py-3 hover:bg-inv-accent-soft" href={icsUrl}>
                  {d.appleCalendar}
                </a>
              </div>
            </details>
          )}
        </div>
      </div>
      {showMap && q && (
        <iframe
          title={event.venueName || "map"}
          className="h-56 w-full border-0 border-t border-inv-border grayscale-[30%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&hl=${locale}&output=embed`}
        />
      )}
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-inv-accent-soft text-inv-accent">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        {label && <dt className="text-xs text-inv-muted">{label}</dt>}
        <dd>{children}</dd>
      </div>
    </div>
  );
}
