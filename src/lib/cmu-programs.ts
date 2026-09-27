// Snapshot of official CMU program listings, 2026-09-27. Sources and scope: docs/CMU_PROGRAMS.md.
// Acronyms are display abbreviations (not necessarily official degree codes).
export type ProgramLevel = "Bachelor’s" | "Master’s" | "Doctoral" | "Additional major";
export interface CmuProgram { emoji: string; acronym: string; name: string; level: ProgramLevel; school: string }
function group(level: ProgramLevel, school: string, degree: string, rows: string): CmuProgram[] {
  return rows.trim().split("\n").map((row) => {
    const [emoji, acronym, subject] = row.split("|");
    return { emoji, acronym, name: degree ? `${degree} in ${subject}` : subject, level, school };
  });
}
export const CMU_PROGRAMS: CmuProgram[] = [
  ...group("Bachelor’s", "Engineering", "Bachelor of Science", `
🧪|BSChE|Chemical Engineering
🏗️|BSCE|Civil Engineering
🌱|BSEnvE|Environmental Engineering
⚡|BSECE|Electrical and Computer Engineering
🔩|BSMSE|Materials Science and Engineering
⚙️|BSME|Mechanical Engineering`),
  ...group("Additional major", "Engineering", "", `
🩺|BME|Biomedical Engineering (Additional Major)
🧬|BMT|Biomedical Technology (Additional Major)
⚖️|EPP|Engineering and Public Policy (Additional Major)
🌐|STPP|Science, Technology and Public Policy (Additional Major)
💡|EDIE|Engineering Design, Innovation and Entrepreneurship (Additional Major)`),
  ...group("Bachelor’s", "Fine Arts", "", `
🏛️|BArch|Bachelor of Architecture
🏛️|BAArch|Bachelor of Arts in Architecture
🎨|BFAArt|Bachelor of Fine Arts in Art
✏️|BDes|Bachelor of Design
🎭|BFADrama|Bachelor of Fine Arts in Drama
🎼|BFAComp|Bachelor of Fine Arts in Composition
🎛️|BFAEM|Bachelor of Fine Arts in Electronic Music
🎻|BFAMP|Bachelor of Fine Arts in Music Performance
🎧|BSMT|Bachelor of Science in Music and Technology`),
  ...group("Bachelor’s", "Dietrich", "Bachelor of Arts", `
✍️|BACW|Creative Writing
🎬|BAFVM|Film and Visual Media
📚|BALC|Literature and Culture
📝|BAPW|Professional Writing
🏺|BAHist|History
🌍|BAAnth|Anthropology
⚖️|BAEHPP|Ethics, History and Public Policy
🗣️|BALang|Languages and Cultures
🌐|BAGCET|Global Cultures and Emerging Technologies
💭|BAPhil|Philosophy
🔤|BALing|Linguistics
🧠|BAPsych|Psychology`),
  ...group("Bachelor’s", "Dietrich", "Bachelor of Science", `
🌐|BSIRP|International Relations and Political Science
🛡️|BSPST|Political Science, Security and Technology
🏛️|BSEP|Economics and Politics
📝|BSTW|Technical Writing
🔬|BSSTS|Science, Technology and Society
⚖️|BSEHPP|Ethics, History and Public Policy
💻|BSIS|Information Systems
🧩|BSLC|Logic and Computation
🧠|BSPsych|Psychology
🧠|BSCogSci|Cognitive Science
🧬|BSPBS|Psychology and Biological Sciences
🧠|BSNeuro|Neuroscience
📈|BSBE|Behavioral Economics
🎯|BSDS|Decision Science
🏛️|BSPM|Policy and Management
📊|BSStatDS|Statistics and Data Science
📈|BSES|Economics and Statistics
🤖|BSStatML|Statistics and Machine Learning`),
  ...group("Additional major", "Dietrich", "", `
🌱|ESS|Environmental and Sustainability Studies (Additional Major)
🩺|HH|Health Humanities (Additional Major)
✨|SDM|Student-Defined Major`),
  ...group("Bachelor’s", "Mellon College of Science", "Bachelor of Science", `
🧬|BSBio|Biological Sciences
🧪|BSChem|Chemistry
🔢|BSMath|Mathematical Sciences
💹|BSCF|Computational Finance
⚛️|BSPhys|Physics`),
  ...group("Bachelor’s", "Mellon College of Science", "Bachelor of Arts", `
🧬|BABio|Biological Sciences
🧪|BAChem|Chemistry
🔢|BAMath|Mathematical Sciences
⚛️|BAPhys|Physics`),
  ...group("Bachelor’s", "Computer Science", "Bachelor of Science", `
🤖|BSAI|Artificial Intelligence
🧬|BSCB|Computational Biology
💻|BSCS|Computer Science
🖱️|BSHCI|Human-Computer Interaction
🦾|BSR|Robotics`),
  ...group("Bachelor’s", "Tepper", "", `
💼|BSBA|Bachelor of Science in Business Administration
📈|BAEcon|Bachelor of Arts in Economics
📈|BSEcon|Bachelor of Science in Economics
🔢|BSEMS|Bachelor of Science in Economics and Mathematical Sciences`),
  ...group("Bachelor’s", "BXA Intercollege", "", `
🎨|BCSA|Bachelor of Computer Science and Arts
🎨|BESA|Bachelor of Engineering Studies and Arts
🎨|BHA|Bachelor of Humanities and Arts
🎨|BSA|Bachelor of Science and Arts`),
  ...group("Additional major", "Intercollege", "", `
🎨|EA|Engineering and Arts (Additional Major)
🤖|AI|Artificial Intelligence (Additional Major)
🧬|CB|Computational Biology (Additional Major)
💻|CS|Computer Science (Additional Major)
🖱️|HCI|Human-Computer Interaction (Additional Major)
🦾|R|Robotics (Additional Major)
🧬|Bio|Biological Sciences (Additional Major)
⚛️|Phys|Physics (Additional Major)
💼|BA|Business Administration (Additional Major)
📈|Econ|Economics (Additional Major)`),
  ...group("Master’s", "Computer Science", "", `
💻|MSCS|Master of Science in Computer Science
📚|MSLE|Master of Science in Learning Engineering
🖱️|MHCI|Master of Human-Computer Interaction
📦|MSPM|Master of Science in Product Management
📊|MCDS|Master of Computational Data Science
🤖|MSAII|Master of Science in Artificial Intelligence and Innovation
💡|MIIS|Master of Science in Intelligent Information Systems
🗣️|MLT|Master of Science in Language Technologies
🤖|MSML|Master of Science in Machine Learning
🧪|MSAS|Master of Science in Automated Science: Biological Experimentation
🧬|MSCB|Master of Science in Computational Biology
👁️|MSCV|Master of Science in Computer Vision
🦾|MSR|Master of Science in Robotics
🦾|MRSD|Master of Science in Robotic Systems Development
🔒|MPEAIG|Master of Science in Privacy Engineering and AI Governance
🔐|MPTAIG|Master of Science in Privacy Technology and AI Governance
💻|MSE|Master of Software Engineering
💻|MSE-AS|Master of Software Engineering — Applied Study
💻|MSE-SS|Master of Software Engineering — Scalable Systems
💻|MSE-ES|Master of Software Engineering — Embedded Systems
💻|MSSE|Master of Science in Software Engineering`),
  ...group("Master’s", "Engineering", "Master of Science", `
🩺|MSBME|Biomedical Engineering
🩺|MSBME-AS|Biomedical Engineering — Applied Study
🔬|MSBME-R|Biomedical Engineering — Research
🧪|MSChE|Chemical Engineering
🧪|MSChE-AS|Chemical Engineering — Applied Study
🧮|MSCSE|Computational Systems Engineering
🧬|MSBTPE|Biotechnology and Pharmaceutical Engineering
🏗️|MSCEE|Civil and Environmental Engineering
🏗️|MSCEE-R|Civil and Environmental Engineering — Research
⚡|MSECE|Electrical and Computer Engineering
⚡|MSECE-AD|Electrical and Computer Engineering — Advanced Study
⚖️|MSEPP|Engineering and Public Policy
🔬|MSEPP-R|Engineering and Public Policy — Research
💡|MSETIM|Engineering and Technology Innovation Management
🔩|MSMSE|Materials Science and Engineering
🔬|MSMatSci|Materials Science — Research
⚙️|MSME|Mechanical Engineering
⚙️|MSME-AS|Mechanical Engineering — Advanced Study
🔬|MSME-R|Mechanical Engineering — Research
🌐|MSIN|Information Networking
🔒|MSIS|Information Security
📱|MSMITE|Mobile and IoT Engineering
🔐|MSIT-IS|Information Technology — Information Security
💻|MSIT|Information Technology
🌍|MSAIE|Artificial Intelligence Engineering
🩺|MSAIE-BME|Artificial Intelligence Engineering — Biomedical Engineering
🔬|MSAIE-BME-R|Artificial Intelligence Engineering — Biomedical Engineering — Research
🧪|MSAIE-ChE|Artificial Intelligence Engineering — Chemical Engineering
🏗️|MSAIE-CEE|Artificial Intelligence Engineering — Civil and Environmental Engineering
⚡|MSAIE-ECE|Artificial Intelligence Engineering — Electrical and Computer Engineering
💡|MSAIE-ETIM|Artificial Intelligence Engineering — Engineering and Technology Innovation Management
🔒|MSAIE-IS|Artificial Intelligence Engineering — Information Security
🔩|MSAIE-MSE|Artificial Intelligence Engineering — Materials Science and Engineering
⚙️|MSAIE-ME|Artificial Intelligence Engineering — Mechanical Engineering
🔋|MSESTP|Energy Science, Technology and Policy
🔋|MSESTP-Adv|Energy Science, Technology and Policy — Advanced Study
🔋|MSESTP-App|Energy Science, Technology and Policy — Applied Study
🔋|MSESTP-AA|Energy Science, Technology and Policy — Applied Advanced Study
🔋|MSAIE-ESTP|Artificial Intelligence Engineering — Energy Science, Technology and Policy
🔋|MSAIE-ESTP-AS|Artificial Intelligence Engineering — Energy Science, Technology and Policy — Applied Study
💻|MSSM|Software Management`),
  ...group("Master’s", "Engineering", "", `
🧪|MChE|Master of Chemical Engineering
💡|MIIPS|Master of Integrated Innovation for Products and Services
💡|MIIAS|Master of Integrated Innovation for Products and Services — Advanced Study`),
  ...group("Master’s", "Fine Arts", "", `
🏛️|MAAD|Master of Advanced Architectural Design
🏛️|MArch|Master of Architecture
🏗️|MSAECM|Master of Science in Architecture–Engineering–Construction Management
🏢|MSBPD|Master of Science in Building Performance and Diagnostics
💻|MSCD|Master of Science in Computational Design
🌱|MSRSD|Master of Science in Regenerative and Sustainable Design
🏙️|MUD|Master of Urban Design
🎨|MFAArt|Master of Fine Arts in Art
✏️|MADes|Master of Arts in Design
🖱️|MDes|Master of Design in Design for Interactions
🖱️|MPS|Master of Professional Studies in Design for Interactions
🎻|MMIP|Master of Music in Instrumental Performance
🎹|MMPP|Master of Music in Piano Performance
🎤|MMVP|Master of Music in Vocal Performance
🎼|MMComp|Master of Music in Composition
🎹|MMCP|Master of Music in Collaborative Piano
📚|MMME|Master of Music in Music Education
🎧|MSMT|Master of Science in Music and Technology`),
  ...group("Master’s", "Fine Arts — Drama", "Master of Fine Arts", `
👗|MFACD|Costume Design
🧵|MFACP|Costume Production
🎬|MFADir|Directing
✍️|MFADW|Dramatic Writing
💡|MFALD|Lighting Design
🎭|MFAScD|Scenic Design
🔊|MFASoD|Sound Design
🎭|MFASPM|Stage and Production Management
🛠️|MFATD|Technical Direction
📽️|MFAVMD|Video and Media Design`),
  ...group("Master’s", "Dietrich", "Master of Arts", `
📚|MALCS|Literary and Cultural Studies
📝|MAPW|Professional Writing
🗣️|MARhet|Rhetoric
🌍|MAALSLA|Applied Linguistics and Second Language Acquisition
🌍|MAALSLA-AS|Applied Linguistics and Second Language Acquisition — Advanced Study
🗣️|MAGCAT|Global Communication and Applied Translation
💭|MAPhil|Philosophy`),
  ...group("Master’s", "Dietrich", "Master of Science", `
🛡️|MITS|Information Technology Strategy
🌐|MSSTAIR|Security, Technology and International Relations
🌐|MSSTAIR-AMP|Security, Technology and International Relations — Accelerated
🧠|MiNT-R|Neural Technologies — Research
🧠|MiNT-AS|Neural Technologies — Applied Study
🧠|MiNT-A|Neural Technologies — Accelerated
🧩|MSLCM|Logic, Computation and Methodology
📊|MSADS|Applied Data Science`),
  ...group("Master’s", "Mellon College of Science", "Master of Science", `
🧬|MSQBB|Quantitative Biology and Bioinformatics
📊|MSDAS|Data Analytics for Science
🧪|MSChem|Chemistry
🔢|MSMath|Mathematical Sciences
🧩|MSACO|Algorithms, Combinatorics and Optimization
⚛️|MSPhys|Physics
💹|MSCF|Computational Finance`),
  ...group("Master’s", "Heinz", "", `
💻|MISM|Master of Information Systems Management
🤖|MSAIM|Master of Science in Artificial Intelligence Systems Management
🔒|MSISPM|Master of Science in Information Security Policy and Management
🏛️|MSPPM|Master of Science in Public Policy and Management
🏛️|MPM|Master of Public Management
🩺|MSHCA|Master of Science in Health Care Analytics and Information Technology
🩺|MMM|Master of Medical Management
🎨|MAM|Master of Arts Management
🎬|MEIM|Master of Entertainment Industry Management`),
  ...group("Master’s", "Tepper", "", `
💼|MBA|Master of Business Administration
📊|MSBA|Master of Science in Business Analytics
💼|MSM|Master of Science in Management`),
  ...group("Master’s", "Entertainment Technology Center", "", `
🎮|MET|Master of Entertainment Technology`),
  ...group("Doctoral", "Engineering", "Doctor of Philosophy", `
🩺|PhD-BME|Biomedical Engineering
🧪|PhD-ChE|Chemical Engineering
🏗️|PhD-CEE|Civil and Environmental Engineering
⚡|PhD-ECE|Electrical and Computer Engineering
⚖️|PhD-EPP|Engineering and Public Policy
🔩|PhD-MSE|Materials Science and Engineering
⚙️|PhD-ME|Mechanical Engineering`),
  ...group("Doctoral", "Engineering", "", `
⚙️|EDTP|Executive Doctorate of Technology Practice`),
  ...group("Doctoral", "Computer Science", "Doctor of Philosophy", `
💻|PhD-CS|Computer Science
🧩|PhD-ACO|Algorithms, Combinatorics and Optimization
🖱️|PhD-HCI|Human-Computer Interaction
🗣️|PhD-LTI|Language and Information Technologies
🤖|PhD-ML|Machine Learning
⚖️|PhD-MLPP|Machine Learning and Public Policy
🧠|PhD-NCML|Neural Computation and Machine Learning
📊|PhD-StatML|Statistics and Machine Learning
🎯|PhD-AHDM|Autonomous and Human Decision Making
🧬|PhD-CB|Computational Biology
🦾|PhD-R|Robotics
🌐|PhD-SC|Societal Computing
💻|PhD-SE|Software Engineering
⚖️|PhD-SCEPP|Societal Computing and Engineering and Public Policy`),
  ...group("Doctoral", "Fine Arts", "Doctor of Philosophy", `
🏛️|PhD-Arch|Architecture
🏗️|PhD-AECM|Architecture–Engineering–Construction Management
🏢|PhD-BPD|Building Performance and Diagnostics
💻|PhD-CD|Computational Design
🌱|PhD-TD|Transition Design`),
  ...group("Doctoral", "Fine Arts", "", `
✏️|DDes|Doctor of Design`),
  ...group("Doctoral", "Dietrich", "Doctor of Philosophy", `
💻|PhD-CCS|Computational Cultural Studies
📚|PhD-LCS|Literary and Cultural Studies
🗣️|PhD-Rhet|Rhetoric
🏺|PhD-Hist|History
🌍|PhD-ALSLA|Applied Linguistics and Second Language Acquisition
🧠|PhD-NC|Neural Computation
🧠|PhD-SN|Systems Neuroscience
💭|PhD-Phil|Philosophy
🧩|PhD-LCM|Logic, Computation and Methodology
🧩|PhD-PAL|Pure and Applied Logic
🧠|PhD-Psych|Psychology
🧠|PhD-CN|Cognitive Neuroscience
🎯|PhD-PBDR|Psychology and Behavioral Decision Research
🎯|PhD-BDR|Behavioral Decision Research
🧠|PhD-CDS|Cognitive Decision Science
🌐|PhD-SDS|Social and Decision Sciences
📈|PhD-BE|Behavioral Economics
📊|PhD-Stat|Statistics
⚖️|PhD-StatEPP|Statistics and Engineering and Public Policy
🧠|PhD-StatNC|Statistics and Neural Computation
🏛️|PhD-StatPP|Statistics and Public Policy
📈|PhD-EconPP|Economics and Public Policy`),
  ...group("Doctoral", "Mellon College of Science", "Doctor of Philosophy", `
🧬|PhD-Bio|Biological Sciences
🧪|PhD-Chem|Chemistry
🔢|PhD-Math|Mathematical Sciences
⚛️|PhD-Phys|Physics
🌌|PhD-AA|Astronomy and Astrophysics
🧬|PhD-MBSB|Molecular Biophysics and Structural Biology`),
  ...group("Doctoral", "Heinz", "Doctor of Philosophy", `
💻|PhD-ISM|Information Systems and Management
🏛️|PhD-PPM|Public Policy and Management`),
  ...group("Doctoral", "Tepper", "Doctor of Philosophy", `
🧾|PhD-Acc|Accounting
💻|PhD-BT|Business Technologies
📈|PhD-Econ|Economics
💹|PhD-FE|Financial Economics
📣|PhD-Mkt|Marketing
⚙️|PhD-OM|Operations Management
🧮|PhD-OR|Operations Research
🤝|PhD-OBT|Organizational Behavior and Theory
💡|PhD-SETC|Strategy, Entrepreneurship and Technological Change`),
  ...group("Doctoral", "Intercollege / Pitt Joint", "", `
🩺|MD-PhD|Medical Scientist Training Program (Joint MD–PhD)
🩺|MD-PhD-BME|Biomedical Engineering (Joint MD–PhD)`),
];

export function programLabel(program: CmuProgram): string {
  return `${program.emoji} ${program.acronym} [${program.name}]`;
}

export function searchPrograms(query: string): CmuProgram[] {
  const tokens = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  return CMU_PROGRAMS.filter((program) => {
    const text = `${program.acronym} ${program.name} ${program.school} ${program.level}`.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    return tokens.every((token) => text.includes(token));
  });
}
