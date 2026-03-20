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

// =========== MULTI-DAY SCHEDULE SLOTS ===========
// state.schedDaySlots = [{day, periodStart, periodEnd, room}, ...]

function buildPeriodPickerHTML(slotIdx, occupiedSet) {
  const TIMES = [
    "08:20",
    "09:20",
    "10:20",
    "11:20",
    "",
    "13:20",
    "14:20",
    "15:20",
    "16:20",
    "17:20",
    "18:20",
  ]
  const occ = occupiedSet || new Set()
  let html =
    '<div class="period-picker" style="margin-top:6px;" data-slot-picker="' +
    slotIdx +
    '">'
  for (let p = 1; p <= 11; p++) {
    if (p === 5) {
      html +=
        '<div class="period-btn break"><div>☕</div><small style="font-size:8px">พัก</small></div>'
    } else {
      const time = TIMES[p - 1]
      if (occ.has(p)) {
        html += `<div class="period-btn" data-period="${p}" style="background:rgba(220,38,38,0.1);border-color:rgba(220,38,38,0.3);color:#b91c1c;cursor:not-allowed;" title="คาบนี้ถูกใช้แล้ว"><div>${p}</div><small style="font-size:8px">${time}</small><small style="font-size:7px;color:#b91c1c">🔒ไม่ว่าง</small></div>`
      } else {
        html += `<div class="period-btn" data-period="${p}" onclick="toggleSlotPeriod(${slotIdx},${p})"><div>${p}</div><small style="font-size:8px">${time}</small></div>`
      }
    }
  }
  html += "</div>"
  return html
}

async function renderSchedDaySlots() {
  const cont = document.getElementById("sched-day-slots")
  if (!cont) return
  const subjectId = document.getElementById("sched-subject").value
  const teacherId = document.getElementById("sched-teacher")
    ? document.getElementById("sched-teacher").value
    : ""
  const subj = state.subjects.find((s) => s.id === subjectId)
  const totalHours = subj ? subj.theory_hours + subj.practice_hours : 0

  // 1. คำนวณชั่วโมงที่เคยลงตารางไปแล้วของวิชานี้ (ดึงจากฐานข้อมูล)
  let prevHours = 0
  if (subjectId && teacherId) {
    state.schedules.forEach((s) => {
      if (s.subject_id === subjectId && s.teacher_id === teacherId) {
        prevHours += s.period_end - s.period_start + 1
      }
    })
  }

  // 2. คำนวณชั่วโมงที่กำลังเลือกในฟอร์มปัจจุบัน
  const formHours = state.schedDaySlots.reduce((sum, sl) => {
    if (sl.periodStart && sl.periodEnd)
      return sum + (sl.periodEnd - sl.periodStart + 1)
    return sum
  }, 0)

  // 3. เอาชั่วโมงเก่า + ชั่วโมงใหม่
  const totalUsed = prevHours + formHours

  document.getElementById("sched-hours-info").textContent = totalHours
    ? `(รวม ${totalUsed}/${totalHours} ชม.)`
    : ""

  const totalLbl = document.getElementById("sched-total-label")
  if (totalHours && (prevHours > 0 || state.schedDaySlots.length)) {
    totalLbl.style.display = ""
    const diff = totalHours - totalUsed
    if (diff === 0)
      totalLbl.innerHTML = `<span style="color:var(--green)">✓ ครบ ${totalHours} ชั่วโมงแล้ว</span>`
    else if (diff > 0)
      totalLbl.innerHTML = `<span style="color:var(--orange)">⚠ ยังขาดอีก ${diff} ชั่วโมง (ลงแล้ว ${prevHours} + เลือกใหม่ ${formHours} = ${totalUsed}/${totalHours})</span>`
    else
      totalLbl.innerHTML = `<span style="color:var(--red)">⚠ เกิน ${Math.abs(diff)} ชั่วโมง (ลงแล้ว ${prevHours} + เลือกใหม่ ${formHours} = ${totalUsed}/${totalHours})</span>`
  } else {
    totalLbl.style.display = "none"
  }

  // Build occupied-period map per day for chosen teacher
  // key = day, value = Set of occupied period numbers
  const occupiedByDay = {}
  DAYS.forEach((d) => (occupiedByDay[d] = new Set()))
  const refScheds =
    teacherId && teacherId === state.currentTeacher?.id
      ? state.schedules
      : teacherId
        ? await api(
            "GET",
            "/teacher-schedules?teacher_id=" + teacherId,
          ).catch(() => [])
        : []
  refScheds.forEach((s) => {
    if (occupiedByDay[s.day]) {
      for (let p = s.period_start; p <= s.period_end; p++)
        occupiedByDay[s.day].add(p)
    }
  })

  cont.innerHTML = state.schedDaySlots
    .map((sl, idx) => {
      const pLabel =
        sl.periodStart && sl.periodEnd
          ? `คาบ ${sl.periodStart}-${sl.periodEnd} (${PERIOD_TIMES[sl.periodStart]}–${PERIOD_END[sl.periodEnd]})`
          : "ยังไม่ได้เลือกคาบ"
      const occSet = occupiedByDay[sl.day] || new Set()
      return `<div style="background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:12px; position:relative;">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
        <select onchange="updateSlot(${idx},'day',this.value)" style="flex:1; min-width:100px;">
          ${["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"].map((d) => `<option ${sl.day === d ? "selected" : ""}>${d}</option>`).join("")}
        </select>
        <input placeholder="ห้อง เช่น ชย102" value="${sl.room || ""}" oninput="updateSlot(${idx},'room',this.value)" style="width:110px;" />
        ${state.schedDaySlots.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="removeSchedSlot(${idx})">🗑</button>` : ""}
      </div>
      <div style="font-size:11px; color:var(--text3); margin-bottom:4px;">คาบ 1-4 = 08:20-12:20 | คาบ 6-11 = 14:20-20:20 &nbsp;·&nbsp; <span style="color:#b91c1c">🔒 = คาบไม่ว่าง</span></div>
      ${buildPeriodPickerHTML(idx, occSet)}
      <div style="font-size:11px; color:var(--accent2); margin-top:6px;" id="slot-label-${idx}">${pLabel}</div>
    </div>`
    })
    .join("")
  // Re-render selected state (skip occupied buttons)
  state.schedDaySlots.forEach((sl, idx) => {
    if (!sl.periodStart || !sl.periodEnd) return
    const picker = cont.querySelector(`[data-slot-picker="${idx}"]`)
    if (!picker) return
    for (let p = sl.periodStart; p <= sl.periodEnd; p++) {
      const btn = picker.querySelector(`[data-period="${p}"][onclick]`)
      if (btn) btn.classList.add("selected")
    }
  })
}

function updateSlot(idx, key, val) {
  if (key === "day") {
    const duplicate = state.schedDaySlots.some(
      (s, i) => i !== idx && s.day === val,
    )
    if (duplicate) {
      toast(`วัน${val}มีอยู่แล้ว ไม่สามารถเลือกซ้ำได้`, "error")
      // Reset select back to current value
      const cont = document.getElementById("sched-day-slots")
      if (cont) {
        const selects = cont.querySelectorAll("select")
        if (selects[idx])
          selects[idx].value = state.schedDaySlots[idx].day
      }
      return
    }
  }
  state.schedDaySlots[idx][key] = val
  renderSchedDaySlots()
}

function toggleSlotPeriod(slotIdx, p) {
  const sl = state.schedDaySlots[slotIdx]
  if (!sl.periodStart || !sl.periodEnd) {
    sl.periodStart = p
    sl.periodEnd = p
  } else if (sl.periodStart === p && sl.periodEnd === p) {
    sl.periodStart = null
    sl.periodEnd = null
  } else {
    const newStart = Math.min(sl.periodStart, p)
    const newEnd = Math.max(sl.periodEnd, p)
    if (p >= sl.periodStart && p <= sl.periodEnd) {
      if (p - sl.periodStart < sl.periodEnd - p) sl.periodStart = p + 1
      else sl.periodEnd = p - 1
      if (sl.periodStart > sl.periodEnd) {
        sl.periodStart = null
        sl.periodEnd = null
      }
    } else {
      sl.periodStart = newStart
      sl.periodEnd = newEnd
    }
  }
  renderSchedDaySlots() // async — fire and forget OK
}

function addSchedDaySlot() {
  const usedDays = new Set(state.schedDaySlots.map((s) => s.day))
  const ALL_DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"]
  if (usedDays.size >= ALL_DAYS.length) {
    toast("เพิ่มช่วงวันครบทุกวันแล้ว (5 วัน)", "error")
    return
  }
  const nextDay = ALL_DAYS.find((d) => !usedDays.has(d)) || "จันทร์"
  state.schedDaySlots.push({
    day: nextDay,
    periodStart: null,
    periodEnd: null,
    room: "",
  })
  renderSchedDaySlots()
}

function removeSchedSlot(idx) {
  state.schedDaySlots.splice(idx, 1)
  renderSchedDaySlots()
}

function onSchedSubjectChange() {
  renderSchedDaySlots()
}

function togglePeriod(p) {
  // Legacy: kept for compatibility but not used
}

async function addSchedule() {
  const subjectId = document.getElementById("sched-subject").value
  const teacherId = document.getElementById("sched-teacher").value
  const group = document.getElementById("sched-group").value
  if (!subjectId || !teacherId)
    return toast("กรุณาเลือกวิชาและครู", "error")
  const subj = state.subjects.find((s) => s.id === subjectId)
  const totalHours = subj ? subj.theory_hours + subj.practice_hours : 0

  // คำนวณชั่วโมงที่เคยลงไปแล้วของวิชานี้
  let prevHours = 0
  state.schedules.forEach((s) => {
    if (s.subject_id === subjectId && s.teacher_id === teacherId) {
      prevHours += s.period_end - s.period_start + 1
    }
  })

  const slots = state.schedDaySlots.filter(
    (sl) => sl.periodStart && sl.periodEnd,
  )
  if (!slots.length)
    return toast("กรุณาเลือกคาบเรียนอย่างน้อย 1 ช่วง", "error")

  // คำนวณชั่วโมงที่เลือกในฟอร์มปัจจุบัน
  const formHours = slots.reduce(
    (sum, sl) => sum + (sl.periodEnd - sl.periodStart + 1),
    0,
  )

  // เอาของเก่าบวกของใหม่
  const totalUsed = prevHours + formHours

  if (totalHours > 0 && totalUsed !== totalHours)
    return toast(
      `จำนวนชั่วโมงรวมต้องครบ ${totalHours} ชม. พอดี (ของเดิม ${prevHours} + เลือกใหม่ ${formHours} = ปัจจุบัน ${totalUsed} ชม.)`,
      "error",
    )

  try {
    for (const sl of slots) {
      await api("POST", "/teacher-schedules", {
        teacher_id: teacherId,
        subject_id: subjectId,
        day: sl.day,
        period_start: sl.periodStart,
        period_end: sl.periodEnd,
        room: sl.room || "",
        group_code: group,
      })
    }
    toast(`บันทึกตารางสอน ${slots.length} ช่วงแล้ว ✅`, "success")
    state.schedDaySlots = [
      { day: "จันทร์", periodStart: null, periodEnd: null, room: "" },
    ]
    await loadAll()
    renderSchedulePage()
  } catch (e) {}
}

function renderSchedulesTable() {
  const tbody = document.getElementById("schedules-tbody")
  state.selectedSchedIds = new Set()
  updateSchedBulkBar()
  if (!state.schedules.length) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="empty-state">ยังไม่มีตารางสอน</td></tr>'
    return
  }
  const sorted = [...state.schedules].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
      a.period_start - b.period_start,
  )
  tbody.innerHTML = sorted
    .map(
      (s) => `
    <tr>
<td><input type="checkbox" class="sched-cb" value="${s.id}" onchange="toggleSchedSelect('${s.id}', this.checked)"></td>
<td>${s.day}</td>
<td>คาบ ${s.period_start}${s.period_end > s.period_start ? "-" + s.period_end : ""}</td>
<td>${PERIOD_TIMES[s.period_start]}-${PERIOD_END[s.period_end]}</td>
<td><span class="badge badge-blue">${s.subject_code}</span></td>
<td>${s.subject_name}</td>
<td>${s.room || "-"}</td>
<td><small>${s.group_code || "-"}</small></td>
<td style="white-space:nowrap">
  <button class="btn btn-ghost btn-sm" onclick="editSchedule('${s.id}')" title="แก้ไขเวลา/วัน/ห้อง">✏️ แก้ไข</button>
  <button class="btn btn-danger btn-sm" onclick="deleteSchedule('${s.id}')">🗑 ยกเลิก</button>
</td>
    </tr>`,
    )
    .join("")
}

function toggleSchedSelect(id, checked) {
  if (checked) state.selectedSchedIds.add(id)
  else state.selectedSchedIds.delete(id)
  updateSchedBulkBar()
}

function toggleSelectAllScheds(checked) {
  document.querySelectorAll(".sched-cb").forEach((cb) => {
    cb.checked = checked
    if (checked) state.selectedSchedIds.add(cb.value)
    else state.selectedSchedIds.delete(cb.value)
  })
  updateSchedBulkBar()
}

function updateSchedBulkBar() {
  const bar = document.getElementById("sched-bulk-bar")
  const count = state.selectedSchedIds.size
  document.getElementById("sched-selected-count").textContent =
    `เลือก ${count} รายการ`
  bar.classList.toggle("visible", count > 0)
}

function clearSchedSelection() {
  state.selectedSchedIds = new Set()
  document
    .querySelectorAll(".sched-cb")
    .forEach((cb) => (cb.checked = false))
  const allCb = document.getElementById("select-all-scheds")
  if (allCb) allCb.checked = false
  updateSchedBulkBar()
}

async function deleteSelectedSchedules() {
  const ids = [...state.selectedSchedIds]
  if (!ids.length) return
  showConfirmModal(
    "⚠️ ยืนยันยกเลิกตารางสอน",
    `ยกเลิก <strong>${ids.length} รายการ</strong>?<br>ข้อมูลการลงทะเบียนนักเรียนในคาบเหล่านี้จะถูกลบด้วย`,
    async () => {
      await api("POST", "/teacher-schedules/bulk-delete", { ids })
      toast(`ยกเลิก ${ids.length} รายการแล้ว`, "success")
      await loadAll()
      await renderSchedulePage()
    },
  )
}

async function deleteAllSchedules() {
  if (!state.currentTeacher) return toast("กรุณาเลือกครูก่อน", "error")
  if (!state.schedules.length) return toast("ไม่มีตารางสอน", "error")
  showConfirmModal(
    "⚠️ ยืนยันยกเลิกตารางสอนทั้งหมด",
    `ยกเลิกตารางสอนทั้งหมด <strong>${state.schedules.length} รายการ</strong> ของ ${state.currentTeacher.name}?<br>ข้อมูลการลงทะเบียนนักเรียนทั้งหมดจะถูกลบด้วย`,
    async () => {
      await api(
        "DELETE",
        "/teacher-schedules/all/" + state.currentTeacher.id,
      )
      toast("ยกเลิกตารางสอนทั้งหมดแล้ว", "success")
      await loadAll()
      await renderSchedulePage()
    },
  )
}

async function deleteSchedule(id) {
  showConfirmModal(
    "⚠️ ยืนยันยกเลิกตารางสอน",
    "ยกเลิกตารางสอนนี้? การลงทะเบียนนักเรียนในคาบนี้จะถูกลบด้วย",
    async () => {
      await api("DELETE", "/teacher-schedules/" + id)
      toast("ยกเลิกตารางสอนแล้ว", "success")
      await loadAll()
      await renderSchedulePage()
    },
  )
}

// =========== EDIT SCHEDULE MODAL ===========
function editSchedule(id) {
  const s = state.schedules.find((x) => x.id === id)
  if (!s) return
  document.getElementById("edit-sched-id").value = id
  document.getElementById("edit-sched-subject-info").textContent =
    `${s.subject_code} — ${s.subject_name} (รวม ${s.theory_hours + s.practice_hours} ชม.)`
  document.getElementById("edit-sched-total-hours").textContent =
    s.theory_hours + s.practice_hours
  document.getElementById("edit-sched-day").value = s.day
  document.getElementById("edit-sched-room").value = s.room || ""
  document.getElementById("edit-sched-group").value = s.group_code || ""
  // Store context for conflict check
  state._editId = id
  state._editTeacherId = s.teacher_id
  // Pre-select periods
  state.editSchedPeriods = []
  for (let p = s.period_start; p <= s.period_end; p++)
    state.editSchedPeriods.push(p)
  renderEditPeriods()
  openModal("modal-edit-schedule")
}

function renderEditPeriods() {
  const editId = state._editId
  const teacherId = state._editTeacherId
  const day = document.getElementById("edit-sched-day")?.value
  // Build occupied set: other schedules of same teacher on same day
  const occupied = new Set()
  state.schedules.forEach((s) => {
    if (s.teacher_id === teacherId && s.day === day && s.id !== editId) {
      for (let p = s.period_start; p <= s.period_end; p++) occupied.add(p)
    }
  })
  document
    .querySelectorAll(".edit-period-btn[data-period]")
    .forEach((btn) => {
      const p = +btn.dataset.period
      const isOcc = occupied.has(p)
      const isSel = state.editSchedPeriods.includes(p)
      // Reset inline styles
      btn.removeAttribute("style")
      btn.classList.remove("selected")
      if (isOcc) {
        btn.style.cssText =
          "background:rgba(220,38,38,0.1);border-color:rgba(220,38,38,0.3);color:#b91c1c;cursor:not-allowed;"
        btn.title = "คาบนี้ถูกใช้แล้ว — ไม่สามารถเลือกได้"
      } else {
        btn.style.cursor = "pointer"
        btn.title = ""
        if (isSel) btn.classList.add("selected")
      }
    })
  updateEditPeriodLabel()
}

function toggleEditPeriod(p) {
  // Block occupied periods
  const editId = state._editId
  const teacherId = state._editTeacherId
  const day = document.getElementById("edit-sched-day")?.value
  const isOcc = state.schedules.some(
    (s) =>
      s.teacher_id === teacherId &&
      s.day === day &&
      s.id !== editId &&
      p >= s.period_start &&
      p <= s.period_end,
  )
  if (isOcc) {
    toast("คาบนี้ถูกใช้งานแล้ว", "error")
    return
  }
  const idx = state.editSchedPeriods.indexOf(p)
  if (idx >= 0) state.editSchedPeriods.splice(idx, 1)
  else state.editSchedPeriods.push(p)
  state.editSchedPeriods.sort((a, b) => a - b)
  renderEditPeriods()
}

function updateEditPeriodLabel() {
  const lbl = document.getElementById("edit-periods-label")
  if (state.editSchedPeriods.length) {
    const min = Math.min(...state.editSchedPeriods),
      max = Math.max(...state.editSchedPeriods)
    const count = max - min + 1
    lbl.innerHTML = `<span style="color:var(--green)">✓ คาบ ${min}–${max} (${PERIOD_TIMES[min]}–${PERIOD_END[max]}) รวม ${count} คาบ</span>`
  } else {
    lbl.innerHTML = `<span style="color:var(--text3)">ยังไม่ได้เลือกคาบ</span>`
  }
}

async function saveEditSchedule() {
  const id = document.getElementById("edit-sched-id").value
  const s = state.schedules.find((x) => x.id === id)
  if (!s) return
  const totalHours = s.theory_hours + s.practice_hours
  if (!state.editSchedPeriods.length)
    return toast("กรุณาเลือกคาบเรียน", "error")
  const period_start = Math.min(...state.editSchedPeriods)
  const period_end = Math.max(...state.editSchedPeriods)
  const count = period_end - period_start + 1
  // For multi-day subjects, each slot can be any number of periods (no strict enforcement per-slot)
  if (count < 1)
    return toast("กรุณาเลือกคาบเรียนอย่างน้อย 1 คาบ", "error")
  const day = document.getElementById("edit-sched-day").value
  const room = document.getElementById("edit-sched-room").value
  const group_code = document.getElementById("edit-sched-group").value
  try {
    await api("PUT", "/teacher-schedules/" + id, {
      day,
      period_start,
      period_end,
      room,
      group_code,
    })
    toast("แก้ไขตารางสอนแล้ว ✅", "success")
    closeModal("modal-edit-schedule")
    await loadAll()
    await renderSchedulePage()
  } catch (e) {}
}

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

