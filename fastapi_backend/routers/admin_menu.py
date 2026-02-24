#routers/admin_menu.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Menu
from schemas import MenuAdminOut, MenuCreate, MenuUpdate
from auth import get_current_admin_email

router = APIRouter(prefix="/admin", tags=["admin"])

# ---------------------------
# 1) Admin Page (HTML)
# ---------------------------
@router.get("/menu-page", response_class=HTMLResponse, include_in_schema=False)
def admin_menu_page():
    # HTML ฝังตรงนี้เลย (ง่ายสุด) หรือจะอ่านจากไฟล์ก็ได้
    return ADMIN_MENU_HTML


# ---------------------------
# 2) CRUD APIs (Admin Only)
# ---------------------------
@router.get("/menu", response_model=List[MenuAdminOut])
def list_menu(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_email),
):
    return db.query(Menu).order_by(Menu.id.desc()).all()


@router.post("/menu", response_model=MenuAdminOut)
def create_menu(
    payload: MenuCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_email),
):
    # กันชื่อซ้ำ
    exists = db.query(Menu).filter(Menu.food_name == payload.food_name).first()
    if exists:
        raise HTTPException(status_code=400, detail="food_name already exists")

    row = Menu(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/menu/{menu_id}", response_model=MenuAdminOut)
def update_menu(
    menu_id: int,
    payload: MenuUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_email),
):
    row = db.query(Menu).filter(Menu.id == menu_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Menu not found")

    data = payload.model_dump(exclude_unset=True)

    # ถ้าแก้ชื่อ ให้กันซ้ำด้วย
    if "food_name" in data and data["food_name"] != row.food_name:
        exists = db.query(Menu).filter(Menu.food_name == data["food_name"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="food_name already exists")

    for k, v in data.items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    return row


@router.delete("/menu/{menu_id}")
def delete_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_email),
):
    row = db.query(Menu).filter(Menu.id == menu_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Menu not found")

    db.delete(row)
    db.commit()
    return {"ok": True}


# ---------------------------
# HTML (หน้า Admin)
# ---------------------------
ADMIN_MENU_HTML = r"""
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Admin - Manage Menu</title>
</head>
<body class="bg-slate-50">
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Admin: จัดการตาราง Menu</h1>
      <div class="text-sm text-slate-600">
        API Base: <span id="apiBase" class="font-mono"></span>
      </div>
    </div>

    <!-- Login -->
    <div id="loginBox" class="bg-white rounded-xl shadow p-5 mb-6">
      <h2 class="font-semibold mb-3">เข้าสู่ระบบแอดมิน</h2>
      <div class="grid md:grid-cols-3 gap-3">
        <input id="email" class="border rounded-lg p-2" placeholder="admin email" />
        <input id="password" type="password" class="border rounded-lg p-2" placeholder="password" />
        <button id="btnLogin" class="bg-blue-600 text-white rounded-lg px-4 py-2">Login</button>
      </div>
      <p id="loginMsg" class="text-sm mt-3 text-red-600 hidden"></p>
    </div>

    <!-- App -->
    <div id="appBox" class="hidden">
      <div class="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div class="flex-1">
          <input id="q" class="w-full border rounded-lg p-2" placeholder="ค้นหา food_name / food_name_en (filter ในหน้า)"/>
        </div>
        <button id="btnAdd" class="bg-emerald-600 text-white rounded-lg px-4 py-2">+ เพิ่มเมนู</button>
        <button id="btnLogout" class="bg-slate-200 rounded-lg px-4 py-2">Logout</button>
      </div>

      <div class="bg-white rounded-xl shadow overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-slate-700">
            <tr>
              <th class="text-left p-3">ID</th>
              <th class="text-left p-3">ชื่ออาหาร (TH)</th>
              <th class="text-left p-3">ชื่ออาหาร (EN)</th>
              <th class="text-left p-3">kcal</th>
              <th class="text-left p-3">P</th>
              <th class="text-left p-3">C</th>
              <th class="text-left p-3">F</th>
              <th class="text-left p-3">จัดการ</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>

      <p id="msg" class="text-sm mt-3 text-slate-600"></p>
    </div>
  </div>

  <!-- Modal -->
  <div id="modal" class="fixed inset-0 bg-black/40 hidden items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow max-w-2xl w-full p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 id="modalTitle" class="font-semibold text-lg">เพิ่มเมนู</h3>
        <button id="btnClose" class="text-slate-500">✕</button>
      </div>

      <div class="grid md:grid-cols-2 gap-3">
        <input id="m_id" class="border rounded-lg p-2 hidden" />
        <div>
          <label class="text-xs text-slate-600">food_name (TH) *</label>
          <input id="m_food_name" class="w-full border rounded-lg p-2" />
        </div>
        <div>
          <label class="text-xs text-slate-600">food_name_en</label>
          <input id="m_food_name_en" class="w-full border rounded-lg p-2" />
        </div>

        <div><label class="text-xs text-slate-600">calories</label><input id="m_calories" type="number" step="0.01" class="w-full border rounded-lg p-2"/></div>
        <div><label class="text-xs text-slate-600">protein</label><input id="m_protein" type="number" step="0.01" class="w-full border rounded-lg p-2"/></div>
        <div><label class="text-xs text-slate-600">carb</label><input id="m_carb" type="number" step="0.01" class="w-full border rounded-lg p-2"/></div>
        <div><label class="text-xs text-slate-600">fat</label><input id="m_fat" type="number" step="0.01" class="w-full border rounded-lg p-2"/></div>
      </div>

      <div class="flex items-center justify-end gap-2 mt-5">
        <button id="btnCancel" class="bg-slate-200 rounded-lg px-4 py-2">ยกเลิก</button>
        <button id="btnSave" class="bg-blue-600 text-white rounded-lg px-4 py-2">บันทึก</button>
      </div>

      <p id="modalMsg" class="text-sm mt-3 text-red-600 hidden"></p>
    </div>
  </div>

<script>
  // ใช้ base เดียวกับที่เปิดหน้านี้
  const API_BASE = location.origin;
  document.getElementById("apiBase").textContent = API_BASE;

  const els = (id) => document.getElementById(id);
  const loginBox = els("loginBox");
  const appBox = els("appBox");
  const rowsEl = els("rows");
  const msgEl = els("msg");

  const modal = els("modal");
  const modalTitle = els("modalTitle");
  const modalMsg = els("modalMsg");

  let token = localStorage.getItem("admin_token") || "";
  let allRows = [];

  function showLoginError(t){
    const p = els("loginMsg");
    p.textContent = t;
    p.classList.remove("hidden");
  }
  function clearLoginError(){
    const p = els("loginMsg");
    p.classList.add("hidden");
    p.textContent = "";
  }

  function authHeaders(){
    return token ? { "Authorization": "Bearer " + token } : {};
  }

  async function api(path, options={}){
    const res = await fetch(API_BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...authHeaders(),
      }
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok){
      throw new Error(data.detail || ("HTTP " + res.status));
    }
    return data;
  }

  function setAuthedUI(isAuthed){
    if(isAuthed){
      loginBox.classList.add("hidden");
      appBox.classList.remove("hidden");
    }else{
      loginBox.classList.remove("hidden");
      appBox.classList.add("hidden");
    }
  }

  function renderTable(list){
    rowsEl.innerHTML = "";
    for(const r of list){
      const tr = document.createElement("tr");
      tr.className = "border-t";
      tr.innerHTML = `
        <td class="p-3">${r.id}</td>
        <td class="p-3">${r.food_name ?? ""}</td>
        <td class="p-3">${r.food_name_en ?? ""}</td>
        <td class="p-3">${r.calories ?? ""}</td>
        <td class="p-3">${r.protein ?? ""}</td>
        <td class="p-3">${r.carb ?? ""}</td>
        <td class="p-3">${r.fat ?? ""}</td>
        <td class="p-3 whitespace-nowrap">
          <button class="px-3 py-1 rounded-lg bg-slate-200 mr-2" data-edit="${r.id}">แก้ไข</button>
          <button class="px-3 py-1 rounded-lg bg-rose-600 text-white" data-del="${r.id}">ลบ</button>
        </td>
      `;
      rowsEl.appendChild(tr);
    }

    // bind actions
    rowsEl.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => openEdit(btn.getAttribute("data-edit")));
    });
    rowsEl.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => doDelete(btn.getAttribute("data-del")));
    });
  }

  function filterLocal(){
    const q = (els("q").value || "").toLowerCase();
    if(!q) return allRows;
    return allRows.filter(r =>
      (r.food_name || "").toLowerCase().includes(q) ||
      (r.food_name_en || "").toLowerCase().includes(q)
    );
  }

  async function load(){
    msgEl.textContent = "กำลังโหลด...";
    allRows = await api("/admin/menu");
    msgEl.textContent = "โหลดแล้ว: " + allRows.length + " รายการ";
    renderTable(filterLocal());
  }

  // Login
  els("btnLogin").addEventListener("click", async () => {
    clearLoginError();
    try{
      const email = els("email").value.trim();
      const password = els("password").value;
      const data = await api("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      token = data.access_token;
      localStorage.setItem("admin_token", token);
      setAuthedUI(true);
      await load();
    }catch(e){
      showLoginError("Login ไม่สำเร็จ: " + e.message);
    }
  });

  // Logout
  els("btnLogout").addEventListener("click", () => {
    token = "";
    localStorage.removeItem("admin_token");
    setAuthedUI(false);
  });

  // Search filter
  els("q").addEventListener("input", () => renderTable(filterLocal()));

  // Modal
  function openModal(title){
    modalTitle.textContent = title;
    modalMsg.classList.add("hidden");
    modalMsg.textContent = "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  function closeModal(){
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function setModalError(t){
    modalMsg.textContent = t;
    modalMsg.classList.remove("hidden");
  }

  function fillForm(r){
    els("m_id").value = r?.id ?? "";
    els("m_food_name").value = r?.food_name ?? "";
    els("m_food_name_en").value = r?.food_name_en ?? "";
    els("m_calories").value = r?.calories ?? "";
    els("m_protein").value = r?.protein ?? "";
    els("m_carb").value = r?.carb ?? "";
    els("m_fat").value = r?.fat ?? "";
  }
  function getFormPayload(){
    const num = (v) => v === "" ? null : Number(v);
    return {
      food_name: els("m_food_name").value.trim(),
      food_name_en: els("m_food_name_en").value.trim() || null,
      calories: num(els("m_calories").value),
      protein: num(els("m_protein").value),
      carb: num(els("m_carb").value),
      fat: num(els("m_fat").value),
    };
  }

  els("btnAdd").addEventListener("click", () => {
    fillForm(null);
    openModal("เพิ่มเมนู");
  });

  els("btnClose").addEventListener("click", closeModal);
  els("btnCancel").addEventListener("click", closeModal);

  async function openEdit(id){
    const r = allRows.find(x => String(x.id) === String(id));
    fillForm(r);
    openModal("แก้ไขเมนู (ID: " + id + ")");
  }

  els("btnSave").addEventListener("click", async () => {
    try{
      const id = els("m_id").value;
      const payload = getFormPayload();
      if(!payload.food_name){
        return setModalError("food_name (TH) จำเป็นต้องกรอก");
      }

      if(id){
        // update
        const patch = {};
        for(const k of ["food_name","food_name_en","calories","protein","carb","fat"]){
          patch[k] = payload[k];
        }
        await api("/admin/menu/" + id, { method: "PUT", body: JSON.stringify(patch) });
      }else{
        // create
        await api("/admin/menu", { method: "POST", body: JSON.stringify(payload) });
      }

      closeModal();
      await load();
    }catch(e){
      setModalError(e.message);
    }
  });

  async function doDelete(id){
    if(!confirm("ยืนยันลบเมนู ID " + id + " ?")) return;
    try{
      await api("/admin/menu/" + id, { method: "DELETE" });
      await load();
    }catch(e){
      alert("ลบไม่สำเร็จ: " + e.message);
    }
  }

  // Auto load if token exists
  (async () => {
    if(token){
      try{
        setAuthedUI(true);
        await load();
      }catch(e){
        token = "";
        localStorage.removeItem("admin_token");
        setAuthedUI(false);
      }
    }else{
      setAuthedUI(false);
    }
  })();
</script>
</body>
</html>
"""
