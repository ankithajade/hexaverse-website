import { departments } from './departments';
import { events as megaEvents } from './events';

/**
 * Unified registration events lookup source.
 * Keyed by eventId (e.g. 'aiml-workshop', 'treasure-hunt', 'hackathon').
 * Directly callable on page load / browser refresh.
 */

const DEFAULT_WORKSHOP_RULES = [
  'Open to all enrolled DBIT students of the respective department and semester.',
  'Attendance on both workshop days is mandatory to receive the digital certificate of participation.',
  'Participants must bring their own laptops with required software pre-installed (instructions sent via email prior to day 1).',
  'Seats are reserved on a first-come, first-served basis upon registration completion.',
];

const DEFAULT_SIGNATURE_RULES = [
  'Participants must register with their official college USN and mobile phone number.',
  'Team size limits must be strictly adhered to as specified for each department signature event.',
  'Registration fee is ₹50 per head, payable during the online checkout flow.',
  'Decisions made by the event coordinators and faculty judges are final and binding.',
];

export const registrationEvents = {};

// 1. Map all department events
Object.values(departments).forEach((dept) => {
  dept.events.forEach((ev) => {
    const isWorkshop = ev.eventId.endsWith('-workshop');
    registrationEvents[ev.eventId] = {
      eventId: ev.eventId,
      eventTitle: ev.eventTitle || ev.title,
      isTeam: !!ev.isTeam,
      isInterCollege: !!ev.isInterCollege,
      teamMin: ev.teamMin || (ev.isTeam ? 2 : 1),
      teamMax: ev.teamMax || (ev.isTeam ? 4 : 1),
      fee: ev.fee || (isWorkshop ? 0 : 50),
      lockedDepartment: { id: dept.id, name: dept.name },
      registrationRules: ev.registrationRules || (isWorkshop ? DEFAULT_WORKSHOP_RULES : DEFAULT_SIGNATURE_RULES),
      dates: ev.dates,
      venue: ev.venue,
      description: ev.description,
    };
  });
});

// 2. Map all mega events
Object.values(megaEvents).forEach((ev) => {
  const eventId = ev.registrationEventId || ev.id;
  let rules = DEFAULT_SIGNATURE_RULES;
  if (eventId === 'treasure-hunt') {
    rules = [
      'Teams must consist of 2 to 3 members from any department.',
      'Registration fee is ₹80 per head, payable during the online checkout flow.',
      'At least one smartphone with active internet and working camera is required per team.',
      'Any disruption of campus activities or damage to college property results in instant disqualification.',
      'The first team to scan the final checkpoint QR code and submit the answer at the control desk wins.',
    ];
  } else if (eventId === 'hackathon') {
    rules = [
      'Teams can consist of 2 to 4 members. Inter-college and cross-department teams are allowed.',
      'Registration fee is ₹50 per head, payable during online checkout.',
      'All code must be written during the 24-hour hackathon duration; pre-built projects are disqualified.',
      'Laptops, chargers, and hardware kits must be brought by the participants.',
    ];
  } else if (eventId === 'technical-talk') {
    rules = [
      'Open to all DBIT students and external college attendees.',
      'Individual registration, free of cost.',
      'Please arrive at the venue 15 minutes prior to the scheduled keynote time.',
    ];
  }

  registrationEvents[eventId] = {
    eventId,
    eventTitle: ev.registrationTitle || ev.title,
    isTeam: !!ev.isTeam,
    isInterCollege: !!ev.isInterCollege,
    teamMin: ev.id === 'treasure-hunt' ? 2 : 2,
    teamMax: ev.id === 'treasure-hunt' ? 3 : 4,
    fee: ev.id === 'treasure-hunt' ? 80 : (ev.id === 'technical-talk' ? 0 : 50),
    lockedDepartment: null, // Free choice dropdown for mega events
    registrationRules: ev.registrationRules || rules,
    dates: ev.dates,
    description: ev.description,
  };
});
