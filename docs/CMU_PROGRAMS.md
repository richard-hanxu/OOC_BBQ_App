# CMU program picker sources

Compiled September 27, 2026. Data: `src/lib/cmu-programs.ts`.

The picker covers bachelor's degrees, additional majors, master's programs and doctoral fields across CMU's schools, including interdisciplinary programs. It is a profile directory, not an admissions eligibility list. Some programs are milestone degrees or have restricted admissions. Scalable/Embedded Software Engineering names are retained for currently enrolled students even though incoming programs are changing.

Labels use `emoji ACRONYM [Full degree / major name]`. Where CMU has no unambiguous short code, the acronym is a readable UI abbreviation, not an assertion of an official credential code. Emoji are our presentation choices. Joint programs are generally listed once; equivalent campus, online, part-time and accelerated delivery formats are not duplicated unless they have separately named degrees. Concentrations, instruments, certificates, minors, and every possible dual-degree combination are not separate majors. The custom-entry option accommodates older programs, combinations, concentration names and omissions; existing free-text profiles are preserved.

## Official sources

- [2026–2027 undergraduate degrees and majors](https://coursecatalog.web.cmu.edu/degreesoffered/): undergraduate programs across Engineering, CFA, Dietrich, MCS, SCS, Tepper and BXA.
- [SCS master's programs](https://www.cs.cmu.edu/education/masters/) and [doctoral programs](https://www.cs.cmu.edu/education/phd/).
- [Software Engineering FAQ](https://mse.s3d.cmu.edu/applicants/faq.html) and [current-student plans](https://mse.s3d.cmu.edu/current-students/plans-of-study-2025-2027.html).
- [Privacy Engineering and AI Governance](https://privacy.cs.cmu.edu/masters/): renamed degrees announced September 2026.
- [Engineering graduate admissions directory](https://engineering.cmu.edu/education/graduate-studies/admissions/index.html) and [multidisciplinary degrees](https://engineering.cmu.edu/education/graduate-studies/multidisciplinary-programs.html).
- [Biomedical Engineering](https://engineering.cmu.edu/education/graduate-studies/programs/bme.html), [Chemical Engineering](https://www.cheme.engineering.cmu.edu/education/graduate-programs/masters/index.html), [Civil and Environmental Engineering](https://engineering.cmu.edu/education/graduate-studies/programs/cee.html), [ECE](https://www.ece.cmu.edu/academics/ms-ece/requirements.html), [Engineering and Public Policy](https://epp.engineering.cmu.edu/education/graduate/masters-programs/index.html), [Materials](https://www.materials.cmu.edu/education/graduate/masters-programs/index.html), [Mechanical Engineering](https://engineering.cmu.edu/education/departments/meche.html).
- [AI Engineering specialties](https://engineering.cmu.edu/education/graduate-studies/programs/ms-aie.html), [INI](https://www.cmu.edu/ini/academics/index.html), [Integrated Innovation](https://www.cmu.edu/iii/graduate-programs/index.html), [Energy Science, Technology and Policy](https://engineering.cmu.edu/estp/degree-programs/index.html), [Executive Doctorate of Technology Practice](https://engineering.cmu.edu/edtp/index.html).
- [Architecture graduate programs](https://www.architecture.cmu.edu/programs/graduate-programs), [Fine Arts directory](https://cfa.cmu.edu/schools-and-academic-programs/majors-and-minors), [Design](https://design.cmu.edu/about-our-programs), [Drama](https://drama.cmu.edu/academics/graduate-programs/), [Music](https://www.cmu.edu/cfa/music/programs/graduate-programs/).
- [Dietrich departmental degree lists](https://www.cmu.edu/dietrich/).
- [MCS graduate programs](https://www.cmu.edu/mcs/academics/grad), [Biological Sciences](https://www.cmu.edu/bio/graduate/), [Mathematical Sciences master's degrees](https://www.cmu.edu/math/grad/master/), [Physics](https://www.cmu.edu/physics/graduate-program/), [Chemistry](https://www.cmu.edu/chemistry/).
- [Heinz master's degrees](https://www.heinz.cmu.edu/programs/) and [doctorates](https://www.heinz.cmu.edu/programs/phd-programs/).
- [Tepper programs](https://www.cmu.edu/tepper/programs/) and [doctoral fields](https://www.cmu.edu/tepper/programs/phd/).
- [Entertainment Technology Center](https://etc.cmu.edu/academics/curriculum).

## Maintenance

Review these sources when refreshing the catalog. Add one row per named degree/major in the appropriate group, choose a distinct acronym and relevant emoji, and run `npm test`. Tests catch duplicate labels, missing fields, oversized stored values, and search regressions. Avoid silently rewriting guests' saved program labels when names change.
