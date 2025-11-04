# Vercel Auto-Deployment Troubleshooting Guide

## 🔍 Issue Summary

Vercel is not automatically triggering deployments when commits are pushed to the `main` branch on GitHub.

## ⚠️ Current Issues Identified

### 1. **Authorization Issue**
- **Error**: `Git author rspatil441980@gmail.com must have access to the team Arpit Patil's projects on Vercel to create deployments.`
- **Impact**: Manual deployments via CLI are blocked
- **Location**: `.vercel/project.json` shows project ID: `prj_4TCn1QT31Wz0f8m8jTp2qePqobsH`

### 2. **GitHub Integration Status**
- Repository is connected: `https://github.com/apatil45/parkway-driveway-rental`
- Latest commit on `main`: `e9019d7` (chore: Trigger Vercel rebuild with latest fixes)
- Local and remote are in sync

## ✅ Steps to Fix Auto-Deployment

### Step 1: Verify GitHub Integration in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **driveway-rental**
3. Navigate to **Settings** → **Git**
4. Verify:
   - ✅ GitHub repository is connected: `apatil45/parkway-driveway-rental`
   - ✅ Production Branch is set to `main`
   - ✅ Auto-deploy is enabled for Production deployments
   - ✅ Webhook is active (green status)

### Step 2: Check GitHub Webhook Configuration

1. Go to your GitHub repository: `https://github.com/apatil45/parkway-driveway-rental`
2. Navigate to **Settings** → **Webhooks**
3. Look for a webhook from `vercel.com`
4. Verify:
   - ✅ Webhook is active (green checkmark)
   - ✅ Events include: `push`, `pull_request`
   - ✅ Recent deliveries show successful responses (200 status codes)
   - ✅ If webhook is missing or failing, re-connect the repository in Vercel

### Step 3: Verify Project Settings

In Vercel Dashboard → **Settings** → **General**:

1. **Root Directory**: 
   - **Option A (Recommended for monorepo)**: Set to `apps/web`
   - **Option B (Current setup)**: Leave as root (`.`), but ensure output directory is correct
2. **Build Command**: Should be `npm run build` or auto-detected
3. **Output Directory**: 
   - If Root Directory is `apps/web`: Should be `.next` (auto-detected)
   - If Root Directory is root (`.`): Should be `apps/web/.next`
   - **IMPORTANT**: Remove any old `frontend/dist` setting if present
4. **Install Command**: Should be `npm install` or auto-detected
5. **Framework Preset**: Should be `Next.js`

**⚠️ If you see "Error: No entrypoint found in output directory: frontend/dist"**:
- This means Vercel has an old output directory setting
- Go to Vercel Dashboard → **Settings** → **General** → **Output Directory**
- Change it from `frontend/dist` to `apps/web/.next` (if root is `.`) or `.next` (if root is `apps/web`)
- Or clear the field to let Vercel auto-detect

### Step 4: Check Deployment Filters

In Vercel Dashboard → **Settings** → **Git** → **Deployment Protection**:

1. Verify no deployment filters are blocking `main` branch
2. Ensure **Ignore Build Step** is not enabled (unless intentionally configured)
3. Check **Production Branch** is set to `main`

### Step 5: Test Manual Deployment

After fixing the above, test if manual deployment works:

```bash
cd apps/web
npx vercel --prod --yes
```

If this still fails with authorization error, proceed to Step 6.

### Step 6: Fix Authorization Issue (If Needed)

The authorization error suggests the Git author email doesn't match the Vercel account:

**Option A: Update Git Author Email (Recommended)**
```bash
git config user.email "your-vercel-account-email@example.com"
# Or set globally:
git config --global user.email "your-vercel-account-email@example.com"
```

**Option B: Add Email to Vercel Team**
1. Go to Vercel Dashboard → **Team Settings** → **Members**
2. Add `rspatil441980@gmail.com` as a team member
3. Or verify the account email matches your Vercel login

**Note**: Auto-deployments from GitHub should work regardless of Git author email, as Vercel uses GitHub OAuth tokens. The authorization error only affects CLI deployments.

### Step 7: Trigger a Test Deployment

1. Make a small change to trigger a new deployment:
   ```bash
   # Create a test commit
   echo "# Test deployment" >> docs/deployment/test.md
   git add docs/deployment/test.md
   git commit -m "test: Trigger Vercel deployment"
   git push origin main
   ```

2. Immediately check Vercel Dashboard → **Deployments**
3. You should see a new deployment starting within seconds
4. If no deployment appears, check the **Deployments** tab for any error messages

### Step 8: Check Vercel Logs

If deployments still don't trigger:

1. Go to Vercel Dashboard → **Deployments**
2. Check for any failed deployments or error messages
3. Look for deployment logs that might indicate the issue
4. Check **Settings** → **Logs** for any system errors

## 🔧 Common Issues and Solutions

### Issue: Webhook Not Being Created (Critical)
**Problem**: Vercel doesn't automatically create a webhook when connecting the repository.

**Solution - Step by Step**:

1. **Check GitHub App Permissions**:
   - Go to GitHub: https://github.com/settings/applications
   - Look for "Vercel" or "Vercel Inc" in the **Installed GitHub Apps** section
   - Click on it to see permissions
   - Verify it has access to your repository: `apatil45/parkway-driveway-rental`
   - If missing, you need to grant access (see step 2)

2. **Re-authorize Vercel GitHub App**:
   - Go to Vercel Dashboard → **Settings** → **Git**
   - Click **Disconnect** on the repository
   - Click **Connect Git Repository**
   - You'll be redirected to GitHub to authorize
   - **Important**: Make sure to grant access to:
     - Repository access (either all repos or specific ones)
     - Webhook permissions
     - Repository hooks permission
   - After authorization, select your repository again

3. **Check GitHub Organization Settings** (if applicable):
   - If your repo is under an organization, go to: `https://github.com/organizations/[org-name]/settings/installations`
   - Find Vercel app installation
   - Click "Configure" → ensure repository access includes your repo
   - Check "Repository permissions" → ensure "Webhooks" permission is granted

4. **Verify Repository Access**:
   - Go to: https://github.com/settings/installations
   - Click on "Vercel" or "Vercel Inc"
   - Under "Repository access", ensure `apatil45/parkway-driveway-rental` is listed
   - If not, click "Configure" and add it

5. **Alternative: Manual Webhook Creation** (Last Resort):
   If the above doesn't work, you can manually create the webhook:
   - In Vercel Dashboard → **Settings** → **Git**, look for a webhook URL (may be hidden)
   - Or get it from Vercel support
   - Go to GitHub → **Settings** → **Webhooks** → **Add webhook**
   - **Payload URL**: `https://api.vercel.com/v1/integrations/deploy/...` (you'll need to get this from Vercel)
   - **Content type**: `application/json`
   - **Events**: Select `push` and `pull_request`
   - **Active**: ✓ Checked
   - Click "Add webhook"

### Issue: Webhook Not Receiving Events
**Solution**: 
- Re-connect GitHub repository in Vercel
- Check GitHub repository permissions for Vercel app
- Verify GitHub organization settings allow Vercel integration

### Issue: Wrong Root Directory
**Solution**: 
- Set Root Directory to `apps/web` in Vercel project settings
- This is critical for monorepo setups

### Issue: Build Failures Preventing Deployment
**Solution**: 
- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### Issue: Branch Protection Rules
**Solution**: 
- Check if GitHub has branch protection rules that might block webhooks
- Verify Vercel has necessary permissions in GitHub

## 📊 Current Project Configuration

- **Project ID**: `prj_4TCn1QT31Wz0f8m8jTp2qePqobsH`
- **Organization**: `team_DrWYsVafLEFexLTEiIsiocmc`
- **Project Name**: `driveway-rental`
- **GitHub Repository**: `apatil45/parkway-driveway-rental`
- **Root Directory**: Should be `apps/web`
- **Latest Commit**: `e9019d7`

## 🚀 Quick Verification Checklist

- [ ] GitHub repository is connected in Vercel
- [ ] Webhook is active and receiving events
- [ ] Root directory is set to `apps/web`
- [ ] Production branch is set to `main`
- [ ] Auto-deploy is enabled
- [ ] No deployment filters blocking `main`
- [ ] Environment variables are configured
- [ ] Build command is correct (`npm run build`)
- [ ] Latest commit is pushed to `main` branch

## 📝 Next Steps

1. Check Vercel Dashboard for deployment status
2. Verify GitHub webhook is active
3. Test with a new commit to `main`
4. Monitor Vercel Dashboard → Deployments for new deployments
5. If issue persists, check Vercel status page: https://www.vercel-status.com/

## 🔗 Useful Links

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Vercel GitHub Integration Guide](https://vercel.com/docs/concepts/git)
- [Troubleshooting Deployments](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**Last Updated**: After commit `e9019d7`
**Status**: Auto-deployment not triggering - webhook not being created automatically

## 🚨 Current Issue: Webhook Not Being Created

If Vercel is not automatically creating a webhook after reconnecting the repository, follow these steps:

### Immediate Actions Required:

1. **Check GitHub App Installation**:
   - Visit: https://github.com/settings/installations
   - Look for "Vercel" or "Vercel Inc"
   - If not found, you need to install it from Vercel dashboard

2. **Re-authorize Vercel in GitHub**:
   - In Vercel Dashboard → **Settings** → **Git**
   - Disconnect and reconnect the repository
   - This will trigger a GitHub authorization flow
   - **CRITICAL**: Grant all required permissions including:
     - Repository access
     - Webhook permissions
     - Repository hooks

3. **Verify Permissions**:
   - After re-authorization, check: https://github.com/settings/applications
   - Find Vercel app → Check permissions include:
     - ✅ Repository access
     - ✅ Webhooks permission
     - ✅ Repository hooks permission

4. **Check Organization Settings** (if repo is under an org):
   - Organization admins may need to approve the integration
   - Check organization settings for third-party app access

5. **Contact Vercel Support** (if still not working):
   - Vercel Dashboard → Help → Contact Support
   - Explain that webhook is not being created automatically
   - Provide project ID: `prj_4TCn1QT31Wz0f8m8jTp2qePqobsH`
   - They can manually trigger webhook creation or provide webhook URL for manual setup

