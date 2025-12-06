import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  Globe2,
  Radar,
  Sparkles,
  Users2,
  Workflow,
  Wrench,
} from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import TextType from "@/components/ui/TextType";
import companies from "@/data/companies.json";
import faqs from "@/data/faq.json";

const metrics = [
  {
    label: "Active roles curated weekly",
    value: "18k+",
    icon: Radar,
    accent: "from-sky-400/40 to-sky-600/20",
  },
  {
    label: "Candidates hired through Job-Seek",
    value: "42k",
    icon: Users2,
    accent: "from-emerald-400/40 to-teal-500/20",
  },
  {
    label: "Average time to first interview",
    value: "5 days",
    icon: Globe2,
    accent: "from-fuchsia-400/40 to-purple-500/20",
  },
];

const journeys = [
  {
    title: "Launch your next role",
    subtitle: "For ambitious candidates",
    icon: Compass,
    steps: [
      "Build a standout talent profile with guided prompts and AI-enhanced summaries.",
      "Receive personalized matches powered by your skills, goals, and culture preferences.",
      "Track applications, interview loops, and offers from a cinematic glass dashboard.",
    ],
    cta: {
      label: "Explore jobs",
      to: "/jobs",
    },
  },
  {
    title: "Activate hiring superpowers",
    subtitle: "For fast-moving teams",
    icon: BriefcaseBusiness,
    steps: [
      "Post roles in seconds with smart templates that highlight what matters.",
      "Unlock a vetted candidate pool—filter by impact, not just keywords.",
      "Collaborate with your team using shared feedback loops and offer insights.",
    ],
    cta: {
      label: "Post a role",
      to: "/post-job",
    },
  },
];

const experiencePillars = [
  {
    title: "Precision-matched opportunities",
    description:
      "Our discovery engine blends market data with your narrative to surface openings that feel tailored, not generic.",
    icon: Workflow,
  },
  {
    title: "Narratives that resonate",
    description:
      "Share your story through video intros, work samples, and dynamic case studies that spotlight your craft.",
    icon: Sparkles,
  },
  {
    title: "Human-first hiring",
    description:
      "Transparently align on expectations with structured conversations, scorecards, and candidate success rituals.",
    icon: Wrench,
  },
];

const LandingPage = () => {
  const heroWords = "Where meaningful teams find each other";

  return (
    <main className="flex flex-col gap-20 py-12 sm:py-20">
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/5 px-6 py-16 text-center text-white shadow-[0_48px_120px_-60px_rgba(12,15,45,0.8)] backdrop-blur-2xl sm:px-12 lg:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--app-aurora-a)_0%,transparent_55%)] opacity-70" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          {/* <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-200">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Next-generation hiring
          </span>*/}
          <TextGenerateEffect words={heroWords} />
          <h1 className="app-gradient-text text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Discover work that feels{" "}
            <TextType
              text={["purpose-built", "technically magnetic", "future ready"]}
              typingSpeed={90}
              pauseDuration={1800}
              className="app-gradient-text drop-shadow-[0_18px_36px_rgba(56,189,248,0.45)]"
              cursorCharacter="▌"
              cursorClassName="text-cyan-300 drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]"
            />
          </h1>
          <p className="max-w-2xl text-base text-slate-200/80 sm:text-lg">
            Job-Seek pairs the world’s top operators with teams ready to ship.
            Craft a narrative-rich profile, surface precision matches, and turn
            decision cycles into engaging stories.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/onboarding">
              <Button className="app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
                Begin your journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button variant="ghost" className="text-slate-100/80">
                Browse roles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {metrics.map(({ label, value, icon, accent }) => {
          const MetricIcon = icon;
          return (
            <Card
              key={label}
              className="relative overflow-hidden border-white/10 bg-white/10 text-white shadow-[0_32px_80px_-48px_rgba(11,21,45,0.9)] backdrop-blur-2xl"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`}
              />
              <CardContent className="relative flex flex-col gap-3 px-6 py-8">
                <MetricIcon className="h-10 w-10 text-white" />
                <span className="text-4xl font-semibold tracking-tight">
                  {value}
                </span>
                <p className="text-sm text-slate-200/80">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_100px_-64px_rgba(12,18,45,0.85)] backdrop-blur-2xl sm:p-12">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-200/70">
          Trusted by product teams worldwide
        </p>
        <Carousel
          plugins={[
            Autoplay({
              delay: 1800,
            }),
          ]}
          className="mt-10"
        >
          <CarouselContent className="flex items-center gap-10 sm:gap-16">
            {companies.map(({ name, id, path }) => (
              <CarouselItem
                key={id}
                className="basis-1/2 text-center sm:basis-1/4 lg:basis-1/6"
              >
                <img
                  src={path}
                  alt={name}
                  className="mx-auto h-10 w-auto opacity-80 transition hover:opacity-100 sm:h-12"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      <section className="flex flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/60">
            Choose your flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Purpose-built journeys for every path
          </h2>
          <p className="mt-4 text-base text-slate-200/80 sm:text-lg">
            Whether you&apos;re designing your ideal next role or scaling a high
            velocity team, our experience adapts to the story you want to tell.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {journeys.map(({ title, subtitle, icon, steps, cta }) => {
            const JourneyIcon = icon;
            return (
              <Card
                key={title}
                className="relative overflow-hidden border-white/10 bg-white/8 text-white shadow-[0_36px_90px_-60px_rgba(15,22,48,0.85)] backdrop-blur-2xl"
              >
                <CardHeader className="relative flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/40 via-cyan-400/30 to-fuchsia-500/30 backdrop-blur">
                      <JourneyIcon className="h-6 w-6 text-white" />
                    </span>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-white">
                        {title}
                      </CardTitle>
                      <p className="text-sm text-slate-200/70">{subtitle}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative flex flex-col gap-6">
                  <ul className="flex flex-col gap-4">
                    {steps.map((step) => (
                      <li
                        key={step}
                        className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-200/80"
                      >
                        <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={cta.to} className="self-start">
                    <Button className="app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-sm font-semibold text-white">
                      {cta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/6 p-8 text-white shadow-[0_32px_90px_-68px_rgba(12,18,45,0.9)] backdrop-blur-2xl">
          <h3 className="text-2xl font-semibold sm:text-3xl">
            A people-first experience at every touchpoint
          </h3>
          <p className="text-base text-slate-200/75">
            We combine craft, data, and storytelling to elevate every
            interaction—so hiring feels less transactional and more like
            collaborative discovery.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {experiencePillars.map(({ title, description, icon }) => {
              const PillarIcon = icon;
              return (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200/80"
                >
                  <PillarIcon className="h-6 w-6 text-cyan-300" />
                  <h4 className="text-base font-semibold text-white">
                    {title}
                  </h4>
                  <p>{description}</p>
                </div>
              );
            })}
          </div>
        </div>
        <Card className="relative flex flex-col justify-between overflow-hidden border-white/15 bg-white/6 p-8 text-white shadow-[0_32px_90px_-64px_rgba(13,19,42,0.85)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-cyan-400/10 to-fuchsia-500/20 opacity-75" />
          <div className="relative flex flex-col gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-200/70">
              Ready when you are
            </p>
            <h3 className="text-3xl font-semibold">Step into the aurora</h3>
            <p className="text-sm text-slate-100/80">
              Sign up today to access curated roles, narrative tools, and a
              community that champions the craft of building teams.
            </p>
          </div>
          <div className="relative mt-8 flex flex-col gap-3">
            <Link to="/onboarding">
              <Button className="app-button-glow w-full border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
                Create your account
              </Button>
            </Link>
            <Link to="/post-job">
              <Button variant="outline" className="w-full text-slate-100/85">
                Start hiring
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-[0_30px_80px_-52px_rgba(12,19,46,0.9)] backdrop-blur-2xl sm:p-12">
        <h3 className="text-center text-2xl font-semibold text-white sm:text-3xl">
          Questions, meet clarity
        </h3>
        <p className="mt-3 text-center text-sm text-slate-200/75">
          Everything you need to know about how Job-Seek orchestrates modern
          hiring.
        </p>
        <Accordion type="multiple" className="mt-8 space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 px-4"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-white hover:text-sky-200">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-200/80">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
};

export default LandingPage;
