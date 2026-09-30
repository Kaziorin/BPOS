import pymysql

conn = pymysql.connect(host='192.168.181.104', user='root', password='Blue@1234', db='blue_ocean_pos')
cur = conn.cursor()
hash_123456 = '$2b$10$uHuf1bhrhA34actlmz39S.ZpmN16TUORTlTeDakcyaxN0MBcQCOXa'
cur.execute(
    "UPDATE users SET passwordHash=%s WHERE email IN ('blueocean@grocery.com', 'blueocean@pharmacy.com', 'blueocean@wholesale.com')",
    (hash_123456,)
)
conn.commit()
print('Successfully updated password for users:', cur.rowcount)
