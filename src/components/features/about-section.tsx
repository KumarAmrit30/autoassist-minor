"use client";

import { motion } from "framer-motion";
import { Users, Target, Award, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "50K+", label: "Happy Customers" },
  { icon: TrendingUp, value: "500+", label: "Car Models" },
  { icon: Award, value: "4.8", label: "Average Rating" },
  { icon: Target, value: "99%", label: "Accuracy Rate" },
];

const team = [
  {
    name: "Automotive Experts",
    description: "Industry veterans with 20+ years of experience",
  },
  {
    name: "Tech Innovators", 
    description: "Cutting-edge AI and machine learning specialists",
  },
  {
    name: "Data Scientists",
    description: "Ensuring accuracy and reliability of car information",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AutoAssist
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We are passionate about transforming the car buying experience by
            combining automotive expertise with cutting-edge technology. Our
            mission is to empower every car buyer with the information they need
            to make confident decisions.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          className="bg-card border border-border rounded-xl p-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold mb-4 text-center">Our Mission</h3>
          <p className="text-muted-foreground text-center leading-relaxed max-w-4xl mx-auto">
            To democratize access to comprehensive car information and provide
            AI-powered recommendations that help everyone find their perfect
            vehicle. We believe that buying a car should be exciting, not
            overwhelming, and we&apos;re here to make that vision a reality.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-4">
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Team */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold mb-8">Built by Experts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                className="bg-card border border-border rounded-xl p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <h4 className="text-lg font-semibold mb-2">{member.name}</h4>
                <p className="text-muted-foreground text-sm">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold mb-6">Our Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2 text-primary">
                Transparency
              </h4>
              <p className="text-muted-foreground text-sm">
                Honest, accurate information with no hidden agendas
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2 text-primary">
                Innovation
              </h4>
              <p className="text-muted-foreground text-sm">
                Leveraging AI and technology to enhance your experience
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2 text-primary">
                Customer First
              </h4>
              <p className="text-muted-foreground text-sm">
                Your needs and satisfaction are our top priority
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
