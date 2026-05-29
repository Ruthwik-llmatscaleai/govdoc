"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

export function HeroSection() {
  return (
    <section className="govdoc-page-pad relative pb-10 pt-16 lg:pb-14 lg:pt-20">
      <motion.div
        className="govdoc-page-inner relative z-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="govdoc-kicker mb-8">
          <span className="govdoc-kicker-number">00</span>
          <span>Welcome · GovDoc Platform</span>
        </motion.div>

        <motion.h1 variants={fadeUp} className="govdoc-display mb-6 max-w-[1180px]">
          GovDoc is{" "}
          <em>beyond</em>{" "}
          Microsoft 365
          <br />
          Copilot<span className="ml-1 inline-block h-[12px] w-[12px] translate-y-[-3px] bg-[#3D5740]" />
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="max-w-[980px] text-[#0E1410]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(18px, 1.4vw, 22px)",
            lineHeight: 1.4,
            letterSpacing: 0,
          }}
        >
          <strong style={{ fontWeight: 700 }}>Deterministic responses </strong>
          <span style={{ fontStyle: "italic" }}>at</span>
          <strong style={{ fontWeight: 700 }}> low cost</strong>{" "}
          —{" "}
          <em style={{ fontStyle: "italic", fontWeight: 500, color: "#3D5740" }}>
            built to handle any complex document.
          </em>
        </motion.p>
      </motion.div>
    </section>
  );
}
