/**
 * exportUtils.js — shared export helpers for admin pages.
 *
 * CSV:   safe escaping (handles commas, quotes, newlines in values).
 * Excel: structured .xlsx via exceljs with bold coloured headers,
 *        frozen header row, auto-sized columns, team-block grouping.
 */
import ExcelJS from 'exceljs';

// ── CSS-var resolver (used to convert dept colour into an ARGB hex for Excel) ──
export function resolveCssVar(varStr) {
  if (typeof window === 'undefined') return '#38bdf8';
  const raw = varStr.replace(/var\(([^)]+)\).*/, '$1').trim();
  return getComputedStyle(document.documentElement).getPropertyValue(raw).trim() || '#38bdf8';
}

// Strips leading '#' and pads to 6 chars, returns 'FF' + 6-char hex for ExcelJS argb
export function toArgb(cssColor) {
  if (!cssColor) return 'FF38BDF8';
  // Handle rgb(r, g, b)
  const rgbMatch = cssColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const hex = [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(n => parseInt(n).toString(16).padStart(2, '0'))
      .join('');
    return `FF${hex.toUpperCase()}`;
  }
  const clean = cssColor.replace('#', '').trim();
  if (clean.length === 3) {
    return `FF${clean.split('').map(c => c + c).join('').toUpperCase()}`;
  }
  return `FF${clean.padStart(6, '0').toUpperCase()}`;
}

// ── Safe CSV cell escape ──
export function csvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  // If it contains commas, quotes, or newlines, wrap in double-quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Build a CSV row from an array of values ──
export function csvRow(values) {
  return values.map(csvCell).join(',') + '\n';
}

// Excel sheet names can't contain: * ? : \ / [ ] — and must be ≤31 chars
export function safeSheetName(name) {
  const cleaned = String(name || 'Sheet').replace(/[*?:\\/[\]]/g, '-').trim();
  return (cleaned || 'Sheet').slice(0, 31);
}

// ── Trigger a file download in the browser ──
export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA SHAPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten a teams array (with nested team_members) into one row per participant.
 * Columns: Team Short ID, Team Name, College, Name, USN, Email, Phone, Department, Is Lead, Payment Status, Registered At
 */
export function flattenTeams(teams) {
  const rows = [];
  for (const t of teams) {
    const shortId = t.short_id ? t.short_id.toUpperCase() : `legacy-${(t.id || '').replace(/-/g, '').slice(0, 8)}`;
    const members = [...(t.team_members || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
    for (const m of members) {
      rows.push({
        shortId,
        teamName: t.team_name || '',
        name: m.name || '',
        email: m.email || '',
        phone: m.phone || '',
        semester: m.semester ? `Sem ${m.semester}` : '',
        section: m.section || '',
        dept: m.dept || '',
        cycle: m.cycle || '',
        rollNumber: m.roll_number || '',
        usn: m.usn || '',
        isLead: m.is_lead ? 'Yes' : 'No',
        paymentStatus: t.payment_status || 'pending',
        registeredAt: t.created_at || '',
        // Keep raw team id for grouping
        _teamId: t.id,
      });
    }
  }
  return rows;
}

// ── Team CSV export (one row per participant) ──
export function buildTeamCSV(teams) {
  const HEADERS = [
    'Team Short ID',
    'Team Name',
    'Participant Name',
    'Email',
    'Phone',
    'Semester',
    'Section',
    'Department',
    'Cycle',
    'Roll Number',
    'USN',
    'Is Lead',
    'Payment Status',
    'Registered At',
  ];
  let csv = csvRow(HEADERS);
  const rows = flattenTeams(teams);
  for (const r of rows) {
    csv += csvRow([
      r.shortId,
      r.teamName,
      r.name,
      r.email,
      r.phone,
      r.semester,
      r.section,
      r.dept,
      r.cycle,
      r.rollNumber,
      r.usn,
      r.isLead,
      r.paymentStatus,
      r.registeredAt,
    ]);
  }
  return csv;
}

// ── Workshop CSV export (one row per registrant) ──
export function buildWorkshopCSV(workshops) {
  const HEADERS = ['Name', 'Email', 'Phone', 'Semester', 'Section', 'Department', 'Cycle', 'Roll Number', 'USN', 'Status', 'Registered At'];
  let csv = csvRow(HEADERS);
  for (const w of workshops) {
    csv += csvRow([
      w.name,
      w.email,
      w.phone,
      `Sem ${w.semester}`,
      w.section || '',
      w.selected_dept || '',
      w.cycle || '',
      w.roll_number || '',
      w.usn || '',
      w.status || 'confirmed',
      w.created_at,
    ]);
  }
  return csv;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TEAM_COLS = [
  { key: 'shortId',        header: 'Team Short ID',    width: 14 },
  { key: 'teamName',       header: 'Team Name',         width: 22 },
  { key: 'name',           header: 'Participant Name',  width: 22 },
  { key: 'email',          header: 'Email',             width: 28 },
  { key: 'phone',          header: 'Phone',             width: 14 },
  { key: 'semester',       header: 'Semester',          width: 12 },
  { key: 'section',        header: 'Section',           width: 10 },
  { key: 'dept',           header: 'Department',        width: 22 },
  { key: 'cycle',          header: 'Cycle',             width: 16 },
  { key: 'rollNumber',     header: 'Roll Number',       width: 14 },
  { key: 'usn',            header: 'USN',               width: 16 },
  { key: 'isLead',         header: 'Is Lead',           width: 9  },
  { key: 'paymentStatus',  header: 'Payment Status',    width: 14 },
  { key: 'registeredAt',   header: 'Registered At',     width: 22 },
];

const WORKSHOP_COLS = [
  { key: 'name',         header: 'Name',          width: 22 },
  { key: 'email',        header: 'Email',         width: 28 },
  { key: 'phone',        header: 'Phone',         width: 14 },
  { key: 'semester',     header: 'Semester',      width: 10 },
  { key: 'section',      header: 'Section',       width: 10 },
  { key: 'selectedDept', header: 'Department',    width: 22 },
  { key: 'cycle',        header: 'Cycle',         width: 16 },
  { key: 'rollNumber',   header: 'Roll Number',   width: 14 },
  { key: 'usn',          header: 'USN',           width: 16 },
  { key: 'status',       header: 'Status',        width: 12 },
  { key: 'registeredAt', header: 'Registered At', width: 22 },
];

const SUMMARY_COLS = [
  { key: 'shortId',       header: 'Team Short ID',  width: 14 },
  { key: 'teamName',      header: 'Team Name',       width: 22 },
  { key: 'teamSize',      header: 'Team Size',       width: 10 },
  { key: 'paymentStatus', header: 'Payment Status',  width: 14 },
];

// Payment status badge colours for Excel cells
function paymentFill(status) {
  if (status === 'success') return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
  if (status === 'failed')  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
  return null;
}

// Alternating team group fill colours for the detail sheet
const TEAM_GROUP_FILLS = [
  null,                          // default (no fill)
  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }, // very light blue tint
];

/**
 * Apply styled header row to a worksheet.
 * @param {ExcelJS.Worksheet} ws
 * @param {Array<{key, header, width}>} cols
 * @param {string} headerArgb  - ARGB colour for header fill
 * @param {string} fontArgb    - ARGB colour for header font (default white)
 */
function applyHeader(ws, cols, headerArgb, fontArgb = 'FFFFFFFF') {
  ws.columns = cols.map(c => ({ key: c.key, header: c.header, width: c.width }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerArgb },
    };
    cell.font = { bold: true, color: { argb: fontArgb }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });
  headerRow.height = 20;

  // Freeze header row
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Add a team detail worksheet (flat, one row per participant, grouped by team).
 * @param {ExcelJS.Workbook} wb
 * @param {string} sheetName
 * @param {Array} teams
 * @param {string} headerArgb
 */
export function addTeamDetailSheet(wb, sheetName, teams, headerArgb) {
  const ws = wb.addWorksheet(safeSheetName(sheetName));
  applyHeader(ws, TEAM_COLS, headerArgb);

  const flatRows = flattenTeams(teams);
  let groupToggle = 0;
  let lastTeamId = null;
  let currentTeamStartRow = null;

  const mergeTeamLevelCells = (startRow, endRow) => {
    if (endRow <= startRow) return; // single-member team, nothing to merge
    ['shortId', 'teamName', 'paymentStatus', 'registeredAt'].forEach((key) => {
      const colIndex = TEAM_COLS.findIndex((c) => c.key === key) + 1; // ExcelJS columns are 1-indexed
      if (colIndex > 0) {
        ws.mergeCells(startRow, colIndex, endRow, colIndex);
        const mergedCell = ws.getCell(startRow, colIndex);
        mergedCell.alignment = {
          vertical: 'middle',
          horizontal: mergedCell.alignment?.horizontal || (key === 'paymentStatus' || key === 'shortId' ? 'center' : 'left'),
        };
      }
    });
  };

  for (const r of flatRows) {
    // Toggle group fill and merge previous team's cells when team changes
    if (r._teamId !== lastTeamId) {
      if (lastTeamId !== null && currentTeamStartRow !== null) {
        mergeTeamLevelCells(currentTeamStartRow, ws.lastRow ? ws.lastRow.number : currentTeamStartRow);
      }
      groupToggle = 1 - groupToggle;
      lastTeamId = r._teamId;
      currentTeamStartRow = (ws.lastRow ? ws.lastRow.number : ws.rowCount) + 1;
    }

    const row = ws.addRow({
      shortId: r.shortId,
      teamName: r.teamName,
      name: r.name,
      email: r.email,
      phone: r.phone,
      semester: r.semester,
      section: r.section,
      dept: r.dept,
      cycle: r.cycle,
      rollNumber: r.rollNumber,
      usn: r.usn,
      isLead: r.isLead,
      paymentStatus: r.paymentStatus,
      registeredAt: r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : '',
    });

    // Alternating group fill
    const groupFill = TEAM_GROUP_FILLS[groupToggle];
    if (groupFill) {
      row.eachCell(cell => { cell.fill = groupFill; });
    }

    // Colour the Is Lead cell
    const leadCell = row.getCell('isLead');
    if (r.isLead === 'Yes') {
      leadCell.font = { bold: true, color: { argb: 'FF059669' } };
    }

    // Colour payment status cell
    const payCell = row.getCell('paymentStatus');
    if (r.paymentStatus === 'success') payCell.font = { color: { argb: 'FF059669' }, bold: true };
    else if (r.paymentStatus === 'failed') payCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    else payCell.font = { color: { argb: 'FFB45309' } };
  }

  // Merge the final team's rows after the loop
  if (lastTeamId !== null && currentTeamStartRow !== null) {
    mergeTeamLevelCells(currentTeamStartRow, ws.lastRow.number);
  }

  return ws;
}

/**
 * Add a team summary worksheet (one row per team).
 */
export function addTeamSummarySheet(wb, sheetName, teams, headerArgb) {
  const ws = wb.addWorksheet(safeSheetName(sheetName));
  applyHeader(ws, SUMMARY_COLS, headerArgb);

  for (const t of teams) {
    const shortId = t.short_id ? t.short_id.toUpperCase() : `legacy-${(t.id || '').replace(/-/g, '').slice(0, 8)}`;
    const row = ws.addRow({
      shortId,
      teamName: t.team_name || '',
      teamSize: t.team_size || (t.team_members?.length ?? 0),
      paymentStatus: t.payment_status || 'pending',
    });
    const payCell = row.getCell('paymentStatus');
    if (t.payment_status === 'success') payCell.font = { color: { argb: 'FF059669' }, bold: true };
    else if (t.payment_status === 'failed') payCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    else payCell.font = { color: { argb: 'FFB45309' } };
  }

  return ws;
}

/**
 * Add a workshop detail worksheet (one row per registrant).
 */
export function addWorkshopSheet(wb, sheetName, workshops, headerArgb) {
  const ws = wb.addWorksheet(safeSheetName(sheetName));
  applyHeader(ws, WORKSHOP_COLS, headerArgb);

  for (const w of workshops) {
    ws.addRow({
      name: w.name,
      email: w.email,
      phone: w.phone,
      semester: `Sem ${w.semester}`,
      section: w.section || '',
      selectedDept: w.selected_dept || '',
      cycle: w.cycle || '',
      rollNumber: w.roll_number || '',
      usn: w.usn || '',
      status: w.status || 'confirmed',
      registeredAt: w.created_at ? new Date(w.created_at).toLocaleString('en-IN') : '',
    });
  }

  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-LEVEL DOWNLOAD FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Download a CSV blob */
export function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/** Download a single-event team Excel (2 tabs: detail + summary) */
export async function downloadTeamExcel(teams, eventLabel, filename, headerArgb) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HexaVerse Admin';
  wb.created = new Date();

  addTeamDetailSheet(wb, `${eventLabel} – Participants`, teams, headerArgb);
  addTeamSummarySheet(wb, `${eventLabel} – Teams`, teams, headerArgb);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename);
}

/** Download a single workshop Excel (1 tab) */
export async function downloadWorkshopExcel(workshops, eventLabel, filename, headerArgb) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HexaVerse Admin';
  wb.created = new Date();

  addWorkshopSheet(wb, `${eventLabel} Workshop`, workshops, headerArgb);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename);
}

/** Site-wide multi-tab Excel for AdminHome */
export async function downloadSiteWideExcel(workshops, teams, summaryStats) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HexaVerse Admin';
  wb.created = new Date();

  const DEPT_CYAN = 'FF38BDF8'; // fallback site cyan

  // Dept colour map (approximate ARGB)
  const DEPT_ARGB = {
    aiml: 'FF8B5CF6',
    aids: 'FF3B82F6',
    cse:  'FF06B6D4',
    ise:  'FF10B981',
    ece:  'FFF59E0B',
    eee:  'FFEF4444',
  };

  const DEPT_IDS = ['aiml', 'aids', 'cse', 'ise', 'ece', 'eee'];
  const DEPT_NAMES = { aiml: 'AI & ML', aids: 'AI & DS', cse: 'CSE', ise: 'ISE', ece: 'ECE', eee: 'EEE' };

  // ── Summary tab ──
  {
    const ws = wb.addWorksheet('📊 Summary');
    ws.columns = [
      { key: 'event', header: 'Event', width: 26 },
      { key: 'type',  header: 'Type',  width: 16 },
      { key: 'count', header: 'Registrations', width: 16 },
    ];
    applyHeader(ws, [
      { key: 'event', header: 'Event', width: 26 },
      { key: 'type',  header: 'Type',  width: 16 },
      { key: 'count', header: 'Registrations', width: 16 },
    ], DEPT_CYAN);

    const EVENT_SLUGS = [
      { slug: 'aiml-workshop',  label: 'AI&ML Workshop',        type: 'workshop' },
      { slug: 'aids-workshop',  label: 'AI&DS Workshop',        type: 'workshop' },
      { slug: 'cse-workshop',   label: 'CSE Workshop',          type: 'workshop' },
      { slug: 'ise-workshop',   label: 'ISE Workshop',          type: 'workshop' },
      { slug: 'ece-workshop',   label: 'ECE Workshop',          type: 'workshop' },
      { slug: 'eee-workshop',   label: 'EEE Workshop',          type: 'workshop' },
      { slug: 'aiml-event',     label: 'AI&ML Signature Event', type: 'team' },
      { slug: 'aids-event',     label: 'AI&DS Signature Event', type: 'team' },
      { slug: 'cse-event',      label: 'CSE Signature Event',   type: 'team' },
      { slug: 'ise-event',      label: 'ISE Signature Event',   type: 'team' },
      { slug: 'ece-event',      label: 'ECE Signature Event',   type: 'team' },
      { slug: 'eee-event',      label: 'EEE Signature Event',   type: 'team' },
      { slug: 'treasure-hunt',  label: 'Treasure Hunt',         type: 'team' },
      { slug: 'hackathon',      label: 'Hackathon',             type: 'team' },
    ];

    for (const { slug, label, type } of EVENT_SLUGS) {
      const count = type === 'workshop'
        ? workshops.filter(w => w.event_slug === slug).length
        : teams.filter(t => t.event_slug === slug).length;
      ws.addRow({ event: label, type: type === 'workshop' ? 'Workshop' : 'Team Event', count });
    }

    // Stats rows at the bottom
    ws.addRow({});
    ws.addRow({ event: 'TOTAL WORKSHOP REGISTRANTS', count: summaryStats.totalWorkshops });
    ws.addRow({ event: 'TOTAL TEAMS', count: summaryStats.totalTeams });
    ws.addRow({ event: 'PAID TEAMS', count: summaryStats.paidTeams });
    ws.addRow({ event: 'VERIFIED REVENUE (₹)', count: summaryStats.totalRevenue });
  }

  // ── Per-department workshop tabs ──
  for (const deptId of DEPT_IDS) {
    const deptWorkshops = workshops.filter(w => w.event_slug === `${deptId}-workshop`);
    addWorkshopSheet(wb, `${DEPT_NAMES[deptId]} Workshop`, deptWorkshops, DEPT_ARGB[deptId]);
  }

  // ── Per-department signature event tabs ──
  for (const deptId of DEPT_IDS) {
    const deptTeams = teams.filter(t => t.event_slug === `${deptId}-event`);
    addTeamDetailSheet(wb, `${DEPT_NAMES[deptId]} Event`, deptTeams, DEPT_ARGB[deptId]);
  }

  // ── Mega event tabs ──
  const treasureTeams = teams.filter(t => t.event_slug === 'treasure-hunt');
  addTeamDetailSheet(wb, 'Treasure Hunt', treasureTeams, 'FFF59E0B');

  const hackathonTeams = teams.filter(t => t.event_slug === 'hackathon');
  addTeamDetailSheet(wb, 'Hackathon', hackathonTeams, 'FF8B5CF6');

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `HexaVerse_All_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
