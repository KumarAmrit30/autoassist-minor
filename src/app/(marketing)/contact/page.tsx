import ContactSection from "@/components/features/contact-section";

export default function ContactPage() {
  return (
    <>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-10">
          <p className="text-sm font-medium text-primary mb-3">Support</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            We&apos;re here to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              help you buy smarter
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl">
            Reach our advisors for product questions, partnership opportunities,
            or concierge help picking the right car. Send a message and we&apos;ll
            respond within one business day.
          </p>
        </div>
      </section>

      <ContactSection />
    </>
  );
}

