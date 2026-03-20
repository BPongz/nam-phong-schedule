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

