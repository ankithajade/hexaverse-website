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
      'A week of hands-on workshops, AI challenges, and innovative experiences exploring artificial intelligence and machine learning.',
    metaTitle: "AI & ML — Week 01 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & ML department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 21–24 Sept 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'AWS Builders Lab',
        description:
          'AWS Builders Lab brings cloud computing and machine learning together through hands-on AWS services, model training, deployment, and MLOps.',
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
          'PartyRockHack is a three-round AI challenge that takes participants from testing their AWS and cloud knowledge to building applications with PartyRock and creating innovative solutions for campus life.',
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
      'Step into Franchise Forge, where AI meets imagination and creativity.Build your story, forge your franchise, and survive the spotlight.',
    metaTitle: "AI & DS — Week 02 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & DS department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 28 Sept – 1 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Franchise Forge Labs',
        description:
          'This hands-on workshop introduces participants to Amazon Bedrock, prompt engineering, and AI-assisted creative development, followed by using Amazon S3 to organize and store their project assets. Participants will learn how to turn ideas into structured creative outputs using AI while developing practical skills in prompt design, content generation, AWS workflow, and digital asset management. The workshop prepares participants to confidently build and manage their franchise during the Franchise Forge: The Studio Challenge.',
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
          'Franchise Forge puts every team in charge of a Studio, building an original entertainment franchise from the ground up — concept, cast, visual identity and marketing — using Amazon Bedrock and AWS tools at each stage. ',
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
      'Explore the world of computing and software engineering through hands-on workshops, technical challenges, and innovative experiences.',
    metaTitle: "CSE — Week 03 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "CSE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 5–8 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Breaking Bug: The Debugging Masterclass',
        description:
          'A two-day, hands-on workshop covering Cloud Computing, AWS fundamentals, Git & GitHub, prompt engineering, Amazon Q Developer, debugging, logging, and monitoring — designed to help participants build, debug, and deploy with confidence.',
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
        title: 'The Breaking Bug: The Amazon Q Debugging Challenge',
        description:
          'Breaking Bug immerses every team in a live hacker simulation, where they become engineers racing to stop a cyberattack through debugging challenges, AI-assisted coding missions, and interconnected system recovery stages—testing technical skills, teamwork, accuracy, and speed under pressure.',
        dates: '8 Oct 2026',
        venue: 'A-001',
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
      'Beyond Search: The Intelligence Challenge — an AWS-powered competition that tests knowledge retrieval, RAG, and cloud architecture skills.',
    metaTitle: "ISE — Week 04 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ISE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 12–16 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'The RAG Builder Session',
        description:
          'A hands-on workshop covering AWS fundamentals, S3, Generative AI, RAG, Amazon Bedrock, and Knowledge Bases.',
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
          'A two-round AWS competition featuring Rapid Retrieval and Solution Architecture challenges, where participants retrieve knowledge and design real-world cloud solutions.',
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
      'An engaging platform that brings together engineering, technology, and innovation through hands-on learning, collaboration, and real-world problem solving.',
    metaTitle: "EEE — Week 06 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "EEE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 2–5 Nov 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Workshop Title TBD',
        description:
          'AWS × EEE — From Engineering Problems to Cloud Solutions is a hands-on workshop introducing students to AWS cloud technologies and their applications in electrical and electronics engineering.',
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
        title: 'FetchNFix:Spot before it Sparks',
        description:
          'A high-energy competitive event that brings together enthusiastic minds through three exciting rounds, challenging participants on their technical knowledge, problem-solving skills, creativity, and teamwork. Get ready to learn, compete, and prove your skills!',
        dates: '4 Nov 2026',
        venue: 'A-001',
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
