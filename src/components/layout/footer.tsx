"use client";

import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Facebook,
  Car
} from "lucide-react";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Car Search", href: "#explore" },
      { label: "Car Comparison", href: "#explore" },
      { label: "AI Recommendations", href: "#hero" },
      { label: "Expert Reviews", href: "#explore" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#contact" },
      { label: "Blog", href: "#contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#contact" },
      { label: "FAQs", href: "#contact" },
      { label: "Live Chat", href: "#contact" },
      { label: "Contact Support", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#contact" },
      { label: "Terms of Service", href: "#contact" },
      { label: "Cookie Policy", href: "#contact" },
      { label: "Disclaimer", href: "#contact" },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <motion.div
                className="flex items-center space-x-2 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold">
                  Auto<span className="text-primary">Assist</span>
                </h3>
              </motion.div>
              
              <motion.p
                className="text-muted-foreground mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Your trusted partner in finding the perfect car. We combine
                automotive expertise with cutting-edge AI to make car buying
                simple, transparent, and enjoyable.
              </motion.p>

              {/* Contact Info */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">support@autoassist.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Mumbai, Maharashtra, India</span>
                </div>
              </motion.div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {footerSections.map((section, sectionIndex) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 + sectionIndex * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h4 className="font-semibold mb-4">{section.title}</h4>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <button
                            onClick={() => scrollToSection(link.href)}
                            className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                          >
                            {link.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <motion.div
            className="bg-primary/5 rounded-2xl p-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
              <p className="text-muted-foreground mb-6">
                Get the latest car news, reviews, and exclusive offers delivered
                to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <motion.button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <motion.p
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              © 2024 AutoAssist. All rights reserved.
            </motion.p>

            {/* Social Links */}
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <span className="text-muted-foreground text-sm mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-muted hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </motion.div>

            {/* Quality Badges */}
            <motion.div
              className="flex items-center space-x-4 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="px-2 py-1 bg-muted rounded">ISO Certified</span>
              <span className="px-2 py-1 bg-muted rounded">GDPR Compliant</span>
              <span className="px-2 py-1 bg-muted rounded">Secure</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
