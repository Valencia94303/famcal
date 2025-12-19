# FamCal Demo Presentation Script
## The Garcia Family Dashboard
### ~5-7 minute walkthrough

---

## BACKSTORY (Know this, don't read it verbatim)

Meet the **Garcia Family** from San Jose, California:

- **Marcus (Dad)** - Software developer who works from home. Coaches Ethan's soccer team on weekends. Loves playing Minecraft and Mario Kart with the kids after work.

- **Sofia (Mom)** - Pediatric nurse at the local hospital. She's the logistics queen who keeps everyone on schedule. Works 3 days a week (12-hour shifts).

- **Ethan (10)** - 5th grader, soccer star, Minecraft enthusiast. Responsible older brother who helps with Max the dog. Currently saving points for a new video game.

- **Lily (7)** - 2nd grader, loves gymnastics and art. Creative soul who would rather draw than do chores, but is motivated by the reward system!

- **Max** - The family's golden retriever and unofficial 5th family member.

---

## SCRIPT

### OPENING (30 seconds)

> "This is FamCal - a family dashboard designed to run on a Raspberry Pi mounted in a common area like the kitchen or hallway. Let me show you how the Garcia family uses it to stay organized."

*[Point to the dashboard on screen]*

> "Right now you're looking at the main display view. It cycles through different widgets every 30 seconds, showing the family calendar, today's schedule, chores, and more. The background and colors change automatically based on time of day."

---

### WIDGET TOUR (3-4 minutes)

#### Calendar Widget
> "The calendar syncs with Google Calendar. You can see the family has Ethan's soccer practice on Tuesday and Thursday, Lily's gymnastics on Monday and Wednesday. It pulls in school events, appointments - everything stays in one place."

#### Schedule Widget
> "The schedule widget shows today's routine - wake up at 6:45, breakfast, school drop-off at 8. Dad's got his morning standup at 9:30 since he works from home. After school there's homework time at 4, then activities. Family dinner is at 6:30 every night - that's non-negotiable in this house!"

#### Chores Widget
> "Here's where it gets fun. Every chore is worth points. Making your bed? 5 points. Feeding Max the dog? 10 points. Taking out the trash on Tuesday? 15 points. The kids can see exactly what's expected and what they'll earn."

#### Habits Widget
> "Beyond chores, we track daily habits - brushing teeth, reading for 20 minutes, practicing piano. These also earn points and help build good routines."

#### Points Leaderboard
> "This shows each child's point balance. Ethan is currently at 175 points, Lily has 120. There's a friendly competition element, but it's really about personal progress."

#### Shopping List
> "Organized by store - Costco, Target, Walmart. When Mom notices they're low on dog food or the kids need school supplies, it goes on the list. Simple and visual."

#### Tasks Widget
> "These are one-off items - homework assignments, permission slips due, scheduling the dog's vet appointment. The family can see what's coming up and what's urgent."

---

### REWARDS SYSTEM (1 minute)

> "Now the magic - the rewards! Points can be redeemed for real rewards the family has agreed on."

*[If showing manage screen, navigate to rewards]*

> "30 points gets you extra screen time. 75 points and you pick the family movie this weekend. Save up 500 points? That's a new video game. There's even a cash-out option - $1 for every 100 points."

> "This teaches kids about earning, saving, and making choices. Do you spend your points now on ice cream, or save up for something bigger?"

---

### MANAGEMENT & SECURITY (30 seconds)

> "Parents access the management screen with a PIN code. From there they can add chores, adjust point values, approve reward redemptions, and see an audit log of all point transactions."

> "The whole system backs up automatically and can be restored if needed."

---

### CLOSING (30 seconds)

> "FamCal runs 24/7 on a $50 Raspberry Pi with a touchscreen. It's self-hosted, private, and doesn't require any subscriptions."

> "For the Garcia family, it's transformed their daily routine. The kids know what's expected, they're motivated by earning points, and there's less nagging. Marcus and Sofia can see everything at a glance."

> "Questions?"

---

## KEY TALKING POINTS (if asked)

- **Why Raspberry Pi?** Always-on, low power, no monthly fees, total privacy
- **How long to set up?** About an hour for basic setup, then customize over time
- **Multiple kids?** Each has their own profile, color, and point balance
- **Age range?** Works for ages 5-15; adjust point values and rewards as kids grow
- **What if parents disagree on rewards?** You configure everything together - it's a family conversation
- **Screen time concern?** The dashboard is informational, not interactive for kids - no games, no endless scrolling

---

## LOADING THE DEMO

1. Go to `/manage` and enter your PIN
2. Navigate to **Settings** tab
3. Scroll to **Backup & Restore**
4. Click **Restore from File**
5. Select `demo-backup.json`
6. Confirm the restore

The demo data will be loaded immediately!

---

## RESETTING AFTER DEMO

To clear demo data and start fresh:
1. Either restore a different backup
2. Or re-run the seed command: `npx prisma db seed`
