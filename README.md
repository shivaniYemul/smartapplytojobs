# JobApply Pro

PROJECT NAME

Smart Job Apply Assistant

PROJECT TYPE

Multi-User SaaS Platform for Job Application Automation

OBJECTIVE

Build a complete production-ready web application that allows users to create accounts, manage role-specific resumes and templates, send job applications individually or in bulk, preview emails before sending, and track application history.

TECH STACK

Frontend:

* React
* TypeScript
* Tailwind CSS
* ShadCN UI

Backend:

* Node.js
* Express.js

Database:

* PostgreSQL

Authentication:

* JWT
* bcrypt password hashing

Email:

* Nodemailer SMTP

File Upload:

* Resume PDF Upload
* Excel File Upload (.xlsx, .xls)

---

## USER REGISTRATION

Create Account Page

Fields:

* Full Name
* Email Address
* Password
* Confirm Password

Rules:

Email:

* Required
* Unique
* Used as Login ID

Password Requirements:

* Minimum 8 characters
* At least 1 uppercase letter
* At least 1 lowercase letter
* At least 1 number
* At least 1 special character

Show live validation while typing.

Examples:

✓ Uppercase Letter
✓ Lowercase Letter
✓ Number
✓ Special Character
✓ 8+ Characters

Add Password Strength Meter.

---

## EMAIL VERIFICATION

After registration:

* Send verification email.
* User must verify email before first login.

Account Status:

* Pending Verification
* Active

Unverified users cannot login.

Message:

"Please verify your email before logging in."

---

## LOGIN PAGE

Fields:

* Email Address
* Password

Features:

* Show Password
* Remember Me
* Login Button

If login fails:

Display:

"Invalid email or password."

Show:

* Forgot Password
* Create Account

---

## FORGOT PASSWORD

User enters registered email.

System sends secure reset link.

Reset token expires in 15 minutes.

---

## RESET PASSWORD

Fields:

* New Password
* Confirm Password

Apply same password rules.

After success:

Display:

"Password reset successfully."

Redirect to Login.

---

## ROLE BASED ACCESS

Create two roles:

ADMIN
USER

---

## ADMIN PANEL

Admin Dashboard

Show:

* Total Users
* Active Users
* Verified Users
* Emails Sent Today
* Failed Emails
* Total Applications

User Management

Admin can:

* View Users
* Search Users
* Enable User
* Disable User
* Delete User
* Reset User Password
* View User Activity

User Table Columns:

* Name
* Email
* Registration Date
* Status
* Last Login
* Applications Sent

Admin can see all users.

---

## USER DASHBOARD

Show:

* Total Applications Sent
* Successful Applications
* Failed Applications
* Recent Activity

Sidebar Menu:

* Dashboard
* Manage Roles
* Single Apply
* Bulk Apply
* Application History
* SMTP Settings
* Profile
* Logout

---

## USER DATA ISOLATION

Every user must have private data.

Users can only access:

* Their resumes
* Their templates
* Their SMTP settings
* Their application history
* Their profile

Users must never see another user's data.

---

## DYNAMIC ROLE MANAGEMENT

Roles must not be hardcoded.

Users can:

* Add Role
* Edit Role
* Delete Role

Each role contains:

* Role Name
* Resume PDF
* Subject Template
* Email Template

Examples:

* Java Developer
* SQL Developer
* PLSQL Developer
* HR Executive
* Back Office Executive
* Data Analyst
* Software Tester
* Business Analyst

Users can create unlimited custom roles.

---

## RESUME MANAGEMENT

Allow upload of PDF resumes.

Each role should have its own resume.

Examples:

Java Developer
→ java_resume.pdf

SQL Developer
→ sql_resume.pdf

HR Executive
→ hr_resume.pdf

Users can replace resumes anytime.

---

## SINGLE APPLY

Fields:

* Recipient Email
* Company Name (Optional)
* Job Role
* Job Description (Optional)

Workflow:

Select Role
↓
Generate Email
↓
Preview
↓
Send

If company name is blank:

Greeting:

Dear Hiring Manager,

---

## BULK APPLY

Primary Upload Format:

Excel Files

Supported:

* .xlsx
* .xls

Optional:

* CSV

Excel Columns:

Email
Company Name
Role
Job Description

Features:

* Validate file
* Preview rows
* Show total rows
* Show valid rows
* Show invalid rows
* Allow row removal before sending
* Progress Bar
* Bulk Send Queue
* Skip invalid rows
* Duplicate Detection

If Company Name missing:

Use:

Dear Hiring Manager,

If Role missing:

Use currently selected role.

---

## AI EMAIL GENERATION

Generate ATS-friendly professional emails.

Inputs:

* Company Name
* Job Role
* Job Description

Outputs:

* Subject
* Email Body

Allow user to edit before sending.

---

## EMAIL PREVIEW

Must work correctly.

Display:

* Recipient Email
* Company Name
* Subject
* Email Body
* Attached Resume

Allow editing:

* Subject
* Email Body

Show loading indicator while generating.

Show errors:

* No role selected
* Missing template
* Missing resume

---

## SMTP SETTINGS

Each user has their own SMTP configuration.

Fields:

* Sender Email
* SMTP Host
* SMTP Port
* App Password

Default Gmail Settings:

Host:
smtp.gmail.com

Port:
587

Add:

Test SMTP Connection Button

Show:

✓ Connection Successful

or

✗ Connection Failed

Store SMTP passwords securely.

---

## APPLICATION HISTORY

Store:

* Recipient Email
* Company Name
* Role
* Subject
* Date Sent
* Status
* Resume Used

Statuses:

* Sent
* Failed
* Pending

Features:

* Search
* Filter
* Sort
* Export Excel
* Export CSV

---

## PROFILE PAGE

Allow users to update:

* Name
* Email
* Password

Show:

* Account Creation Date
* Last Login

---

## EMAIL TEMPLATES

Verification Email

Subject:
Verify Your Account

Forgot Password Email

Subject:
Reset Your Password

Application Email

Generated dynamically.

---

## SECURITY

Implement:

* JWT Authentication
* bcrypt Password Hashing
* Protected Routes
* Secure Password Reset Tokens
* Email Verification Tokens
* Session Timeout
* CSRF Protection
* Rate Limiting
* Secure File Upload Validation
* User Data Isolation

---

## DATABASE TABLES

users

id
full_name
email
password_hash
role
status
email_verified
verification_token
reset_token
reset_token_expiry
created_at
last_login

roles

id
user_id
role_name
resume_path
subject_template
email_template
created_at

smtp_settings

id
user_id
sender_email
smtp_host
smtp_port
smtp_password

applications

id
user_id
recipient_email
company_name
role_name
subject
status
resume_used
created_at

---

## UI REQUIREMENTS

* Modern SaaS Design
* Professional Layout
* Responsive Design
* Mobile Friendly
* Dark Mode
* Light Mode
* Toast Notifications
* Loading Indicators
* Success Messages
* Error Messages

---



On first login:

Force password change.

---

## DELIVERABLES

Generate:

* Complete Frontend
* Complete Backend
* PostgreSQL Database
* Authentication System
* Email Verification
* Password Reset
* Admin Panel
* User Management
* Dynamic Role Management
* Resume Upload
* SMTP Integration
* Email Preview
* Single Apply
* Bulk Apply with Excel Upload
* AI Email Generation
* Application Tracking
* Security Features

The application must be fully functional, production-ready, scalable, secure, and deployable on Replit without placeholder implementations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smartapplytojobs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/94bdd461-9d86-4176-89b8-f825e742325d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).


