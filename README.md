# MealMate: Corporate Catering & Meal Subsidy Platform

**PRD:** PST_PD_123 · 2026 Level 1 (Core) · 4 weeks

MealMate is a responsive web app for company meal benefits. Employees submit meal expenses and register their meal preference for company catering events. HR managers approve or reject expenses and create catering events. Food vendors see a clear order with meal counts and dietary needs.

> Product promise: an employee can submit a meal expense or register a meal preference in under 30 seconds.

This is a demo with sample data. It has no real payments and no real login.

## Tech stack (PRD section 14)

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 + Bootstrap 5.3 (CDN) + Bootstrap Icons |
| Logic | Vanilla JavaScript (no framework, no build step) |
| Persistence | localStorage |
| Version control | Git and GitHub |
| Deployment | GitHub Pages or Vercel |

## How to run

Open `index.html` in a browser. It works by double-clicking because there is no build step.

You can also run a small local server:

```bash
python3 -m http.server 5500
# then open http://localhost:5500
```

Or use the **Live Server** extension in VS Code.

On first load, the app saves the sample data to localStorage. To start again, use **Reset demo data** at the bottom of the home page.

## Demo roles

| Role | Sign in as | Lands on |
|---|---|---|
| Employee | Aarav Sharma, Priya Nair, Rohan Mehta, Sneha Iyer or Kabir Singh | `employee/dashboard.html` |
| HR Manager | Meera Kapoor | `hr/dashboard.html` |
| Vendor | Annapoorna Caterers or Green Leaf Kitchen | `vendor/dashboard.html` |

## Features

### Must have (MVP)
- **Employee expense management:** submit an expense (date, amount, category, description, receipt reference), with validation shown under each field. The expense history shows each status and any rejection reason.
- **HR expense management:** view all expenses or only pending ones, approve or reject with a confirmation step and a reason, and see totals submitted and approved.
- **Meal subsidy tracking:** each employee has a monthly limit. The amount used is calculated **only from approved expenses** for the current month, along with the remaining balance and a warning at 80% and at 100%.
- **Catering events:** HR creates and edits events (name, date, time, location, registration deadline, vendor). Employees see upcoming events.
- **Dietary preferences:** Vegetarian, Non-vegetarian, Vegan and Jain, plus Gluten-free, Dairy-free, Nut allergy, Other, and notes.
- **Catering order summary:** total registered, a count for each meal category, dietary restriction counts, notes, the list of registered employees, and vendor and event details.
- **Persistence:** all data is in localStorage, so it survives a page refresh.
- **Responsive:** works at laptop and phone widths. Tables turn into cards on phones.

### Good to have (also done)
- Search expenses by employee name and filter by status
- Filter catering events by date and search vendors
- Export expenses and order summaries to CSV
- Subsidy progress bar and dashboard summary cards
- Employees can edit their meal preference until the deadline
- Vendor view: assigned orders only, with Confirm order and Mark as delivered

### Not included (stretch / out of scope)
React + Vite, Chart.js, PDF export, real payments and real vendor integration.

## Important rules (PRD section 10.7)

- Only **approved** expenses count towards subsidy usage. Pending and rejected expenses do not.
- Each employee has **one** meal preference per event. Saving again updates the same record (no duplicates).
- Registration closes after the deadline, or when HR changes the event status from Open.
- Meal counts are always **calculated** from saved preferences, never typed in by hand.
- **Role checks are in the logic** (`js/logic.js`), not only in the UI. Every action such as `approveExpense`, `rejectExpense`, `saveCateringEvent` and `saveMealPreference` checks the current role first. Opening a page of another role sends you back to the home page.

## Folder structure

```
index.html              Home page + demo role selection
employee/               dashboard, submit-expense, expenses, events, preference
hr/                     dashboard, expenses, catering, create-event, summary
vendor/                 dashboard, order
css/style.css           Theme (colours, fonts) on top of Bootstrap
images/                 Food photos (credits below)
js/sample-data.js       Sample employees, vendors, expenses, events, preferences
js/storage.js           localStorage read/write (mm_ keys), find by ID, new IDs
js/helpers.js           Formatting (₹, dates), CSV download, small helpers
js/logic.js             Role permissions, subsidy and meal count calculations, actions
js/components.js        Reusable UI: navbar, cards, badges, tables, modal, toast
js/pages/*.js           One script for each page
```

## localStorage keys (PRD section 10.6)

| Key | Purpose |
|---|---|
| `mm_employees` | Sample employee records |
| `mm_expenses` | Expense submissions |
| `mm_catering_events` | Catering event records |
| `mm_meal_preferences` | Employee meal preferences |
| `mm_vendors` | Sample vendor records |
| `mm_current_user` | Selected demo user and role |

## Demo checklist (PRD section 17.2)

**A. Employee expense:** sign in as Aarav, check the allowance, submit an empty form (errors appear), submit a valid expense, and see it in My Expenses as Pending.

**B. HR review:** switch to HR, open Expense management, review the pending expense and approve it. The status becomes Approved and Aarav's allowance goes down. Reject another expense with a reason, and the reason shows in the employee's history.

**C. Catering:** as HR, create an event with a deadline and vendor. Switch to an employee and choose a meal with restrictions. Switch back to HR and open the Order summary to check the counts.

**D. Vendor:** sign in as the event's vendor, open the order, and check the quantities and dietary summary.

**E. Persistence:** refresh any page and the data is still there. Saving a preference twice does not create a duplicate. Test at laptop width and at phone width (Chrome DevTools, 390px).

## Colours

The PRD suggests navy and teal. After feedback, the team chose a forest green and saffron palette:

| Purpose | Colour |
|---|---|
| Primary (forest) | `#1F4D3A` |
| Accent (saffron) | `#E59A2F` |
| Background | `#F3F5F1` |
| Text | `#14211C` |
| Success / Warning / Error | `#198754` / `#FFC107` / `#DC3545` |

Statuses always show an icon and a word, not just a colour.

## Photo credits

Photos from Wikimedia Commons:
- [Indian thali with poori and rice](https://commons.wikimedia.org/wiki/File:Indian_thali_with_poori_and_rice.jpg) by Mallikarjunasj, CC BY-SA 3.0
- [Chicken Hyderabadi Biryani](https://commons.wikimedia.org/wiki/File:Chicken_Hyderabadi_Biryani.JPG) by Dheerajk88, CC BY-SA 4.0
- [South Indian Thali](https://commons.wikimedia.org/wiki/File:South_Indian_Thali_Cropped.jpg) by Tracy Hunter, CC BY 2.0

## Team

- Pruthvi (PST-26-0106)
- Karanam Rohith Ganesh Kumar (PST-26-0096)
