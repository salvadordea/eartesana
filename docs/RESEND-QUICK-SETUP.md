# ⚡ Quick Setup: Resend + Supabase Emails

## 🎯 Goal
Configure professional confirmation emails that redirect to `estudioartesana.com`

---

## ✅ Step-by-Step Checklist

### 1. Configure Supabase URL Settings (2 min)

**Go to:** Supabase Dashboard → Authentication → URL Configuration

```
Site URL: https://estudioartesana.com

Redirect URLs (add both):
- https://estudioartesana.com/*
- http://localhost:3000/*
```

Click **Save**

---

### 2. Upload Email Template (3 min)

**Go to:** Supabase Dashboard → Authentication → Email Templates → **Confirm signup**

1. Open `docs/email-template-confirmation.html` in a text editor
2. **Copy ALL the content** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase** template editor
4. Click **Save**

✅ Preview should show a beautiful purple email with Estudio Artesana branding

---

### 3. Configure Resend SMTP (2 min)

**Go to:** Supabase Dashboard → Project Settings → Auth → **SMTP Settings**

**Enable Custom SMTP** (toggle the switch)

**Fill in:**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: re_Gzs3wBQU_FTZYjHX2MD4Z1RnS54MZhLfg

Sender Email: onboarding@resend.dev
Sender Name: Estudio Artesana
```

⚠️ **Note:** Use `onboarding@resend.dev` temporarily. After verifying your domain (next step), change to `noreply@estudioartesana.com`

Click **Save**

---

### 4. Verify Domain in Resend (10 min + DNS propagation)

**Go to:** https://resend.com/domains

1. Click **Add Domain**
2. Enter: `estudioartesana.com`
3. Resend will show DNS records to add

**Example DNS records you'll need to add:**

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add:

```
Type: TXT
Name: resend._domainkey
Value: [Long value Resend provides - copy it exactly]
```

4. Click **Verify Domain** in Resend (may take 5-30 min for DNS to propagate)

---

### 5. Update Sender Email (After domain verified)

**Go back to:** Supabase → Project Settings → Auth → SMTP Settings

**Change:**
```
Sender Email: noreply@estudioartesana.com
```

Click **Save**

---

## 🧪 Test It!

### Test 1: Create a test user

1. Open https://estudioartesana.com (or localhost)
2. Go to registration page
3. Sign up with a real email you can check
4. Check inbox (and spam folder)

**Expected result:**
- ✅ Email arrives with beautiful design
- ✅ Subject: "Confirm your signup" (or your custom subject)
- ✅ Sender shows: "Estudio Artesana"
- ✅ Click confirmation button
- ✅ Redirects to `estudioartesana.com` (not localhost)
- ✅ User is verified in Supabase

### Test 2: Check Supabase Logs

**Go to:** Supabase Dashboard → Logs → Auth Logs

Look for:
- ✅ `user.signup` event
- ✅ `user.email_confirm` event

If you see errors, check the troubleshooting section below.

---

## 🔧 Troubleshooting

### Email not arriving

**Check:**
1. Spam/Junk folder
2. Supabase Logs for errors
3. SMTP credentials are exactly as shown above
4. "Enable Custom SMTP" toggle is ON

**Quick fix:**
Temporarily switch back to Supabase default SMTP to test if it's a Resend issue:
- Disable "Enable Custom SMTP" toggle
- Test signup again

### "Invalid login: 535 Authentication failed"

**Fix:**
- Username must be exactly `resend` (not your email)
- Password is the API key (copy it again, no extra spaces)
- Port is 587 (not 465 or 25)

### Email redirects to localhost

**Fix:**
- Double-check Site URL in Supabase is `https://estudioartesana.com`
- No trailing slash
- Must be https (not http)

### Domain not verifying in Resend

**Check:**
1. DNS records were added correctly (no typos)
2. Wait 30 min - 2 hours for DNS propagation
3. Use DNS checker: https://dnschecker.org
   - Search for: `resend._domainkey.estudioartesana.com`
   - Should show the TXT record value

**Temporary workaround:**
Keep using `onboarding@resend.dev` - it works fine for testing!

---

## 📊 Your Current Status

API Key: `re_Gzs3wBQU_FTZYjHX2MD4Z1RnS54MZhLfg` ✅

**To Complete:**
- [ ] Update Supabase Site URL
- [ ] Add redirect URLs
- [ ] Upload email template
- [ ] Configure Resend SMTP in Supabase
- [ ] Verify domain in Resend (optional - can do later)
- [ ] Update sender email to `noreply@estudioartesana.com` (after domain verified)
- [ ] Send test signup
- [ ] Verify email looks good
- [ ] Verify redirect works

**Estimated time:** 15-20 minutes (excluding DNS propagation wait)

---

## 🎨 Bonus: Customize Other Email Templates

After signup confirmation works, customize these too:

**Go to:** Authentication → Email Templates

1. **Reset Password** - When users forget password
2. **Magic Link** - Passwordless login
3. **Change Email** - Email verification for email changes
4. **Invite User** - Admin invitations

**For each:** Use similar HTML structure from the confirmation template, just change the heading and CTA text.

---

## 💡 Tips

1. **Save the API key somewhere safe** - Store in a password manager
2. **Monitor usage:** https://resend.com/overview - Track how many emails you're sending
3. **Upgrade if needed:** Resend free tier = 3,000 emails/month (plenty for starting)
4. **Warm up domain:** If domain is new, send to real emails first (not spam traps)

---

## ✅ Success Criteria

You're done when:
- ✅ Test signup email arrives in inbox (not spam)
- ✅ Email looks professional (not plain text)
- ✅ Sender shows "Estudio Artesana"
- ✅ Confirmation link redirects to estudioartesana.com
- ✅ User gets verified in database

**Questions?** Check `docs/SUPABASE-EMAIL-SETUP.md` for detailed documentation.

---

**Last updated:** 2025-01-07
**Resend Account:** Your account with API key configured
**Status:** Ready to configure ✅
