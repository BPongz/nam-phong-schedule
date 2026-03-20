// =========== TIMETABLE RENDER ===========
function renderTimetable(schedules, containerId, options = {}) {
  const wrap = document.getElementById(containerId)
  const dayPeriods = {}
  DAYS.forEach((d) => (dayPeriods[d] = {}))
  schedules.forEach((s) => {
    if (!dayPeriods[s.day]) return
    for (let p = s.period_start; p <= s.period_end; p++)
      dayPeriods[s.day][p] = s
  })

  let html = `<div class="scroll-x"><div class="timetable">
    <div class="timetable-head" style="grid-template-columns:80px repeat(11,1fr)">
<div class="tt-head-cell">วัน</div>`
  for (let p = 1; p <= 11; p++) {
    html += `<div class="tt-head-cell">คาบ ${p}<br><small>${PERIOD_TIMES[p]}</small></div>`
  }
  html += '</div><div class="timetable-body">'

  DAYS.forEach((day) => {
    html += `<div class="timetable-row" style="grid-template-columns:80px repeat(11,1fr)">
<div class="tt-cell tt-day">${day}</div>`
    let skip = 0
    for (let p = 1; p <= 11; p++) {
      const s = dayPeriods[day][p]
      if (skip > 0) {
        skip--
        continue
      }
      if (s && s.period_start === p) {
        const span = s.period_end - s.period_start + 1
        skip = span - 1
        const colorClass = subjectColorMap[s.subject_id] || "color-1"
        html += `<div class="tt-cell" style="grid-column:span ${span}">
    <div class="tt-subject ${colorClass}">
      <div style="font-weight:700">${s.subject_code || s.code}</div>
      <div style="font-size:9px">${(s.subject_name || s.name || "").substring(0, 20)}</div>
      ${s.room ? `<div style="font-size:9px; opacity:.7">${s.room}</div>` : ""}
      ${options.showTeacher && s.teacher_name ? `<div style="font-size:9px; opacity:.7">👨‍🏫${s.teacher_name.replace("นาย", "").replace("นางสาว", "")}</div>` : ""}
    </div>
  </div>`
      } else {
        html += `<div class="tt-cell"></div>`
      }
    }
    html += "</div>"
  })
  html += "</div></div></div>"
  html += `<div style="margin-top:8px; font-size:11px; color:var(--text3);">⏰ พักกลางวัน 12:20 - 13:20 (ระหว่างคาบ 4 และ 5)</div>`
  wrap.innerHTML = html
}

async function renderTeacherTimetable() {
  await loadAll()
  renderTimetable(state.schedules, "teacher-timetable-wrap")
  const uniqueSubjects = {}
  state.schedules.forEach((s) => {
    uniqueSubjects[s.subject_id] = s
  })
  const tbody = document.getElementById("teacher-subjects-summary")
  tbody.innerHTML = Object.values(uniqueSubjects)
    .map(
      (s) => `
    <tr>
<td><span class="badge badge-blue">${s.subject_code}</span></td>
<td>${s.subject_name}</td>
<td>${s.theory_hours}</td><td>${s.practice_hours}</td><td>${s.credits}</td>
<td>${s.theory_hours + s.practice_hours} ชม.</td>
    </tr>`,
    )
    .join("")
}

// =========== APPROVAL PAGE ===========
async function renderApprovalPage() {
  await loadAll()
  if (!state.currentTeacher) {
    document.getElementById("approve-list").innerHTML =
      '<div class="empty-state"><div class="empty-icon">👨‍🏫</div>กรุณาเลือกครูก่อน</div>'
    return
  }
  const requests = await api(
    "GET",
    "/enrollment-requests/teacher/" + state.currentTeacher.id,
  )
  const filtered = requests.filter(
    (r) => r.status === state.currentApproveTab,
  )

  // Update pending tab count
  const pendingCount = requests.filter(
    (r) => r.status === "pending",
  ).length
  const tabBadge = document.getElementById("tab-pending-count")
  tabBadge.textContent = pendingCount || ""
  tabBadge.style.display = pendingCount ? "" : "none"

  // Update sidebar badge
  const badge = document.getElementById("pending-badge")
  if (pendingCount > 0) {
    badge.textContent = pendingCount
    badge.style.display = ""
  } else badge.style.display = "none"

  const el = document.getElementById("approve-list")
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">${state.currentApproveTab === "pending" ? "🕐" : "📋"}</div>${
      state.currentApproveTab === "pending"
        ? "ไม่มีคำขอรออนุมัติ"
        : state.currentApproveTab === "approved"
          ? "ยังไม่มีที่อนุมัติ"
          : state.currentApproveTab === "rejected"
            ? "ยังไม่มีที่ปฏิเสธ"
            : "ยังไม่มีรายการถูกถอน"
    }</div>`
    return
  }
  el.innerHTML = filtered
    .map(
      (r) => `
    <div class="request-item">
<div style="flex:1">
  <div style="font-weight:600">${r.student_name}</div>
  <div style="font-size:11px; color:var(--text3)">รหัส: ${r.student_code} | กลุ่ม: ${r.group_code}</div>
  <div style="font-size:10px; color:var(--text3); margin-top:2px;">ส่งคำขอ: ${new Date(r.created_at).toLocaleDateString("th-TH")} ${r.status === "revoked" ? `| <span style="color:var(--red)">⚠️ ถอนเมื่อ: ${new Date(r.updated_at).toLocaleDateString("th-TH")} เวลา ${new Date(r.updated_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>` : ""}</div>
</div>
<span class="request-status ${r.status === "pending" ? "req-pending" : r.status === "approved" ? "req-approved" : "req-rejected"}">
  ${r.status === "pending" ? "⏳ รอ" : r.status === "approved" ? "✅ อนุมัติ" : r.status === "revoked" ? "⚠️ ถูกถอน" : "❌ ปฏิเสธ"}
</span>
<div style="display: flex; gap: 8px;">
${
  r.status === "pending"
    ? `
  <button class="btn btn-success btn-sm" onclick="approveRequest('${r.id}')">✅ อนุมัติ</button>
  <button class="btn btn-danger btn-sm" onclick="rejectRequest('${r.id}')">❌ ปฏิเสธ</button>
`
    : r.status === "approved"
      ? `
  <button class="btn btn-warning btn-sm" onclick="revokeRequest('${r.id}')">⚠️ ยกเลิกอนุมัติและถอนวิชา</button>
`
      : ""
}
</div>
    </div>`,
    )
    .join("")
}

function switchApproveTab(tab) {
  state.currentApproveTab = tab
  document.querySelectorAll("#page-t-approve .tab").forEach((t, i) => {
    t.classList.toggle(
      "active",
      ["pending", "approved", "rejected", "revoked"][i] === tab, // เพิ่ม "revoked" เข้าไป
    )
  })
  renderApprovalPage()
}

async function approveRequest(id) {
  await api("PUT", "/enrollment-requests/" + id, { status: "approved" })
  toast("อนุมัติแล้ว ✅", "success")
  renderApprovalPage()
}

async function rejectRequest(id) {
  await api("PUT", "/enrollment-requests/" + id, { status: "rejected" })
  toast("ปฏิเสธแล้ว", "success")
  renderApprovalPage()
}

// =========== TEACHER EXPORT PAGE ===========
