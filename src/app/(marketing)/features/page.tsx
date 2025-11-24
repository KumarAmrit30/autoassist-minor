import FeaturesSection from "@/components/features/features-section";

export default function FeaturesPage() {
  return (
    <>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-10 text-center">
          <p className="text-sm font-medium text-primary mb-3">Capabilities</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            All the tools you need to make{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              confident car decisions
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Dive deep into the features that power AutoAssist—from AI-driven
            recommendations to a verified data layer and an active enthusiast
            community.
          </p>
        </div>
      </section>

      <FeaturesSection />
    </>
  );
}

