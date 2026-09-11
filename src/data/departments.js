// Department data — extracted from all 6 department HTML files
// Each object drives DepartmentPage via useParams :deptId

export const departments = {
  aiml: {
    id: 'aiml',
    name: 'AI & ML',
    fullName: 'Department of AI & ML, DBIT',
    cssVar: 'var(--aiml)',
    week: 'Week 01',
    badge: 'Week 01 · Department of AI & ML, DBIT',
    dates: '21 – 23 September 2026',
    displayDates: '21–23 Sept',
    logoSrc: '/assets/aiml-sbg-logo.svg',
    description:
      'Explore the frontiers of artificial intelligence and machine learning through hands-on workshops and a signature department event.',
    metaTitle: "AI & ML — Week 01 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & ML department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 21–24 Sept 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A hands-on workshop covering AWS Cloud fundamentals, core services like IAM, EC2 and S3, along with AI/ML tools such as SageMaker Canvas and Amazon Bedrock. Participants will explore Generative AI, MLOps workflows, model deployment and cloud cost management through practical sessions.',
        dates: '21 – 22 Sept 2026',
        venue: 'Venue TBD',
        eventId: 'aiml-workshop',
        eventTitle: 'AI & ML Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda, prerequisites, and learning outcomes will be announced closer to the event date. Stay tuned for updates on topics, speakers, and required materials.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A three-round AI innovation competition that tests \n participants’ knowledge, creativity and application-building skills.',
        dates: '23 Sept 2026',
        venue: 'Venue TBD',
        eventId: 'aiml-event',
        eventTitle: 'AI & ML Signature Event',
        isTeam: true,
        teamMin: 1,
        teamMax: 2,
        fee: 50,
        isInterCollege: false,
        accordionContent:
          'Event format, rules, and prizes will be announced soon. Check back for the full event brief and registration details.',
      },
    ],
  },

  aids: {
    id: 'aids',
    name: 'AI & DS',
    fullName: 'Department of AI & DS, DBIT',
    cssVar: 'var(--aids)',
    week: 'Week 02',
    badge: 'Week 02 · Department of AI & DS, DBIT',
    dates: '28 – 30 September 2026',
    displayDates: '28–30 Sept',
    logoSrc: '/assets/aids-sbg-logo.svg',
    description:
      'Dive into data science, analytics, and AI-driven insights through hands-on workshops and a signature department event.',
    metaTitle: "AI & DS — Week 02 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & DS department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 28 Sept – 1 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A 2-day hands-on workshop exploring key concepts and practical applications in AI & Data Science.',
        dates: '28 – 29 Sept 2026',
        venue: 'Venue TBD',
        eventId: 'aids-workshop',
        eventTitle: 'AI & DS Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda, prerequisites, and learning outcomes will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A department-curated competition or activity showcasing the best of AI & Data Science.',
        dates: '30 Sept 2026',
        venue: 'Venue TBD',
        eventId: 'aids-event',
        eventTitle: 'AI & DS Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 50,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },

  cse: {
    id: 'cse',
    name: 'CSE',
    fullName: 'Department of CSE, DBIT',
    cssVar: 'var(--cse)',
    week: 'Week 03',
    badge: 'Week 03 · Department of CSE, DBIT',
    dates: '5 – 7 October 2026',
    displayDates: '5–7 Oct',
    logoSrc: '/assets/cse-sbg-logo.svg',
    description:
      'Core computing, software engineering, and systems design — through workshops and a department signature event.',
    metaTitle: "CSE — Week 03 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "CSE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 5–8 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A 2-day hands-on workshop exploring key concepts and practical applications in computer science and engineering.',
        dates: '5 – 6 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'cse-workshop',
        eventTitle: 'CSE Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A department-curated competition showcasing the best of computer science and engineering.',
        dates: '7 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'cse-event',
        eventTitle: 'CSE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 50,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },

  ise: {
    id: 'ise',
    name: 'ISE',
    fullName: 'Department of ISE, DBIT',
    cssVar: 'var(--ise)',
    week: 'Week 04',
    badge: 'Week 04 · Department of ISE, DBIT',
    dates: '12 – 14 October 2026',
    displayDates: '12–14 Oct',
    logoSrc: '/assets/ise-sbg-logo.svg',
    description:
      'Information systems, web technologies, and digital innovation — through workshops and a department signature event.',
    metaTitle: "ISE — Week 04 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ISE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 12–16 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A 2-day hands-on workshop exploring key concepts in information science and engineering.',
        dates: '12 – 13 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'ise-workshop',
        eventTitle: 'ISE Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A department-curated competition showcasing the best of information science and engineering.',
        dates: '14 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'ise-event',
        eventTitle: 'ISE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 50,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },

  ece: {
    id: 'ece',
    name: 'ECE',
    fullName: 'Department of ECE, DBIT',
    cssVar: 'var(--ece)',
    week: 'Week 05',
    badge: 'Week 05 · Department of ECE, DBIT',
    dates: '26 – 28 October 2026',
    displayDates: '26–28 Oct',
    logoSrc: '/assets/ece-sbg-logo.svg',
    description:
      'Electronics, communication systems, and embedded systems — through workshops and a department signature event.',
    metaTitle: "ECE — Week 05 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ECE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 26–29 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A 2-day hands-on workshop exploring key concepts and practical applications in electronics and communications engineering.',
        dates: '26 – 27 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'ece-workshop',
        eventTitle: 'ECE Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A department-curated competition showcasing the best of electronics and communications engineering.',
        dates: '28 Oct 2026',
        venue: 'Venue TBD',
        eventId: 'ece-event',
        eventTitle: 'ECE Signature Event',
        isTeam: true,
        teamMin: 3,
        teamMax: 4,
        fee: 50,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },

  eee: {
    id: 'eee',
    name: 'EEE',
    fullName: 'Department of EEE, DBIT',
    cssVar: 'var(--eee)',
    week: 'Week 06',
    badge: 'Week 06 · Department of EEE, DBIT',
    dates: '2 – 4 November 2026',
    displayDates: '2–4 Nov',
    logoSrc: '/assets/eee-sbg-logo.svg',
    description:
      'Electrical engineering, power electronics, and energy innovations — through workshops and a department signature event.',
    metaTitle: "EEE — Week 06 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "EEE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 2–5 Nov 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'A 2-day hands-on workshop exploring key concepts and practical applications in electrical and electronics engineering.',
        dates: '2 – 3 Nov 2026',
        venue: 'Venue TBD',
        eventId: 'eee-workshop',
        eventTitle: 'EEE Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Dept. Signature Event TBD',
        description:
          'A department-curated competition showcasing the best of electrical and electronics engineering.',
        dates: '4 Nov 2026',
        venue: 'Venue TBD',
        eventId: 'eee-event',
        eventTitle: 'EEE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 4,
        fee: 50,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },
};

// Ordered list for grids and timelines
export const departmentsList = ['aiml', 'aids', 'cse', 'ise', 'ece', 'eee'];
