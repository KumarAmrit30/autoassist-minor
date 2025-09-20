"use client";

import { motion } from "framer-motion";
import { Search, Database, Star, Shield, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Advanced Search",
    description:
      "Find your perfect car with our intelligent search and filtering system",
  },
  {
    icon: Database,
    title: "Comprehensive Database",
    description:
      "Access detailed information on thousands of car models and variants",
  },
  {
    icon: Star,
    title: "Expert Reviews",
    description:
      "Read authentic reviews and ratings from automotive experts and users",
  },
  {
    icon: Shield,
    title: "Trusted Information",
    description: "All car data is verified and updated regularly for accuracy",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Join a community of car enthusiasts sharing experiences and insights",
  },
  {
    icon: Zap,
    title: "AI-Powered Recommendations",
    description:
      "Get personalized car suggestions based on your preferences and budget",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AutoAssist?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide everything you need to make an informed car buying
            decision
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-8 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-6">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>

              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold mb-8">Built by Car Enthusiasts</h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Our team combines decades of automotive industry experience with
            cutting-edge technology expertise to bring you the most
            comprehensive car platform.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                ISO Certified
              </div>
              <div className="text-sm text-muted-foreground">
                Quality Assured
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                Privacy Protected
              </div>
              <div className="text-sm text-muted-foreground">
                Secure by Default
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                Expert Verified
              </div>
              <div className="text-sm text-muted-foreground">Accurate Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                24/7 Support
              </div>
              <div className="text-sm text-muted-foreground">
                Always Available
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
