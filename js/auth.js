// =========== API ===========
async function api(method, path, body) {
  try {
    const res = await fetch(API + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    let data
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      data = await res.json()
    } else {
      const txt = await res.text()
      throw new Error("เซิร์ฟเวอร์ไม่ตอบสนอง (" + res.status + ")")
    }
    if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")
    return data
  } catch (e) {
    if (e.name === "TypeError" && e.message.includes("fetch")) {
      toast(
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — รัน node server.js หรือยัง?",
        "error",
      )
    } else {
      toast(e.message, "error")
    }
    throw e
  }
}

// =========== PIN AUTH ===========
const SESSION_KEY = "teacher_pin_ok"

function isTeacherUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === "1"
}

function requestTeacherMode() {
  if (isTeacherUnlocked()) {
    setMode("teacher")
    return
  }
  // Reset modal state
  document.getElementById("pin-input").value = ""
  document.getElementById("pin-input").type = "password"
  document.getElementById("pin-eye-btn").textContent = "👁"
  document.getElementById("pin-error-msg").style.display = "none"
  document.getElementById("change-pin-panel").style.display = "none"
  document.getElementById("change-pin-chevron").style.transform = ""
  document.getElementById("chg-current").value = ""
  document.getElementById("chg-new").value = ""
  document.getElementById("chg-confirm").value = ""
  document.getElementById("chg-msg").style.display = "none"
  openModal("modal-teacher-pin")
  setTimeout(() => document.getElementById("pin-input").focus(), 80)
}

function closePinModal() {
  closeModal("modal-teacher-pin")
  // Restore button state to match current mode
  document.getElementById("btn-teacher-mode").className =
    "btn btn-sm " + (state.mode === "teacher" ? "btn-primary" : "btn-ghost")
}

function togglePinEye() {
  const inp = document.getElementById("pin-input")
  const btn = document.getElementById("pin-eye-btn")
  if (inp.type === "password") {
    inp.type = "text"
    btn.textContent = "🙈"
  } else {
    inp.type = "password"
    btn.textContent = "👁"
  }
}

async function submitPin() {
  const pin = document.getElementById("pin-input").value.trim()
  const errEl = document.getElementById("pin-error-msg")
  if (!pin) {
    errEl.textContent = "กรุณากรอกรหัสผ่าน"
    errEl.style.display = "block"
    return
  }
  try {
    await api("POST", "/auth/verify-pin", { pin })
    sessionStorage.setItem(SESSION_KEY, "1")
    closeModal("modal-teacher-pin")
    toast("🔓 เข้าสู่โหมดครูสำเร็จ", "success")
    setMode("teacher")
  } catch (e) {
    errEl.textContent = "❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่"
    errEl.style.display = "block"
    const inp = document.getElementById("pin-input")
    inp.value = ""
    inp.focus()
    inp.style.borderColor = "var(--red)"
    inp.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)"
    setTimeout(() => {
      inp.style.borderColor = ""
      inp.style.boxShadow = ""
    }, 1600)
  }
}

function toggleChangePinPanel() {
  const panel = document.getElementById("change-pin-panel")
  const chevron = document.getElementById("change-pin-chevron")
  const open = panel.style.display === "none" || panel.style.display === ""
  panel.style.display = open ? "block" : "none"
  chevron.style.transform = open ? "rotate(90deg)" : ""
  if (open) setTimeout(() => document.getElementById("chg-current").focus(), 60)
}

async function submitChangePin() {
  const current = document.getElementById("chg-current").value
  const newPin = document.getElementById("chg-new").value
  const confirm = document.getElementById("chg-confirm").value
  const msgEl = document.getElementById("chg-msg")

  const showMsg = (text, isErr) => {
    msgEl.textContent = text
    msgEl.style.display = "block"
    msgEl.style.background = isErr
      ? "rgba(220,38,38,0.07)"
      : "rgba(5,150,105,0.08)"
    msgEl.style.border = isErr
      ? "1px solid rgba(220,38,38,0.2)"
      : "1px solid rgba(5,150,105,0.2)"
    msgEl.style.color = isErr ? "var(--red)" : "var(--green)"
  }

  if (!current || !newPin || !confirm)
    return showMsg("กรุณากรอกข้อมูลให้ครบทุกช่อง", true)
  if (newPin !== confirm) return showMsg("รหัสผ่านใหม่ไม่ตรงกัน", true)
  if (newPin.length < 3)
    return showMsg("รหัสผ่านต้องมีอย่างน้อย 3 ตัวอักษร", true)

  try {
    await api("POST", "/auth/change-pin", {
      current_pin: current,
      new_pin: newPin,
    })
    showMsg("✅ เปลี่ยนรหัสผ่านสำเร็จแล้ว!", false)
    sessionStorage.removeItem(SESSION_KEY) // force re-login with new PIN
    document.getElementById("chg-current").value = ""
    document.getElementById("chg-new").value = ""
    document.getElementById("chg-confirm").value = ""
    setTimeout(() => {
      msgEl.style.display = "none"
      document.getElementById("change-pin-panel").style.display = "none"
      document.getElementById("change-pin-chevron").style.transform = ""
    }, 2200)
  } catch (e) {}
}
