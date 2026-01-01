# Database Location & Connection Info

## Your Current Database

Based on your `.env` file, your database is:

- **Type**: PostgreSQL
- **Host**: `localhost`
- **Port**: `5432`
- **Database Name**: `ai_chatbot_saas`
- **Username**: `manjushapaul`
- **Password**: (not set in connection string)

**Connection URL**: `postgresql://manjushapaul@localhost:5432/ai_chatbot_saas`

## How to Access the Database

### Option 1: Using Prisma Studio (Easiest - Visual Interface)

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View and edit data
- Test trial expiration by editing the `subscriptions` table

### Option 2: Using psql (Command Line)

```bash
psql -h localhost -p 5432 -U manjushapaul -d ai_chatbot_saas
```

Or if you need to specify a password:
```bash
psql postgresql://manjushapaul@localhost:5432/ai_chatbot_saas
```

### Option 3: Using pgAdmin (GUI Tool)

1. Download pgAdmin from https://www.pgadmin.org/
2. Create a new server connection:
   - Host: `localhost`
   - Port: `5432`
   - Database: `ai_chatbot_saas`
   - Username: `manjushapaul`

### Option 4: Using TablePlus / DBeaver / Other GUI Tools

Use the connection details above in any PostgreSQL client.

## Quick SQL Commands to Test Trial Expiration

Once connected, you can run:

```sql
-- View all subscriptions
SELECT id, "tenantId", status, "trialEndsAt", "isTrialExpired 
FROM subscriptions 
WHERE status = 'TRIALING';

-- Expire a trial immediately
UPDATE subscriptions 
SET 
  "trialEndsAt" = NOW() - INTERVAL '1 day',
  "isTrialExpired" = true 
WHERE status = 'TRIALING' 
LIMIT 1;

-- Reset trial to 14 days
UPDATE subscriptions 
SET 
  "trialEndsAt" = NOW() + INTERVAL '14 days',
  "isTrialExpired" = false 
WHERE id = '<subscription-id>';
```

## Check if Database is Running

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Or check with Docker (if using Docker)
docker ps | grep postgres
```

## Database Location

Your database is running **locally** on your machine at:
- **Host**: `localhost` (127.0.0.1)
- **Port**: `5432` (default PostgreSQL port)

If you're using a local PostgreSQL installation, the data files are typically stored in:
- **macOS**: `/usr/local/var/postgres` or `/opt/homebrew/var/postgres`
- **Linux**: `/var/lib/postgresql/data`
- **Windows**: `C:\Program Files\PostgreSQL\<version>\data`

## Using the Test Script

The easiest way to test trial expiration is using the script:

```bash
node scripts/test-trial-expiration-simple.js
```

This will automatically find and expire trials without needing direct database access.




