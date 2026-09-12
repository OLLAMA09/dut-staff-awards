import { motion } from "framer-motion";
import { MapPin, Clock, Accessibility, Car, Shirt } from "lucide-react";
import { AWARD_CATEGORIES } from "@/data/awards";

const ceremonySchedule = [
  { time: "TBC", title: "Welcome & Opening Address", desc: "Registrar's remarks and programme introduction" },
  { time: "TBC", title: "Cultural Opening", desc: "Performance of the institutional anthem" },
  ...AWARD_CATEGORIES.map((c) => ({
    time: "TBC",
    title: `Award: ${c.short}`,
    desc: c.tagline,
  })),
  { time: "TBC", title: "Closing Address & Toast", desc: "A salute to all nominees and winners" },
];

const venueFacts = [
  { icon: MapPin, label: "Address", value: "TBC" },
  { icon: Car, label: "Parking", value: "TBC" },
  { icon: Accessibility, label: "Access", value: "TBC" },
  { icon: Shirt, label: "Dress code", value: "TBC" },
];

export default function EventProgram() {
  return (
    <section id="program" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Programme of the Evening</p>
        <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
          A ceremony <span className="text-primary">honouring our people.</span>
        </h2>
        <p className="mt-5 text-muted-foreground">
          Full ceremony date, time and schedule details will be announced closer to the event.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Timeline */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl border border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
            <div className="absolute left-[6.5rem] top-8 bottom-8 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent" />
            <ol className="space-y-5">
              {ceremonySchedule.map((s, idx) => (
                <motion.li
                  key={`${s.title}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: idx * 0.04, duration: 0.5 }}
                  className="relative flex items-start gap-6"
                >
                  <div className="w-20 shrink-0 pt-0.5 text-right text-lg font-bold text-primary">
                    {s.time}
                  </div>
                  <div className="relative z-10 mt-2 h-3 w-3 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_oklch(0.18_0.06_265)]" />
                  <div className="flex-1 pb-1">
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>

        {/* Venue card */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-6 lg:space-y-4">
            <div className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-secondary/40">
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-primary">The Venue</p>
                <h3 className="mt-2 text-3xl font-bold">TBC</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Date & time: TBC
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-card/40 p-6 backdrop-blur-sm">
              <ul className="space-y-4">
                {venueFacts.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-primary">{f.label}</p>
                        <p className="mt-0.5 text-sm text-foreground">{f.value}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
