/* main.js - Client-side only e-learning front-end for CodTech */

/* SAMPLE COURSES */
const COURSES = {
  course1: {
    id: "course1",
    title: "Frontend Web Development",
    desc: "HTML, CSS, JavaScript — build responsive UI and interactive web pages.",
    video: "https://www.youtube.com/embed/DPnqb74Smug",
    lessons: [
      "Introduction & Setup",
      "HTML Basics",
      "CSS Layouts & Flexbox",
      "Responsive Design",
      "JavaScript Fundamentals",
      "DOM Manipulation",
      "Project: Portfolio"
    ]
  },
  course2: {
    id: "course2",
    title: "Node.js & Backend Basics",
    desc: "Build APIs, work with databases and authentication.",
    video: "https://www.youtube.com/embed/TlB_eWDSMt4",
    lessons: [
      "Node.js Intro",
      "Express.js Basics",
      "REST APIs",
      "Databases (MongoDB)",
      "Authentication",
      "Deployment"
    ]
  },
  course3: {
    id: "course3",
    title: "React & Modern Frontend",
    desc: "Component architecture, state management and routing.",
    video: "https://www.youtube.com/embed/Ke90Tje7VS0",
    lessons: [
      "React Intro",
      "JSX & Components",
      "State & Props",
      "Hooks",
      "Routing",
      "Build & Deploy"
    ]
  }
};

/* ---------- localStorage helpers ---------- */
function readProgress() {
  try { return JSON.parse(localStorage.getItem('ct_progress') || '{}'); }
  catch(e){ return {}; }
}
function writeProgress(obj) { localStorage.setItem('ct_progress', JSON.stringify(obj)); }

/* ---------- UTIL ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function calcCourseProgress(courseId, cached) {
  const progress = cached || readProgress();
  const c = COURSES[courseId];
  if(!c) return 0;
  const state = progress[courseId];
  if(!state || !state.enrolled) return 0;
  const done = (state.lessonsCompleted || []).filter(Boolean).length;
  return Math.round((done / c.lessons.length) * 100);
}

/* ---------- INDEX: course listing ---------- */
function initCourseListing() {
  const grid = document.getElementById('coursesGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const progress = readProgress();

  Object.values(COURSES).forEach(course => {
    const pct = calcCourseProgress(course.id, progress);
    const card = document.createElement('article');
    card.className = 'course-card card';
    card.innerHTML = `
      <h3>${escapeHtml(course.title)}</h3>
      <p class="muted">${escapeHtml(course.desc)}</p>
      <div class="progress-box">
        <label>Progress</label>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="muted">${pct}%</div>
      </div>
      <div class="course-meta">
        <div class="small muted">${course.lessons.length} lessons</div>
        <div style="display:flex;gap:8px;">
          <a class="btn ghost" href="course.html?id=${course.id}">Open</a>
          <button class="btn primary" onclick="enrollCourse('${course.id}')">Enroll</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ---------- COURSE PAGE ---------- */
function loadCoursePage(courseId) {
  const course = COURSES[courseId];
  if(!course) return;
  document.getElementById('courseTitle').textContent = course.title;
  document.getElementById('courseDesc').textContent = course.desc;

  const videoWrap = document.getElementById('videoEmbed');
  videoWrap.innerHTML = `<div class="video-embed"><iframe src="${course.video}" title="${course.title}" allowfullscreen></iframe></div>`;

  const lessonList = document.getElementById('lessonList');
  const progress = readProgress();
  const state = progress[courseId] || { enrolled:false, lessonsCompleted: [] };
  state.lessonsCompleted = state.lessonsCompleted.concat(Array(Math.max(0, course.lessons.length - (state.lessonsCompleted.length || 0))).fill(false));

  lessonList.innerHTML = '';
  course.lessons.forEach((ls,i) => {
    const li = document.createElement('li');
    const done = state.lessonsCompleted[i];
    li.className = 'lesson-item' + (done ? ' completed' : '');
    li.innerHTML = `<div class="bullet">${done ? '✓' : i+1}</div><div>${escapeHtml(ls)}</div>`;
    li.onclick = () => {
      if(!state.enrolled){ alert('Please enroll first to track progress.'); return; }
      toggleLesson(courseId,i);
      loadCoursePage(courseId);
    };
    lessonList.appendChild(li);
  });

  const enrollBtn = document.getElementById('enrollBtn');
  enrollBtn.textContent = state.enrolled ? 'Enrolled' : 'Enroll';
  enrollBtn.disabled = !!state.enrolled;
  enrollBtn.onclick = () => { enrollCourse(courseId); loadCoursePage(courseId); };

  const pct = calcCourseProgress(courseId);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = pct + '%';
}

/* enroll */
function enrollCourse(courseId) {
  const progress = readProgress();
  if(!progress[courseId]) {
    progress[courseId] = { enrolled:true, lessonsCompleted: Array(COURSES[courseId].lessons.length).fill(false), lastUpdated: Date.now() };
    writeProgress(progress);
    alert('Enrolled in ' + COURSES[courseId].title);
  } else {
    progress[courseId].enrolled = true;
    writeProgress(progress);
  }
  if(typeof initCourseListing === 'function') initCourseListing();
}

/* toggle lesson */
function toggleLesson(courseId, lessonIndex) {
  const progress = readProgress();
  if(!progress[courseId] || !progress[courseId].enrolled) return;
  const arr = progress[courseId].lessonsCompleted || [];
  arr[lessonIndex] = !arr[lessonIndex];
  progress[courseId].lessonsCompleted = arr;
  progress[courseId].lastUpdated = Date.now();
  writeProgress(progress);
}

/* ---------- DASHBOARD ---------- */
function loadDashboard() {
  const enrolledList = document.getElementById('enrolledList');
  const progress = readProgress();
  enrolledList.innerHTML = '';

  const enrolledIds = Object.keys(progress).filter(id => progress[id].enrolled);
  if(enrolledIds.length === 0) {
    enrolledList.innerHTML = '<li class="muted">No courses enrolled yet. Browse courses to enroll.</li>';
  } else {
    enrolledIds.forEach(id => {
      const course = COURSES[id];
      const pct = calcCourseProgress(id, progress);
      const li = document.createElement('li');
      li.innerHTML = `<div style="flex:1"><strong>${escapeHtml(course.title)}</strong><div class="muted" style="font-size:13px">${pct}% • ${course.lessons.length} lessons</div></div><div style="margin-left:12px"><a class="btn ghost" href="course.html?id=${id}">Open</a></div>`;
      enrolledList.appendChild(li);
    });
  }

  const allPct = enrolledIds.length ? Math.round(enrolledIds.reduce((s,id)=>s+calcCourseProgress(id, progress),0)/enrolledIds.length) : 0;
  const overallFill = document.getElementById('overallFill');
  const overallText = document.getElementById('overallText');
  if(overallFill) overallFill.style.width = allPct + '%';
  if(overallText) overallText.textContent = allPct + '%';

  const dateInput = document.getElementById('internshipDate');
  const saved = localStorage.getItem('ct_internship_end');
  if(saved && dateInput) dateInput.value = saved;

  const saveBtn = document.getElementById('saveDate');
  if(saveBtn) saveBtn.onclick = () => {
    if(!dateInput.value){ alert('Pick a valid date'); return; }
    localStorage.setItem('ct_internship_end', dateInput.value);
    alert('Internship end date saved: ' + dateInput.value);
  };

  const clearBtn = document.getElementById('clearData');
  if(clearBtn) clearBtn.onclick = () => {
    if(!confirm('Clear all progress and enrollment?')) return;
    localStorage.removeItem('ct_progress');
    initCourseListing();
    loadDashboard();
  };
}

/* ---------- CERTIFICATE ---------- */
function loadCertificatePage() {
  const status = document.getElementById('certStatus');
  const certName = document.getElementById('certName');
  const certCourse = document.getElementById('certCourse');
  const certDate = document.getElementById('certDate');
  const progress = readProgress();
  const internshipEnd = localStorage.getItem('ct_internship_end');

  const eligible = Object.keys(progress).find(id => progress[id].enrolled && calcCourseProgress(id, progress) === 100);
  if(!eligible) {
    if(status) status.textContent = 'No completed course yet. Complete a course to get a certificate.';
    document.getElementById('printCert').disabled = true;
    certName.textContent = '[Student Name]';
    certCourse.textContent = '[Course Title]';
    certDate.textContent = 'on [Completion Date]';
    return;
  }

  if(!internshipEnd) {
    status.innerHTML = 'Internship end date not set. Go to <a href="dashboard.html">Dashboard</a> to set it.';
    document.getElementById('printCert').disabled = true;
    return;
  }

  const now = new Date();
  const endDate = new Date(internshipEnd + 'T23:59:59');
  if(now < endDate) {
    const d = endDate.toLocaleDateString();
    status.textContent = `Certificate will be issued after internship end date (${d}).`;
    document.getElementById('printCert').disabled = true;
    return;
  }

  const course = COURSES[eligible];
  certName.textContent = localStorage.getItem('ct_student_name') || 'Student Name';
  certCourse.textContent = course.title;
  certDate.textContent = 'on ' + new Date().toLocaleDateString();
  status.textContent = 'Certificate available — click Print / Download.';
  document.getElementById('printCert').disabled = false;
  document.getElementById('printCert').onclick = () => window.print();
}

/* Expose functions to global so HTML can call them */
window.initCourseListing = initCourseListing;
window.loadCoursePage = loadCoursePage;
window.enrollCourse = enrollCourse;
window.toggleLesson = toggleLesson;
window.loadDashboard = loadDashboard;
window.loadCertificatePage = loadCertificatePage;
