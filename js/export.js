// =========== TEACHER EXPORT PAGE ===========
async function renderTeacherExportPage() {
  await loadAll()
  const sel = document.getElementById("export-teacher-sel")
  sel.innerHTML =
    '<option value="">-- เลือกครู --</option>' +
    state.teachers
      .map(
        (t) =>
          `<option value="${t.id}" ${state.currentTeacher && t.id === state.currentTeacher.id ? "selected" : ""}>${t.name}</option>`,
      )
      .join("")
  previewTeacherExport()
}

function buildOfficialTimetableHTML(teacher, schedules, semester) {
  // Build day×period grid
  const PERIOD_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const TIMES_START = {
    1: "07:50",
    2: "08:20",
    3: "09:20",
    4: "10:20",
    5: "11:20",
    6: "12:20",
    7: "13:20",
    8: "14:20",
    9: "15:20",
    10: "16:20",
    11: "17:20",
  }
  const TIMES_END = {
    1: "08:20",
    2: "09:20",
    3: "10:20",
    4: "11:20",
    5: "12:20",
    6: "13:20",
    7: "14:20",
    8: "15:20",
    9: "16:20",
    10: "17:20",
    11: "18:20",
  }

  // Map day+period → schedule
  const grid = {}
  DAYS.forEach((d) => (grid[d] = {}))
  schedules.forEach((s) => {
    if (grid[s.day]) {
      for (let p = s.period_start; p <= s.period_end; p++)
        grid[s.day][p] = s
    }
  })

  // Unique subjects list
  const subjectMap = {}
  schedules.forEach((s) => {
    subjectMap[s.subject_id] = s
  })
  const subjList = Object.values(subjectMap)

  // Count total hours per subject
  const hoursMap = {}
  schedules.forEach((s) => {
    if (!hoursMap[s.subject_id])
      hoursMap[s.subject_id] = { theory: 0, practice: 0, credits: 0 }
    const count = s.period_end - s.period_start + 1
    hoursMap[s.subject_id].theory = s.theory_hours || 0
    hoursMap[s.subject_id].practice = s.practice_hours || 0
    hoursMap[s.subject_id].credits = s.credits || 0
  })

  // Total hours summed
  let totalT = 0,
    totalP = 0,
    totalC = 0,
    totalH = 0
  subjList.forEach((s) => {
    totalT += s.theory_hours || 0
    totalP += s.practice_hours || 0
    totalC += s.credits || 0
    totalH += (s.theory_hours || 0) + (s.practice_hours || 0)
  })

  // Build subject rows for left table (show up to 5 per column, 2 columns)
  let subjectRowsHTML = ""
  subjList.forEach((s, i) => {
    subjectRowsHTML += `<tr>
      <td style="text-align:center;font-size:10px;">${i + 1}</td>
      <td style="font-size:9px;">${s.subject_code}</td>
      <td style="font-size:9px;text-align:left;padding-left:3px;">${s.subject_name}</td>
      <td style="text-align:center;font-size:10px;">${s.theory_hours}</td>
      <td style="text-align:center;font-size:10px;">${s.practice_hours}</td>
      <td style="text-align:center;font-size:10px;">${s.credits}</td>
      <td style="text-align:center;font-size:10px;">${(s.theory_hours || 0) + (s.practice_hours || 0)}</td>
    </tr>`
  })

  // Timetable grid rows
  let gridHTML = ""
  // Header row: day col + period cols
  let headCols = `<th style="width:52px;font-size:9px;background:#e8e4f2;border:1px solid #999;">วัน</th>`
  for (let p = 1; p <= 11; p++) {
    headCols += `<th style="font-size:9px;background:#e8e4f2;padding:2px 1px;border:1px solid #999;">
      <div>คาบ ${p}</div>
      <div style="font-weight:normal;font-size:8px;">${PERIOD_TIMES[p]}</div>
    </th>`
  }
  gridHTML += `<tr>${headCols}</tr>`

  DAYS.forEach((day) => {
    let row = `<td style="font-weight:700;font-size:10px;text-align:center;background:#f0eef6;padding:4px 2px;border:1px solid #999;">${day}</td>`
    let skip = 0
    for (let p = 1; p <= 11; p++) {
      if (skip > 0) {
        skip--
        continue
      }
      const s = grid[day][p]
      if (s && s.period_start === p) {
        const span = s.period_end - s.period_start + 1
        skip = span - 1
        const colors = [
          "background:#f3e8ff;border-left:3px solid #7c3aed;",
          "background:#d1fae5;border-left:3px solid #059669;",
          "background:#dbeafe;border-left:3px solid #3b82f6;",
          "background:#fef3c7;border-left:3px solid #d97706;",
          "background:#fce7f3;border-left:3px solid #db2777;",
          "background:#e0f2fe;border-left:3px solid #0284c7;",
        ]
        const subjIdx = subjList.findIndex(
          (x) => x.subject_id === s.subject_id,
        )
        const colorStyle = colors[subjIdx % colors.length] || colors[0]
        row += `<td colspan="${span}" style="padding:2px;vertical-align:middle;border:1px solid #999;">
          <div style="${colorStyle}border-radius:3px;padding:2px 3px;font-size:9px;line-height:1.3;text-align:center;">
            <div style="font-weight:700;font-size:9px;">${s.subject_code}</div>
            <div style="font-size:8px;">${(s.subject_name || "").length > 16 ? (s.subject_name || "").substring(0, 16) + "…" : s.subject_name || ""}</div>
            ${s.room ? `<div style="font-size:7px;opacity:.8;">${s.room}</div>` : ""}
          </div>
        </td>`
      } else {
        row += `<td style="padding:2px;border:1px solid #999;"></td>`
      }
    }
    gridHTML += `<tr style="height:52px;">${row}</tr>`
  })

  const sem = semester || "2/2568"
  const now = new Date()
  const thYear = now.getFullYear() + 543

  return `
<div id="official-tt-doc" style="font-family:'Sarabun',sans-serif;color:#000;background:#fff;padding:16px;max-width:960px;margin:0 auto;">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:8px;">
    <div style="font-size:14px;font-weight:700;">วิทยาลัยเทคนิคน้ำพอง</div>
    <div style="font-size:13px;">ตารางสอนภาคเรียนที่ ${sem} ปีการศึกษา ${thYear}</div>
  </div>

  <!-- Teacher info + subject list side by side -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
    <tr>
<td style="vertical-align:top;width:50%;padding-right:8px;">
  <table style="width:100%;border-collapse:collapse;border:1px solid #999;font-size:11px;">
    <tr><td style="padding:3px 6px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;" colspan="2">ข้อมูลครูผู้สอน</td></tr>
    <tr><td style="padding:3px 6px;border:1px solid #ccc;width:40%;color:#555;">ชื่อ-สกุล</td><td style="padding:3px 6px;border:1px solid #ccc;font-weight:600;">${teacher.name}</td></tr>
    <tr><td style="padding:3px 6px;border:1px solid #ccc;color:#555;">วุฒิการศึกษา</td><td style="padding:3px 6px;border:1px solid #ccc;">${teacher.education || "-"}</td></tr>
    <tr><td style="padding:3px 6px;border:1px solid #ccc;color:#555;">แผนกวิชา</td><td style="padding:3px 6px;border:1px solid #ccc;">${teacher.department || "-"}</td></tr>
    <tr><td style="padding:3px 6px;border:1px solid #ccc;color:#555;">หน้าที่พิเศษ</td><td style="padding:3px 6px;border:1px solid #ccc;">${teacher.special_duty || "-"}</td></tr>
    <tr>
      <td style="padding:3px 6px;border:1px solid #ccc;color:#555;">รวมชั่วโมงสอน</td>
      <td style="padding:3px 6px;border:1px solid #ccc;font-weight:700;">ท.${totalT} ป.${totalP} น.${totalC} รวม ${totalT + totalP} ชม./สัปดาห์</td>
    </tr>
  </table>
</td>
<td style="vertical-align:top;width:50%;">
  <table style="width:100%;border-collapse:collapse;border:1px solid #999;font-size:10px;">
    <thead>
      <tr style="background:#e8e4f2;">
        <th style="padding:3px 2px;border:1px solid #ccc;width:20px;">#</th>
        <th style="padding:3px 2px;border:1px solid #ccc;">รหัสวิชา</th>
        <th style="padding:3px 2px;border:1px solid #ccc;text-align:left;">ชื่อรายวิชา</th>
        <th style="padding:3px 2px;border:1px solid #ccc;">ท.</th>
        <th style="padding:3px 2px;border:1px solid #ccc;">ป.</th>
        <th style="padding:3px 2px;border:1px solid #ccc;">น.</th>
        <th style="padding:3px 2px;border:1px solid #ccc;">ชม.</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRowsHTML}
      <tr style="background:#f5f5f5;font-weight:700;">
        <td colspan="3" style="padding:3px 4px;border:1px solid #ccc;text-align:right;">รวม</td>
        <td style="padding:3px 2px;border:1px solid #ccc;text-align:center;">${totalT}</td>
        <td style="padding:3px 2px;border:1px solid #ccc;text-align:center;">${totalP}</td>
        <td style="padding:3px 2px;border:1px solid #ccc;text-align:center;">${totalC}</td>
        <td style="padding:3px 2px;border:1px solid #ccc;text-align:center;">${totalT + totalP}</td>
      </tr>
    </tbody>
  </table>
</td>
    </tr>
  </table>

  <!-- Timetable grid -->
  <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #999;table-layout:fixed;">
${gridHTML}
    </table>
  </div>
  <div style="font-size:9px;color:#666;margin-top:4px;">⏰ พักกลางวัน 12:20 - 13:20 (ระหว่างคาบ 4 และ 5)</div>

  <!-- Schedule detail table -->
  <div style="margin-top:12px;">
    <div style="font-size:11px;font-weight:700;margin-bottom:4px;">รายละเอียดตารางสอน</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
<thead>
  <tr style="background:#e8e4f2;">
    <th style="padding:3px 4px;border:1px solid #ccc;">วัน</th>
    <th style="padding:3px 4px;border:1px solid #ccc;">คาบ</th>
    <th style="padding:3px 4px;border:1px solid #ccc;">เวลา</th>
    <th style="padding:3px 4px;border:1px solid #ccc;">รหัสวิชา</th>
    <th style="padding:3px 4px;border:1px solid #ccc;text-align:left;">ชื่อวิชา</th>
    <th style="padding:3px 4px;border:1px solid #ccc;">ห้อง</th>
    <th style="padding:3px 4px;border:1px solid #ccc;">กลุ่มเรียน</th>
  </tr>
</thead>
<tbody>
  ${schedules
    .sort(
      (a, b) =>
        DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
        a.period_start - b.period_start,
    )
    .map(
      (s) => `
  <tr>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;">${s.day}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;">คาบ ${s.period_start}-${s.period_end}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;">${PERIOD_TIMES[s.period_start]}-${PERIOD_END[s.period_end]}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;">${s.subject_code}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;">${s.subject_name}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;">${s.room || "-"}</td>
    <td style="padding:3px 4px;border:1px solid #ccc;text-align:center;font-size:9px;">${s.group_code || "-"}</td>
  </tr>`,
    )
    .join("")}
</tbody>
    </table>
  </div>

  <!-- Signature row -->
  <table style="width:100%;margin-top:20px;font-size:10px;border-collapse:collapse;">
    <tr>
<td style="text-align:center;width:33%;padding:4px;">
  <div style="border-top:1px solid #000;display:inline-block;min-width:120px;padding-top:2px;">หัวหน้าแผนกวิชา</div>
</td>
<td style="text-align:center;width:33%;padding:4px;">
  <div style="border-top:1px solid #000;display:inline-block;min-width:120px;padding-top:2px;">หัวหน้างานพัฒนาหลักสูตรฯ</div>
</td>
<td style="text-align:center;width:33%;padding:4px;">
  <div style="border-top:1px solid #000;display:inline-block;min-width:120px;padding-top:2px;">ผู้อำนวยการ</div>
</td>
    </tr>
  </table>
</div>`
}

async function previewTeacherExport() {
  const teacherId = document.getElementById("export-teacher-sel").value
  const preview = document.getElementById("teacher-export-preview")
  if (!teacherId) {
    preview.innerHTML = ""
    return
  }
  const teacher = state.teachers.find((t) => t.id === teacherId)
  const schedules = await api(
    "GET",
    "/teacher-schedules?teacher_id=" + teacherId,
  )
  if (!schedules.length) {
    preview.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div>ยังไม่มีตารางสอน</div>'
    return
  }
  schedules.forEach((s, i) => {
    if (!subjectColorMap[s.subject_id])
      subjectColorMap[s.subject_id] = COLORS[i % COLORS.length]
  })
  preview.innerHTML = buildOfficialTimetableHTML(teacher, schedules)
}

async function exportTeacherTimetablePrint() {
  const teacherId = document.getElementById("export-teacher-sel").value
  if (!teacherId) return toast("กรุณาเลือกครูก่อน", "error")
  const teacher = state.teachers.find((t) => t.id === teacherId)
  const schedules = await api(
    "GET",
    "/teacher-schedules?teacher_id=" + teacherId,
  )
  if (!schedules.length) return toast("ยังไม่มีตารางสอน", "error")
  const docHTML = buildOfficialTimetableHTML(teacher, schedules)
  const win = window.open("", "_blank")
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>ตารางสอน — ${teacher.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Sarabun',sans-serif; font-size:12px; color:#000; background:#fff; }
      table { border-collapse:collapse; }
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        td, th { border:1px solid #999 !important; }
      }
    </style></head><body>`)
  win.document.write(docHTML)
  win.document.write("</body></html>")
  win.document.close()
  setTimeout(() => {
    win.focus()
    win.print()
  }, 800)
}

function exportTeacherCSV() {
  const teacherId = document.getElementById("export-teacher-sel").value
  if (!teacherId) return toast("กรุณาเลือกครู", "error")
  const teacher = state.teachers.find((t) => t.id === teacherId)
  const schedules = state.schedules.filter ? state.schedules : []
  // Fetch fresh then export
  api("GET", "/teacher-schedules?teacher_id=" + teacherId).then(
    (scheds) => {
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
          "กลุ่ม",
        ],
      ]
      scheds.forEach((s) =>
        rows.push([
          s.subject_code,
          s.subject_name,
          s.day,
          s.period_start,
          s.period_end,
          PERIOD_TIMES[s.period_start],
          PERIOD_END[s.period_end],
          s.room || "",
          s.group_code || "",
        ]),
      )
      downloadCSV(rows, `ตารางสอน_${teacher.name}.csv`)
    },
  )
}

