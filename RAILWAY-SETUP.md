# Railway Setup Instructions

## Problem: Database resets after every deploy

The SQLite database (`orders.db`) is stored in the container's ephemeral filesystem, which is deleted on every deploy.

## Solution: Use Railway Volume

Railway Volumes provide persistent storage that survives deployments.

---

## Quick Setup (5 minutes)

### Step 1: Create a Volume

1. Go to Railway → Your Project → Bot Service
2. Click "Settings" → "Volumes" → "+ New Volume"
3. Set Mount Path: `/app/data`
4. Click "Add"

### Step 2: Add Environment Variable

1. Go to "Variables" tab
2. Add new variable:
   - **Name:** `DB_PATH`
   - **Value:** `/app/data/orders.db`
3. Click "Add"

### Step 3: Deploy

The code is already updated! Just push:

```bash
git add .
git commit -m "Add Railway Volume support"
git push
```

Railway will automatically deploy.

### Step 4: Verify

After deployment, send to the bot:

```
/checkdb
```

You should see:
```
📁 Path: /app/data/orders.db
✅ File exists
```

Add a test client and redeploy. The client should remain in the database!

---

## New Admin Commands

- `/checkdb` - Check database info (path, size, counts)
- `/downloaddb` - Download database backup
- `/uploaddb` - Upload database backup
- `/reloaddata` - Reload warehouses and products from DB

---

## Verification Checklist

- [ ] Volume created (Mount Path: `/app/data`)
- [ ] Environment variable set (`DB_PATH=/app/data/orders.db`)
- [ ] Code deployed
- [ ] `/checkdb` shows correct path
- [ ] Test client added
- [ ] After redeploy, client still exists

---

## Troubleshooting

If data still resets:

1. **Check Volume exists:**
   - Railway → Settings → Volumes
   - Should have Mount Path: `/app/data`

2. **Check environment variable:**
   - Railway → Settings → Variables
   - Should have: `DB_PATH=/app/data/orders.db`

3. **Check logs:**
   - Railway → Deployments → View Logs
   - Look for:
     ```
     📁 Created directory for DB: /app/data
     📊 Database path: /app/data/orders.db
     ✅ Database connected
     ```

4. **Check via bot:**
   ```
   /checkdb
   ```
   Path should be: `/app/data/orders.db`

---

## Backup Strategy

**Important:** Regularly download backups!

```
/downloaddb
```

Recommended:
- Daily backups
- Before major changes
- After adding new clients

To restore:
1. Send `/uploaddb`
2. Send the .db file
3. Redeploy

---

For detailed instructions in Russian, see:
- `НАСТРОЙКА-RAILWAY-VOLUME.md` (full guide)
- `БЫСТРАЯ-НАСТРОЙКА-RAILWAY.txt` (quick reference)
- `РЕШЕНИЕ-RAILWAY-БАЗА-ДАННЫХ.md` (problem description)

---

**Date:** February 7, 2026  
**Version:** 1.0  
**Status:** ✅ Ready to use
