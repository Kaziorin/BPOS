import urllib.request
import json
import uuid

BASE = "http://127.0.0.1:4000"

def req(method, path, body=None, token=None, tenant="demo-shop"):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if tenant:
        r.add_header("x-tenant-id", tenant)
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"error": "non-json"}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("--- 1. Authenticating Admin ---")
    st, res = req("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"}, tenant=None)
    assert st == 200, f"Login failed: {res}"
    token = res["token"]
    print(f"Logged in successfully. Token acquired.")

    print("\n--- 2. Fetching Prerequisite Data (Suppliers, Warehouses, Products) ---")
    st, sups = req("GET", "/api/v1/suppliers?limit=10", token=token)
    sup_list = sups.get("data", {}).get("data", []) if isinstance(sups.get("data"), dict) else sups.get("data", [])
    assert len(sup_list) > 0, "No suppliers found"
    supplier_id = sup_list[0]["id"]
    print(f"Using Supplier: {sup_list[0]['name']} (ID: {supplier_id})")

    st, wh_res = req("GET", "/api/v1/branches", token=token)
    wh_data = wh_res.get("data", {}).get("data", []) if isinstance(wh_res.get("data"), dict) else wh_res.get("data", [])
    warehouses = [w for b in wh_data for w in b.get("warehouses", [])]
    assert len(warehouses) > 0, "No warehouses found"
    warehouse_id = warehouses[0]["id"]
    print(f"Using Warehouse: {warehouses[0]['name']} (ID: {warehouse_id})")

    st, prods = req("GET", "/api/v1/products?limit=10", token=token)
    prod_list = prods.get("data", {}).get("data", []) if isinstance(prods.get("data"), dict) else prods.get("data", [])
    assert len(prod_list) > 0, "No products found"
    prod1 = prod_list[0]
    print(f"Using Product: {prod1['name']} (SKU: {prod1['sku']}, ID: {prod1['id']})")

    print("\n--- 3. Testing Purchase Requisition Lifecycle ---")
    st, pr = req("POST", "/api/v1/purchasing/requisitions", {
        "warehouseId": warehouse_id,
        "note": "Quarterly restocking for store shelves",
        "items": [{"productId": prod1["id"], "qty": 20, "estUnitPrice": 150.0}]
    }, token=token)
    assert st in (200, 201), f"PR creation failed: {pr}"
    pr_id = pr["data"]["id"]
    pr_no = pr["data"]["prNo"]
    print(f"[OK] Requisition Created: {pr_no} (ID: {pr_id})")

    st, sub_res = req("POST", f"/api/v1/purchasing/requisitions/{pr_id}/submit", {}, token=token)
    assert st == 200, f"PR submit failed: {sub_res}"
    print(f"[OK] Requisition {pr_no} Submitted")

    st, apr_res = req("POST", f"/api/v1/purchasing/requisitions/{pr_id}/approve", {}, token=token)
    assert st in (200, 202), f"PR approve failed: {apr_res}"
    print(f"[OK] Requisition {pr_no} Approved")

    print("\n--- 4. Testing Requisition Conversion -> Purchase Order ---")
    st, po = req("POST", "/api/v1/purchasing/orders", {
        "requisitionId": pr_id,
        "supplierId": supplier_id,
        "warehouseId": warehouse_id,
        "rebatePercent": 5.0,
        "items": [{"productId": prod1["id"], "qty": 20, "unitPrice": 140.0}]
    }, token=token)
    assert st in (200, 201), f"PO creation failed: {po}"
    po_id = po["data"]["id"]
    po_no = po["data"]["poNo"]
    print(f"[OK] PO Created from PR: {po_no} (ID: {po_id}, Total: {po['data']['total']})")

    st, po_apr = req("POST", f"/api/v1/purchasing/orders/{po_id}/approve", {}, token=token)
    assert st in (200, 202), f"PO approve failed: {po_apr}"
    print(f"[OK] Purchase Order {po_no} Approved")

    print("\n--- 5. Testing Goods Received Note (GRN) with Batch & Stock In ---")
    batch_no = f"BAT-{uuid.uuid4().hex[:6].upper()}"
    st, grn = req("POST", "/api/v1/purchasing/grns", {
        "purchaseOrderId": po_id,
        "supplierId": supplier_id,
        "warehouseId": warehouse_id,
        "note": "Delivery Chalan #DC-9920",
        "items": [{
            "productId": prod1["id"],
            "qty": 20,
            "costPrice": 140.0,
            "batchNo": batch_no,
            "expiryDate": "2027-12-31"
        }]
    }, token=token)
    assert st in (200, 201), f"GRN failed: {grn}"
    grn_no = grn["data"]["grnNo"]
    grn_id = grn["data"]["id"]
    print(f"[OK] GRN Processed: {grn_no} (ID: {grn_id}) with Batch {batch_no}")

    print("\n--- 6. Verifying Auto-Generated Purchase Invoice & Supplier Due ---")
    st, invs = req("GET", "/api/v1/purchasing/invoices", token=token)
    inv_list = invs.get("data", [])
    matching_inv = next((i for i in inv_list if i.get("purchaseOrderId") == po_id or i.get("goodsReceiptId") == grn_id), None)
    assert matching_inv is not None, "Purchase Invoice was not auto-created"
    pi_id = matching_inv["id"]
    pi_no = matching_inv["piNo"]
    pi_total = float(matching_inv["total"])
    print(f"[OK] Purchase Invoice Found: {pi_no} (Total: {pi_total}, Status: {matching_inv['status']})")

    print("\n--- 7. Testing Supplier Payment Settlement ---")
    st, pay = req("POST", "/api/v1/purchasing/payments", {
        "supplierId": supplier_id,
        "amount": pi_total,
        "method": "BANK",
        "reference": "EFT-883902",
        "note": f"Settlement for PI {pi_no}",
        "allocations": [{"purchaseInvoiceId": pi_id, "amount": pi_total}]
    }, token=token)
    assert st in (200, 201), f"Supplier payment failed: {pay}"
    print(f"[OK] Supplier Payment Recorded: {pay['data']['paymentNo']} (Amount: {pay['data']['amount']})")

    print("\n--- 8. Testing Purchase Return (Debit Note) ---")
    st, ret = req("POST", "/api/v1/purchasing/returns", {
        "supplierId": supplier_id,
        "warehouseId": warehouse_id,
        "purchaseOrderId": po_id,
        "goodsReceiptId": grn_id,
        "returnType": "CREDIT_NOTE",
        "reason": "Defective seal on 2 units",
        "items": [{"productId": prod1["id"], "qty": 2, "unitPrice": 140.0}]
    }, token=token)
    assert st in (200, 201), f"Purchase return failed: {ret}"
    ret_no = ret["data"]["returnNo"]
    print(f"[OK] Purchase Return Created: {ret_no} (Total: {ret['data']['total']})")

    print("\n--- 9. Testing Requisition Rejection Flow ---")
    st, pr2 = req("POST", "/api/v1/purchasing/requisitions", {
        "warehouseId": warehouse_id,
        "note": "Excess request test",
        "items": [{"productId": prod1["id"], "qty": 500, "estUnitPrice": 150.0}]
    }, token=token)
    pr2_id = pr2["data"]["id"]
    req("POST", f"/api/v1/purchasing/requisitions/{pr2_id}/submit", {}, token=token)
    st, rej = req("POST", f"/api/v1/purchasing/requisitions/{pr2_id}/reject", {
        "reason": "Budget limit exceeded for Q3"
    }, token=token)
    print(f"DEBUG REJECT: status={st}, response={rej}")
    assert st == 200, f"Rejection failed: {rej}"
    print(f"[OK] Requisition {pr2['data']['prNo']} successfully rejected with reason.")

    print("\n=======================================================")
    print(" ALL 9 PURCHASING MODULE TESTS PASSED 100% PERFECTLY! ")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
