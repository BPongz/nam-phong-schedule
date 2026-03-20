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

