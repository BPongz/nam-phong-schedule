// =========== STUDENT DASHBOARD ===========
async function renderStudentDashboard() {
  const el = document.getElementById("student-info-card")
  if (!state.currentStudent) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div>กรุณาเลือกนักเรียนก่อน
<br><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="showSelectUserModal()">เลือกนักเรียน</button></div>`
    document.getElementById("teacher-request-card").style.display = "none"
    return
  }
  document.getElementById("teacher-request-card").style.display = ""
  const s = state.currentStudent
  el.innerHTML = `
    <div class="form-row">
<div>
  <div class="info-row"><span class="info-key">ชื่อ-สกุล</span><span class="info-val">${s.name}</span></div>
  <div class="info-row"><span class="info-key">กลุ่มเรียน</span><span class="info-val">${s.group_code}</span></div>
</div>
    </div>`

  const regs = await api("GET", "/registrations/" + s.id)
  state.myRegistrations = regs
  document.getElementById("s-stat-reg").textContent = regs.length
  document.getElementById("s-stat-credits").textContent = regs.reduce(
    (sum, r) => sum + (r.credits || 0),
    0,
  )

  // Show enrollment requests for this student
  await renderStudentRequests()

  // Populate teacher selector — exclude already-approved teachers
  await loadAll()
  const existingRequests = await api(
    "GET",
    "/enrollment-requests/student/" + s.id,
  )
  const approvedTeacherIds = new Set(
    existingRequests
      .filter((r) => r.status === "approved")
      .map((r) => r.teacher_id),
  )
  const reqSel = document.getElementById("req-teacher-sel")
  const availableTeachers = state.teachers.filter(
    (t) => !approvedTeacherIds.has(t.id),
  )
  reqSel.innerHTML =
    '<option value="">-- เลือกครูผู้สอน --</option>' +
    availableTeachers
      .map(
        (t) =>
          `<option value="${t.id}">${t.name} (${t.department})</option>`,
      )
      .join("")
  // Hide request section if no teachers available
  const reqSection =
    reqSel
      .closest(".card-body")
      .querySelector('div[style*="display: flex"]') ||
    reqSel.parentElement
  if (!availableTeachers.length) {
    reqSel.closest('div[style*="flex"]') &&
      (reqSel.closest('div[style*="flex"]').style.display = "none")
  }
}

async function renderStudentRequests() {
  if (!state.currentStudent) return
  const requests = await api(
    "GET",
    "/enrollment-requests/student/" + state.currentStudent.id,
  )
  const el = document.getElementById("my-requests-list")
  if (!requests.length) {
    el.innerHTML =
      '<div style="color:var(--text3); font-size:12px; padding:8px 0;">ยังไม่ได้ส่งคำขอ</div>'
    return
  }
  el.innerHTML = requests
    .map(
      (r) => `
    <div class="request-item" style="margin-bottom:8px;">
<span>👨‍🏫</span>
<div style="flex:1">
  <div style="font-weight:600; font-size:13px;">${r.teacher_name}</div>
  <div style="font-size:11px; color:var(--text3);">${r.teacher_dept}</div>
  ${r.status === "revoked" ? `<div style="font-size:10px; color:var(--red); margin-top:2px;">⚠️ ถอนเมื่อ: ${new Date(r.updated_at).toLocaleDateString("th-TH")} เวลา ${new Date(r.updated_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>` : ""}
</div>
<span class="request-status ${r.status === "pending" ? "req-pending" : r.status === "approved" ? "req-approved" : "req-rejected"}">
  ${r.status === "pending" ? "⏳ รออนุมัติ" : r.status === "approved" ? "✅ อนุมัติแล้ว" : r.status === "revoked" ? "⚠️ ถูกถอนรายวิชา" : "❌ ปฏิเสธ"}
</span>
    </div>`,
    )
    .join("")
}

async function sendEnrollmentRequest() {
  if (!state.currentStudent)
    return toast("กรุณาเลือกนักเรียนก่อน", "error")
  const teacherId = document.getElementById("req-teacher-sel").value
  if (!teacherId) return toast("กรุณาเลือกครูผู้สอน", "error")
  try {
    await api("POST", "/enrollment-requests", {
      student_id: state.currentStudent.id,
      teacher_id: teacherId,
    })
    toast("ส่งคำขอแล้ว รอครูอนุมัติ ✅", "success")
    await renderStudentRequests()
  } catch (e) {}
}

// =========== STUDENT REGISTER ===========
async function renderStudentRegister() {
  if (!state.currentStudent) {
    document.getElementById("available-subjects-panel").innerHTML =
      '<div class="empty-state"><div class="empty-icon">👤</div>กรุณาเลือกนักเรียนก่อน</div>'
    return
  }

  // Check approved teacher
  const requests = await api(
    "GET",
    "/enrollment-requests/student/" + state.currentStudent.id,
  )
  const approved = requests.filter((r) => r.status === "approved")

  const infoEl = document.getElementById("student-teacher-info")
  if (!approved.length) {
    infoEl.innerHTML = `<div class="card"><div class="card-body" style="text-align:center; padding:24px;">
<div style="font-size:36px; margin-bottom:8px;">🕐</div>
<div style="color:var(--text2);">กรุณาส่งคำขอลงทะเบียนกับครูผู้สอนก่อน แล้วรอการอนุมัติ</div>
<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="navigate('s-dashboard')">ไปส่งคำขอ</button>
    </div></div>`
    document.getElementById("available-subjects-panel").innerHTML =
      '<div class="empty-state"><div class="empty-icon">⏳</div>รอการอนุมัติจากครู</div>'
    document.getElementById("registered-subjects-panel").innerHTML = ""
    return
  }

  // ดึง ID ของครูทุกคนที่อนุมัติแล้วมาเก็บไว้เป็น Array
  const approvedTeacherIds = approved.map((r) => r.teacher_id)

  infoEl.innerHTML = `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
    ${approved.map((r) => `<span class="badge badge-green">✅ อนุมัติโดย ${r.teacher_name}</span>`).join("")}
  </div>`

  // ดึงตารางสอนทั้งหมด (ไม่ต้องส่ง ID ครูคนเดียวแล้ว)
  let [available, regs] = await Promise.all([
    api("GET", "/available-schedules/" + state.currentStudent.id),
    api("GET", "/registrations/" + state.currentStudent.id),
  ])

  // กรองเอาเฉพาะวิชาที่เปิดสอนโดย "ครูทุกคน" ที่อนุมัติแล้ว
  available = available.filter((s) =>
    approvedTeacherIds.includes(s.teacher_id),
  )

  state.availableSchedules = available
  state.myRegistrations = regs

  // Auto-register all available subjects
  if (available.length) {
    let autoRegistered = 0
    for (const s of available) {
      // ตรวจสอบตารางชนก่อนลงทะเบียนอัตโนมัติ
      const hasConflict = regs.some(
        (r) =>
          r.day === s.day &&
          !(
            r.period_end < s.period_start || r.period_start > s.period_end
          ),
      )

      if (!hasConflict) {
        try {
          await api("POST", "/registrations", {
            student_id: state.currentStudent.id,
            subject_id: s.subject_id,
            teacher_schedule_id: s.id,
          })
          autoRegistered++
          // เพิ่มวิชาที่ลงสำเร็จเข้า regs ชั่วคราวเพื่อเช็คชนในลูปถัดไป
          regs.push({
            ...s,
            period_start: s.period_start,
            period_end: s.period_end,
            day: s.day,
          })
        } catch (e) {}
      }
    }
    if (autoRegistered > 0) {
      toast(`ลงทะเบียนอัตโนมัติ ${autoRegistered} วิชา ✅`, "success")
      // Reload after auto-register
      const resData = await Promise.all([
        api("GET", "/available-schedules/" + state.currentStudent.id),
        api("GET", "/registrations/" + state.currentStudent.id),
      ])
      available = resData[0].filter((s) =>
        approvedTeacherIds.includes(s.teacher_id),
      )
      regs = resData[1]
      state.availableSchedules = available
      state.myRegistrations = regs
    }
  }

  const avEl = document.getElementById("available-subjects-panel")
  const regEl = document.getElementById("registered-subjects-panel")

  if (!available.length) {
    avEl.innerHTML =
      '<div class="empty-state"><div class="empty-icon">🎉</div>ลงทะเบียนครบทุกวิชาแล้ว</div>'
  } else {
    avEl.innerHTML = available
      .map((s) => {
        const colorClass =
          subjectColorMap[s.subject_id || s.id] || "color-1"

        const hasConflict = regs.some(
          (r) =>
            r.day === s.day &&
            !(
              r.period_end < s.period_start ||
              r.period_start > s.period_end
            ),
        )

        if (hasConflict) {
          return `<div class="drag-item" style="opacity:0.6; cursor:not-allowed;">
            <div class="tt-subject ${colorClass}" style="width:8px; height:40px; border-radius:4px; flex-shrink:0;"></div>
            <div style="flex:1">
              <div class="subject-code">${s.subject_code}</div>
              <div class="subject-name">${s.subject_name}</div>
              <div style="font-size:10px; color:var(--text3)">${s.day} คาบ ${s.period_start}-${s.period_end} | ${s.room || "-"}</div>
              <div style="font-size:10px; color:var(--red); font-weight:600; margin-top:2px;">⚠️ เวลาเรียนชนกับวิชาอื่น</div>
            </div>
            <button class="btn btn-ghost btn-sm" disabled>+ ลง</button>
          </div>`
        } else {
          return `<div class="drag-item" style="cursor:pointer" onclick="registerSubject('${s.id}','${s.subject_id}')">
            <div class="tt-subject ${colorClass}" style="width:8px; height:40px; border-radius:4px; flex-shrink:0;"></div>
            <div style="flex:1">
              <div class="subject-code">${s.subject_code}</div>
              <div class="subject-name">${s.subject_name}</div>
              <div style="font-size:10px; color:var(--text3)">${s.day} คาบ ${s.period_start}-${s.period_end} | ${s.room || "-"} | ${s.credits} น.</div>
            </div>
            <button class="btn btn-success btn-sm">+ ลง</button>
          </div>`
        }
      })
      .join("")
  }

  if (!regs.length) {
    regEl.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div>ยังไม่ได้ลงทะเบียนวิชาใด</div>'
  } else {
    regEl.innerHTML = regs
      .map((r) => {
        const colorClass = subjectColorMap[r.subject_id] || "color-1"
        return `<div class="drag-item">
  <div class="tt-subject ${colorClass}" style="width:8px; height:40px; border-radius:4px; flex-shrink:0;"></div>
  <div style="flex:1">
    <div class="subject-code">${r.subject_code}</div>
    <div class="subject-name">${r.subject_name}</div>
    <div style="font-size:10px; color:var(--text3)">${r.day} คาบ ${r.period_start}-${r.period_end} | ${r.room || "-"} | ครู${r.teacher_name}</div>
  </div>
  <button class="btn btn-danger btn-sm" onclick="unregisterSubject('${r.id}')">ถอน</button>
</div>`
      })
      .join("")
  }
}

async function registerSubject(scheduleId, subjectId) {
  if (!state.currentStudent)
    return toast("กรุณาเลือกนักเรียนก่อน", "error")
  try {
    await api("POST", "/registrations", {
      student_id: state.currentStudent.id,
      subject_id: subjectId,
      teacher_schedule_id: scheduleId,
    })
    toast("ลงทะเบียนวิชาสำเร็จ", "success")
    renderStudentRegister()
  } catch (e) {}
}

async function unregisterSubject(regId) {
  if (!confirm("ต้องการถอนวิชานี้?")) return
  await api("DELETE", "/registrations/" + regId)
  toast("ถอนวิชาแล้ว", "success")
  renderStudentRegister()
}

async function renderStudentTimetable() {
  if (!state.currentStudent) {
    document.getElementById("student-timetable-wrap").innerHTML =
      '<div class="empty-state"><div class="empty-icon">👤</div>กรุณาเลือกนักเรียนก่อน</div>'
    return
  }
  const regs = await api(
    "GET",
    "/registrations/" + state.currentStudent.id,
  )
  if (!regs.length) {
    document.getElementById("student-timetable-wrap").innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div>ยังไม่ได้ลงทะเบียนวิชาใด<br><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="navigate(\'s-register\')">ลงทะเบียนเลย</button></div>'
    return
  }
  renderTimetable(regs, "student-timetable-wrap", { showTeacher: true })
}

// =========== STUDENT EXPORT PAGE ===========
async function renderStudentExportPage() {
  if (!state.currentStudent) {
    document.getElementById("student-export-preview").innerHTML =
      '<div class="empty-state"><div class="empty-icon">👤</div>กรุณาเลือกนักเรียนก่อน</div>'
    return
  }
  const s = state.currentStudent
  document.getElementById("s-export-info").textContent =
    `นักเรียน: ${s.name} | กลุ่ม: ${s.group_code}`
  const regs = await api("GET", "/registrations/" + s.id)
  const preview = document.getElementById("student-export-preview")
  if (!regs.length) {
    preview.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div>ยังไม่ได้ลงทะเบียนวิชาใด</div>'
    return
  }
  preview.innerHTML = `
    <div class="card">
<div class="card-header"><div class="card-title">📋 ตัวอย่างตารางเรียน — ${s.name}</div></div>
<div class="card-body">
  <div id="s-export-tt-wrap"></div>
  <div style="margin-top:16px;">
    <table>
      <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>วัน</th><th>คาบ</th><th>เวลา</th><th>ห้อง</th><th>ครูผู้สอน</th></tr></thead>
      <tbody>${regs
        .sort(
          (a, b) =>
            DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
            a.period_start - b.period_start,
        )
        .map(
          (r) => `
        <tr><td>${r.subject_code}</td><td>${r.subject_name}</td><td>${r.day}</td>
        <td>คาบ${r.period_start}-${r.period_end}</td>
        <td>${PERIOD_TIMES[r.period_start]}-${PERIOD_END[r.period_end]}</td>
        <td>${r.room || "-"}</td><td>${r.teacher_name || "-"}</td></tr>`,
        )
        .join("")}
      </tbody>
    </table>
  </div>
</div>
    </div>`
  renderTimetable(regs, "s-export-tt-wrap", { showTeacher: true })
}

function exportStudentTimetablePrint() {
  if (!state.currentStudent) return toast("ไม่มีข้อมูลตารางเรียน", "error")
  const s = state.currentStudent
  const regs = state.myRegistrations
  if (!regs || !regs.length) return toast("ยังไม่ได้ลงทะเบียนวิชาใด", "error")

  // สีวิชา (6 สี)
  const PRINT_COLORS = [
    { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
    { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
    { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
    { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" },
  ]
  const colorKeys = Object.keys(subjectColorMap)
  const getColor = (subjectId) => {
    const idx = parseInt((subjectColorMap[subjectId] || "color-1").replace("color-", "")) - 1
    return PRINT_COLORS[idx] || PRINT_COLORS[0]
  }

  // สร้าง map วัน → คาบ → schedule
  const dayPeriods = {}
  DAYS.forEach((d) => (dayPeriods[d] = {}))
  regs.forEach((r) => {
    for (let p = r.period_start; p <= r.period_end; p++)
      dayPeriods[r.day][p] = r
  })

  // สร้าง timetable grid (HTML table)
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  let ttRows = ""
  DAYS.forEach((day) => {
    let cells = `<td style="font-weight:700;background:#f3f4f6;padding:6px 10px;border:1px solid #d1d5db;white-space:nowrap;font-size:12px;">${day}</td>`
    let skip = 0
    PERIODS.forEach((p) => {
      if (skip > 0) { skip--; return }
      if (p === 5) {
        cells += `<td style="background:#fafafa;border:1px solid #d1d5db;text-align:center;font-size:10px;color:#9ca3af;">พัก</td>`
        return
      }
      const r = dayPeriods[day][p]
      if (r && r.period_start === p) {
        const span = r.period_end - r.period_start + 1
        skip = span - 1
        const c = getColor(r.subject_id)
        cells += `<td colspan="${span}" style="border:1px solid #d1d5db;padding:4px;text-align:center;background:${c.bg};color:${c.color};">
          <div style="font-weight:700;font-size:11px;">${r.subject_code}</div>
          <div style="font-size:9px;line-height:1.3;">${(r.subject_name || "").substring(0, 18)}</div>
          ${r.room ? `<div style="font-size:9px;opacity:.8;">${r.room}</div>` : ""}
          ${r.teacher_name ? `<div style="font-size:9px;opacity:.7;">${r.teacher_name.replace("นาย","").replace("นางสาว","").replace("นาง","")}</div>` : ""}
        </td>`
      } else {
        cells += `<td style="border:1px solid #d1d5db;"></td>`
      }
    })
    ttRows += `<tr>${cells}</tr>`
  })

  const ttHeadCells = PERIODS.map((p) =>
    p === 5
      ? `<th style="background:#f3f4f6;border:1px solid #d1d5db;padding:5px 3px;font-size:10px;color:#6b7280;">☕<br>พัก</th>`
      : `<th style="background:#f3f4f6;border:1px solid #d1d5db;padding:5px 3px;font-size:10px;min-width:52px;">คาบ${p}<br><span style="font-weight:400;color:#6b7280;">${PERIOD_TIMES[p]}</span></th>`
  ).join("")

  // สร้าง list table
  const listRows = [...regs]
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period_start - b.period_start)
    .map((r) => `<tr>
      <td>${r.subject_code}</td>
      <td style="text-align:left;">${r.subject_name}</td>
      <td>${r.day}</td>
      <td>คาบ ${r.period_start}–${r.period_end}</td>
      <td>${PERIOD_TIMES[r.period_start]}–${PERIOD_END[r.period_end]}</td>
      <td>${r.room || "-"}</td>
      <td>${r.teacher_name || "-"}</td>
    </tr>`).join("")

  const win = window.open("", "_blank")
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>ตารางเรียน — ${s.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 24px; }
    h2 { margin: 0 0 4px; font-size: 16px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 16px; }
    .section-title { font-weight: 700; font-size: 13px; margin: 18px 0 8px; color: #374151; }
    .tt-wrap { overflow-x: auto; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: center; font-size: 12px; }
    thead th { background: #f3f4f6; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .note { font-size: 11px; color: #6b7280; margin-top: 8px; }
    @media print {
      body { padding: 10px; }
      .tt-wrap { overflow: visible; }
    }
  </style></head><body>
  <h2>ตารางเรียน — ${s.name}</h2>
  <div class="sub">กลุ่มเรียน: ${s.group_code || "-"} &nbsp;|&nbsp; ปีการศึกษา: ${state.config?.semester || ""}</div>

  <div class="section-title">📅 ตารางเรียน</div>
  <div class="tt-wrap">
    <table style="min-width:700px;">
      <thead><tr>
        <th style="background:#f3f4f6;min-width:60px;">วัน</th>
        ${ttHeadCells}
      </tr></thead>
      <tbody>${ttRows}</tbody>
    </table>
  </div>
  <div class="note">⏰ พักกลางวัน 12:20 – 13:20 (ระหว่างคาบ 4 และ 5)</div>

  <div class="section-title">📋 รายวิชาที่ลงทะเบียน</div>
  <table>
    <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>วัน</th><th>คาบ</th><th>เวลา</th><th>ห้อง</th><th>ครูผู้สอน</th></tr></thead>
    <tbody>${listRows}</tbody>
  </table>
</body></html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

function exportStudentCSV() {
  if (!state.currentStudent) return
  const s = state.currentStudent
  api("GET", "/registrations/" + s.id).then((regs) => {
    const rows = [
      [
        "รหัสวิชา",
        "ชื่อวิชา",
        "วัน",
        "คาบเริ่ม",
        "คาบสิ้นสุด",
        "เวลาเริ่ม",
        "เวลาสิ้นสุด",
        "ห้องเรียน",
        "ครูผู้สอน",
      ],
    ]
    regs.forEach((r) =>
      rows.push([
        r.subject_code,
        r.subject_name,
        r.day,
        r.period_start,
        r.period_end,
        PERIOD_TIMES[r.period_start],
        PERIOD_END[r.period_end],
        r.room || "",
        r.teacher_name || "",
      ]),
    )
    downloadCSV(rows, `ตารางเรียน_${s.name}.csv`)
  })
}

function downloadCSV(rows, filename) {
  const bom = "\uFEFF" // UTF-8 BOM for Thai
  const csv =
    bom +
    rows
      .map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast("ดาวน์โหลด CSV แล้ว ✅", "success")
}

