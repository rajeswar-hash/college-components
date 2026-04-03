import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  MoonStar,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Watch,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statCards = [
  { label: "Weekly strain", value: "82%", detail: "Dialed-in volume", icon: Activity },
  { label: "Calories burned", value: "4,860", detail: "+12% this week", icon: Flame },
  { label: "Recovery score", value: "91", detail: "Ready for intensity", icon: HeartPulse },
  { label: "Sleep consistency", value: "8.1h", detail: "Above target", icon: MoonStar },
];

const timeline = [
  { time: "06:30", title: "Readiness scan", text: "HRV, sleep debt, soreness, and stress folded into today's score." },
  { time: "07:00", title: "Adaptive workout", text: "Strength block shifts from push intensity to mobility when recovery dips." },
  { time: "13:00", title: "Nutrition sync", text: "Macros rebalance after a heavier morning session and missed breakfast." },
  { time: "21:30", title: "Wind-down coaching", text: "Breathwork, sleep cueing, and tomorrow's suggested target in one view." },
];

const features = [
  {
    title: "Adaptive training engine",
    description: "Plans evolve around recovery, schedule changes, and actual performance so progress keeps moving.",
    icon: Dumbbell,
  },
  {
    title: "Nutrition intelligence",
    description: "Macro targets flex for cut, maintenance, or performance phases with meal timing suggestions.",
    icon: Flame,
  },
  {
    title: "Recovery coaching",
    description: "Sleep, soreness, strain, and stress create a single readiness score with clear next steps.",
    icon: MoonStar,
  },
  {
    title: "Premium wearable sync",
    description: "Apple Watch, Garmin, and Oura style insights designed for serious athletes and ambitious beginners.",
    icon: Watch,
  },
];

const planFeatures = [
  "AI workout programming with progression logic",
  "Live heart-rate zones and training load",
  "Macro planner with recovery meals",
  "Coach notes, streaks, and milestone celebrations",
  "Luxury dark-glass UI tuned for mobile and desktop",
];

const Index = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,185,39,0.18),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,107,53,0.18),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.2),_transparent_35%)]" />
      <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-[#ff6b35]/20 blur-3xl" />
      <div className="absolute right-[-4rem] top-12 h-64 w-64 rounded-full bg-[#fdb927]/20 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-6 md:px-8 lg:pb-20">
        <header className="mb-10 flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#fdb927] text-slate-950 shadow-[0_12px_32px_rgba(253,185,39,0.25)]">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#fdb927]">Apex Forma</p>
              <p className="text-sm text-muted-foreground">Luxury fitness tracking for people who train with intention.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
              Preview App
            </Button>
            <Button className="rounded-full bg-[#fdb927] px-6 text-slate-950 hover:bg-[#ffd15c]">
              Start Premium
            </Button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="max-w-3xl">
              <Badge className="mb-5 rounded-full border-0 bg-white/10 px-4 py-2 text-[#ffe7b3] hover:bg-white/10">
                <Sparkles className="mr-2 h-4 w-4" />
                Premium fitness intelligence
              </Badge>
              <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
                Train with data that feels
                <span className="block bg-[linear-gradient(135deg,#fdb927,#ff8a3d,#fff2c7)] bg-clip-text text-transparent">
                  personal, precise, and expensive.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Apex Forma combines workout tracking, recovery science, nutrition planning, and elite coaching cues in a cinematic mobile-first dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button className="h-12 rounded-full bg-[#ff6b35] px-6 text-base text-white hover:bg-[#ff814f]">
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" className="h-12 rounded-full border border-white/10 bg-white/5 px-6 text-base text-white hover:bg-white/10">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Product Tour
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#fdb927]" /> Private health vault</span>
                <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#fdb927]" /> Real-time coaching cues</span>
                <span className="flex items-center gap-2"><Star className="h-4 w-4 text-[#fdb927]" /> Premium athlete-grade visuals</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, detail, icon: Icon }) => (
                <Card key={label} className="border-white/10 bg-white/10 text-white shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-slate-300">{label}</span>
                      <div className="rounded-xl bg-white/10 p-2 text-[#fdb927]">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">{value}</div>
                    <p className="mt-2 text-sm text-slate-400">{detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.78))] text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <CardContent className="p-0">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Today's readiness</p>
                    <h2 className="text-3xl font-semibold">Peak performance mode</h2>
                  </div>
                  <Badge className="rounded-full border-0 bg-emerald-500/15 px-3 py-1 text-emerald-300 hover:bg-emerald-500/15">
                    +18% vs last week
                  </Badge>
                </div>
                <Progress value={84} className="h-3 bg-white/10" />
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>Recovery 84/100</span>
                  <span>Recommended: lower-body power</span>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Coach brief</p>
                      <p className="mt-1 text-xl font-semibold">Heavy day cleared</p>
                    </div>
                    <Brain className="h-5 w-5 text-[#fdb927]" />
                  </div>
                  <p className="text-sm leading-7 text-slate-300">
                    Sleep was strong, HRV recovered, and soreness is low. Push intensity on your compound lifts, then finish with a shorter conditioning block.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">Goal ring</p>
                    <div className="mt-3 text-4xl font-black text-[#fdb927]">72%</div>
                    <p className="mt-2 text-sm text-slate-300">6 of 8 sessions completed this week.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">Recovery stack</p>
                    <div className="mt-3 flex items-center gap-3 text-sm text-slate-300">
                      <Clock3 className="h-4 w-4 text-[#ff6b35]" />
                      Breathwork, stretch, magnesium, lights-down at 10:15 PM
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#ff6b35]/18 to-[#fdb927]/12 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#ffe7b3]">Elite Mode</p>
                    <Target className="h-5 w-5 text-[#fdb927]" />
                  </div>
                  <h3 className="text-2xl font-semibold">One dashboard for training, nutrition, recovery, and momentum.</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    Designed to feel like a luxury performance product, not a spreadsheet with steps.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-8 md:px-8">
        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#fdb927]">App experience</p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Built like a premium coaching console</h2>
            </div>
            <TabsList className="h-auto flex-wrap rounded-full border border-white/10 bg-white/5 p-1 text-white">
              <TabsTrigger value="overview" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-slate-950">Overview</TabsTrigger>
              <TabsTrigger value="workouts" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-slate-950">Workouts</TabsTrigger>
              <TabsTrigger value="nutrition" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-slate-950">Nutrition</TabsTrigger>
              <TabsTrigger value="recovery" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-slate-950">Recovery</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Daily flow</p>
                  <div className="mt-6 space-y-5">
                    {timeline.map((item) => (
                      <div key={item.time} className="flex gap-4">
                        <div className="min-w-16 text-sm font-medium text-[#fdb927]">{item.time}</div>
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm leading-7 text-slate-300">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Premium feature stack</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {features.map(({ title, description, icon: Icon }) => (
                      <div key={title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                        <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-[#fdb927]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workouts" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                ["Strength arc", "Progressive overload, form cues, rep velocity notes, and deload triggers."],
                ["Class booking", "Pilates, run club, mobility, and HIIT sessions with luxury studio vibes."],
                ["Performance analytics", "Zone splits, pace, power, and consistency trends in one clean layer."],
              ].map(([title, text]) => (
                <Card key={title} className="border-white/10 bg-white/5 text-white">
                  <CardContent className="p-6">
                    <BarChart3 className="mb-4 h-6 w-6 text-[#fdb927]" />
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="mt-0">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-sm text-slate-400">Fueling intelligence</p>
                  <h3 className="mt-2 text-3xl font-semibold">Macros that adapt to training load and body goals.</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    The app shifts calories and protein targets for lift days, run days, and recovery days, then packages meals in a polished visual planner.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Protein", "162g"],
                    ["Carbs", "220g"],
                    ["Hydration", "3.8L"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-center">
                      <p className="text-sm text-slate-400">{label}</p>
                      <div className="mt-3 text-3xl font-bold text-[#fdb927]">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="mt-0">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <p className="text-sm text-slate-400">Sleep + stress engine</p>
                  <h3 className="mt-2 text-2xl font-semibold">Recovery becomes visible, actionable, and calming.</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    Instead of guilt-driven notifications, the experience uses elegant signals that tell you when to push, back off, or recover smarter.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Readiness score from HRV, resting heart rate, and sleep debt",
                    "Evening routines with breathwork, mobility, and sleep cues",
                    "Recovery streaks that reward consistency, not punishment",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-[#fdb927]" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="p-7">
            <p className="text-sm uppercase tracking-[0.3em] text-[#fdb927]">Why it feels premium</p>
            <h2 className="mt-3 text-3xl font-bold">A fitness app that looks like it belongs next to a luxury wearable.</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              {planFeatures.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Star className="mt-1 h-4 w-4 text-[#fdb927]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#fdb927]/20 bg-[linear-gradient(180deg,rgba(253,185,39,0.14),rgba(255,107,53,0.08))] text-white">
          <CardContent className="p-7">
            <p className="text-sm uppercase tracking-[0.3em] text-[#fdb927]">Premium tier</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black">$19</span>
              <span className="pb-2 text-slate-300">/month</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              Built for launch with a premium positioning strategy: aspirational design, measurable outcomes, and a subscription feature set that feels worth paying for.
            </p>
            <Button className="mt-6 h-12 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100">
              Claim Early Access
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Index;
