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
        title: 'AWS Builders Lab',
        description:
          'A hands-on workshop covering AWS Cloud fundamentals, core services like IAM, EC2 and S3, along with AI/ML tools such as SageMaker Canvas and Amazon Bedrock.\n\nParticipants will explore Generative AI, MLOps workflows, model deployment and cloud cost management through practical sessions.',
        dates: '21 – 22 Sept 2026',
        venue: 'B-311 & B-312',
        eventId: 'aiml-workshop',
        eventTitle: 'AI & ML Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda, prerequisites, and learning outcomes will be announced closer to the event date. Stay tuned for updates on topics, speakers, and required materials.',
      },
      {
        type: 'Signature Event',
        title: 'The PartyRock Hack',
        description:
          'A three-round AI innovation competition that tests participants’ knowledge, creativity and application-building skills. \n\n Round 1 – Cloud Blitz: AWS, cloud computing and dataset-based quiz to test participants’ technical knowledge.\n Round 2 – BuildForge: Dataset summarisation and AI application development using AWS PartyRock.\n Round 3 – Campus Innovator: Development and presentation of a campus-focused AI solution, followed by expert evaluation.',
        dates: '23 Sept 2026',
        venue: 'A-001',
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
    dates: '5 – 7 October 2026',
    displayDates: '5–7 Oct',
    logoSrc: '/assets/aids-sbg-logo.svg',
    description:
      'Dive into data science, analytics, and AI-driven insights through hands-on workshops and a signature department event.',
    metaTitle: "AI & DS — Week 02 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & DS department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 28 Sept – 1 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Franchise Forge Labs',
        description:
          'A hands-on workshop introducing participants to Amazon Bedrock, AI-assisted creativity, prompt engineering, and Amazon S3 through a practical studio-building workflow. \n\nParticipants learn how to use AI tools to develop, organize, and prepare creative assets for the franchise they are creating.',
        dates: '5 – 6 Oct 2026',
        venue: 'B-218 & B-219',
        eventId: 'aids-workshop',
        eventTitle: 'AI & DS Workshop',
        isTeam: false,
        isInterCollege: false,
        accordionContent:
          'Detailed workshop agenda, prerequisites, and learning outcomes will be announced closer to the event date.',
      },
      {
        type: 'Signature Event',
        title: 'Franchise Forge: The Studio Challenge',
        description:
          'a team-based AI and creativity competition where participants build an original entertainment franchise through \n\n Round 1: Greenlight \n Round 2: Character & Visual Forge \n Round 3: Marketing & Adaptation, followed by a Final Pitch.',
        dates: '7 Oct 2026',
        venue: 'A-001 ',
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
    dates: '5 – 8 October 2026',
    displayDates: '5–8 Oct',
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
        dates: '8 Oct 2026',
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
    dates: '22 – 24 October 2026',
    displayDates: '22–24 Oct',
    logoSrc: '/assets/ise-sbg-logo.svg',
    description:
      'Information systems, web technologies, and digital innovation — through workshops and a department signature event.',
    metaTitle: "ISE — Week 04 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ISE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 12–16 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'The RAG Builder Session',
        description:
          'The workshop will provide a hands-on introduction to Amazon Bedrock and Knowledge Bases, covering how to create and use a RAG-based AI assistant. \n\n Participants will learn to connect documents, retrieve relevant information, and build their own Knowledge Base.',
        dates: '22 Oct 2026',
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
        title: 'Beyond Search : The Intelligence Challenge',
        description:
          'Beyond Search: The Intelligence Challenge is a two-round competition featuring \n\n Round 1: Rapid Retrieval Challenge and \n Round 2: AWS Solution Architect Challenge, where participants use RAG and AWS knowledge to solve real-world problems.',
        dates: '24 Oct 2026',
        venue: 'A-001',
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
    dates: '22 – 29 October 2026',
    displayDates: '22–29 Oct',
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
        dates: '22 – 23 Oct 2026',
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
        dates: '29 Oct 2026',
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
    dates: '2 – 5 November 2026',
    displayDates: '2–5 Nov',
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
        dates: '5 Nov 2026',
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
