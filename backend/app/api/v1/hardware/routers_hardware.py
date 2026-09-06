"""Hardware Abstraction Layer (Prompt 35, §14).

Driver-based architecture for POS peripherals:
- Thermal Printer (ESC/POS), A4 Printer, Label Printer
- Barcode Scanner, QR Scanner
- Cash Drawer (solenoid trigger)
- Customer Display, Weighing Scale
- KDS Display, Kiosk

Each device type has a driver interface. Business logic never couples directly
to hardware — it sends jobs through this service.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

# ═══════════════ DRIVER REGISTRY ═══════════════

DRIVER_TYPES = {
    "THERMAL_PRINTER": {
        "drivers": ["epson", "star", "bixolon", "mock"],
        "capabilities": {"cuts": True, "drawer": True, "color": False, "graphics": True},
        "connectionTypes": ["USB", "SERIAL", "NETWORK"],
    },
    "A4_PRINTER": {
        "drivers": ["cups", "windows", "mock"],
        "capabilities": {"cuts": False, "drawer": False, "color": True, "graphics": True},
        "connectionTypes": ["USB", "NETWORK"],
    },
    "BARCODE_SCANNER": {
        "drivers": ["hid", "serial", "camera", "mock"],
        "capabilities": {"barcode1d": True, "barcode2d": True, "camera": False},
        "connectionTypes": ["USB", "SERIAL", "BLUETOOTH"],
    },
    "CASH_DRAWER": {
        "drivers": ["posprinter", "relay", "mock"],
        "capabilities": {"solenoid": True, "sensor": False},
        "connectionTypes": ["USB", "SERIAL"],
    },
    "CUSTOMER_DISPLAY": {
        "drivers": ["virtual", "vfd", "lcd", "mock"],
        "capabilities": {"textOnly": False, "graphics": True, "touch": False},
        "connectionTypes": ["USB", "SERIAL", "NETWORK"],
    },
    "WEIGHING_SCALE": {
        "drivers": ["TOCOL", "AVERY", "CAS", "mock"],
        "capabilities": {"stable": True, "unit": True, "tare": True},
        "connectionTypes": ["SERIAL", "USB", "NETWORK"],
    },
    "LABEL_PRINTER": {
        "drivers": ["zpl", "epl", "tspl", "mock"],
        "capabilities": {"thermal": True, "dpi300": True, "dpi600": False},
        "connectionTypes": ["USB", "NETWORK", "BLUETOOTH"],
    },
    "KDS_DISPLAY": {
        "drivers": ["web", "native", "mock"],
        "capabilities": {"touch": True, "bumpBar": False, "audio": True},
        "connectionTypes": ["NETWORK"],
    },
    "KIOSK": {
        "drivers": ["web", "android", "ios", "mock"],
        "capabilities": {"touch": True, "camera": True, "printer": True, "scanner": True},
        "connectionTypes": ["NETWORK"],
    },
    "QR_SCANNER": {
        "drivers": ["camera", "usb_laser", "mock"],
        "capabilities": {"qrcode": True, "barcode1d": True},
        "connectionTypes": ["USB", "BLUETOOTH"],
    },
}

# ═══════════════ MOCK DRIVERS (for testing) ═══════════════

class MockPrinterDriver:
    """Mock thermal printer that logs output instead of printing."""
    def __init__(self, config=None):
        self.config = config or {}
        self.output_log = []

    def print_receipt(self, data: dict) -> dict:
        self.output_log.append({"type": "receipt", "data": data})
        return {"status": "printed", "jobId": str(uuid.uuid4()), "driver": "mock",
                "lines": len(data.get("lines", []))}

    def cut_paper(self) -> dict:
        self.output_log.append({"type": "cut"})
        return {"status": "cut", "driver": "mock"}

    def open_drawer(self) -> dict:
        self.output_log.append({"type": "drawer_open"})
        return {"status": "drawer_opened", "driver": "mock"}

    def print_label(self, data: dict) -> dict:
        self.output_log.append({"type": "label", "data": data})
        return {"status": "printed", "driver": "mock", "width": data.get("width", 50)}


class MockScannerDriver:
    """Mock scanner that returns the value sent to it."""
    def scan(self) -> dict:
        return {"status": "no_scan", "driver": "mock", "message": "Waiting for input..."}

    def process_code(self, code: str) -> dict:
        return {"status": "scanned", "code": code, "driver": "mock",
                "type": self._detect_type(code)}

    def _detect_type(self, code: str) -> str:
        if code.startswith("QR-"): return "QR_CODE"
        if code.isdigit() and len(code) == 13: return "EAN13"
        if code.isdigit() and len(code) == 12: return "UPC_A"
        if code.isdigit() and len(code) == 8: return "EAN8"
        if code.isdigit(): return "CODE128"
        return "UNKNOWN"


class MockCashDrawerDriver:
    """Mock cash drawer."""
    def open(self) -> dict:
        return {"status": "opened", "driver": "mock", "signal": "pulse_200ms"}

    def is_open(self) -> dict:
        return {"isOpen": False, "driver": "mock"}


class MockScaleDriver:
    """Mock weighing scale."""
    def read_weight(self) -> dict:
        return {"weight": 0.0, "unit": "kg", "stable": True, "driver": "mock"}

    def tare(self) -> dict:
        return {"tare": 0.0, "driver": "mock"}


# Driver instances (singleton per tenant/device)
_driver_instances: dict = {}

def _get_driver(device_type: str, driver_name: str, config: dict = None):
    key = f"{device_type}:{driver_name}"
    if key not in _driver_instances:
        if device_type in ("THERMAL_PRINTER", "A4_PRINTER", "LABEL_PRINTER"):
            _driver_instances[key] = MockPrinterDriver(config)
        elif device_type in ("BARCODE_SCANNER", "QR_SCANNER"):
            _driver_instances[key] = MockScannerDriver()
        elif device_type == "CASH_DRAWER":
            _driver_instances[key] = MockCashDrawerDriver()
        elif device_type == "WEIGHING_SCALE":
            _driver_instances[key] = MockScaleDriver()
        else:
            _driver_instances[key] = MockPrinterDriver(config)  # fallback
    return _driver_instances[key]


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════ DEVICE MANAGEMENT ═══════════════

@router.get("/api/v1/hardware/devices")
async def list_devices(
    deviceType: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if deviceType:
        where += " AND deviceType=:dt"; params["dt"] = deviceType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM hardware_devices WHERE {where} ORDER BY deviceType, name"), params)).fetchall())
    for r in rows:
        if isinstance(r.get("connectionConfig"), str):
            try: r["connectionConfig"] = json.loads(r["connectionConfig"])
            except: pass
        if isinstance(r.get("capabilities"), str):
            try: r["capabilities"] = json.loads(r["capabilities"])
            except: pass
    return ok(rows)


@router.post("/api/v1/hardware/devices")
async def register_device(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name", "")
    device_type = (body.get("deviceType") or "").upper()
    driver = body.get("driver", "mock")
    conn_type = (body.get("connectionType") or "VIRTUAL").upper()

    if not name or not device_type:
        return err("name and deviceType required", 400)
    if device_type not in DRIVER_TYPES:
        return err(f"deviceType must be one of: {list(DRIVER_TYPES.keys())}", 400)

    valid_drivers = DRIVER_TYPES[device_type]["drivers"]
    if driver not in valid_drivers:
        return err(f"Invalid driver '{driver}' for {device_type}. Valid: {valid_drivers}", 400)

    did = _uid()
    caps = DRIVER_TYPES[device_type]["capabilities"]
    await db.execute(text(
        "INSERT INTO hardware_devices (id, tenantId, branchId, name, deviceType, driver, "
        "connectionType, connectionConfig, status, capabilities) "
        "VALUES (:id, :t, :b, :n, :dt, :dr, :ct, :cc, 'ONLINE', :caps)"),
        {"id": did, "t": tenantId, "b": body.get("branchId"),
         "n": name, "dt": device_type, "dr": driver,
         "ct": conn_type, "cc": json.dumps(body.get("connectionConfig", {})),
         "caps": json.dumps(caps)})
    await db.commit()
    return ok({"id": did, "status": "ONLINE", "driver": driver}, 201)


@router.get("/api/v1/hardware/device-types")
async def list_device_types():
    return ok(DRIVER_TYPES)


@router.patch("/api/v1/hardware/devices/{deviceId}")
async def update_device(
    deviceId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": deviceId, "t": tenantId}
    if "status" in body:
        fields.append("status=:s"); params["s"] = body["status"].upper()
    if "connectionConfig" in body:
        fields.append("connectionConfig=:cc"); params["cc"] = json.dumps(body["connectionConfig"])
    if "isActive" in body:
        fields.append("isActive=:a"); params["a"] = 1 if body["isActive"] else 0
    if "branchId" in body:
        fields.append("branchId=:b"); params["b"] = body["branchId"]
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    res = await db.execute(text(
        f"UPDATE hardware_devices SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    if res.rowcount == 0:
        return err("Device not found", 404)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/hardware/devices/{deviceId}")
async def delete_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM hardware_devices WHERE id=:id AND tenantId=:t"),
        {"id": deviceId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ═══════════════ PRINT JOBS ═══════════════

@router.post("/api/v1/hardware/print/receipt")
async def print_receipt(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Submit a receipt print job. Body: { deviceId?, data: { lines, footer, ... } }"""
    device_id = body.get("deviceId")
    data = body.get("data", {})

    # Find device
    device = None
    if device_id:
        device = (await db.execute(text(
            "SELECT * FROM hardware_devices WHERE id=:id AND tenantId=:t AND deviceType IN ('THERMAL_PRINTER','A4_PRINTER')"),
            {"id": device_id, "t": tenantId})).first()
    else:
        device = (await db.execute(text(
            "SELECT * FROM hardware_devices WHERE tenantId=:t AND deviceType='THERMAL_PRINTER' AND status='ONLINE' LIMIT 1"),
            {"t": tenantId})).first()

    # Create job
    job_id = _uid()
    target_type = "THERMAL_PRINTER"
    driver_name = "mock"

    if device:
        ddata = dict(device._mapping) if hasattr(device, '_mapping') else dict(device)
        target_type = ddata.get("deviceType", "THERMAL_PRINTER")
        driver_name = ddata.get("driver", "mock")
        await db.execute(text(
            "UPDATE hardware_devices SET lastSeenAt=NOW() WHERE id=:id"), {"id": ddata["id"]})

    await db.execute(text(
        "INSERT INTO hardware_jobs (id, tenantId, deviceId, deviceType, jobType, payload, status) "
        "VALUES (:id, :t, :d, :dt, 'PRINT_RECEIPT', :payload, 'PROCESSING')"),
        {"id": job_id, "t": tenantId, "d": device_id, "dt": target_type,
         "payload": json.dumps(data)})
    await db.commit()

    # Execute via driver
    driver = _get_driver(target_type, driver_name)
    result = driver.print_receipt(data)

    await db.execute(text(
        "UPDATE hardware_jobs SET status='COMPLETED', completedAt=NOW(), result=:r WHERE id=:id"),
        {"r": json.dumps(result), "id": job_id})
    await db.commit()

    return ok({"jobId": job_id, "result": result})


@router.post("/api/v1/hardware/drawer/open")
async def open_drawer(
    body: dict = None,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Open the cash drawer (typically triggered through printer's solenoid)."""
    device_id = (body or {}).get("deviceId")
    device = None
    if device_id:
        device = (await db.execute(text(
            "SELECT * FROM hardware_devices WHERE id=:id AND tenantId=:t AND deviceType='CASH_DRAWER'"),
            {"id": device_id, "t": tenantId})).first()

    driver_name = "mock"
    if device:
        ddata = dict(device._mapping) if hasattr(device, '_mapping') else dict(device)
        driver_name = ddata.get("driver", "mock")

    job_id = _uid()
    await db.execute(text(
        "INSERT INTO hardware_jobs (id, tenantId, deviceType, jobType, payload, status) "
        "VALUES (:id, :t, 'CASH_DRAWER', 'OPEN_DRAWER', '{}', 'PROCESSING')"),
        {"id": job_id, "t": tenantId})
    await db.commit()

    driver = _get_driver("CASH_DRAWER", driver_name)
    result = driver.open()

    await db.execute(text(
        "UPDATE hardware_jobs SET status='COMPLETED', completedAt=NOW(), result=:r WHERE id=:id"),
        {"r": json.dumps(result), "id": job_id})
    await db.commit()
    return ok({"jobId": job_id, "result": result})


@router.post("/api/v1/hardware/scan/process")
async def process_scan(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Process a scanned barcode/QR code. Body: { code, deviceId? }"""
    code = body.get("code", "")
    if not code:
        return err("code required", 400)

    driver = _get_driver("BARCODE_SCANNER", "mock")
    result = driver.process_code(code)

    job_id = _uid()
    await db.execute(text(
        "INSERT INTO hardware_jobs (id, tenantId, deviceType, jobType, payload, status, result) "
        "VALUES (:id, :t, 'BARCODE_SCANNER', 'SCAN_RESULT', :payload, 'COMPLETED', :result)"),
        {"id": job_id, "t": tenantId, "payload": json.dumps({"code": code}),
         "result": json.dumps(result)})
    await db.commit()
    return ok(result)


@router.post("/api/v1/hardware/scale/read")
async def read_scale(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Read current weight from the scale."""
    driver = _get_driver("WEIGHING_SCALE", "mock")
    result = driver.read_weight()
    return ok(result)


@router.post("/api/v1/hardware/display/message")
async def display_message(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to customer display. Body: { line1, line2, total }"""
    data = body.get("data", {})
    job_id = _uid()
    await db.execute(text(
        "INSERT INTO hardware_jobs (id, tenantId, deviceType, jobType, payload, status) "
        "VALUES (:id, :t, 'CUSTOMER_DISPLAY', 'DISPLAY_MSG', :payload, 'COMPLETED')"),
        {"id": job_id, "t": tenantId, "payload": json.dumps(data)})
    await db.commit()
    return ok({"jobId": job_id, "displayed": True, "data": data})


# ═══════════════ JOB MANAGEMENT ═══════════════

@router.get("/api/v1/hardware/jobs")
async def list_jobs(
    status: str = "",
    deviceType: str = "",
    limit: int = 50,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId, "lim": min(limit, 200)}
    if status:
        where += " AND status=:s"; params["s"] = status.upper()
    if deviceType:
        where += " AND deviceType=:dt"; params["dt"] = deviceType.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM hardware_jobs WHERE {where} ORDER BY createdAt DESC LIMIT :lim"), params)).fetchall())
    for r in rows:
        for field in ("payload", "result"):
            if isinstance(r.get(field), str):
                try: r[field] = json.loads(r[field])
                except: pass
    return ok(rows)


@router.get("/api/v1/hardware/stats")
async def hardware_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    devices = (await db.execute(text(
        "SELECT COUNT(*) FROM hardware_devices WHERE tenantId=:t AND isActive=1"),
        {"t": tenantId})).first()[0]
    online = (await db.execute(text(
        "SELECT COUNT(*) FROM hardware_devices WHERE tenantId=:t AND status='ONLINE'"),
        {"t": tenantId})).first()[0]
    jobs_today = (await db.execute(text(
        "SELECT COUNT(*) FROM hardware_jobs WHERE tenantId=:t AND DATE(createdAt) = CURDATE()"),
        {"t": tenantId})).first()[0]
    failed_jobs = (await db.execute(text(
        "SELECT COUNT(*) FROM hardware_jobs WHERE tenantId=:t AND status='FAILED'"),
        {"t": tenantId})).first()[0]

    return ok({
        "totalDevices": devices, "onlineDevices": online,
        "jobsToday": jobs_today, "failedJobs": failed_jobs,
    })
