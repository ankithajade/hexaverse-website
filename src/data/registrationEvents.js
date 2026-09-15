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
  'Participants must bring their own laptops with required software pre-installed (instructions sent prior to day 1).',
  'Seats are reserved on a first-come, first-served basis upon registration completion.',
];

const DEFAULT_SIGNATURE_RULES = [
  'Participants must register with their official college USN and mobile phone number.',
  'Team size limits must be strictly adhered to as specified for each department signature event.',
  'Registration fee is ₹50 per head, payable during the online checkout flow.',
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

// 2. Map mega events with active registrations (only Treasure Hunt)
Object.values(megaEvents).forEach((ev) => {
  if (ev.id !== 'treasure-hunt') return; // Hackathon and Mega Event 3 do not have public registration

  const eventId = ev.registrationEventId || ev.id;
  const rules = [
    'Teams must consist of exactly 3 members from any department.',
    'Registration fee is ₹80 per head (₹240 total per team), payable during the online checkout flow.',
    'At least one smartphone with active internet and working camera is required per team.',
    'Any disruption of campus activities or damage to college property results in instant disqualification.',
  ];

  registrationEvents[eventId] = {
    eventId,
    eventTitle: ev.registrationTitle || ev.title,
    isTeam: true,
    isInterCollege: false,
    teamMin: 3,
    teamMax: 3,
    fee: 80,
    lockedDepartment: null, // Cross-department allowed
    registrationRules: rules,
    dates: ev.dates,
    description: ev.description,
  };
});
