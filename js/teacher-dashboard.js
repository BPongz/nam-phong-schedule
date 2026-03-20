// =========== TEACHER DASHBOARD ===========
async function renderTeacherDashboard() {
  await loadAll()
  const teacherId = state.currentTeacher ? state.currentTeacher.id : ""
  const unregistered = await api("GET", "/teacher-schedules/unregistered")
  // const unregistered = await api(
  //   "GET",
  //   "/teacher-schedules/unregistered" +
  //     (teacherId ? "?teacher_id=" + teacherId : ""),
  // )
  const scheduled = state.subjects.length - unregistered.length
  document.getElementById("stat-subjects").textContent =
    state.subjects.length
  document.getElementById("stat-scheduled").textContent = scheduled
  document.getElementById("stat-unscheduled").textContent =
    unregistered.length
  document.getElementById("stat-students").textContent =
    state.students.length

  // pending requests
  if (state.currentTeacher) {
    const reqs = await api(
      "GET",
      "/enrollment-requests/teacher/" + state.currentTeacher.id,
    )
    const pendingCount = reqs.filter((r) => r.status === "pending").length
    document.getElementById("stat-pending").textContent = pendingCount
    const badge = document.getElementById("pending-badge")
    if (pendingCount > 0) {
      badge.textContent = pendingCount
      badge.style.display = ""
    } else badge.style.display = "none"
  }

  const el = document.getElementById("unregistered-subjects-list")
  if (!unregistered.length) {
    el.innerHTML =
      '<div class="empty-state"><div class="empty-icon">🎉</div>ลงตารางสอนครบทุกวิชาแล้ว!</div>'
  } else {
    el.innerHTML = unregistered
      .map(
        (s) => `
<div class="drag-item" style="margin-bottom:8px;">
  <span class="drag-handle">⚠️</span>
  <div><div class="subject-code">${s.code}</div><div class="subject-name">${s.name}</div></div>
  <div style="margin-left:auto; display:flex; gap:6px; align-items:center;">
    <span class="badge badge-orange">${s.theory_hours}ท. ${s.practice_hours}ป. ${s.credits}น.</span>
    <button class="btn btn-primary btn-sm" onclick="navigate('t-schedule')">ลงตาราง</button>
  </div>
</div>`,
      )
      .join("")
  }
}

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

