// Mega-event data — extracted from all 3 event HTML files.
// Each object drives EventPage via useParams :eventId

export const events = {
  'treasure-hunt': {
    id: 'treasure-hunt',
    title: 'Treasure Hunt',
    cssVar: 'var(--mega-accent)',
    badge: 'Mega Event',
    dates: '26 September 2026',
    description:
      'Cross-campus challenge blending logic, speed, and technology. Solve riddles, complete challenges, and scan QR codes to reach the final treasure.',
    metaTitle: "Treasure Hunt | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "Treasure Hunt mega event at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Cross-campus logic and tech challenge.",
    // Registration flags
    registrationEventId: 'treasure-hunt',
    registrationTitle: 'Treasure Hunt',
    isTeam: true,
    isInterCollege: false,
    // Detail card meta items
    metaItems: [
      { icon: 'calendar', text: '25 September 2026, 2:00 PM \u2014 5:00 PM' },
      { icon: 'location', text: 'Starting Point: DBIT Main Seminar Hall' },
      { icon: 'people', text: 'Teams of 2\u20133 members' },
    ],
    // Content sections inside the detail card
    sections: [
      {
        heading: 'About the Hunt',
        type: 'paragraph',
        text: 'Get ready for the ultimate race across the DBIT campus! The HexaVerse Treasure Hunt combines cryptographic puzzles, riddle-solving, and physical navigation. Teams will receive their starting clue at the Seminar Hall, leading them to various checkpoints scattered throughout the campus buildings. At each checkpoint, a challenge must be completed to unlock the QR code representing the next clue.',
      },
      {
        heading: 'Rules \u0026 Format',
        type: 'list',
        items: [
          'Each team must consist of 2 to 3 members.',
          'At least one smartphone with active internet connection and a working camera (for scanning QR codes) is required per team.',
          'Any form of damage to campus property or disruption of classes will result in immediate disqualification.',
          'Decisions of the volunteers and coordinators at checkpoints are final.',
          'The first team to scan the final QR code and present the solution at the control desk wins the grand prize.',
        ],
      },
      {
        heading: 'Eligibility',
        type: 'paragraph',
        text: 'Open to all undergraduate students of Don Bosco Institute of Technology across all departments and academic years. Cross-departmental team formulation is highly encouraged!',
      },
    ],
  },

  'mega-event-3': {
    id: 'mega-event-3',
    title: 'Mega Event 3',
    cssVar: 'var(--mega-accent)',
    badge: 'Mega Event',
    dates: 'TBD',
    description:
      'Keynote address and interactive session featuring prominent cloud architects and tech innovators. Expand your network and domain knowledge.',
    metaTitle: "Technical Talk | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "Technical Talk mega event at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Keynote session with industry leaders.",
    registrationEventId: 'technical-talk',
    registrationTitle: 'Technical Talk',
    isTeam: false,
    isInterCollege: false,
    metaItems: [
      { icon: 'calendar', text: '9 October 2026, 11:00 AM \u2014 1:00 PM' },
      { icon: 'location', text: 'Location: DBIT Auditorium' },
      { icon: 'people', text: 'Individual Registration' },
    ],
    sections: [
      {
        heading: 'About the Session',
        type: 'paragraph',
        text: 'As part of the HexaVerse series, this technical talk is designed to connect students with the realities of modern software engineering. We host industry leaders to talk about scalable cloud architectures, AI systems integration, and what companies expect from next-generation tech graduates. Learn about the transition from academic programming to production-level systems design.',
      },
      {
        heading: 'Format \u0026 Certification',
        type: 'list',
        items: [
          'Interactive presentation: 60 minutes.',
          'Live Q&A session: 30 minutes. Students can ask questions directly to the speaker.',
          'Registration is mandatory. Attendance will be recorded via QR codes scanned at the venue entrance.',
          'E-certificates will be issued to all registered attendees.',
        ],
      },
      {
        heading: 'Eligibility',
        type: 'paragraph',
        text: 'Open to all students of DBIT across all engineering disciplines, computer application courses, and semesters. Faculty members and researchers are also welcome to attend.',
      },
    ],
  },

  hackathon: {
    id: 'hackathon',
    title: 'Hackathon',
    cssVar: 'var(--mega-accent)',
    badge: 'Mega Event',
    dates: '30 \u2013 31 October 2026',
    description:
      'Build. Ship. Pitch. A flagship 24-hour coding marathon to design solutions for real-world problems. Open to participants across multiple colleges.',
    metaTitle: "Hackathon | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "Hackathon mega event at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Flagship 24-hour inter-college programming marathon.",
    registrationEventId: 'hackathon',
    registrationTitle: 'Hackathon',
    isTeam: true,
    isInterCollege: true,
    metaItems: [
      {
        icon: 'calendar',
        text: 'Starts: 30 Oct, 9:00 AM \u2014 Closes: 31 Oct, 1:00 PM (24 Hours Active Coding)',
      },
      { icon: 'location', text: 'Location: DBIT IT Lab Block' },
      { icon: 'people', text: 'Teams of 2\u20134 members (Inter-College allowed)' },
    ],
    sections: [
      {
        heading: 'About the Hackathon',
        type: 'paragraph',
        text: 'The HexaVerse Hackathon is our flagship coding event. Teams are challenged to prototype a working application addressing one of our major themes: Cloud Infrastructure, Sustainability, FinTech, or AI-Driven Automation. Throughout the 24 hours, experienced mentors will be available to help refine ideas and resolve technical issues.',
      },
      {
        heading: 'Rules \u0026 Submission Guidelines',
        type: 'list',
        items: [
          'All development must take place within the 24-hour hackathon window. Using pre-existing projects is strictly prohibited.',
          'Open-source libraries, frameworks, and APIs are permitted, provided they are declared in the final submission.',
          'Final submissions must include a link to a public repository (GitHub/GitLab) and a brief 3-minute video demo or live pitch to the jury.',
          'Evaluation criteria: Innovation (25%), Implementation (30%), Design/User Experience (20%), and Pitch/Feasibility (25%).',
        ],
      },
      {
        heading: 'Eligibility \u0026 Registration',
        type: 'paragraph',
        strongPrefix: '\uD83C\uDF10 Inter-College Event:',
        text: 'Open to all undergraduate engineering, computing, and IT students from any recognized institution. Inter-college teams (members from different colleges) are fully eligible and encouraged to register.',
      },
    ],
  },
};
