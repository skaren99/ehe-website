export function tallinnInstant(date, time) {
  const target = Date.parse(date + "T" + time + ":00Z");
  let stamp = target;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Tallinn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(stamp))
        .map((x) => [x.type, x.value]),
    );
    stamp +=
      target -
      Date.parse(
        `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
      );
  }
  return new Date(stamp).toISOString();
}
