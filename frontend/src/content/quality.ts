/** Quality page copy per requirements §7. */
export const qualityHeading = "Quality Built into the Process";

export const qualityIntro =
  "Quality at Shakti Udyog begins with a clear agreement on the drawing, material, and acceptance criteria. Relevant checks are planned through production so that finished components match the agreed requirements.";

export const qualityChecks = [
  { check: "Incoming material and charge-material control", note: "[scope to be confirmed]" },
  { check: "Chemical composition verification", note: "[scope to be confirmed]" },
  { check: "Visual and dimensional inspection", note: "" },
  { check: "Hardness testing", note: "[scope to be confirmed]" },
  { check: "Microstructure / tensile testing", note: "[scope to be confirmed]" },
  { check: "Non-destructive testing", note: "[only if actually offered — to be confirmed]" },
  { check: "Traceability and inspection records", note: "[scope as agreed]" },
] as const;

/**
 * §7: certification status is unverified — the doc's "if not certified"
 * statement is used. Never display certification logos without authorization.
 */
export const certificationStatement =
  "We follow documented quality practices tailored to each order's agreed requirements.";
