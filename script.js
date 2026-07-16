document.addEventListener('DOMContentLoaded', () => {
  // ─── Scroll reveal ───
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .stagger').forEach(el => obs.observe(el));

  // ─── Nav scroll ───
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ─── Hamburger menu ───
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ─── Geometric blocks for hero ───
  const geoContainer = document.querySelector('.geo-blocks');
  if (geoContainer) {
    const colors = ['rgba(86,196,245,0.5)', 'rgba(86,196,245,0.3)', 'rgba(86,196,245,0.15)', 'rgba(255,153,0,0.25)'];
    const rects = [
      { x: '58%', y: '12%', w: 64, h: 64 },
      { x: '72%', y: '8%', w: 48, h: 96 },
      { x: '82%', y: '22%', w: 96, h: 48 },
      { x: '65%', y: '35%', w: 48, h: 48 },
      { x: '90%', y: '42%', w: 64, h: 64 },
      { x: '55%', y: '55%', w: 96, h: 48 },
      { x: '78%', y: '60%', w: 48, h: 96 },
      { x: '88%', y: '15%', w: 48, h: 48 },
      { x: '62%', y: '72%', w: 64, h: 48 },
      { x: '75%', y: '78%', w: 48, h: 64 },
      { x: '92%', y: '70%', w: 48, h: 48 },
      { x: '85%', y: '50%', w: 32, h: 32 },
    ];
    rects.forEach((r, i) => {
      const div = document.createElement('div');
      div.className = 'geo-block';
      div.style.cssText = `left:${r.x};top:${r.y};width:${r.w}px;height:${r.h}px;background:${colors[i % colors.length]};opacity:0;animation:fadeIn 0.5s ${0.3 + i * 0.08}s forwards;`;
      geoContainer.appendChild(div);
    });
  }

  // ─── Smooth anchor scrolling ───
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ─── Accordion toggle (department pages) ───
  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.event-card');
      const accordion = card.querySelector('.accordion-content');
      if (!accordion) return;
      const isOpen = accordion.classList.contains('open');
      if (isOpen) {
        accordion.style.maxHeight = '0';
        accordion.classList.remove('open');
        btn.textContent = 'Details';
      } else {
        accordion.classList.add('open');
        accordion.style.maxHeight = accordion.scrollHeight + 'px';
        btn.textContent = 'Hide Details';
      }
    });
  });

  // ─── Registration Modal ───
  injectRegistrationModal();
  setupRegistrationHandlers();

  // ─── Back to Top Button ───
  const backToTopBtn = document.createElement('button');
  backToTopBtn.className = 'back-to-top';
  backToTopBtn.id = 'backToTop';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  backToTopBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  document.body.appendChild(backToTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ─── REGISTRATION MODAL SYSTEM ───

function injectRegistrationModal() {
  const modalHTML = `
  <div class="modal-overlay" id="registrationModal">
    <div class="modal-card">
      <button class="modal-close" id="modalClose">&times;</button>
      <div id="modalFormView">
        <div class="modal-header">
          <h3>Register</h3>
          <p class="modal-event-name" id="modalEventName"></p>
        </div>
        <form class="modal-form" id="registrationForm">
          <div class="form-group">
            <label for="regName">Full Name</label>
            <input type="text" id="regName" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="regUSN">USN / Roll No</label>
            <input type="text" id="regUSN" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="regEmail">Email</label>
            <input type="email" id="regEmail" class="form-input" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="regDept">Department</label>
              <select id="regDept" class="form-select" required>
                <option value="">Select...</option>
                <option>AI & ML</option>
                <option>AI & DS</option>
                <option>CSE</option>
                <option>ISE</option>
                <option>ECE</option>
                <option>EEE</option>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="regYear">Year</label>
              <select id="regYear" class="form-select" required>
                <option value="">Select...</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="regPhone">Phone</label>
            <input type="tel" id="regPhone" class="form-input" required>
          </div>
          <div class="form-group" id="collegeField" style="display:none;">
            <label for="regCollege">College Name</label>
            <input type="text" id="regCollege" class="form-input" placeholder="Your institution name">
          </div>
          <div id="teamSection" style="display:none;">
            <div class="team-section-title">Team Details</div>
            <p class="form-hint">You are automatically the team leader. Add up to 4 team members below.</p>
            <div class="form-group">
              <label for="regTeamName">Team Name</label>
              <input type="text" id="regTeamName" class="form-input">
            </div>
            <div id="membersList"></div>
            <button type="button" class="btn-add-member" id="addMemberBtn">+ Add Team Member</button>
          </div>
          <button type="submit" class="btn-register" style="width:100%;margin-top:8px;">Register Now</button>
        </form>
      </div>
      <div class="modal-success" id="modalSuccess" style="display:none;">
        <div class="success-checkmark">✓</div>
        <h3>You're registered!</h3>
        <p>You'll receive a confirmation email shortly.</p>
        <button class="btn-register" style="margin-top:8px;" onclick="closeRegistrationModal()">Done</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

let memberCount = 0;

function setupRegistrationHandlers() {
  // Open modal from any register button
  document.querySelectorAll('.btn-register[data-event], .btn-dept-register[data-event]').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.event;
      const eventTitle = btn.dataset.title;
      const isTeam = btn.dataset.team === 'true';
      const isInterCollege = btn.dataset.interCollege === 'true';
      openRegistrationModal(eventId, eventTitle, isTeam, isInterCollege);
    });
  });

  // Close modal
  document.getElementById('modalClose').addEventListener('click', closeRegistrationModal);
  document.getElementById('registrationModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeRegistrationModal();
  });

  // Add team member
  document.getElementById('addMemberBtn').addEventListener('click', addTeamMember);

  // Form submit
  document.getElementById('registrationForm').addEventListener('submit', submitRegistration);
}

function openRegistrationModal(eventId, eventTitle, isTeam, isInterCollege) {
  const modal = document.getElementById('registrationModal');
  document.getElementById('modalEventName').textContent = eventTitle;
  document.getElementById('modalFormView').style.display = '';
  document.getElementById('modalSuccess').style.display = 'none';
  document.getElementById('registrationForm').reset();

  // Show/hide college field
  document.getElementById('collegeField').style.display = isInterCollege ? '' : 'none';

  // Show/hide team section
  document.getElementById('teamSection').style.display = isTeam ? '' : 'none';
  document.getElementById('membersList').innerHTML = '';
  memberCount = 0;

  // Store event info on form
  document.getElementById('registrationForm').dataset.eventId = eventId;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeRegistrationModal() {
  const modal = document.getElementById('registrationModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function addTeamMember() {
  if (memberCount >= 4) return;
  memberCount++;
  const row = document.createElement('div');
  row.className = 'team-member-row';
  row.innerHTML = `
    <button type="button" class="btn-remove-member" onclick="this.parentElement.remove(); memberCount--;">Remove</button>
    <div class="form-group"><label>Member ${memberCount} Name</label><input type="text" class="form-input" required></div>
    <div class="form-row">
      <div class="form-group"><label>USN / Roll No</label><input type="text" class="form-input" required></div>
      <div class="form-group"><label>Email</label><input type="email" class="form-input" required></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Department</label>
        <select class="form-select" required>
          <option value="">Select...</option>
          <option>AI & ML</option><option>AI & DS</option><option>CSE</option>
          <option>ISE</option><option>ECE</option><option>EEE</option><option>Other</option>
        </select>
      </div>
      <div class="form-group"><label>Phone</label><input type="tel" class="form-input"></div>
    </div>`;
  document.getElementById('membersList').appendChild(row);
}

function submitRegistration(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    eventId: form.dataset.eventId,
    name: document.getElementById('regName').value,
    usn: document.getElementById('regUSN').value,
    email: document.getElementById('regEmail').value,
    department: document.getElementById('regDept').value,
    year: document.getElementById('regYear').value,
    phone: document.getElementById('regPhone').value,
    college: document.getElementById('regCollege').value || null,
    teamName: document.getElementById('regTeamName').value || null,
  };

  // Collect team members
  const memberRows = document.querySelectorAll('.team-member-row');
  if (memberRows.length > 0) {
    data.members = [];
    memberRows.forEach(row => {
      const inputs = row.querySelectorAll('.form-input');
      const selects = row.querySelectorAll('.form-select');
      data.members.push({
        name: inputs[0]?.value,
        usn: inputs[1]?.value,
        email: inputs[2]?.value,
        department: selects[0]?.value,
        phone: inputs[3]?.value,
      });
    });
  }

  // ── PLACEHOLDER: Replace with Supabase insert ──
  console.log('Registration data:', data);
  registerForEvent(data);
}

// Placeholder function — replace with Supabase client calls
async function registerForEvent(data) {
  // TODO: Initialize Supabase client
  // const { data: result, error } = await supabase.from('registrations').insert(...)
  // For now, simulate success:
  document.getElementById('modalFormView').style.display = 'none';
  document.getElementById('modalSuccess').style.display = '';
}
