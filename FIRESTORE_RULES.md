# Firebase Firestore Security Rules

## Basic Rules (Development & Production)

Copy and paste these rules into your Firebase Console under **Firestore Database → Rules**:

### Development Rules (Permissive - Use for testing only!)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **WARNING**: These rules allow anyone to read/write any data. Use only during development!

---

### Production Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles (for leaderboard)
      allow read: if true;
      
      // Only authenticated users can create their own profile
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.fullName is string
                    && request.resource.data.class is string
                    && request.resource.data.department is string
                    && request.resource.data.semester is string
                    && request.resource.data.phone is string
                    && request.resource.data.highScore is number
                    && request.resource.data.highScore >= 0;
      
      // Only the user can update their own profile
      // High score can only increase (prevents cheating)
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.highScore >= resource.data.highScore;
      
      // No one can delete user profiles
      allow delete: if false;
    }
  }
}
```

---

### Enhanced Production Rules (With Rate Limiting)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to validate score update
    function isValidScoreUpdate() {
      return request.resource.data.highScore is number
          && request.resource.data.highScore >= 0
          && request.resource.data.highScore >= resource.data.highScore
          && request.resource.data.highScore < 1000000; // Maximum score limit
    }
    
    // Helper function to validate user data
    function isValidUserData() {
      return request.resource.data.fullName is string
          && request.resource.data.fullName.size() > 0
          && request.resource.data.fullName.size() <= 100
          && request.resource.data.class is string
          && request.resource.data.class.size() > 0
          && request.resource.data.class.size() <= 50
          && request.resource.data.department is string
          && request.resource.data.department.size() > 0
          && request.resource.data.department.size() <= 100
          && request.resource.data.semester is string
          && request.resource.data.semester.size() > 0
          && request.resource.data.semester.size() <= 20
          && request.resource.data.phone is string
          && request.resource.data.phone.size() > 0
          && request.resource.data.phone.size() <= 20;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read (for leaderboard)
      allow read: if true;
      
      // Create with validation
      allow create: if isOwner(userId)
                    && isValidUserData()
                    && request.resource.data.highScore == 0;
      
      // Update with validation and score increase only
      allow update: if isOwner(userId)
                    && isValidScoreUpdate();
      
      // No deletions
      allow delete: if false;
    }
  }
}
```

---

## How to Apply Rules

### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** (in Build menu)
4. Click on **Rules** tab
5. Copy and paste the rules above
6. Click **Publish**

### Method 2: Firebase CLI

1. Create a file named `firestore.rules` in your project root
2. Paste the rules into the file
3. Run: `firebase deploy --only firestore:rules`

---

## Testing Rules

Firebase provides a Rules Playground to test your rules:

1. In Firebase Console, go to **Firestore Database → Rules**
2. Click **Rules playground** (at the top)
3. Configure test scenarios:
   - **Location**: `/users/{userId}`
   - **Operation**: `get`, `list`, `create`, `update`, or `delete`
   - **Authentication**: Authenticated or Unauthenticated
4. Click **Run**

### Example Test Cases

#### Test 1: Anonymous Read (Should Pass)
```
Location: /users/abc123
Operation: get
Authentication: Unauthenticated
Expected: ✅ Allow
```

#### Test 2: Authenticated User Creating Own Profile (Should Pass)
```
Location: /users/abc123
Operation: create
Authentication: Authenticated as abc123
Data: { fullName: "Test", class: "10A", ... }
Expected: ✅ Allow
```

#### Test 3: User Updating Another User's Score (Should Fail)
```
Location: /users/xyz789
Operation: update
Authentication: Authenticated as abc123
Expected: ❌ Deny
```

#### Test 4: Decreasing High Score (Should Fail)
```
Location: /users/abc123
Operation: update
Authentication: Authenticated as abc123
Existing data: { highScore: 1000 }
New data: { highScore: 500 }
Expected: ❌ Deny
```

---

## Common Issues

### Issue: "Missing or insufficient permissions"

**Cause**: Your Firestore rules are too restrictive or you haven't published them.

**Solution**:
1. Check that rules are published
2. Verify user is authenticated
3. Check that user UID matches document ID
4. Use Rules Playground to debug

### Issue: "false for 'create' @ L1"

**Cause**: The rule condition evaluated to false for the create operation.

**Solution**:
1. Check authentication status
2. Verify all required fields are present
3. Ensure field types match (string, number, etc.)
4. Check data validation functions

### Issue: Rules work in playground but not in app

**Cause**: Timing issue or cached rules.

**Solution**:
1. Wait 1-2 minutes after publishing rules
2. Clear browser cache
3. Try in incognito/private mode
4. Check Firebase Console → Usage tab for errors

---

## Security Best Practices

1. ✅ **Never allow unrestricted access** in production
2. ✅ **Validate all input data** (type, length, format)
3. ✅ **Implement anti-cheating measures** (score can only increase)
4. ✅ **Set maximum values** to prevent abuse
5. ✅ **Use helper functions** for cleaner, reusable rules
6. ✅ **Test rules thoroughly** before deploying
7. ✅ **Monitor usage** regularly in Firebase Console
8. ✅ **Enable App Check** for additional security (optional but recommended)

---

## Monitoring and Alerts

### Enable Firestore Monitoring

1. Go to Firebase Console → **Firestore Database**
2. Click on **Usage** tab
3. Monitor:
   - Number of reads/writes
   - Document count
   - Storage usage

### Set Up Alerts

1. Go to **Project Settings** → **Integrations**
2. Enable alerts for:
   - High API usage
   - Quota limits
   - Security rule violations

---

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Language Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Common Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)

---
