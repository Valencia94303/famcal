# FamCal Enhancement Requests

Future enhancements to be discussed and implemented after beta testing.

---

## 1. Role-Based Access Control

### Current State
- No authentication required for any page
- All users have equal access to admin functions
- Points can be modified by anyone

### Proposed Enhancement
Implement role-based access control (RBAC) with two user types:

| Role | Access Level |
|------|--------------|
| **Parent (Admin)** | Full access to all features |
| **Child (User)** | Limited access, view-only for some features |

### Parent (Admin) Capabilities
- Full access to `/manage` admin panel
- Add/edit/delete family members
- Create/modify chores, habits, rewards
- Approve/deny reward redemptions
- Award bonus points
- Modify all settings
- View all point transactions

### Child (User) Capabilities
- View dashboard
- Mark their own chores as complete
- Log their own habits
- View their own point balance
- Request reward redemptions
- **Cannot** access admin panel
- **Cannot** modify other users' data
- **Cannot** approve their own redemptions

---

## 2. Authentication for Admin Sections

### Current State
- No login required
- Anyone on the network can access `/manage`

### Proposed Enhancement
Require authentication for sensitive areas:

| Page/Feature | Authentication Required |
|--------------|------------------------|
| `/` (Dashboard) | No - public display |
| `/manage` | Yes - Parent only |
| `/manage/settings` | Yes - Parent only |
| `/api/points/*` | Yes - Parent for modifications |
| `/api/rewards/redemptions` (approve) | Yes - Parent only |
| Chore completion | Yes - Any authenticated user |
| Habit logging | Yes - Any authenticated user |

### Implementation Options

**Option A: PIN-based Authentication**
- Simple 4-6 digit PIN for parents
- Quick to enter on touch screens
- No external accounts needed
- Stored hashed in database

**Option B: Google Account Authentication**
- Use existing Google OAuth integration
- Link Google accounts to family members
- Parent accounts get admin access
- More secure but requires Google account

**Option C: Hybrid Approach**
- Google OAuth for initial setup
- PIN for quick daily authentication
- Parents can set/reset PINs for family members

---

## 3. Secure Points System

### Current State
- Points can be awarded/deducted without authentication
- No audit trail of who made changes
- Chores can be marked complete by anyone
- Potential for kids to game the system

### Proposed Enhancement

#### 3.1 Point Transaction Logging
- Record WHO made each transaction
- Record WHEN transaction occurred
- Record FROM WHICH DEVICE (IP/device name)
- Immutable audit log

#### 3.2 Chore Completion Verification
Options to consider:
- **Parent approval required**: Chores pending until parent confirms
- **Photo verification**: Kids upload photo proof of completed chore
- **Time-based restrictions**: Chores can only be marked complete during certain hours
- **Location-based**: Must be on home network to complete

#### 3.3 Anti-Gaming Measures
- Rate limiting on point transactions
- Alert parents of unusual activity
- Daily/weekly point caps per child
- Require re-authentication for high-value actions

#### 3.4 Redemption Workflow
```
Child requests reward
       ↓
Request logged with timestamp
       ↓
Parent receives notification
       ↓
Parent reviews and approves/denies
       ↓
Points deducted only after approval
       ↓
Transaction logged with approver info
```

---

## 4. Implementation Priority

### Phase 1: Quick Wins
- [ ] Add PIN authentication for `/manage`
- [ ] Log all point transactions with timestamps
- [ ] Require parent approval for redemptions (already exists, verify working)

### Phase 2: Role System
- [ ] Link family members to authentication
- [ ] Implement parent vs child permissions
- [ ] Restrict admin panel to parents

### Phase 3: Advanced Security
- [ ] Chore completion verification options
- [ ] Activity alerts for parents
- [ ] Detailed audit logging
- [ ] Device tracking

---

## 5. Questions to Discuss

1. **PIN vs Google Auth**: Which is preferred for daily use?
2. **Chore verification**: Is parent approval needed, or trust the kids?
3. **Dashboard access**: Should kids need to log in to view dashboard?
4. **Multiple parents**: Should all parents have equal admin access?
5. **Audit retention**: How long to keep transaction logs?
6. **Notifications**: How should parents be notified of pending approvals?

---

## 6. Technical Considerations

### Database Changes
- Add `pin` field to FamilyMember (hashed)
- Add `linkedUserId` to connect Google accounts to family members
- Add `createdBy` field to point transactions
- Add `deviceInfo` field to transactions

### API Changes
- Add authentication middleware
- Add role-checking middleware
- New endpoints for PIN management
- Rate limiting on sensitive endpoints

### UI Changes
- Login/PIN entry screen
- "Switch User" functionality
- Parent approval queue in admin panel
- Activity log viewer

---

## 7. Database Seeding for Testing

### Current State
- Fresh installs have empty database
- Manual data entry required for testing
- Time-consuming to set up test scenarios

### Proposed Enhancement
Create a database seed script with comprehensive test data.

#### Seed Data to Include

| Feature | Test Data |
|---------|-----------|
| Family Members | 2 parents, 2-3 kids with different colors |
| Chores | Daily, weekly, custom recurrence examples |
| Habits | Morning/evening routines, health habits |
| Tasks | Various priorities and due dates |
| Shopping | Items for different stores |
| Schedule | Daily routine items |
| Rewards | Point-based and cash rewards |
| Points | Sample transactions for each kid |

#### Implementation

```bash
# Usage
npx prisma db seed

# Or via npm script
npm run seed
```

#### Seed Script Location
```
prisma/seed.ts
```

#### Benefits
- Faster testing setup
- Consistent test scenarios
- Demo mode for showcasing
- Development environment parity

#### Options
- `--demo` - Family-friendly demo data
- `--test` - Edge cases and stress test data
- `--clean` - Clear existing data first

---

## 8. Settings Backup & Restore

### Current State
- Settings stored only in local SQLite database
- Rebuilding the site requires reconfiguring all settings
- No way to transfer settings between installations

### Proposed Enhancement
Add ability to export and import all settings and data.

#### Export Feature

**API Endpoint:** `GET /api/backup`

```json
{
  "version": "1.0.0",
  "exportedAt": "2024-12-19T10:00:00Z",
  "settings": { ... },
  "familyMembers": [ ... ],
  "chores": [ ... ],
  "habits": [ ... ],
  "rewards": [ ... ],
  "scheduleItems": [ ... ]
}
```

#### Import Feature

**API Endpoint:** `POST /api/backup/restore`

- Upload JSON backup file
- Option to merge or replace existing data
- Validate data structure before import
- Handle version migrations if needed

#### UI Changes

**In Settings Section:**
- "Export Backup" button - downloads JSON file
- "Import Backup" button - file upload with confirmation
- Last backup timestamp display
- Option to auto-backup on schedule

#### Data Included in Backup

| Data Type | Included | Notes |
|-----------|:--------:|-------|
| Settings | ✓ | All app settings |
| Family Members | ✓ | Names, colors, roles |
| Chores | ✓ | Definitions and assignments |
| Habits | ✓ | Definitions only |
| Rewards | ✓ | Names and point costs |
| Schedule Items | ✓ | Daily routines |
| Point Transactions | Optional | Can be large |
| Completion History | Optional | Can be large |

#### Benefits
- Quick recovery after rebuild
- Easy migration to new hardware
- Shareable family configurations
- Version control for settings

---

## 9. User Profile Customization

### Current State
- Family members have name and color only
- No avatar/profile picture support
- Limited personalization options

### Proposed Enhancement
Allow users to customize their profile appearance.

#### Profile Options

| Field | Description |
|-------|-------------|
| **Avatar** | Profile picture or emoji |
| **Display Name** | Nickname for dashboard |
| **Color** | Already exists - theme color |
| **Birthday** | For birthday celebrations |
| **Preferences** | Individual display preferences |

#### Avatar Options

**Option A: Emoji Avatars**
- Select from curated emoji set
- Simple, no file storage needed
- Works well at any size

**Option B: Built-in Avatar Library**
- Pre-made cartoon/icon avatars
- Multiple styles (animals, characters, etc.)
- Stored as static assets

**Option C: Custom Image Upload**
- Upload personal photo
- Crop/resize tool
- Stored locally or in database

**Option D: Gravatar Integration**
- Link to email for automatic avatar
- No local storage needed
- Requires email per family member

#### Database Changes

```prisma
model FamilyMember {
  // Existing fields...
  avatar        String?   // Emoji, asset path, or image URL
  avatarType    String    @default("emoji")  // "emoji", "asset", "custom"
  displayName   String?   // Optional nickname
  birthday      DateTime?
  preferences   Json?     // Individual settings
}
```

#### UI Changes

**Family Member Edit Form:**
- Avatar picker (emoji grid or image upload)
- Display name field
- Birthday date picker

**Dashboard Display:**
- Show avatar next to assigned items
- Avatar in chore assignments
- Avatar in points leaderboard
- Birthday indicator on special days

#### Where Avatars Would Appear

| Location | Current | With Avatars |
|----------|---------|--------------|
| Chore assignments | Color dot | Avatar + color |
| Habit tracking | Name only | Avatar + name |
| Points display | Color bar | Avatar + points |
| Leaderboard | Names | Avatar + name + rank |
| Task assignments | Color dot | Avatar |

---

## 10. Automatic Calendar Sync

### Current State
- Calendar only syncs when manually pressing "Sync" button in `/setup`
- Dashboard refreshes from local database every 5 minutes
- New Google Calendar events don't appear until manual sync

### Proposed Enhancement
Add automatic background sync from Google Calendar on a schedule.

#### Implementation

**Option A: Server-Side Interval**
- Background job syncs every 15 minutes
- Runs regardless of whether dashboard is open
- More reliable but requires persistent process

**Option B: Client-Side Trigger**
- Dashboard triggers sync API every 15 minutes
- Simpler implementation
- Only syncs when dashboard is displayed

#### API Rate Limits
Google Calendar API allows 1,000,000 queries/day:
- 15-minute sync = 96 queries/day
- 5-minute sync = 288 queries/day
- 1-minute sync = 1,440 queries/day

**Conclusion**: 15-minute intervals are perfectly safe.

#### Settings
Add to Settings UI:
- Auto-sync toggle (on/off)
- Sync interval dropdown (5, 10, 15, 30 minutes)
- Last sync timestamp display
- Manual sync button (keep existing)

#### Database Changes
```prisma
model Settings {
  // Existing fields...
  calendarAutoSync      Boolean @default(true)
  calendarSyncInterval  Int     @default(15)  // minutes
  calendarLastSync      DateTime?
}
```

#### Implementation Notes
- Show "Last synced: X minutes ago" on dashboard
- Visual indicator during sync (subtle spinner)
- Error handling if Google token expires
- Don't sync if no calendar connected

---

## 11. Photo Optimization for Screensaver

### Current State
- Photos served raw without any processing
- Large phone photos (4-8MB, 4000x3000px) cause stuttering
- Ken Burns animations struggle on Raspberry Pi with large files

### Proposed Enhancement
Automatic photo optimization using hybrid approach - archive originals, optimize in place.

#### How It Works
1. New photos detected in photo folder
2. Original moved to `.originals/` archive folder
3. Optimized version saved in place of original
4. Originals preserved for recovery if needed

#### Optimization Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Max Width | 1920px | Full HD is plenty for TV |
| Max Height | 1080px | Matches display resolution |
| Quality | 85% | Good balance of size/quality |
| Format | JPEG | Smaller than PNG for photos |

#### File Size Comparison

| Original | Optimized | Savings |
|----------|-----------|---------|
| 5MB (4000x3000) | ~300KB (1920x1080) | 94% |
| 8MB (4032x3024) | ~350KB (1920x1080) | 96% |

#### Folder Structure
```
/home/pi/famcal-photos/
├── photo1.jpg          # Optimized (300KB)
├── photo2.jpg          # Optimized (350KB)
├── photo3.jpg          # Optimized (280KB)
└── .originals/         # Hidden archive folder
    ├── photo1.jpg      # Original (5MB)
    ├── photo2.jpg      # Original (6MB)
    └── photo3.jpg      # Original (4MB)
```

#### Implementation

**Dependencies:**
```bash
npm install sharp
```

**New API Route:** `POST /api/local-photos/optimize`
```typescript
import sharp from 'sharp';

async function optimizePhotos(photoPath: string) {
  const archivePath = path.join(photoPath, '.originals');
  fs.mkdirSync(archivePath, { recursive: true });

  const files = fs.readdirSync(photoPath);

  for (const file of files) {
    if (isImage(file) && !isOptimized(file)) {
      const filePath = path.join(photoPath, file);
      const archiveFile = path.join(archivePath, file);

      // Move original to archive
      fs.renameSync(filePath, archiveFile);

      // Create optimized version in place
      await sharp(archiveFile)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(filePath);
    }
  }
}
```

#### Trigger Options

**Option A: Manual Button**
- "Optimize Photos" button in Settings
- Shows progress and results

**Option B: Automatic on Scan**
- Optimize when new photos detected
- Runs during `/api/local-photos` scan

**Option C: Scheduled**
- Run optimization check every hour
- Optimizes any new unprocessed photos

#### Benefits
- Smooth Ken Burns animations on Raspberry Pi
- Saves disk space (no duplicate optimized copies)
- Originals preserved in archive for recovery
- No manual photo preparation needed

#### Settings UI
- "Optimize Photos" button with progress indicator
- "Restore Originals" button (moves files back)
- Archive size display
- Auto-optimize toggle (on new photos)

#### Recovery
```bash
# Restore all originals
mv /home/pi/famcal-photos/.originals/* /home/pi/famcal-photos/

# Or restore specific photo
mv /home/pi/famcal-photos/.originals/photo1.jpg /home/pi/famcal-photos/
```

---

*Document created: December 2024*
*Status: Pending discussion*
