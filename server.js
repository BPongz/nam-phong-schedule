const express = require("express")
const cors = require("cors")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")
const { v4: uuidv4 } = require("uuid")

const app = express()
app.use(cors())
app.use(express.json())
app.use(
  express.static(__dirname, {
    setHeaders: (res, path) => {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private",
      )
      res.setHeader("Expires", "-1")
      res.setHeader("Pragma", "no-cache")
    },
  }),
)

const adapter = new FileSync("school.json")
const db = low(adapter)

db.defaults({
  subjects: [],
  teachers: [],
  teacher_schedules: [],
  students: [],
  student_registrations: [],
  enrollment_requests: [],
  groups: [],
  rooms: [],
  config: { teacher_pin: "@dmin" },
}).write()

// ---- เปิดใช้โค้ดด้านล่างหากอยากมี data mockup ----
// if (db.get("subjects").size().value() === 0) {
//   const subjects = [
//     {
//       id: uuidv4(),
//       code: "20143-2003",
//       name: "เทคโนโลยียานยนต์ไฟฟ้า",
//       theory_hours: 2,
//       practice_hours: 0,
//       credits: 2,
//       total_hours: 2,
//     },
//     {
//       id: uuidv4(),
//       code: "30000-2002",
//       name: "กิจกรรมองค์การวิชาชีพ 1",
//       theory_hours: 0,
//       practice_hours: 2,
//       credits: 0,
//       total_hours: 2,
//     },
//     {
//       id: uuidv4(),
//       code: "30100-1015",
//       name: "ความแข็งแรงของวัสดุ",
//       theory_hours: 3,
//       practice_hours: 0,
//       credits: 3,
//       total_hours: 3,
//     },
//     {
//       id: uuidv4(),
//       code: "30143-0003",
//       name: "งานไฟฟ้าแรงเคลื่อนต่ำในยานยนต์ไฟฟ้า",
//       theory_hours: 1,
//       practice_hours: 3,
//       credits: 2,
//       total_hours: 4,
//     },
//     {
//       id: uuidv4(),
//       code: "30143-2005",
//       name: "งานอิเล็กทรอนิกส์วิศวกรรมและเซ็นเซอร์ยานยนต์ไฟฟ้า",
//       theory_hours: 1,
//       practice_hours: 4,
//       credits: 3,
//       total_hours: 5,
//     },
//     {
//       id: uuidv4(),
//       code: "30000-1201",
//       name: "ภาษาอังกฤษสำหรับงานอาชีพ",
//       theory_hours: 1,
//       practice_hours: 0,
//       credits: 2,
//       total_hours: 2,
//     },
//     {
//       id: uuidv4(),
//       code: "30000-1407",
//       name: "คณิตศาสตร์อุตสาหกรรม",
//       theory_hours: 3,
//       practice_hours: 0,
//       credits: 3,
//       total_hours: 3,
//     },
//     {
//       id: uuidv4(),
//       code: "30000-1503",
//       name: "หลักปรัชญาของเศรษฐกิจพอเพียง",
//       theory_hours: 1,
//       practice_hours: 0,
//       credits: 1,
//       total_hours: 1,
//     },
//     {
//       id: uuidv4(),
//       code: "30001-1003",
//       name: "การประยุกต์ใช้เทคโนโลยีดิจิทัลในอาชีพ",
//       theory_hours: 2,
//       practice_hours: 2,
//       credits: 3,
//       total_hours: 4,
//     },
//     {
//       id: uuidv4(),
//       code: "30100-1016",
//       name: "นิวเมติกส์และไฮดรอลิกส์",
//       theory_hours: 2,
//       practice_hours: 3,
//       credits: 3,
//       total_hours: 5,
//     },
//     {
//       id: uuidv4(),
//       code: "30101-2016",
//       name: "งานซ่อมเครื่องยนต์แก๊สโซลีนและดีเซล",
//       theory_hours: 2,
//       practice_hours: 3,
//       credits: 3,
//       total_hours: 5,
//     },
//     {
//       id: uuidv4(),
//       code: "30143-0001",
//       name: "งานไฟฟ้าและเครื่องมือวัดไฟฟ้าในยานยนต์ไฟฟ้า",
//       theory_hours: 1,
//       practice_hours: 3,
//       credits: 2,
//       total_hours: 4,
//     },
//   ]
//   db.get("subjects")
//     .push(...subjects)
//     .write()

//   const teacherId = uuidv4()
//   db.get("teachers")
//     .push({
//       id: teacherId,
//       name: "นายภัคพล กัสปะ",
//       department: "ช่างยนต์",
//       education: "ครุศาสตร์อุตสาหกรรมบัณฑิต",
//       special_duty: "หัวหน้างานวัดและประเมินผล",
//     })
//     .write()

//   const subjectMap = {}
//   db.get("subjects")
//     .value()
//     .forEach((s) => {
//       subjectMap[s.code] = s.id
//     })

//   const schedules = [
//     {
//       day: "จันทร์",
//       period_start: 1,
//       period_end: 3,
//       subject_code: "30100-1015",
//       room: "ชย102",
//       group_code: "683014301,683014302",
//     },
//     {
//       day: "จันทร์",
//       period_start: 5,
//       period_end: 6,
//       subject_code: "20143-2003",
//       room: "ชย105",
//       group_code: "672010402",
//     },
//     {
//       day: "จันทร์",
//       period_start: 8,
//       period_end: 9,
//       subject_code: "30143-0003",
//       room: "ชย102",
//       group_code: "683014302",
//     },
//     {
//       day: "อังคาร",
//       period_start: 1,
//       period_end: 2,
//       subject_code: "20143-2003",
//       room: "ชย102",
//       group_code: "672010401",
//     },
//     {
//       day: "อังคาร",
//       period_start: 8,
//       period_end: 9,
//       subject_code: "30143-0003",
//       room: "ชย102",
//       group_code: "683014302",
//     },
//     {
//       day: "พุธ",
//       period_start: 5,
//       period_end: 9,
//       subject_code: "30143-2005",
//       room: "ชย102",
//       group_code: "683014301,683014302",
//     },
//     {
//       day: "พฤหัสบดี",
//       period_start: 6,
//       period_end: 7,
//       subject_code: "30000-2002",
//       room: "โดม",
//       group_code: "683014301,683014302",
//     },
//     {
//       day: "ศุกร์",
//       period_start: 3,
//       period_end: 4,
//       subject_code: "20143-2003",
//       room: "ชย102",
//       group_code: "672010403,672010404",
//     },
//   ]
//   schedules.forEach((s) => {
//     if (subjectMap[s.subject_code]) {
//       db.get("teacher_schedules")
//         .push({
//           id: uuidv4(),
//           teacher_id: teacherId,
//           subject_id: subjectMap[s.subject_code],
//           day: s.day,
//           period_start: s.period_start,
//           period_end: s.period_end,
//           room: s.room,
//           group_code: s.group_code,
//         })
//         .write()
//     }
//   })

//   const students = [
//     {
//       id: uuidv4(),
//       student_id: "6830143001",
//       name: "นายสมชาย ใจดี",
//       group_code: "683014302",
//     },
//     {
//       id: uuidv4(),
//       student_id: "6830143002",
//       name: "นางสาวสมหญิง รักเรียน",
//       group_code: "683014302",
//     },
//     {
//       id: uuidv4(),
//       student_id: "6830143003",
//       name: "นายวิชัย เก่งมาก",
//       group_code: "683014302",
//     },
//   ]
//   db.get("students")
//     .push(...students)
//     .write()
// }

// ---- Helpers ----
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
const PERIOD_END_MAP = {
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

function getSubject(id) {
  return db.get("subjects").find({ id }).value()
}
function getTeacher(id) {
  return db.get("teachers").find({ id }).value()
}

function enrichSchedule(ts) {
  const s = getSubject(ts.subject_id)
  const t = getTeacher(ts.teacher_id)
  return {
    ...ts,
    subject_code: s ? s.code : "",
    subject_name: s ? s.name : "",
    theory_hours: s ? s.theory_hours : 0,
    practice_hours: s ? s.practice_hours : 0,
    credits: s ? s.credits : 0,
    teacher_name: t ? t.name : "",
  }
}

// ---- AUTH ----
app.post("/api/auth/verify-pin", (req, res) => {
  const { pin } = req.body
  const storedPin = db.get("config.teacher_pin").value() || "@dmin"
  if (pin === storedPin) return res.json({ success: true })
  res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" })
})

app.post("/api/auth/change-pin", (req, res) => {
  const { current_pin, new_pin } = req.body
  const storedPin = db.get("config.teacher_pin").value() || "@dmin"
  if (current_pin !== storedPin)
    return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" })
  if (!new_pin || new_pin.length < 3)
    return res
      .status(400)
      .json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 3 ตัวอักษร" })
  db.set("config.teacher_pin", new_pin).write()
  res.json({ success: true })
})

app.get("/api/config", (req, res) => {
  const config = db.get("config").value() || {}
  const hasData = db.get("subjects").size().value() > 0 // เช็คว่ามีข้อมูลหรือไม่

  res.json({
    semester: config.semester || "1/2568", // ค่าเริ่มต้น
    // ถ้าตั้งใจให้เป็นค่าว่างก็ให้เป็นค่าว่าง แต่ถ้าไม่เคยตั้งค่าเลยค่อยใช้ค่า default
    school_name:
      config.school_name !== undefined
        ? config.school_name
        : "วิทยาลัยเทคนิคน้ำพอง",
    // มองว่าตั้งค่าแล้ว ถ้าระบุเทอมมาแล้ว หรือมีข้อมูลในระบบแล้ว
    is_configured: config.semester !== undefined || hasData,
  })
})

app.put("/api/config", (req, res) => {
  const { semester, school_name } = req.body
  if (semester !== undefined) db.set("config.semester", semester).write()
  if (school_name !== undefined)
    db.set("config.school_name", school_name).write()
  res.json({ success: true })
})

app.get("/api/subjects/scheduled-map", (req, res) => {
  const schedules = db.get("teacher_schedules").value()
  const map = {}
  schedules.forEach((ts) => {
    if (!map[ts.subject_id]) {
      const teacher = db.get("teachers").find({ id: ts.teacher_id }).value()
      map[ts.subject_id] = {
        teacher_id: ts.teacher_id,
        teacher_name: teacher ? teacher.name : "",
      }
    }
  })
  res.json(map)
})

// ---- SUBJECTS ----
app.get("/api/subjects", (req, res) => {
  res.json(db.get("subjects").sortBy("code").value())
})

app.post("/api/subjects", (req, res) => {
  const { code, name, theory_hours, practice_hours, credits } = req.body
  if (!code || !name)
    return res.status(400).json({ error: "กรุณากรอกรหัสและชื่อวิชา" })
  if (db.get("subjects").find({ code }).value())
    return res.status(400).json({ error: "รหัสวิชาซ้ำ" })
  const subject = {
    id: uuidv4(),
    code,
    name,
    theory_hours: +theory_hours || 0,
    practice_hours: +practice_hours || 0,
    credits: +credits || 0,
    total_hours: (+theory_hours || 0) + (+practice_hours || 0),
  }
  db.get("subjects").push(subject).write()
  res.json(subject)
})

// Static POST routes before /:id
app.post("/api/subjects/bulk-delete", (req, res) => {
  const { ids } = req.body
  if (!ids || !ids.length)
    return res.status(400).json({ error: "ไม่มีรายการที่จะลบ" })
  ids.forEach((id) => deleteSubjectCascade(id))
  res.json({ success: true, deleted: ids.length })
})

app.post("/api/subjects/check-registrations", (req, res) => {
  const { ids } = req.body
  const result = {}
  ;(ids || []).forEach((id) => {
    const scheduleIds = db
      .get("teacher_schedules")
      .filter({ subject_id: id })
      .map("id")
      .value()
    const hasReg = scheduleIds.some(
      (sid) =>
        db
          .get("student_registrations")
          .filter({ teacher_schedule_id: sid })
          .size()
          .value() > 0,
    )
    result[id] = hasReg
  })
  res.json(result)
})

app.put("/api/subjects/:id", (req, res) => {
  const id = req.params.id
  const scheduled = db.get("teacher_schedules").find({ subject_id: id }).value()
  if (scheduled) {
    const teacher = db
      .get("teachers")
      .find({ id: scheduled.teacher_id })
      .value()
    return res.status(403).json({
      error: `ไม่สามารถแก้ไขได้ วิชานี้ถูกบรรจุในตารางสอนของ ${teacher ? teacher.name : "ครู"} แล้ว`,
    })
  }
  const { code, name, theory_hours, practice_hours, credits } = req.body
  db.get("subjects")
    .find({ id })
    .assign({
      code,
      name,
      theory_hours: +theory_hours || 0,
      practice_hours: +practice_hours || 0,
      credits: +credits || 0,
      total_hours: (+theory_hours || 0) + (+practice_hours || 0),
    })
    .write()
  res.json({ success: true })
})

// Helper to delete a subject and cascade
function deleteSubjectCascade(id) {
  const scheduleIds = db
    .get("teacher_schedules")
    .filter({ subject_id: id })
    .map("id")
    .value()
  scheduleIds.forEach((sid) => {
    db.get("student_registrations").remove({ teacher_schedule_id: sid }).write()
    db.get("enrollment_requests").remove({ teacher_schedule_id: sid }).write()
  })
  db.get("teacher_schedules").remove({ subject_id: id }).write()
  db.get("student_registrations").remove({ subject_id: id }).write()
  db.get("enrollment_requests").remove({ subject_id: id }).write()
  db.get("subjects").remove({ id }).write()
}

app.delete("/api/subjects/:id", (req, res) => {
  deleteSubjectCascade(req.params.id)
  res.json({ success: true })
})

// ---- TEACHERS ----
app.get("/api/teachers", (req, res) => {
  res.json(db.get("teachers").value())
})

app.post("/api/teachers", (req, res) => {
  const { name, department, education, special_duty } = req.body
  if (!name || !name.trim())
    return res.status(400).json({ error: "กรุณากรอกชื่อครู" })
  const existing = db
    .get("teachers")
    .find((t) => t.name.trim() === name.trim())
    .value()
  if (existing)
    return res
      .status(400)
      .json({ error: "มีชื่อครูนี้อยู่แล้ว: " + name.trim() })
  const teacher = {
    id: uuidv4(),
    name: name.trim(),
    department: department || "",
    education: education || "",
    special_duty: special_duty || "",
  }
  db.get("teachers").push(teacher).write()
  res.json(teacher)
})

app.put("/api/teachers/:id", (req, res) => {
  const { name, department, education, special_duty } = req.body
  if (!name || !name.trim())
    return res.status(400).json({ error: "กรุณากรอกชื่อครู" })
  const existing = db
    .get("teachers")
    .find((t) => t.name.trim() === name.trim() && t.id !== req.params.id)
    .value()
  if (existing) return res.status(400).json({ error: "มีชื่อครูนี้อยู่แล้ว" })
  db.get("teachers")
    .find({ id: req.params.id })
    .assign({
      name: name.trim(),
      department: department || "",
      education: education || "",
      special_duty: special_duty || "",
    })
    .write()
  res.json({ success: true })
})

// ---- TEACHER SCHEDULES ----
// Static routes MUST come before /:id to avoid Express matching them as params

app.get("/api/teacher-schedules/unregistered", (req, res) => {
  const teacherId = req.query.teacher_id
  const scheduledIds = new Set(
    db
      .get("teacher_schedules")
      .filter((ts) => !teacherId || ts.teacher_id === teacherId)
      .map("subject_id")
      .value(),
  )
  res.json(
    db
      .get("subjects")
      .filter((s) => !scheduledIds.has(s.id))
      .value(),
  )
})

app.post("/api/teacher-schedules/bulk-delete", (req, res) => {
  const { ids } = req.body
  if (!ids || !ids.length) return res.status(400).json({ error: "ไม่มีรายการ" })
  ids.forEach((id) => {
    db.get("student_registrations").remove({ teacher_schedule_id: id }).write()
    db.get("enrollment_requests").remove({ teacher_schedule_id: id }).write()
    db.get("teacher_schedules").remove({ id }).write()
  })
  res.json({ success: true, deleted: ids.length })
})

app.get("/api/teacher-schedules", (req, res) => {
  const teacherId = req.query.teacher_id
  let items = db.get("teacher_schedules").value()
  if (teacherId) items = items.filter((ts) => ts.teacher_id === teacherId)
  res.json(items.map(enrichSchedule))
})

app.post("/api/teacher-schedules", (req, res) => {
  const {
    teacher_id,
    subject_id,
    day,
    period_start,
    period_end,
    room,
    group_code,
  } = req.body
  // Block if another teacher has already scheduled this subject
  const claimedByOther = db
    .get("teacher_schedules")
    .find((ts) => ts.subject_id === subject_id && ts.teacher_id !== teacher_id)
    .value()
  if (claimedByOther) {
    const otherTeacher = db
      .get("teachers")
      .find({ id: claimedByOther.teacher_id })
      .value()
    return res.status(409).json({
      error: `วิชานี้ถูกบรรจุในตารางสอนของ ${otherTeacher ? otherTeacher.name : "ครูท่านอื่น"} แล้ว ไม่สามารถบรรจุซ้ำได้`,
    })
  }
  // Block time conflict for same teacher
  const conflict = db
    .get("teacher_schedules")
    .find(
      (ts) =>
        ts.teacher_id === teacher_id &&
        ts.day === day &&
        !(ts.period_end < period_start || ts.period_start > period_end),
    )
    .value()
  if (conflict)
    return res.status(409).json({ error: "มีตารางสอนซ้อนกันในช่วงเวลานี้แล้ว" })
  const ts = {
    id: uuidv4(),
    teacher_id,
    subject_id,
    day,
    period_start: +period_start,
    period_end: +period_end,
    room: room || "",
    group_code: group_code || "",
  }
  db.get("teacher_schedules").push(ts).write()
  res.json(ts)
})

app.put("/api/teacher-schedules/:id", (req, res) => {
  const { day, period_start, period_end, room, group_code } = req.body
  const ts = db.get("teacher_schedules").find({ id: req.params.id }).value()
  if (!ts) return res.status(404).json({ error: "ไม่พบตารางสอน" })
  // Check time conflict excluding self
  const conflict = db
    .get("teacher_schedules")
    .find(
      (other) =>
        other.id !== req.params.id &&
        other.teacher_id === ts.teacher_id &&
        other.day === day &&
        !(other.period_end < +period_start || other.period_start > +period_end),
    )
    .value()
  if (conflict)
    return res.status(409).json({ error: "มีตารางสอนซ้อนกันในช่วงเวลานี้แล้ว" })
  db.get("teacher_schedules")
    .find({ id: req.params.id })
    .assign({
      day,
      period_start: +period_start,
      period_end: +period_end,
      room: room || "",
      group_code: group_code || "",
    })
    .write()
  res.json({ success: true })
})

app.delete("/api/teacher-schedules/all/:teacherId", (req, res) => {
  const ids = db
    .get("teacher_schedules")
    .filter({ teacher_id: req.params.teacherId })
    .map("id")
    .value()
  ids.forEach((id) => {
    db.get("student_registrations").remove({ teacher_schedule_id: id }).write()
    db.get("enrollment_requests").remove({ teacher_schedule_id: id }).write()
  })
  db.get("teacher_schedules")
    .remove({ teacher_id: req.params.teacherId })
    .write()
  res.json({ success: true, deleted: ids.length })
})

app.delete("/api/teacher-schedules/:id", (req, res) => {
  db.get("student_registrations")
    .remove({ teacher_schedule_id: req.params.id })
    .write()
  db.get("enrollment_requests")
    .remove({ teacher_schedule_id: req.params.id })
    .write()
  db.get("teacher_schedules").remove({ id: req.params.id }).write()
  res.json({ success: true })
})

// ---- ROOMS ----
app.get("/api/rooms", (_req, res) => {
  res.json(db.get("rooms").sortBy("name").value())
})

app.post("/api/rooms", (req, res) => {
  const { name } = req.body
  if (!name || !name.trim())
    return res.status(400).json({ error: "กรุณากรอกชื่อห้องเรียน" })
  if (db.get("rooms").find({ name: name.trim() }).value())
    return res.status(400).json({ error: "ห้องเรียนนี้มีอยู่แล้ว" })
  const room = { id: uuidv4(), name: name.trim() }
  db.get("rooms").push(room).write()
  res.json(room)
})

app.delete("/api/rooms/:id", (req, res) => {
  db.get("rooms").remove({ id: req.params.id }).write()
  res.json({ success: true })
})

// ---- GROUPS ----
app.get("/api/groups", (_req, res) => {
  res.json(db.get("groups").sortBy("code").value())
})

app.post("/api/groups", (req, res) => {
  const { code } = req.body
  if (!code || !code.trim())
    return res.status(400).json({ error: "กรุณากรอกรหัสกลุ่มเรียน" })
  if (db.get("groups").find({ code: code.trim() }).value())
    return res.status(400).json({ error: "รหัสกลุ่มนี้มีอยู่แล้ว" })
  const group = { id: uuidv4(), code: code.trim() }
  db.get("groups").push(group).write()
  res.json(group)
})

app.delete("/api/groups/:id", (req, res) => {
  db.get("groups").remove({ id: req.params.id }).write()
  res.json({ success: true })
})

// ---- STUDENTS ----
app.get("/api/students", (req, res) => {
  res.json(db.get("students").sortBy("student_id").value())
})

app.post("/api/students", (req, res) => {
  const { student_id, name, group_code } = req.body
  if (student_id && db.get("students").find({ student_id }).value())
    return res.status(400).json({ error: "รหัสนักเรียนซ้ำ" })
  const student = {
    id: uuidv4(),
    student_id,
    name,
    group_code: group_code || "",
  }
  db.get("students").push(student).write()
  res.json(student)
})

// ---- ENROLLMENT REQUESTS ----
app.post("/api/enrollment-requests", (req, res) => {
  const { student_id, teacher_id } = req.body
  if (!student_id || !teacher_id)
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" })
  const existing = db
    .get("enrollment_requests")
    .find({ student_id, teacher_id, status: "pending" })
    .value()
  if (existing)
    return res.status(400).json({ error: "ส่งคำขอไปแล้ว กรุณารอครูอนุมัติ" })
  const approved = db
    .get("enrollment_requests")
    .find({ student_id, teacher_id, status: "approved" })
    .value()
  if (approved)
    return res.status(400).json({ error: "ได้รับการอนุมัติจากครูท่านนี้แล้ว" })
  const newReq = {
    id: uuidv4(),
    student_id,
    teacher_id,
    status: "pending",
    created_at: new Date().toISOString(),
  }
  db.get("enrollment_requests").push(newReq).write()
  res.json(newReq)
})

app.get("/api/enrollment-requests/teacher/:teacherId", (req, res) => {
  const requests = db
    .get("enrollment_requests")
    .filter({ teacher_id: req.params.teacherId })
    .value()
  const enriched = requests.map((r) => {
    const student = db.get("students").find({ id: r.student_id }).value()
    return {
      ...r,
      student_name: student ? student.name : "",
      student_code: student ? student.student_id : "",
      group_code: student ? student.group_code : "",
    }
  })
  res.json(enriched.sort((a, b) => (a.status === "pending" ? -1 : 1)))
})

app.get("/api/enrollment-requests/student/:studentId", (req, res) => {
  const requests = db
    .get("enrollment_requests")
    .filter({ student_id: req.params.studentId })
    .value()
  const enriched = requests.map((r) => {
    const teacher = db.get("teachers").find({ id: r.teacher_id }).value()
    return {
      ...r,
      teacher_name: teacher ? teacher.name : "",
      teacher_dept: teacher ? teacher.department : "",
    }
  })
  res.json(enriched)
})

app.put("/api/enrollment-requests/:id", (req, res) => {
  const { status } = req.body
  db.get("enrollment_requests")
    .find({ id: req.params.id })
    .assign({ status, updated_at: new Date().toISOString() })
    .write()
  res.json({ success: true })
})

// ---- REGISTRATIONS ----
app.get("/api/registrations/:studentId", (req, res) => {
  const regs = db
    .get("student_registrations")
    .filter({ student_id: req.params.studentId })
    .value()
  const enriched = regs.map((r) => {
    const ts = db
      .get("teacher_schedules")
      .find({ id: r.teacher_schedule_id })
      .value()
    const s = ts ? getSubject(ts.subject_id) : null
    const t = ts ? getTeacher(ts.teacher_id) : null
    return {
      ...r,
      subject_id: ts ? ts.subject_id : r.subject_id,
      subject_code: s ? s.code : "",
      subject_name: s ? s.name : "",
      credits: s ? s.credits : 0,
      day: ts ? ts.day : "",
      period_start: ts ? ts.period_start : 0,
      period_end: ts ? ts.period_end : 0,
      room: ts ? ts.room : "",
      group_code: ts ? ts.group_code : "",
      teacher_name: t ? t.name : "",
      teacher_id: ts ? ts.teacher_id : "",
    }
  })
  res.json(enriched)
})

app.post("/api/registrations", (req, res) => {
  const { student_id, subject_id, teacher_schedule_id } = req.body
  if (db.get("student_registrations").find({ student_id, subject_id }).value())
    return res.status(400).json({ error: "ลงทะเบียนวิชานี้แล้ว" })
  const newSlot = db
    .get("teacher_schedules")
    .find({ id: teacher_schedule_id })
    .value()
  if (!newSlot) return res.status(404).json({ error: "ไม่พบตารางสอน" })
  const myRegs = db.get("student_registrations").filter({ student_id }).value()
  const conflict = myRegs.find((r) => {
    const ts = db
      .get("teacher_schedules")
      .find({ id: r.teacher_schedule_id })
      .value()
    return (
      ts &&
      ts.day === newSlot.day &&
      !(
        ts.period_end < newSlot.period_start ||
        ts.period_start > newSlot.period_end
      )
    )
  })
  if (conflict) return res.status(409).json({ error: "ตารางเรียนชนกัน" })
  const reg = { id: uuidv4(), student_id, subject_id, teacher_schedule_id }
  db.get("student_registrations").push(reg).write()
  res.json({ success: true, id: reg.id })
})

app.delete("/api/registrations/:id", (req, res) => {
  db.get("student_registrations").remove({ id: req.params.id }).write()
  res.json({ success: true })
})

app.get("/api/available-schedules/:studentId", (req, res) => {
  const teacherId = req.query.teacher_id
  const registeredSubjectIds = new Set(
    db
      .get("student_registrations")
      .filter({ student_id: req.params.studentId })
      .map("subject_id")
      .value(),
  )
  let items = db.get("teacher_schedules").value()
  if (teacherId) items = items.filter((ts) => ts.teacher_id === teacherId)
  res.json(
    items
      .filter((ts) => !registeredSubjectIds.has(ts.subject_id))
      .map(enrichSchedule),
  )
})

app.post("/api/enrollment-requests/:id/revoke", (req, res) => {
  const reqId = req.params.id
  const request = db.get("enrollment_requests").find({ id: reqId }).value()
  if (!request) return res.status(404).json({ error: "ไม่พบคำขอ" })

  const { student_id, teacher_id } = request

  // 1. เปลี่ยนสถานะคำขอให้เป็น "ถูกถอน"
  db.get("enrollment_requests")
    .find({ id: reqId })
    .assign({ status: "revoked", updated_at: new Date().toISOString() }) // แก้ rejected เป็น revoked
    .write()

  // 2. ดึง ID ของตารางสอนทั้งหมดที่เป็นของครูคนนี้
  const teacherScheduleIds = db
    .get("teacher_schedules")
    .filter({ teacher_id })
    .map("id")
    .value()

  // 3. ค้นหาและ "ลบรายวิชา" ที่นักเรียนคนนี้ลงทะเบียนไว้ แต่ลบเฉพาะวิชาที่ตรงกับตารางสอนของครูคนนี้เท่านั้น
  db.get("student_registrations")
    .remove(
      (r) =>
        r.student_id === student_id &&
        teacherScheduleIds.includes(r.teacher_schedule_id),
    )
    .write()

  res.json({ success: true })
})

app.get("/api/period-times", (req, res) => res.json(PERIOD_TIMES))

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
