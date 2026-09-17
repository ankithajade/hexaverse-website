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
    heroImage: '/cubes/aiml-cube.png',
    description:
      'Step into AIML Week for a practical journey across artificial intelligence, machine learning, and cloud technologies. Explore AWS services, work with real datasets, build and deploy machine learning models, and experiment with modern AI tools. The week also brings a competitive edge through a multi-round challenge where technical knowledge meets creativity, problem-solving, and application building.',
    metaTitle: "AI & ML — Week 01 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & ML department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 21–24 Sept 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'AWS Builders Lab',
        description: `
        AWS Builders Lab brings cloud computing and machine learning together through guided, hands-on experiences. Participants work directly with AWS services and explore how a machine learning workflow moves from data to a trained, deployed, and testable model.

        The workshop is designed to be approachable for students who are new to AWS while still giving experienced learners plenty to experiment with.

        *Participants can look forward to:*
        - Exploring core AWS services such as **IAM, EC2, and S3**
        - Experimenting with **Amazon Bedrock** and cloud-based AI capabilities
        - Working with **SageMaker Canvas** and real datasets
        - Training and evaluating a **machine learning model**
        - Registering, deploying, and testing a model through a practical workflow
        - Getting a hands-on introduction to **MLOps, monitoring, and cloud resource management**

        &nbsp;

        Rather than stopping at concepts, the workshop lets participants actually work through the technology and see how the pieces connect.
        ***Join us through the link below!***
        `,
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
        title: 'The PartyRock Hack: Building the Future with AI',
        description: `
        **PartyRockHack** is a three-round individual challenge that takes participants from testing their AWS and cloud knowledge to building practical AI-powered applications. Each stage introduces a different kind of problem-solving, making the experience progressively more hands-on.

        Participants will work with **AWS PartyRock** to explore data, experiment with AI-powered applications, and develop a solution to a campus-focused challenge — all while making decisions under time constraints. Solutions will be evaluated on **functionality, usability, innovation, and practical value**, with participants getting the opportunity to showcase both their technical understanding and creativity.

        Whether you're already comfortable with cloud technologies or curious about building with AI tools, PartyRockHack offers a progressive challenge that takes you from **knowledge → experimentation → creation.**

        &nbsp;

        ***Ready to build? Register below for PartyRockHack and put your ideas to the test!***
        `,
        dates: '23 Sept 2026',
        venue: 'A-001',
        eventId: 'aiml-event',
        eventTitle: 'AI & ML Signature Event',
        isTeam: false,
        teamMin: 1,
        teamMax: 1,
        fee: 52,
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
    heroImage: '/cubes/aids-cube.png',
    description:
      'Step into an AI&DS experience that moves from exploring AWS and generative AI to putting those tools into action. Start with Amazon Bedrock, prompt engineering and Amazon S3 through a hands-on preparation workshop, then take those skills into Franchise Forge: The Studio Challenge. Work with a team to create an original franchise, develop its characters and visuals, respond to unexpected changes and pitch your final vision.',
    metaTitle: "AI & DS — Week 02 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "AI & DS department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 5-7 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Franchise Forge Labs',
        description: `
        **Build with AWS. Create with AI. Compete with Creativity.**

        **Franchise Forge** Workshop introduces participants to the AWS workflow they will use during the Studio Challenge. Starting with AWS and cloud fundamentals, the workshop moves into Amazon Bedrock, prompt engineering and Amazon S3 through practical, hands-on activities. Participants learn how to use **Bedrock** to brainstorm and refine creative ideas, then organise their working assets in an **S3 Studio Vault**.

        The focus is on getting participants comfortable with the complete workflow before entering the competition.

        - AWS account and Management Console basics
        - Cloud and AWS fundamentals
        - Amazon Bedrock for creative development
        - Prompt engineering for generating and refining ideas
        - Amazon S3 for organising project assets
        - Bedrock → Create/Refine → S3 → Submission workflow

        &nbsp;

        The workshop is accessible to beginners while giving participants the practical foundation needed for Franchise Forge.
        
        ***Explore AWS, experiment with AI, and build something of your own. Register now!***
        `,
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
        description: `
        **The Studio Challenge** puts teams in the role of entertainment Studios and challenges them to build an original franchise from the ground up. Across three rounds, teams develop their franchise concept, create its characters and visual identity, build a marketing strategy and adapt their work when an unexpected Breaking News scenario changes the situation.

        **Amazon Bedrock** supports brainstorming and refinement, while **Amazon S3** helps teams organise their working assets throughout the challenge. After the **three rounds**, the *Top 5 teams* advance to the final pitch, where they present their complete franchise, explain their creative decisions and respond to judges' questions.

        It brings together cloud tools, creative thinking, teamwork, rapid decision-making and the pressure of adapting an idea when the situation suddenly changes.

        &nbsp;

        ***Put your creativity to the test and turn ideas into something real. Join the challenge!***
        `,
        dates: '7 Oct 2026',
        venue: 'A-001 ',
        eventId: 'aids-event',
        eventTitle: 'AI & DS Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 52,
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
    heroImage: '/cubes/cse-cube.png',
    description:
      'The Computer Science and Engineering week takes you from exploring cloud technologies to applying them in a high-pressure system recovery challenge. Get handson with Amazon Q and commonly used AWS services, test your understanding, and then put those skills into action as your team works through a simulated hacker attack. Solve coding challenges, recover compromised system components, and race against the clock to restore what was lost.',
    metaTitle: "CSE — Week 03 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "CSE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 5–8 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Breaking Bug: The Debugging Masterclass',
        description: `
        Get introduced to the technologies that power the challenge ahead. **THE BREAKING BUG** is a day-long, hands-on experience focused on **Amazon Q and commonly used AWS services**, helping participants understand how these tools can be applied in practical cloud-based scenarios. 
        
        The workshop is designed to take participants from the fundamentals to actively working with the concepts, making it accessible even without prior AWS experience. An interactive end-of-day quiz brings the experience together, giving participants a chance to apply what they have explored while offering a glimpse of what awaits in the signature challenge. 
        
        *What to look forward to:*
        - Explore Amazon Q and its practical applications
        - Get familiar with commonly used AWS services
        - Understand how cloud services can work together in real-world scenarios
        - Apply concepts through hands-on activities
        - Test your understanding through an interactive quiz
        - Build familiarity with the tools and concepts used in the upcoming challenge

        &nbsp;

        No prior knowledge is required — the workshop begins with the fundamentals and builds from there.

        ***Decode the tools. Crack the concepts. Get ready to break the bug. Apply now!***
        `,
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
        description: `
        A system has been compromised. Critical components are down, and your team has to bring them back. 
        
        **THE BREAKING BUG** is a ***three-round***, team-based system recovery challenge built around a simulated hacker attack. Participants must work through **code-based challenges using Amazon Q**, solving problems to progress through the system and gradually recover compromised components such as the dashboard and login pages. 
        
        The challenge brings together **coding, cloud technology, logical problem-solving, and teamwork**, with every decision made under time pressure. Rather than simply answering questions, teams must use their technical understanding to move through a scenario where each solved challenge brings the system closer to recovery. 
        
        With three rounds designed to test both individual thinking and team coordination, **THE BREAKING BUG** turns system recovery into a race against the clock. 
        
        &nbsp;

        ***The system is down. The clock is ticking. Can you bring it back? Register below!***
        `,

        dates: '8 Oct 2026',
        venue: 'A-001',
        eventId: 'cse-event',
        eventTitle: 'CSE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 52,
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
    heroImage: '/cubes/ise-cube.png',
    description:
      'Step into a week where cloud computing meets Generative AI and practical problem solving. Explore AWS fundamentals, build a RAG-based Knowledge Base with Amazon Bedrock, and put your skills to the test in a competitive challenge. From working with S3 and cloud services to designing solutions for real-world scenarios, the week offers a mix of hands-on exploration, technical thinking, teamwork, and competition.',
    metaTitle: "ISE — Week 04 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ISE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 12–16 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'The RAG Builder Session',
        description: `
        Get hands-on with the AWS ecosystem and explore how cloud services can power modern AI applications. The session takes you from the basics of AWS and S3 to **Retrieval-Augmented Generation (RAG)** and **Amazon Bedrock**.

        Participants will work with AWS services directly, connect documents to a Knowledge Base, and see how relevant information can be retrieved and used to generate grounded responses.

        *What to expect:*
        * Get familiar with AWS and its core cloud services
        * Create and work with an Amazon S3 bucket
        * Explore AI, Generative AI, and RAG concepts
        * Work with Amazon Bedrock and Knowledge Bases
        * Build and test a RAG-based Knowledge Base
        * Gain practical experience that prepares you for the department's signature challenge

        &nbsp;

        No advanced prior knowledge is required. Basic familiarity with cloud or AI concepts is helpful but not essential.

        ***Retrieve. Understand. Build. Get hands-on with the technology behind the challenge. Join us below!***
        `,

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
        title: 'Beyond Search: The Intelligence Challenge',
        description: `
        Go beyond simply finding information. **Beyond Search: The Intelligence Challenge** is a **two-round** team challenge that puts participants in situations where the right information is only the starting point. Using **AWS, Amazon Bedrock, and Knowledge Bases,** teams will explore a given scenario, retrieve the information they need, and use it to make meaningful technical decisions.

        The challenge progresses from **knowledge retrieval to cloud architecture**, requiring teams to analyse the problem, connect the right pieces, and develop a practical solution within a limited time. Along the way, participants will have to balance **technical reasoning, teamwork, and decision-making** before presenting and defending their approach to the judges.

        Whether you enjoy solving problems, designing systems, or simply want to see how cloud and AI can be used beyond basic search, **Beyond Search** gives you the opportunity to put your thinking to the test in a challenge where **finding the answer is just the beginning.**

        &nbsp;

        ***Beyond finding answers — can you turn knowledge into the right solution? Register and show us your potential!***
        `,

        dates: '24 Oct 2026',
        venue: 'A-001',
        eventId: 'ise-event',
        eventTitle: 'ISE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 3,
        fee: 52,
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
    heroImage: '/cubes/ece-cube.png',
    description:
      'Get ready for a week built around electronics, intelligent systems, and hands-on problem solving. \nExplore how AI, sensors, communication protocols, embedded systems, and interactive hardware come together to create smarter solutions. Whether you enjoy building circuits, experimenting with technology, or solving challenges under pressure, ECE Week brings you opportunities to learn, build, and compete.',
    metaTitle: "ECE — Week 05 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "ECE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 26–29 Oct 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Edge‑to‑Cloud Workshop',
        description: `
          **Design, Train & Bring Intelligent Systems to Life**
          
          Take your electronics knowledge beyond conventional circuits and explore how ***ML, embedded systems, sensors, gestures, and connected communication*** can come together to create intelligent, interactive solutions.
          
          *What you'll explore:*
          - Train ML models for component and gesture recognition 
          - Build MQTT-based communication between system components 
          - Design and validate virtual circuits 
          - Control circuit behaviour using gesture recognition 
          - Integrate ML, communication, and circuit logic into a working system
          
          &nbsp;

          No long lectures. No passive demonstrations. 
          
          You'll train, build, experiment, test, troubleshoot, and integrate - getting a glimpse of how modern intelligent embedded systems are designed.

          ***Come join us to experiment, build, and turn ideas into working systems!***
          `,
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
        title: 'Wave \'n\' Wire: The Smart System Challenge',
        description: `
          **Build the System. Master the Challenge.**
          
          *What if your team was given a real-world problem and you had to engineer the solution from scratch?*

          Take on a real-world engineering challenge where **electronics, ML, communication, and embedded systems** come together.

          Work in teams to analyse a unique scenario, design your approach, train recognition models, build virtual circuits, establish MQTT communication, and integrate everything into a working system.

          Progress through **four challenging levels**, each with new tasks and constraints. There are no step-by-step solutions - *your team has to think, build, troubleshoot, and make it work.*

          &nbsp;

          ***How far can you take your system? Register now and show your potential!***
          `,
        dates: '29 Oct 2026',
        venue: 'A-001',
        eventId: 'ece-event',
        eventTitle: 'ECE Signature Event',
        isTeam: true,
        teamMin: 3,
        teamMax: 4,
        fee: 52,
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
    heroImage: '/cubes/eee-cube.png',
    description:
      'EEE Week brings together technology, engineering, and competition in an experience designed for curious students. Explore how cloud technologies can connect with engineering applications, get hands-on with practical concepts, and put your skills to the test through a three-round technical challenge. Whether you enjoy building, experimenting, solving problems, or competing under pressure, there’s something here to keep you engaged.',
    metaTitle: "EEE — Week 06 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "EEE department week at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Workshop and signature event from 2–5 Nov 2026.",
    events: [
      {
        type: 'Workshop',
        title: 'Grid2Cloud: From Engineering Problems to Cloud Solutions',
        description: `
        Discover how cloud computing can be applied to real engineering scenarios in your domain through an interactive, beginner-friendly experience. The workshop takes students beyond theory and into practical exploration of AWS services and their role in building connected and scalable solutions.

        *Participants can look forward to:*

        * Exploring the fundamentals of cloud computing and AWS
        * Understanding AWS services such as **IoT Core, SQS, Lambda, S3, SNS, CloudWatch, and EC2**
        * Connecting **cloud concepts** with Electrical and Electronics Engineering applications
        * Working through practical examples and hands-on activities
        * Understanding how different cloud services can work together as a complete solution
        * Designing and exploring a practical **Smart Energy Monitoring System**

        &nbsp;

        No cloud background is required. The workshop is designed to make cloud technology approachable while giving students a chance to experiment, build, and think like engineers.

        The workshop also gives participants a strong foundation for the signature event by introducing them to relevant technologies, concepts, and problem-solving approaches.

        ***Connect engineering with the cloud. Learn, explore, and build smarter solutions. Register now!***
        `,

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
        title: 'FetchNFix: Spot before it Sparks',
        description: `
        **Think fast. Solve smart. Engineer your way through the challenge.**

        The **EEE Signature Event** is a **three-round** team-based technical challenge where participants face a series of engineering problems designed to test how well they can **understand a situation, identify the right approach, and turn their ideas into workable solutions.** Each round introduces a different challenge, pushing teams to apply their technical knowledge while adapting to new constraints and making decisions under time pressure.

        Rather than simply testing what you remember, the challenge focuses on **how you think and respond**. Teams will analyse problems, work through technical challenges, collaborate on solutions, and make strategic choices as they progress through the competition. With every round bringing a new twist, participants will need a **balance of engineering knowledge, creativity, teamwork, and quick thinking** to stay ahead.

        Whether you're someone who enjoys solving technical problems, working with your team, or taking on challenges where there isn't always an obvious answer, **FetchNfix** gives you a chance to put your skills to the test in a competitive and engaging environment.

        &nbsp;

        ***Think you can engineer your way through it? Step up, take the challenge, and see how far your team can go. Register below!***
        `,
        dates: '4 Nov 2026',
        venue: 'A-001',
        eventId: 'eee-event',
        eventTitle: 'EEE Signature Event',
        isTeam: true,
        teamMin: 2,
        teamMax: 4,
        fee: 52,
        isInterCollege: false,
        accordionContent: 'Event format, rules, and prizes will be announced soon.',
      },
    ],
  },
};

// Ordered list for grids and timelines
export const departmentsList = ['aiml', 'aids', 'cse', 'ise', 'ece', 'eee'];
