"""Fix grocery module: hide all menu_items so it appears as a direct link."""
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:Blue%401234@192.168.181.104:3306/blue_ocean_pos")
with engine.begin() as conn:
    m = conn.execute(text("SELECT id, route FROM modules WHERE code = 'grocery'")).first()
    if not m:
        print("Grocery module not found!")
    else:
        print(f"Grocery module: id={m[0]}, route={m[1]}")
        items = conn.execute(
            text("SELECT id, label, route, isVisible FROM menu_items WHERE moduleId = :mid"),
            {"mid": m[0]}
        ).fetchall()
        print(f"Found {len(items)} menu items:")
        for i in items:
            print(f"  {i}")

        # Hide all menu items for grocery so no sub-menu appears
        result = conn.execute(
            text("UPDATE menu_items SET isVisible = 0 WHERE moduleId = :mid"),
            {"mid": m[0]}
        )
        print(f"Updated {result.rowcount} menu items -> isVisible=0")

print("Done!")
