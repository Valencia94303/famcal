# FamCal Beta Testing Checklist

Version: v1.0.0-beta
Testing Period: December 2024

## Quick Reference

- **Dashboard URL**: `http://famcal.local:3000`
- **Admin Panel**: `http://famcal.local:3000/manage`
- **Logs**: `sudo journalctl -u famcal -f`
- **Restart**: `sudo systemctl restart famcal`

---

## Pre-Testing Setup

### Initial Deployment
- [ ] Clone repository successfully
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] Database initialized (`npx prisma db push`)
- [ ] Service installed (`setup-autostart.sh`)
- [ ] Kiosk mode configured (`setup-kiosk.sh`)
- [ ] System rebooted and auto-starts

### Network Access
- [ ] Dashboard accessible from Pi (`localhost:3000`)
- [ ] Dashboard accessible from other devices on network
- [ ] Admin panel accessible from mobile device

---

## Display & UI Testing

### Dashboard Display
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Dashboard loads without errors | ☐ | ☐ | |
| Dynamic background renders correctly | ☐ | ☐ | |
| Floating orbs animate smoothly | ☐ | ☐ | |
| No flickering or visual glitches | ☐ | ☐ | |
| Text is readable on all backgrounds | ☐ | ☐ | |
| Responsive on TV resolution | ☐ | ☐ | |

### Clock Display
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Time displays correctly | ☐ | ☐ | |
| Time updates every second | ☐ | ☐ | |
| Colon blinks animation works | ☐ | ☐ | |
| Date displays correctly | ☐ | ☐ | |
| AM/PM indicator correct | ☐ | ☐ | |
| Text visible over photos | ☐ | ☐ | |

### Weather Display
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Weather data loads | ☐ | ☐ | |
| Temperature displays correctly | ☐ | ☐ | |
| Temperature color matches temp range | ☐ | ☐ | |
| City name displays ("Sherwoods Manor") | ☐ | ☐ | |
| Weather icon shows correctly | ☐ | ☐ | |
| High/Low temps display | ☐ | ☐ | |
| Weather refreshes every 10 min | ☐ | ☐ | |
| Handles no internet gracefully | ☐ | ☐ | |

### Header Alternation (if enabled)
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Switches between clock and weather | ☐ | ☐ | |
| Transition animation smooth | ☐ | ☐ | |
| Interval timing correct | ☐ | ☐ | |

---

## Widget Carousel Testing

### General Carousel
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Widgets rotate automatically | ☐ | ☐ | |
| Rotation interval matches settings | ☐ | ☐ | |
| Navigation dots visible | ☐ | ☐ | |
| Clicking dots changes widget | ☐ | ☐ | |
| Current widget dot highlighted | ☐ | ☐ | |

### Animation Presets
Test each animation style:

| Animation | Smooth | Choppy | Broken | Notes |
|-----------|:------:|:------:|:------:|-------|
| Arriving Together | ☐ | ☐ | ☐ | |
| Racing Friends | ☐ | ☐ | ☐ | |
| Bouncy Ball | ☐ | ☐ | ☐ | |
| Peek-a-Boo | ☐ | ☐ | ☐ | |
| Airplane Landing | ☐ | ☐ | ☐ | |
| Silly Spin | ☐ | ☐ | ☐ | |
| Trampoline Jump | ☐ | ☐ | ☐ | |
| Crash & Recover | ☐ | ☐ | ☐ | |
| Jelly Wobble | ☐ | ☐ | ☐ | |
| Rocket Launch | ☐ | ☐ | ☐ | |
| Swing In | ☐ | ☐ | ☐ | |
| Tumble In | ☐ | ☐ | ☐ | |
| Balloon Float | ☐ | ☐ | ☐ | |
| Surprise Me! (cycle) | ☐ | ☐ | ☐ | |

### Individual Widgets
| Widget | Loads | Data Correct | Styled Well | Notes |
|--------|:-----:|:------------:|:-----------:|-------|
| Calendar | ☐ | ☐ | ☐ | |
| Schedule | ☐ | ☐ | ☐ | |
| Chores | ☐ | ☐ | ☐ | |
| Habits | ☐ | ☐ | ☐ | |
| Tasks | ☐ | ☐ | ☐ | |
| Shopping | ☐ | ☐ | ☐ | |
| Meal Plan | ☐ | ☐ | ☐ | |
| Points | ☐ | ☐ | ☐ | |

---

## Photo Mode Testing

### Basic Photo Display
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Photos load from configured folder | ☐ | ☐ | |
| Ken Burns effect animates | ☐ | ☐ | |
| Photos transition smoothly | ☐ | ☐ | |
| Crossfade between photos | ☐ | ☐ | |
| Photo interval timing correct | ☐ | ☐ | |
| Random photo order | ☐ | ☐ | |

### Mini Dashboard Overlay
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Mini dashboard visible | ☐ | ☐ | |
| Appears in random corner | ☐ | ☐ | |
| Content readable at small size | ☐ | ☐ | |
| Semi-transparent background | ☐ | ☐ | |
| Doesn't block photo view | ☐ | ☐ | |

### Dashboard Interruptions
Test at these specific times:

| Time Window | Dashboard Shows | Photos Resume | Notes |
|-------------|:---------------:|:-------------:|-------|
| :25 - :35 | ☐ | ☐ | |
| :55 - :05 | ☐ | ☐ | |
| Before 6 AM (photos only) | ☐ | N/A | |
| After midnight (photos only) | ☐ | N/A | |

---

## Admin Panel Testing

### Navigation
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| All tabs accessible | ☐ | ☐ | |
| Tab switching smooth | ☐ | ☐ | |
| Page scrolls properly | ☐ | ☐ | |
| Bottom nav always visible | ☐ | ☐ | |
| Works on mobile device | ☐ | ☐ | |

### Family Management
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add new family member | ☐ | ☐ | |
| Edit existing member | ☐ | ☐ | |
| Delete member | ☐ | ☐ | |
| Color picker works | ☐ | ☐ | |
| Role selection works | ☐ | ☐ | |

### Chores Management
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add new chore | ☐ | ☐ | |
| Edit existing chore | ☐ | ☐ | |
| Delete chore | ☐ | ☐ | |
| Assign to family members | ☐ | ☐ | |
| Set recurrence (daily/weekly) | ☐ | ☐ | |
| Set point value | ☐ | ☐ | |
| Mark chore complete | ☐ | ☐ | |
| Undo completion | ☐ | ☐ | |

### Habits
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| View habits list | ☐ | ☐ | |
| Add new habit | ☐ | ☐ | |
| Log habit completion | ☐ | ☐ | |
| Points awarded correctly | ☐ | ☐ | |

### Tasks
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add new task | ☐ | ☐ | |
| Mark task complete | ☐ | ☐ | |
| Set priority | ☐ | ☐ | |
| Set due date | ☐ | ☐ | |
| Delete task | ☐ | ☐ | |

### Shopping List
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add shopping item | ☐ | ☐ | |
| Set quantity | ☐ | ☐ | |
| Select store | ☐ | ☐ | |
| Check off item | ☐ | ☐ | |
| Delete item | ☐ | ☐ | |
| Filter by store | ☐ | ☐ | |

### Schedule
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add schedule item | ☐ | ☐ | |
| Set time | ☐ | ☐ | |
| Set days | ☐ | ☐ | |
| Edit item | ☐ | ☐ | |
| Delete item | ☐ | ☐ | |

### Rewards
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Add new reward | ☐ | ☐ | |
| Set point cost | ☐ | ☐ | |
| Edit reward | ☐ | ☐ | |
| Delete reward | ☐ | ☐ | |

### Points
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| View point balances | ☐ | ☐ | |
| Award bonus points | ☐ | ☐ | |
| View transaction history | ☐ | ☐ | |
| Approve redemption request | ☐ | ☐ | |
| Deny redemption request | ☐ | ☐ | |

### Settings
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Change carousel interval | ☐ | ☐ | |
| Change animation style | ☐ | ☐ | |
| Change header mode | ☐ | ☐ | |
| Update weather location | ☐ | ☐ | |
| Enable/disable photo mode | ☐ | ☐ | |
| Change photo folder path | ☐ | ☐ | |
| Change photo interval | ☐ | ☐ | |
| Save settings successfully | ☐ | ☐ | |
| Settings persist after restart | ☐ | ☐ | |

---

## Stability Testing

### Long-Running Tests
| Test | Duration | Result | Notes |
|------|----------|--------|-------|
| Run for 1 hour | 1h | ☐ Pass ☐ Fail | |
| Run for 4 hours | 4h | ☐ Pass ☐ Fail | |
| Run for 24 hours | 24h | ☐ Pass ☐ Fail | |
| Run for 48 hours | 48h | ☐ Pass ☐ Fail | |

### Memory & Performance
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| No memory leaks over time | ☐ | ☐ | Check with `htop` |
| CPU usage reasonable (<30%) | ☐ | ☐ | |
| Animations stay smooth | ☐ | ☐ | |
| No browser crashes | ☐ | ☐ | |

### Recovery Tests
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Recovers from power loss | ☐ | ☐ | |
| Recovers from network loss | ☐ | ☐ | |
| Service restarts on crash | ☐ | ☐ | |
| Database intact after restart | ☐ | ☐ | |

---

## Edge Cases

### Data Edge Cases
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Empty family members list | ☐ | ☐ | |
| Empty chores list | ☐ | ☐ | |
| No photos in folder | ☐ | ☐ | |
| Very long chore/task names | ☐ | ☐ | |
| Special characters in names | ☐ | ☐ | |
| Zero point values | ☐ | ☐ | |

### Network Edge Cases
| Test | Pass | Fail | Notes |
|------|:----:|:----:|-------|
| Slow network connection | ☐ | ☐ | |
| Intermittent network | ☐ | ☐ | |
| No internet (weather fails gracefully) | ☐ | ☐ | |

---

## Bug Report Template

When you find a bug, document it:

```markdown
### Bug: [Brief description]

**Date/Time**:
**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots/Logs**:

**Device/Browser**:

**Additional Notes**:
```

---

## Test Session Log

### Session 1
**Date**: _______________
**Tester**: _______________
**Duration**: _______________

**Summary**:


**Issues Found**:
1.
2.
3.

**Notes**:


---

### Session 2
**Date**: _______________
**Tester**: _______________
**Duration**: _______________

**Summary**:


**Issues Found**:
1.
2.
3.

**Notes**:


---

## Sign-Off

### Beta Testing Complete

- [ ] All critical tests passed
- [ ] All high-priority bugs fixed
- [ ] Performance acceptable for production
- [ ] Documentation accurate
- [ ] Ready for v1.0.0 release

**Tested By**: _______________
**Date**: _______________
**Signature**: _______________
