// =========== SUBJECTS TABLE ===========
async function renderSubjectsTable() {
  await loadAll()
  const scheduledIds = new Set(state.schedules.map((s) => s.subject_id))
  // Fetch global subject→teacher map (all teachers)
  const schedMap = await api("GET", "/subjects/scheduled-map")
  const tbody = document.getElementById("subjects-tbody")
  state.selectedSubjectIds = new Set()
  updateSubjectBulkBar()
  tbody.innerHTML =
    state.subjects
      .map((s) => {
        const ownerInfo = schedMap[s.id]
        const isScheduled = !!ownerInfo
        const isOwnTeacher =
          ownerInfo &&
          state.currentTeacher &&
          ownerInfo.teacher_id === state.currentTeacher.id
        const lockTitle = isScheduled
          ? `บรรจุโดย ${ownerInfo.teacher_name} แล้ว — ไม่สามารถแก้ไขได้`
          : ""
        return `
    <tr>
<td><input type="checkbox" class="sub-cb" value="${s.id}" onchange="toggleSubjectSelect('${s.id}', this.checked)"></td>
<td><span class="badge badge-blue">${s.code}</span></td>
<td>
  ${s.name}
  ${isScheduled ? `<span class="badge badge-orange" style="margin-left:6px;" title="${lockTitle}">🔒 ${ownerInfo.teacher_name}</span>` : ""}
</td>
<td>${s.theory_hours}</td><td>${s.practice_hours}</td><td>${s.credits}</td>
<td>${s.total_hours} ชม.</td>
<td>${
  isScheduled
    ? `<span class="badge badge-green">✓ ลงตารางแล้ว</span>`
    : '<span class="badge badge-red">⚠ ยังไม่ได้ลง</span>'
}</td>
<td>
  ${
    isScheduled
      ? `<button class="btn btn-ghost btn-sm" disabled title="ลงตารางสอนแล้ว — ไม่สามารถแก้ไขได้" style="opacity:.35; cursor:not-allowed;">🔒 แก้ไขไม่ได้</button>`
      : `<button class="btn btn-ghost btn-sm" onclick="editSubject('${s.id}')">✏️</button>`
  }
  <button class="btn btn-danger btn-sm" onclick="deleteSubject('${s.id}')">🗑</button>
</td>
    </tr>`
      })
      .join("") ||
    '<tr><td colspan="9" class="empty-state">ยังไม่มีรายวิชา</td></tr>'
}

function toggleSubjectSelect(id, checked) {
  if (checked) state.selectedSubjectIds.add(id)
  else state.selectedSubjectIds.delete(id)
  updateSubjectBulkBar()
}

function toggleSelectAllSubjects(checked) {
  document.querySelectorAll(".sub-cb").forEach((cb) => {
    cb.checked = checked
    if (checked) state.selectedSubjectIds.add(cb.value)
    else state.selectedSubjectIds.delete(cb.value)
  })
  updateSubjectBulkBar()
}

function updateSubjectBulkBar() {
  const bar = document.getElementById("subject-bulk-bar")
  const count = state.selectedSubjectIds.size
  document.getElementById("subject-selected-count").textContent =
    `เลือก ${count} รายการ`
  bar.classList.toggle("visible", count > 0)
}

function clearSubjectSelection() {
  state.selectedSubjectIds = new Set()
  document
    .querySelectorAll(".sub-cb")
    .forEach((cb) => (cb.checked = false))
  const allCb = document.getElementById("select-all-subjects")
  if (allCb) allCb.checked = false
  updateSubjectBulkBar()
}

async function deleteSelectedSubjects() {
  const ids = [...state.selectedSubjectIds]
  if (!ids.length) return
  await confirmDeleteSubjects(ids)
}

async function deleteAllSubjects() {
  if (!state.subjects.length) return toast("ไม่มีรายวิชา", "error")
  const ids = state.subjects.map((s) => s.id)
  await confirmDeleteSubjects(ids)
}

async function confirmDeleteSubjects(ids) {
  // Check which have registrations
  const regMap = await api("POST", "/subjects/check-registrations", {
    ids,
  })
  const withReg = ids.filter((id) => regMap[id])
  const noReg = ids.filter((id) => !regMap[id])
  let msg = `จะลบ <strong>${ids.length} วิชา</strong>`
  if (withReg.length > 0) {
    const names = withReg.map(
      (id) => state.subjects.find((s) => s.id === id)?.name || id,
    )
    msg += `<br><br>⚠️ วิชาต่อไปนี้มีนักเรียนลงทะเบียนอยู่ และข้อมูลการลงทะเบียนจะถูกลบด้วย:<br>
<ul style="margin-top:8px; padding-left:20px; color:var(--red);">${names.map((n) => `<li>${n}</li>`).join("")}</ul>`
  }
  msg += "<br><br>ต้องการดำเนินการต่อหรือไม่?"
  showConfirmModal("⚠️ ยืนยันการลบรายวิชา", msg, async () => {
    try {
      await api("POST", "/subjects/bulk-delete", { ids })
      toast(`ลบ ${ids.length} วิชาแล้ว`, "success")
      await loadAll()
      renderSubjectsTable()
    } catch (e) {}
  })
}

// =========== ADD/EDIT SUBJECT MODAL ===========
function showAddSubjectModal() {
  document.getElementById("edit-subject-id").value = ""
  document.getElementById("modal-subject-title").textContent =
    "➕ เพิ่มรายวิชา"
  ;["sub-code", "sub-name"].forEach(
    (id) => (document.getElementById(id).value = ""),
  )
  ;["sub-theory", "sub-practice", "sub-credits"].forEach(
    (id) => (document.getElementById(id).value = "0"),
  )
  openModal("modal-add-subject")
}

function editSubject(id) {
  const s = state.subjects.find((x) => x.id === id)
  if (!s) return
  document.getElementById("edit-subject-id").value = id
  document.getElementById("modal-subject-title").textContent =
    "✏️ แก้ไขรายวิชา"
  document.getElementById("sub-code").value = s.code
  document.getElementById("sub-name").value = s.name
  document.getElementById("sub-theory").value = s.theory_hours
  document.getElementById("sub-practice").value = s.practice_hours
  document.getElementById("sub-credits").value = s.credits
  openModal("modal-add-subject")
}

async function saveSubject() {
  const id = document.getElementById("edit-subject-id").value
  const body = {
    code: document.getElementById("sub-code").value.trim(),
    name: document.getElementById("sub-name").value.trim(),
    theory_hours: +document.getElementById("sub-theory").value,
    practice_hours: +document.getElementById("sub-practice").value,
    credits: +document.getElementById("sub-credits").value,
  }
  if (!body.code || !body.name)
    return toast("กรุณากรอกรหัสและชื่อวิชา", "error")
  try {
    if (id) await api("PUT", "/subjects/" + id, body)
    else await api("POST", "/subjects", body)
    toast(id ? "แก้ไขวิชาสำเร็จ" : "เพิ่มวิชาสำเร็จ", "success")
    closeModal("modal-add-subject")
    await loadAll()
    renderSubjectsTable()
  } catch (e) {}
}

async function deleteSubject(id) {
  const s = state.subjects.find((x) => x.id === id)
  await confirmDeleteSubjects([id])
}

// =========== SCHEDULE PAGE ===========
async function renderSchedulePage() {
  await loadAll()
  const teacherId = state.currentTeacher ? state.currentTeacher.id : ""

  // แผนที่วิชาว่าใครเป็นเจ้าของบ้าง (ดึงจากระบบหลังบ้าน)
  const schedMap = await api("GET", "/subjects/scheduled-map")

  // 1. คำนวณชั่วโมงที่ครูคนนี้จัดลงตารางไปแล้วในแต่ละวิชา
  const myHoursMap = {}
  state.schedules.forEach((s) => {
    if (!myHoursMap[s.subject_id]) myHoursMap[s.subject_id] = 0
    // นับจำนวนคาบที่ลงไป (คาบสิ้นสุด - คาบเริ่มต้น + 1)
    myHoursMap[s.subject_id] += s.period_end - s.period_start + 1
  })

  // จัดกลุ่มวิชาสำหรับแสดงผล
  const availableList = []
  const incompleteList = []
  const otherTakenList = []
  const dropdownOptions = []

  // 2. แยกประเภทวิชาทั้งหมด
  state.subjects.forEach((s) => {
    const totalHours = s.total_hours || s.theory_hours + s.practice_hours
    const ownerInfo = schedMap[s.id]

    if (!ownerInfo) {
      // กรณียังไม่มีใครลงตารางเลย
      availableList.push(s)
      dropdownOptions.push(
        `<option value="${s.id}">${s.code} - ${s.name}</option>`,
      )
    } else if (ownerInfo.teacher_id !== teacherId) {
      // กรณีครูคนอื่นเอาไปลงตารางแล้ว
      otherTakenList.push({ ...s, ownerName: ownerInfo.teacher_name })
      dropdownOptions.push(
        `<option value="${s.id}" disabled>${s.code} - ${s.name} [🔒 ${ownerInfo.teacher_name}]</option>`,
      )
    } else {
      // กรณีเป็นวิชาของครูคนนี้ (กำลังล็อกอินอยู่)
      const myHours = myHoursMap[s.id] || 0
      if (myHours < totalHours) {
        // ลงตารางแล้วแต่ "ยังไม่ครบ"
        incompleteList.push({
          ...s,
          scheduledHours: myHours,
          total: totalHours,
        })
        dropdownOptions.push(
          `<option value="${s.id}">${s.code} - ${s.name} (ขาด ${totalHours - myHours} ชม.)</option>`,
        )
      } else {
        // ลงตาราง "ครบแล้ว"
        dropdownOptions.push(
          `<option value="${s.id}" disabled style="color:var(--green)">${s.code} - ${s.name} [🔒 ลงครบแล้ว]</option>`,
        )
      }
    }
  })

  // 3. วาดรายการช่องซ้ายมือ (ลากวาง)
  const dragList = document.getElementById("unscheduled-drag-list")
  let html = ""
  if (
    !availableList.length &&
    !incompleteList.length &&
    !otherTakenList.length
  ) {
    html =
      '<div class="empty-state" style="padding:20px"><div class="empty-icon">✅</div>ลงตารางครบหมดทุกวิชาแล้ว</div>'
  } else {
    // ส่วนที่ 1: วิชาที่ยังลงไม่ครบ (เน้นสีส้ม)
    if (incompleteList.length) {
      html += `<div style="font-size:10px; color:var(--orange); margin:0 0 6px; font-weight:600; letter-spacing:.5px;">⚠️ ลงตารางสอนยังไม่ครบ</div>`
      html += incompleteList
        .map(
          (s) => `
        <div class="drag-item" style="border-left: 3px solid var(--orange);" draggable="true" ondragstart="onDragStart(event,'${s.id}')" onclick="selectSubjectForSchedule('${s.id}')">
          <span class="drag-handle">⠿</span>
          <div style="flex:1">
            <div class="subject-code">${s.code}</div>
            <div class="subject-name">${s.name}</div>
            <div style="font-size:10px; color:var(--orange)">ต้องการ ${s.total} ชม. / ลงแล้ว ${s.scheduledHours} ชม. <b>(ขาด ${s.total - s.scheduledHours} ชม.)</b></div>
          </div>
        </div>`,
        )
        .join("")
    }
    // ส่วนที่ 2: วิชาที่ว่างอยู่
    if (availableList.length) {
      html += `<div style="font-size:10px; color:var(--text3); margin:12px 0 6px; font-weight:600; letter-spacing:.5px;">📌 วิชาที่ยังไม่ได้ลงตาราง</div>`
      html += availableList
        .map(
          (s) => `
        <div class="drag-item" draggable="true" ondragstart="onDragStart(event,'${s.id}')" onclick="selectSubjectForSchedule('${s.id}')">
          <span class="drag-handle">⠿</span>
          <div style="flex:1">
            <div class="subject-code">${s.code}</div>
            <div class="subject-name">${s.name}</div>
            <div style="font-size:10px; color:var(--text3)">ท.${s.theory_hours} ป.${s.practice_hours} ${s.credits}น. รวม ${s.total_hours}ชม.</div>
          </div>
        </div>`,
        )
        .join("")
    }
    // ส่วนที่ 3: วิชาของครูท่านอื่น
    if (otherTakenList.length) {
      html += `<div style="font-size:10px; color:var(--text3); margin:12px 0 6px; font-weight:600; letter-spacing:.5px; text-transform:uppercase;">🔒 บรรจุโดยครูท่านอื่นแล้ว</div>`
      html += otherTakenList
        .map(
          (s) => `
        <div class="drag-item" style="opacity:.4; cursor:not-allowed;" title="บรรจุโดย ${s.ownerName} แล้ว">
          <span>🔒</span>
          <div style="flex:1">
            <div class="subject-code">${s.code}</div>
            <div class="subject-name">${s.name}</div>
            <div style="font-size:10px; color:var(--text3)">👨‍🏫 ${s.ownerName}</div>
          </div>
          <span class="badge badge-orange">ไม่ว่าง</span>
        </div>`,
        )
        .join("")
    }
  }
  dragList.innerHTML = html

  // 4. อัปเดต Dropdown เลือกวิชา
  const sel = document.getElementById("sched-subject")
  sel.innerHTML =
    '<option value="">-- เลือกวิชา --</option>' + dropdownOptions.join("")

  // 5. อัปเดต Dropdown เลือกครู
  const tsel = document.getElementById("sched-teacher")
  tsel.innerHTML =
    '<option value="">-- เลือกครู --</option>' +
    state.teachers
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join("")
  if (state.currentTeacher) tsel.value = state.currentTeacher.id

  renderSchedulesTable()
  renderSchedDaySlots()
}

function selectSubjectForSchedule(id) {
  document.getElementById("sched-subject").value = id
  const s = state.subjects.find((x) => x.id === id)
  if (s) toast(`เลือกวิชา: ${s.name}`, "success")
}

function onDragStart(e, id) {
  state.draggingSubjectId = id
  e.dataTransfer.effectAllowed = "move"
  document.getElementById("sched-subject").value = id
}

