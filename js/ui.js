// =========== SELECT USER MODAL ===========
async function showSelectUserModal() {
  await loadAll()
  const isTeacher = state.mode === "teacher"
  document.getElementById("add-teacher-section").style.display = isTeacher
    ? ""
    : "none"
  document.getElementById("add-student-section").style.display = isTeacher
    ? "none"
    : ""

  const el = document.getElementById("user-select-list")
  if (isTeacher) {
    el.innerHTML = `
<div style="font-size:12px; color:var(--text3); margin-bottom:8px;">เลือกครูผู้สอน:</div>
${state.teachers
  .map(
    (t) => `
  <div class="drag-item" onclick="selectTeacher('${t.id}')" style="cursor:pointer; ${state.currentTeacher?.id === t.id ? "border-color:var(--accent)" : ""}">
    <span>👨‍🏫</span>
    <div>
      <div style="font-weight:600">${t.name}</div>
      <div style="font-size:11px; color:var(--text3)">${t.department} | ${t.special_duty}</div>
    </div>
    ${state.currentTeacher?.id === t.id ? '<span class="badge badge-blue">✓ ใช้งานอยู่</span>' : ""}
  </div>`,
  )
  .join("")}`
  } else {
    el.innerHTML = `
<div style="font-size:12px; color:var(--text3); margin-bottom:8px;">เลือกนักเรียน:</div>
${state.students
  .map(
    (s) => `
  <div class="drag-item" onclick="selectStudent('${s.id}')" style="cursor:pointer; ${state.currentStudent?.id === s.id ? "border-color:var(--green)" : ""}">
    <span>👨‍🎓</span>
    <div>
      <div style="font-weight:600">${s.name}</div>
      <div style="font-size:11px; color:var(--text3)">${s.group_code}</div>
    </div>
    ${state.currentStudent?.id === s.id ? '<span class="badge badge-green">✓ ใช้งานอยู่</span>' : ""}
  </div>`,
  )
  .join("")}`
  }
  openModal("modal-select-user")
}

// function selectTeacher(id) {
//   state.currentTeacher = state.teachers.find((t) => t.id === id)
//   updateUserInfo()
//   closeModal("modal-select-user")
//   toast("เลือกครู: " + state.currentTeacher.name, "success")
//   // Reload schedules for this teacher
//   api("GET", "/teacher-schedules?teacher_id=" + id).then((scheds) => {
//     state.schedules = scheds
//   })
// }

// function selectStudent(id) {
//   state.currentStudent = state.students.find((s) => s.id === id)
//   updateUserInfo()
//   closeModal("modal-select-user")
//   toast("เลือกนักเรียน: " + state.currentStudent.name, "success")
//   navigate("s-dashboard")
// }

async function selectTeacher(id) {
  state.currentTeacher = state.teachers.find((t) => t.id === id)
  updateUserInfo()
  closeModal("modal-select-user")
  toast("เลือกครู: " + state.currentTeacher.name, "success")

  // 1. บังคับโหลดข้อมูลใหม่ทั้งหมดจากหลังบ้านของครูคนนี้
  await loadAll()

  // 2. ค้นหาว่าตอนนี้เปิดหน้าไหนอยู่
  let activePageId = "t-dashboard" // ค่าเริ่มต้น
  document.querySelectorAll(".page").forEach((p) => {
    if (p.classList.contains("active")) {
      activePageId = p.id.replace("page-", "")
    }
  })

  // 3. สั่งวาดหน้านั้นใหม่ด้วยข้อมูลใหม่
  navigate(activePageId)
}

async function selectStudent(id) {
  state.currentStudent = state.students.find((s) => s.id === id)
  updateUserInfo()
  closeModal("modal-select-user")
  toast("เลือกนักเรียน: " + state.currentStudent.name, "success")

  // 1. บังคับโหลดข้อมูลใหม่ทั้งหมด
  await loadAll()

  // 2. ค้นหาว่าตอนนี้เปิดหน้าไหนอยู่ของนักเรียน
  let activePageId = "s-dashboard" // ค่าเริ่มต้น
  document.querySelectorAll(".page").forEach((p) => {
    if (p.classList.contains("active")) {
      activePageId = p.id.replace("page-", "")
    }
  })

  // 3. สั่งวาดหน้านั้นใหม่ด้วยข้อมูลใหม่
  navigate(activePageId)
}

async function addTeacher() {
  const name = document.getElementById("new-teacher-name").value.trim()
  const department = document
    .getElementById("new-teacher-dept")
    .value.trim()
  const education = document
    .getElementById("new-teacher-edu")
    .value.trim()
  const special_duty = document
    .getElementById("new-teacher-duty")
    .value.trim()
  if (!name) return toast("กรุณากรอกชื่อครู", "error")
  try {
    const newTeacher = await api("POST", "/teachers", {
      name,
      department,
      education,
      special_duty,
    })
    state.teachers.push(newTeacher)
    state.currentTeacher = newTeacher
    updateUserInfo()
    // Clear inputs
    ;[
      "new-teacher-name",
      "new-teacher-dept",
      "new-teacher-edu",
      "new-teacher-duty",
    ].forEach((id) => (document.getElementById(id).value = ""))
    closeModal("modal-select-user")
    toast("เพิ่มครูแล้ว: " + name, "success")
    navigate("t-dashboard")
  } catch (e) {}
}

async function addStudent() {
  const name = document.getElementById("new-std-name").value.trim()
  const group_code = document.getElementById("new-std-group").value.trim()
  if (!name)
    return toast("กรุณากรอกชื่อนักเรียน", "error")
  try {
    const newStudent = await api("POST", "/students", {
      name,
      group_code,
    })
    state.students.push(newStudent)
    state.currentStudent = newStudent
    updateUserInfo()
    closeModal("modal-select-user")
    toast("เพิ่มนักเรียนแล้ว: " + name, "success")
    navigate("s-dashboard")
  } catch (e) {}
}

// =========== CONFIRM MODAL ===========
function showConfirmModal(title, msg, onConfirm) {
  document.getElementById("confirm-title").textContent = title
  document.getElementById("confirm-msg").innerHTML = msg
  const btn = document.getElementById("confirm-ok-btn")
  btn.onclick = async () => {
    closeModal("modal-confirm")
    await onConfirm()
  }
  openModal("modal-confirm")
}

// =========== MODAL HELPERS ===========
function openModal(id) {
  document.getElementById(id).style.display = "flex"
}
function closeModal(id) {
  document.getElementById(id).style.display = "none"
}

document.querySelectorAll(".modal-overlay").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) m.style.display = "none"
  })
})

// =========== TOAST ===========
function toast(msg, type = "success") {
  const container = document.getElementById("toast-container")
  const el = document.createElement("div")
  el.className = `toast ${type}`
  el.innerHTML = `<span>${type === "success" ? "✅" : "❌"}</span><span>${msg}</span>`
  container.appendChild(el)
  setTimeout(() => {
    el.style.animation = "slideOut .2s ease forwards"
    setTimeout(() => el.remove(), 200)
  }, 3000)
}

// =========== EDIT PERIOD PICKER EVENT DELEGATION ===========
document.addEventListener("click", function (e) {
  const btn = e.target.closest(
    "#edit-period-picker .edit-period-btn[data-period]",
  )
  if (!btn) return
  const p = +btn.dataset.period
  toggleEditPeriod(p)
})

// =========== SETTINGS ===========
async function loadConfig() {
  try {
    const cfg = await api("GET", "/config")
    state.config = cfg
    updateSemesterDisplay()
  } catch (e) {}
}

function updateSemesterDisplay() {
  const el = document.getElementById("semester-display")
  if (el)
    el.textContent = "ภาคเรียน " + (state.config.semester || "2/2568")

  // อัปเดตชื่อสถาบันที่ Sidebar
  const sidebarName = document.getElementById("sidebar-school-name")
  if (sidebarName) {
    sidebarName.textContent =
      state.config.school_name || "วิทยาลัยเทคนิคน้ำพอง"
  }

  // Also update document title
  document.title =
    (state.config.school_name || "วิทยาลัยเทคนิคน้ำพอง") +
    " — ระบบลงทะเบียนเรียน"
}

async function showSettingsModal(firstTime) {
  if (!firstTime && state.mode !== "teacher") {
    toast("เฉพาะครูเท่านั้น", "error")
    return
  }
  await loadConfig()
  const sem = state.config.semester || ""
  const parts = sem.split("/")
  document.getElementById("settings-semester-term").value =
    parts[0] || "2"
  document.getElementById("settings-semester-year").value =
    parts[1] || new Date().getFullYear() + 543 + ""
  document.getElementById("settings-school-name").value =
    state.config.school_name || "วิทยาลัยเทคนิคน้ำพอง"
  // Adjust modal for first-time vs normal edit
  const titleEl = document.querySelector("#modal-settings .modal-title")
  if (titleEl)
    titleEl.textContent = firstTime
      ? "⚙️ ตั้งค่าเริ่มต้นก่อนใช้งาน"
      : "⚙️ ตั้งค่าระบบ"
  const cancelBtn = document.querySelector(
    "#modal-settings .modal-footer .btn-ghost",
  )
  if (cancelBtn) cancelBtn.style.display = firstTime ? "none" : ""
  openModal("modal-settings")
}

async function saveSettings() {
  const term = document.getElementById("settings-semester-term").value
  const year = document
    .getElementById("settings-semester-year")
    .value.trim()
  const schoolName = document
    .getElementById("settings-school-name")
    .value.trim()
  if (!year || !/^\d{4}$/.test(year))
    return toast("กรุณากรอกปีการศึกษาให้ถูกต้อง (4 หลัก)", "error")

  const semester = term + "/" + year
  await api("PUT", "/config", { semester, school_name: schoolName })

  state.config.semester = semester
  state.config.school_name = schoolName
  state.config.is_configured = true // เพิ่มบรรทัดนี้

  updateSemesterDisplay()
  closeModal("modal-settings")
  toast(`บันทึกการตั้งค่าแล้ว: ภาคเรียน ${semester}`, "success")
}

async function revokeRequest(id) {
  showConfirmModal(
    "⚠️ ยืนยันการยกเลิกอนุมัติ",
    "ต้องการยกเลิกสิทธิ์นักเรียนคนนี้ใช่หรือไม่?<br><span style='color:var(--red); font-size:12px; margin-top:8px; display:inline-block;'>* วิชาเรียนทั้งหมดที่นักเรียนคนนี้เคยลงทะเบียนกับคุณ จะถูกถอนออกโดยอัตโนมัติ!</span>",
    async () => {
      try {
        await api("POST", "/enrollment-requests/" + id + "/revoke")
        toast("ยกเลิกอนุมัติและถอนรายวิชาเรียบร้อยแล้ว", "success")
        await loadAll() // ดึงข้อมูลสถิติใหม่
        renderApprovalPage()
      } catch (e) {}
    },
  )
}

// =========== START ===========
init()