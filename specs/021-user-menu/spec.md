# Feature Specification: User Menu

**Feature Branch**: `021-user-menu`
**Created**: 2026-03-29
**Status**: Draft
**Input**: User description: "I want to implement user Menu. I want it to show who's logged in currently, ability to log out. that's it, keep it simple."

## Clarifications

### Session 2026-03-29

- Q: Should logout invalidate tokens server-side or just clear client-side? → A: Client-side only (clear tokens from memory and localStorage, redirect to login).
- Q: How should the user menu trigger appear in the top bar? → A: Show user initials in the avatar circle; reveal full name/email inside the dropdown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current User Identity (Priority: P1)

As a logged-in user, I want to see my identity (name or email) displayed in the application so that I can confirm I am using the correct account.

**Why this priority**: Knowing who is logged in is the foundational piece of the user menu. Without this, the menu has no purpose.

**Independent Test**: Can be fully tested by logging in and verifying that the user's name or email is visible in the user menu area of the interface.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I look at the user menu area, **Then** I see my display name or email address.
2. **Given** I am logged in, **When** I click on the user menu trigger, **Then** a dropdown appears showing my identity.

---

### User Story 2 - Log Out (Priority: P1)

As a logged-in user, I want to log out of the application so that I can end my session securely.

**Why this priority**: Logout is the only action in this menu and is essential for session security. It shares P1 priority with viewing identity since both are required for a functional user menu.

**Independent Test**: Can be fully tested by clicking the logout option and verifying the user is redirected to a logged-out state (e.g., login page or public landing page).

**Acceptance Scenarios**:

1. **Given** I am logged in and the user menu is open, **When** I click "Log out", **Then** my session is ended and I am redirected to the login or landing page.
2. **Given** I have logged out, **When** I try to access a protected page, **Then** I am redirected to the login page.

---

### Edge Cases

- What happens when the user's display name is unavailable (e.g., only an email exists)? The system should fall back to displaying the email address.
- What happens if the logout request fails (e.g., network error)? The system should show an error message and allow the user to retry.
- What happens if the user's session has already expired when they click logout? The system should redirect to the login page gracefully without showing an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the currently logged-in user's initials in the avatar circle in the top bar. The full display name or email is shown inside the dropdown menu.
- **FR-002**: System MUST provide a clickable user menu trigger (the avatar circle) that opens a dropdown.
- **FR-003**: The user menu dropdown MUST display the user's full name (or email as fallback) and contain a "Log out" option.
- **FR-004**: Clicking "Log out" MUST clear tokens from memory and localStorage and redirect to the login page (client-side only; no server-side token revocation).
- **FR-005**: If the user's display name is not available, the system MUST fall back to showing their email address (for both the initials derivation and the dropdown display).
- **FR-006**: The user menu MUST be accessible from all authenticated pages (e.g., placed in the application header or sidebar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify who is currently logged in within 1 second of viewing any authenticated page.
- **SC-002**: Users can complete the logout flow in 2 clicks or fewer (open menu, click logout).
- **SC-003**: After logout, users are unable to access any protected content without re-authenticating.

## Assumptions

- The application already has an authentication system in place (login flow, session management).
- User identity information (name or email) is available from the existing auth context or session.
- The user menu will be placed in the application's existing navigation area (header or sidebar).
- This feature does not include profile editing, settings, or any other menu items beyond identity display and logout.
