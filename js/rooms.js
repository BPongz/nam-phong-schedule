// =========== ROOMS PAGE ===========
async function renderRoomsPage() {
  await loadAll()
  const tbody = document.getElementById("rooms-tbody")
  if (!tbody) return
  tbody.innerHTML =
    state.rooms
      .map(
        (r) => `<tr>
  <td><span class="badge badge-blue">${r.name}</span></td>
  <td><button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">🗑 ลบ</button></td>
</tr>`,
      )
      .join("") ||
    '<tr><td colspan="2" class="empty-state">ยังไม่มีห้องเรียน</td></tr>'
}

async function addRoom() {
  const input = document.getElementById("new-room-name")
  const name = input.value.trim()
  if (!name) return toast("กรุณากรอกชื่อห้องเรียน", "error")
  try {
    const r = await api("POST", "/rooms", { name })
    state.rooms.push(r)
    state.rooms.sort((a, b) => a.name.localeCompare(b.name))
    input.value = ""
    renderRoomsPage()
    toast("เพิ่มห้องเรียน " + r.name + " แล้ว ✅", "success")
  } catch (_) {}
}

async function deleteRoom(id) {
  const r = state.rooms.find((x) => x.id === id)
  if (!r) return
  showConfirmModal(
    "⚠️ ยืนยันลบห้องเรียน",
    `ลบห้องเรียน <strong>${r.name}</strong> ใช่หรือไม่?`,
    async () => {
      try {
        await api("DELETE", "/rooms/" + id)
        state.rooms = state.rooms.filter((x) => x.id !== id)
        renderRoomsPage()
        toast("ลบห้องเรียนแล้ว", "success")
      } catch (_) {}
    },
  )
}
