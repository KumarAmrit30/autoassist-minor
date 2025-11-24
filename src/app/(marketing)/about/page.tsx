import AboutSection from "@/components/features/about-section";

export default function AboutPage() {
  return (
    <>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-10">
          <p className="text-sm font-medium text-primary mb-3">
            Our Story
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            The people and mission behind{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AutoAssist
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl">
            AutoAssist blends decades of automotive expertise with modern AI to
            remove uncertainty from car buying. Learn more about the team,
            values, and milestones shaping our platform.
          </p>
        </div>
      </section>

      <AboutSection />
    </>
  );
}

