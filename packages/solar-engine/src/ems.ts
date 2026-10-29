/**
 * Deterministic EMS demo profile: 500 kWp C&I rooftop + 1 MWh BESS + grid.
 * Shared by the API (REST + Socket.IO) and the website preview so both show the same story.
 * Every snapshot carries simulated:true — never present it as live monitoring.
 */
export interface EnergySnapshot {
  ts: string;
  simulated: true;
  solarKw: number;
  loadKw: number;
  gridImportKw: number;
  gridExportKw: number;
  batterySocPct: number;
  /** + charging, - discharging */
  batteryKw: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function simulateSnapshot(at: Date = new Date(), jitter = 0): EnergySnapshot {
  const h = at.getHours() + at.getMinutes() / 60;
  const sun = Math.max(0, Math.sin((Math.PI * (h - 5.9)) / 12.4));
  const cloud = 1 - 0.07 * Math.sin(h * 2.7 + jitter);
  const solarKw = 430 * sun * cloud;
  const shift = h >= 8 && h <= 18 ? 1 : 0;
  const loadKw = 180 + 210 * shift + 40 * Math.sin(h / 1.7) + jitter * 6;
  const net = solarKw - loadKw;
  const peak = h >= 17 && h <= 23; // Bangladesh evening peak window
  let batteryKw = 0;
  if (net > 0) batteryKw = Math.min(net, 250);
  else if (peak) batteryKw = -Math.min(-net, 200);
  const residual = net - batteryKw;
  const soc = 35 + 55 * Math.min(1, Math.max(0, (h - 9) / 6)) - (h > 17 ? (h - 17) * 9 : 0);
  return {
    ts: at.toISOString(),
    simulated: true,
    solarKw: r1(solarKw),
    loadKw: r1(loadKw),
    gridImportKw: residual < 0 ? r1(-residual) : 0,
    gridExportKw: residual > 0 ? r1(residual) : 0,
    batteryKw: r1(batteryKw),
    batterySocPct: Math.round(Math.max(15, Math.min(98, soc))),
  };
}

/** 15-minute series for one day. */
export function simulateDay(day: Date = new Date()): EnergySnapshot[] {
  const d0 = new Date(day);
  d0.setHours(0, 0, 0, 0);
  return Array.from({ length: 96 }, (_, i) => simulateSnapshot(new Date(d0.getTime() + i * 15 * 60_000)));
}
