"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export function ComparisonTable() {
  return (
    <section className="govdoc-page-pad pb-16 pt-6 lg:pb-20 lg:pt-8">
      <div className="govdoc-page-inner">
        <motion.div
          className="govdoc-surface px-8 py-10 lg:px-14 lg:py-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="mb-6 font-mono text-[9px] font-extrabold uppercase tracking-[0.45em] text-[#8c8b7d]">
            Why Not Copilot
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mb-12 leading-[1.1] tracking-[-0.6px] text-[#1a1d18]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            GovDoc is{" "}
            <em className="text-[#a14435]" style={{ fontStyle: "italic", fontWeight: 500 }}>not</em>{" "}
            built on Microsoft 365 Copilot
            <span className="ml-1 inline-block h-[9px] w-[9px] translate-y-[-2px] bg-[#2b4d3a]" />
          </motion.h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto_1fr]">
            {/* M365 column */}
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="mb-5 font-mono text-[9px] font-extrabold uppercase tracking-[0.4em] text-[#a14435]">
                M365 Copilot
              </motion.div>
              <div className="mb-5 h-px bg-[#d8d0bc]" />
              <div className="space-y-[17px] text-[15px] text-[#66675f]">
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Non-deterministic responses</span>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Per-token pricing</span>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Unauditable outputs</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              variants={fadeUp}
              className="hidden items-center text-[28px] text-[#2b4d3a] md:flex"
              style={{ fontFamily: "var(--font-display)" }}
            >
              &rarr;
            </motion.div>

            {/* GovDoc column */}
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="mb-5 font-mono text-[9px] font-extrabold uppercase tracking-[0.4em] text-[#2b4d3a]">
                GovDoc
              </motion.div>
              <div className="mb-5 h-px bg-[#d8d0bc]" />
              <div className="space-y-[17px] text-[15px] text-[#66675f]">
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
                  <span>Deterministic verdicts</span>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
                  <span>Fixed cost</span>
                </motion.div>
                <motion.div variants={fadeUp} className="flex items-center gap-[13px]">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
                  <span>Full audit trail</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
