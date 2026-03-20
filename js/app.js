const API = "http://localhost:3000/api"
let state = {
  mode: "teacher",
  currentTeacher: null,
  config: {
    semester: "2/2568",
    school_name: "วิทยาลัยเทคนิคน้ำพอง",
    is_configured: false,
  },
  currentStudent: null,
  subjects: [],
  teachers: [],
  schedules: [],
  students: [],
  groups: [],
  rooms: [],
  myRegistrations: [],
  availableSchedules: [],
  selectedPeriods: [],
  schedDaySlots: [
    { day: "จันทร์", periodStart: null, periodEnd: null, room: "" },
  ],
  editSchedPeriods: [],
  draggingSubjectId: null,
  selectedSubjectIds: new Set(),
  selectedSchedIds: new Set(),
  currentApproveTab: "pending",
}

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"]
const PERIOD_TIMES = {
  1: "08:20",
  2: "09:20",
  3: "10:20",
  4: "11:20",
  5: "13:20",
  6: "14:20",
  7: "15:20",
  8: "16:20",
  9: "17:20",
  10: "18:20",
  11: "19:20",
}
const PERIOD_END = {
  1: "09:20",
  2: "10:20",
  3: "11:20",
  4: "12:20",
  5: "14:20",
  6: "15:20",
  7: "16:20",
  8: "17:20",
  9: "18:20",
  10: "19:20",
  11: "20:20",
}
const COLORS = [
  "color-1",
  "color-2",
  "color-3",
  "color-4",
  "color-5",
  "color-6",
]
let subjectColorMap = {}

// =========== INIT ===========
async function init() {
  await loadConfig()
  await loadAll()

  // ให้เริ่มต้นที่โหมดนักเรียนเสมอ
  setMode("student")
  navigate("s-dashboard")

  // ลบเงื่อนไข if (state.config...) ด้านล่างทิ้งไปเลยครับ
  // มันจะได้ไม่ต้องเด้งขึ้นมาเช็คอะไรอีก
}

async function loadAll() {
  const teacherId = state.currentTeacher ? state.currentTeacher.id : undefined
  const [subjects, teachers, students, groups, rooms] = await Promise.all([
    api("GET", "/subjects"),
    api("GET", "/teachers"),
    api("GET", "/students"),
    api("GET", "/groups"),
    api("GET", "/rooms"),
  ])
  state.subjects = subjects
  state.teachers = teachers
  state.students = students
  state.groups = groups
  state.rooms = rooms
  const schedPath = teacherId
    ? `/teacher-schedules?teacher_id=${teacherId}`
    : "/teacher-schedules"
  state.schedules = await api("GET", schedPath)
  subjects.forEach((s, i) => {
    if (!subjectColorMap[s.id])
      subjectColorMap[s.id] = COLORS[i % COLORS.length]
  })
  if (!state.currentTeacher && teachers.length)
    state.currentTeacher = teachers[0]
  updateUserInfo()
}

// =========== MODE ===========
function setMode(mode) {
  state.mode = mode
  document.getElementById("teacher-nav").style.display =
    mode === "teacher" ? "block" : "none"
  document.getElementById("student-nav").style.display =
    mode === "student" ? "block" : "none"
  document.getElementById("topbar-role").className =
    "role-badge " + (mode === "teacher" ? "role-teacher" : "role-student")
  document.getElementById("topbar-role").textContent =
    mode === "teacher" ? "👨‍🏫 ครูผู้สอน" : "👨‍🎓 นักเรียน"
  document.getElementById("btn-teacher-mode").className =
    "btn btn-sm " + (mode === "teacher" ? "btn-primary" : "btn-ghost")
  document.getElementById("btn-student-mode").className =
    "btn btn-sm " + (mode === "student" ? "btn-primary" : "btn-ghost")
  updateStudentMenuState()
  if (mode === "teacher") navigate("t-dashboard")
  else navigate("s-dashboard")
  updateUserInfo()
}

function updateStudentMenuState() {
  const hasStudent = !!state.currentStudent
  ;["nav-s-register", "nav-s-timetable", "nav-s-export"].forEach((id) => {
    const el = document.getElementById(id)
    if (el) {
      if (hasStudent) el.classList.remove("nav-disabled")
      else el.classList.add("nav-disabled")
    }
  })
}

function updateUserInfo() {
  const el = document.getElementById("current-user-info")
  if (state.mode === "teacher" && state.currentTeacher) {
    el.textContent = "👤 " + state.currentTeacher.name
  } else if (state.mode === "student" && state.currentStudent) {
    el.textContent =
      "👤 " +
      state.currentStudent.name +
      (state.currentStudent.group_code
        ? " (" + state.currentStudent.group_code + ")"
        : "")
  } else {
    el.textContent = state.mode === "student" ? "⚠️ กรุณาเลือกนักเรียน" : ""
  }
  updateStudentMenuState()
}

// =========== NAVIGATE ===========
function navigate(page) {
  // Block disabled student pages
  if (
    state.mode === "student" &&
    !state.currentStudent &&
    ["s-register", "s-timetable", "s-export"].includes(page)
  ) {
    toast("กรุณาเลือกนักเรียนก่อน", "error")
    return
  }
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"))
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"))
  const p = document.getElementById("page-" + page)
  if (p) p.classList.add("active")
  const titles = {
    "t-dashboard": "ภาพรวม",
    "t-subjects": "จัดการรายวิชา",
    "t-groups": "จัดการกลุ่มเรียน",
    "t-rooms": "จัดการห้องเรียน",
    "t-schedule": "ลงตารางสอน",
    "t-timetable": "ตารางสอน",
    "t-approve": "อนุมัตินักเรียน",
    "t-export": "Export ตาราง",
    "s-dashboard": "หน้าแรก",
    "s-register": "ลงทะเบียนเรียน",
    "s-timetable": "ตารางเรียน",
    "s-export": "Export ตาราง",
  }
  document.getElementById("topbar-title").textContent = titles[page] || ""
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (
      n.getAttribute("onclick") &&
      n.getAttribute("onclick").includes("'" + page + "'")
    )
      n.classList.add("active")
  })
  if (page === "t-dashboard") renderTeacherDashboard()
  else if (page === "t-subjects") renderSubjectsTable()
  else if (page === "t-groups") renderGroupsPage()
  else if (page === "t-rooms") renderRoomsPage()
  else if (page === "t-schedule") renderSchedulePage()
  else if (page === "t-timetable") renderTeacherTimetable()
  else if (page === "t-approve") renderApprovalPage()
  else if (page === "t-export") renderTeacherExportPage()
  else if (page === "s-dashboard") renderStudentDashboard()
  else if (page === "s-register") renderStudentRegister()
  else if (page === "s-timetable") renderStudentTimetable()
  else if (page === "s-export") renderStudentExportPage()
}
