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
      { icon: 'calendar', text: '26 September 2026, 9:30 AM \u2014 2:00 PM' },
      { icon: 'location', text: 'Starting Point: A-001' },
      { icon: 'people', text: 'Teams of 3 members' },
    ],
    // Content sections inside the detail card
    sections: [
      {
        heading: 'About the Hunt',
        type: 'paragraph',
        text: `
        Get ready for **The Convergence**, a campus-wide treasure hunt that puts your problem-solving, teamwork, observation, and speed to the test. Teams begin at the designated starting point, where the first clue and its corresponding code entry are revealed. Each clue leads to the next location, where teams must find the designated sticker and complete the challenge associated with that checkpoint. At every checkpoint, participants must enter the correct code to record their progress and unlock the information needed to continue the hunt. Follow the trail, crack the challenges, and stay ahead of the other teams — because every second counts. The hunt continues through multiple checkpoints until teams reach the final hand-in, where the completed solution must be submitted.
        `,
      },
      {
        heading: 'Rules \u0026 Format',
        type: 'list',
        items: [
          'Each team must consist of exactly 3 members.',
          'Teams must follow the clues and checkpoints in the designated order.',
          'The correct code must be entered at each stage to record progress and reveal the next part of the hunt.',
          'Teams must complete the required challenge at each checkpoint before proceeding.',
          'Participants must not damage, move, or tamper with campus property or event materials.',
          'Any form of disruption to classes or campus activities may result in disqualification.',
          'Teams must follow the instructions given by volunteers and coordinators at checkpoints.',
          'The first team to successfully complete the final hand-in with the required solution wins the treasure hunt.',
        ],
      },
      {
        heading: 'Eligibility',
        type: 'paragraph',
        text: 'Open to all undergraduate students of Don Bosco Institute of Technology, across departments and academic years. Cross-departmental team formation is encouraged.',
      },
    ],
  },

  'mega-event-3': {
    id: 'mega-event-3',
    title: 'Mega Event 3',
    cssVar: 'var(--mega-accent)',
    badge: 'Mega Event',
    dates: 'Coming Soon',
    description:
      'Stay tuned! Details for Mega Event 3 will be announced soon.',
    metaTitle: "Mega Event 3 | DBIT HexaVerse CloudFest '26",
    metaDesc:
      "Mega Event 3 at HexaVerse CloudFest '26, Don Bosco Institute of Technology (DBIT). Coming Soon.",
    registrationEventId: null,
    registrationTitle: 'Mega Event 3',
    isTeam: false,
    isInterCollege: false,
    metaItems: [
      { icon: 'calendar', text: 'Date: To Be Announced' },
      { icon: 'location', text: 'Location: Coming Soon' },
      { icon: 'people', text: 'Coming Soon' },
    ],
    sections: [
      {
        heading: 'About Mega Event 3',
        type: 'paragraph',
        text: 'Details for Mega Event 3 are currently under wraps and will be revealed soon. Stay tuned for announcements!',
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
    registrationEventId: null,
    registrationTitle: 'Hackathon',
    isTeam: true,
    isInterCollege: false,
    metaItems: [
      {
        icon: 'calendar',
        text: 'Starts: 30 Oct, 9:00 AM \u2014 Closes: 31 Oct, 1:00 PM (24 Hours Active Coding)',
      },
      { icon: 'location', text: 'Location: DBIT IT Lab Block' },
      { icon: 'people', text: 'Teams of 2\u20134 members' },
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
        heading: 'Eligibility',
        type: 'paragraph',
        text: 'Open to all undergraduate engineering, computing, and IT students. Cross-department teams are fully eligible and encouraged to participate.',
      },
    ],
  },
};
