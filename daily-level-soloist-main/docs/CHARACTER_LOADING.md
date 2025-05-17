# Character Data Loading System

This document explains how character data is loaded, saved, and synchronized between MongoDB and the client.

## Overview

The Solo Leveling game uses a multi-layered approach to ensure character data is properly loaded:

1. **Initial App Loading**: When the app starts, it attempts to load all user data from MongoDB
2. **Authentication Integration**: Users can create accounts to persist their data across devices
3. **Fallback Mechanism**: Local storage is used as a fallback when MongoDB is not available
4. **Cross-Device Synchronization**: Authenticated users can access their data from any device

## Data Loading Flow

```
App Initializes
    │
    ▼
MongoDB Connection Attempt
    │
    ├─► Success ─► Load user data from MongoDB
    │                 │
    │                 │    ┌─► Found ─► Update store with linked character
    │                 ▼    │
    └─► Failure ─► Check for authenticated user ─► Not found ─► Continue with default/local user
                       │
                       ▼
                    Update last login & streak
                       │
                       ▼
                    Render appropriate UI
```

## Implementation Details

### Initial Loading

When the app initializes, it:

1. Establishes a connection to MongoDB
2. Loads basic data (quests, missions, default user)
3. Checks for an authenticated user session
4. If an authenticated user is found, attempts to load their character data
5. Updates the UI to reflect the correct character state (setup, creation, or main game)

### Authentication-Based Loading

When a user logs in:

1. The authentication system validates the user
2. It checks if this user has existing character data in MongoDB
3. If found, it loads that data and updates the store
4. If not, it links the current character data to this authentication account

### Character Creation

When a new character is created:

1. Basic character data is created and saved to MongoDB
2. The user goes through the character creation questionnaire
3. Results are saved to MongoDB, including:
   - Survey responses
   - Calculated stats
   - Character class
   - Strengths and weaknesses

### Cross-Device Access

Users who have authenticated can:

1. Access their character data from any device by logging in
2. Continue their progress seamlessly across platforms
3. Have their data automatically synchronized

## Edge Cases Handled

The system handles the following edge cases:

1. **Network Failures**: Falls back to local storage when MongoDB is unavailable
2. **Data Migration**: Migrates local data to MongoDB when connectivity is restored
3. **Multiple Characters**: Loads the correct character data for the authenticated user
4. **Inconsistent States**: Ensures character creation is completed before proceeding

## Debugging

If character data isn't loading correctly:

1. Check browser console for MongoDB connection errors
2. Verify authentication status using `auth.getCurrentUser()`
3. Check if data exists in MongoDB or local storage
4. Ensure the User model in MongoDB matches the expected schema

## Future Improvements

1. Add multi-character support per authenticated user
2. Implement real-time synchronization between devices
3. Add data conflict resolution for offline play 