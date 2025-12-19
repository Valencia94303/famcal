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

*Document created: December 2024*
*Status: Pending discussion*
