// =========== GROUPS PAGE ===========
async function renderGroupsPage() {
  await loadAll()
  const tbody = document.getElementById("groups-tbody")
  if (!tbody) return
  tbody.innerHTML =
    state.groups
      .map(
        (g) => `<tr>
  <td><span class="badge badge-blue">${g.code}</span></td>
  <td><button class="btn btn-danger btn-sm" onclick="deleteGroup('${g.id}')">🗑 ลบ</button></td>
</tr>`,
      )
      .join("") ||
    '<tr><td colspan="2" class="empty-state">ยังไม่มีกลุ่มเรียน</td></tr>'
}

async function addGroup() {
  const input = document.getElementById("new-group-code")
  const code = input.value.trim()
  if (!code) return toast("กรุณากรอกรหัสกลุ่มเรียน", "error")
  try {
    const g = await api("POST", "/groups", { code })
    state.groups.push(g)
    state.groups.sort((a, b) => a.code.localeCompare(b.code))
    input.value = ""
    renderGroupsPage()
    toast("เพิ่มกลุ่มเรียน " + g.code + " แล้ว ✅", "success")
  } catch (_) {}
}

async function deleteGroup(id) {
  const g = state.groups.find((x) => x.id === id)
  if (!g) return
  showConfirmModal(
    "⚠️ ยืนยันลบกลุ่มเรียน",
    `ลบกลุ่มเรียน <strong>${g.code}</strong> ใช่หรือไม่?`,
    async () => {
      try {
        await api("DELETE", "/groups/" + id)
        state.groups = state.groups.filter((x) => x.id !== id)
        renderGroupsPage()
        toast("ลบกลุ่มเรียนแล้ว", "success")
      } catch (_) {}
    },
  )
}
